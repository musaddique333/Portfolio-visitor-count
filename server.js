const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const allowedOrigins = ['https://www.musaddique.site', 'https://portfolio-ten-puce-90.vercel.app'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

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

    if (!infoTableExists) {
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
    console.error('Error initializing database:', error.message);
  }
};

initializeDatabase().catch(console.error);

// Endpoint to log visitor info
app.post('/api/log-visitor', async (req, res) => {
  try {
    const ipAddresses = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',').map(ip => ip.trim());
    const visitorIp = ipAddresses[0]; 
    const ipInfoToken = process.env.IPINFO_TOKEN;

    console.log(`Received request to log visitor info from IP: ${visitorIp}`);

    const ipInfoResponse = await axios.get(`https://ipinfo.io/${visitorIp}?token=${ipInfoToken}`);
    const { city, region, country } = ipInfoResponse.data;
    const timestamp = new Date().toISOString();

    const { error: insertVisitorError } = await supabase
      .from('visitor_info') 
      .insert([{ 
        ip_address: visitorIp,  // Use the updated column name
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
    console.error('Error logging visitor info:', error.message);
    res.status(500).json({ error: 'Failed to log visitor info', details: error.message });
  }
});

// Endpoint to update the visitor count
app.post('/api/update-count', async (req, res) => {
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
    console.error('Error updating visitor count:', error.message);
    res.status(500).json({ error: 'Failed to update count', details: error.message });
  }
});

// Endpoint to get the visitor count
app.get('/api/visitor-count', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('visitor_count')
      .select('count')
      .eq('id', 1)
      .single();

    if (error) throw error;

    res.status(200).json({ count: data.count });
  } catch (error) {
    console.error('Error getting visitor count:', error.message);
    res.status(500).json({ error: 'Failed to read count', details: error.message });
  }
});

// Serve index.html on root request
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});