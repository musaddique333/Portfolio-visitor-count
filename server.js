const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const ipinfo = require('ipinfo-express');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// IPinfo middleware setup
const ipinfoToken = process.env.IPINFO_TOKEN;
app.use(ipinfo({
  token: ipinfoToken,
  cache: null,
  timeout: 5000,
}));

app.use(cors());
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
          ip TEXT NOT NULL,
          city TEXT,
          region TEXT,
          country TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    const visitorIp = req.ipinfo.ip;
    const { city, region, country } = req.ipinfo;
    const timestamp = new Date().toISOString();

    console.log(`Received request to log visitor info from IP: ${visitorIp}`);

    const { error: insertVisitorError } = await supabase
      .from('visitor_info') 
      .insert([{ ip: visitorIp, city, region, country, timestamp }]);

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
