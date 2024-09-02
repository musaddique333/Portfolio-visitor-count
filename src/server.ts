import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient, PostgrestError } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS configuration to allow only specified domains
const allowedOrigins = ['https://www.musaddique.site', 'https://portfolio-ten-puce-90.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Serve static files from the dist/public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on root request
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and tables
const initializeDatabase = async () => {
  try {
    // Check if visitor_count table exists
    const { data: countTableExists, error: countTableError } = await supabase
      .from('visitor_count')
      .select('*')
      .limit(1);

    if (countTableError) {
      console.error('Error checking visitor_count table:', countTableError.message);
      return;
    }

    if (countTableExists.length === 0) {
      // Insert initial count
      const { error: insertCountError } = await supabase
        .from('visitor_count')
        .insert({ id: 1, count: 0 });

      if (insertCountError) {
        console.error('Error inserting initial count:', insertCountError.message);
      }
    }

    // Check if visitor_info table exists
    const { data: infoTableExists, error: infoTableError } = await supabase
      .from('visitor_info')
      .select('*')
      .limit(1);

    if (infoTableError) {
      console.error('Error checking visitor_info table:', infoTableError.message);
      return;
    }

    if (infoTableExists.length === 0) {
      // Create visitor_info table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE visitor_info (
          id SERIAL PRIMARY KEY,
          ip_address VARCHAR(255) NOT NULL,
          city VARCHAR(255),
          region VARCHAR(255),
          country VARCHAR(255),
          timestamp TIMESTAMP NOT NULL
        );
      `;
      
      const { error: createInfoTableError } = await supabase.rpc('execute_sql', { sql: createTableQuery });

      if (createInfoTableError) {
        console.error('Error creating visitor_info table:', createInfoTableError.message);
      }
    }
  } catch (error) {
    // If the error is not a PostgrestError, fallback to generic error message
    console.error('Error initializing database:', (error as PostgrestError).message || 'Unknown error');
  }
};

initializeDatabase().catch(console.error);

// Endpoint to log visitor info
app.post('/api/log-visitor', async (req: Request, res: Response) => {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddresses = (typeof forwardedFor === 'string' ? forwardedFor : req.socket.remoteAddress || '')
      .split(',')
      .map((ip: string) => ip.trim());

    const visitorIp = ipAddresses[0]; 
    const ipInfoToken = process.env.IPINFO_TOKEN as string;

    console.log(`Received request to log visitor info from IP: ${visitorIp}`);

    const ipInfoResponse = await axios.get(`https://ipinfo.io/${visitorIp}?token=${ipInfoToken}`);
    const { city, region, country } = ipInfoResponse.data;
    const timestamp = new Date().toISOString();

    const { error: insertVisitorError } = await supabase
      .from('visitor_info')
      .insert([{ 
        ip_address: visitorIp,
        city,
        region,
        country,
        timestamp
      }]);

    if (insertVisitorError) {
      throw insertVisitorError;
    }

    res.status(200).json({ message: 'Visitor logged successfully' });
  } catch (error) {
    // If the error is not a PostgrestError, fallback to generic error message
    console.error('Error logging visitor info:', (error as PostgrestError).message || 'Unknown error');
    res.status(500).json({ error: 'Failed to log visitor info', details: (error as PostgrestError).message || 'Unknown error' });
  }
});

// Endpoint to update the visitor count
app.post('/api/update-count', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('visitor_count')
      .select('count')
      .eq('id', 1)
      .single();

    if (error) throw error;

    const updatedCount = data.count + 1;

    const { error: updateError } = await supabase
      .from('visitor_count')
      .update({ count: updatedCount })
      .eq('id', 1);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Count updated successfully' });
  } catch (error) {
    // If the error is not a PostgrestError, fallback to generic error message
    console.error('Error updating visitor count:', (error as PostgrestError).message || 'Unknown error');
    res.status(500).json({ error: 'Failed to update count', details: (error as PostgrestError).message || 'Unknown error' });
  }
});

// Endpoint to get the visitor count
app.get('/api/visitor-count', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('visitor_count')
      .select('count')
      .eq('id', 1)
      .single();

    if (error) throw error;

    res.status(200).json({ count: data.count });
  } catch (error) {
    // If the error is not a PostgrestError, fallback to generic error message
    console.error('Error getting visitor count:', (error as PostgrestError).message || 'Unknown error');
    res.status(500).json({ error: 'Failed to read count', details: (error as PostgrestError).message || 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


//