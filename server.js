// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./visitor-count.db', (err) => {
  if (err) {
    console.error('Could not open database', err.message);
  } else {
    db.run('CREATE TABLE IF NOT EXISTS visitor_count (id INTEGER PRIMARY KEY, count INTEGER)', (err) => {
      if (err) {
        console.error('Could not create table', err.message);
      } else {
        db.get('SELECT count FROM visitor_count WHERE id = 1', (err, row) => {
          if (!row) {
            db.run('INSERT INTO visitor_count (id, count) VALUES (1, 0)', (err) => {
              if (err) {
                console.error('Could not insert initial count', err.message);
              }
            });
          }
        });
      }
    });
  }
});

// Endpoint to update the visitor count
app.post('/api/update-count', (req, res) => {
  db.run('UPDATE visitor_count SET count = count + 1 WHERE id = 1', (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to update count' });
    } else {
      res.status(200).json({ message: 'Count updated successfully' });
    }
  });
});

// Endpoint to get the visitor count
app.get('/api/visitor-count', (req, res) => {
  db.get('SELECT count FROM visitor_count WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read count' });
    } else {
      res.status(200).json({ count: row.count });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
