const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port

// Serve static files from the 'static' directory
app.use(express.static('static'));

// Endpoint to update visitor count
app.post('/api/update-count', (req, res) => {
  const countFilePath = path.join(__dirname, 'static', 'visitor-count.json');

  // Read the current visitor count
  fs.readFile(countFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading visitor count file:', err);
      return res.status(500).send('Internal Server Error');
    }

    let count;
    try {
      count = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing visitor count file:', e);
      count = { count: 0 };
    }

    // Update the count
    count.count += 1;

    // Write the updated count back to the file
    fs.writeFile(countFilePath, JSON.stringify(count, null, 2), (err) => {
      if (err) {
        console.error('Error writing visitor count file:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.status(200).send('Visitor count updated');
    });
  });
});

// Serve the visitor count endpoint
app.get('/api/visitor-count', (req, res) => {
  const countFilePath = path.join(__dirname, 'static', 'visitor-count.json');

  // Read the visitor count file
  fs.readFile(countFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading visitor count file:', err);
      return res.status(500).send('Internal Server Error');
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
