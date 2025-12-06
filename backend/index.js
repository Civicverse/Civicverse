const express = require('express')
const app = express()
const port = process.env.PORT || 3001

// Simple CORS for demo frontend running on a different port
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.get('/', (req, res) => {
  res.json({ status: 'Civicverse backend stub', time: new Date().toISOString() })
})

// API endpoints used by the frontend status page
app.get('/api/backend', (req, res) => {
  res.json({ status: 'Civicverse backend stub', time: new Date().toISOString() })
})

app.get('/api/kaspa', async (req, res) => {
  try {
    const resp = await fetch(process.env.KASPA_URL || 'http://kaspa-node:16110/');
    const json = await resp.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: 'kaspa unreachable', message: err.message })
  }
})

app.get('/api/monero', async (req, res) => {
  try {
    const resp = await fetch(process.env.MONERO_URL || 'http://monerod:18081/');
    const json = await resp.json();
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: 'monero unreachable', message: err.message })
  }
})

app.listen(port, () => {
  console.log(`Civicverse backend stub listening on port ${port}`)
})
