const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Initialize database and table
const initializeDatabase = async () => {
  const { data: tableExists, error: tableError } = await supabase
    .from('visitor_count')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('Table check error:', tableError.message);
    return;
  }

  if (tableExists.length === 0) {
    const { error: insertError } = await supabase
      .from('visitor_count')
      .insert({ id: 1, count: 0 });

    if (insertError) {
      console.error('Insert initial count error:', insertError.message);
    }
  }
};

initializeDatabase().catch(console.error);

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
    console.error('Update count error:', error.message);
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
    console.error('Get count error:', error.message);
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
