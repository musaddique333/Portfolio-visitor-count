const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Path to your JSON file
const countFilePath = path.join(__dirname, 'visitor-curl http://localhost:3000/api/visitor-countcount.json');

// Endpoint to update visitor count
app.post('/api/update-count', (req, res) => {
  fs.readFile(countFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read count file' });
    }

    let count = parseInt(data, 10);
    count = isNaN(count) ? 0 : count;

    // Increment the count
    count += 1;

    fs.writeFile(countFilePath, count.toString(), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update count file' });
      }
      res.status(200).json({ message: 'Count updated successfully' });
    });
  });
});

// Endpoint to get visitor count
app.get('/api/visitor-count', (req, res) => {
  fs.readFile(countFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read count file' });
    }

    let count = parseInt(data, 10);
    count = isNaN(count) ? 0 : count;

    res.status(200).json({ count });
  });
});

// Serve static files (if any)
app.use(express.static(path.join(__dirname, 'public')));

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
