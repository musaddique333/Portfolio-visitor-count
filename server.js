const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

const filePath = path.join(__dirname, 'visitor-count.json');

app.post('/api/update-count', (req, res) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    const json = JSON.parse(data);
    json.count = (json.count || 0) + 1;
    fs.writeFile(filePath, JSON.stringify(json), 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json({ count: json.count });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
