
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('../dashboard'));

app.get('/status', (req, res) => {
    res.json({ node: 'Alpha-2', status: 'Active', synced: true, timestamp: new Date() });
});

app.listen(port, () => {
    console.log(`CivicVerse Alpha-2 node running at http://localhost:${port}`);
});
