const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const app = express()
const port = process.env.PORT || 3003

const DATA_DIR = path.join(__dirname, '..', 'data')
const ID_DIR = path.join(DATA_DIR, 'identities')
const WALLETS_DIR = path.join(DATA_DIR, 'wallets')
try { fs.mkdirSync(ID_DIR, { recursive: true }) } catch(e) {}
try { fs.mkdirSync(WALLETS_DIR, { recursive: true }) } catch(e) {}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(bodyParser.json({ limit: '1mb' }))

app.get('/api/status', (req, res) => {
  res.json({ status: 'rebuild-backend', time: new Date().toISOString() })
})

app.post('/api/identity', (req, res) => {
  try {
    const { did, username, publicKey } = req.body || {}
    if (!did || !publicKey) return res.status(400).json({ error: 'missing_fields' })
    const file = path.join(ID_DIR, `${encodeURIComponent(did)}.json`)
    fs.writeFileSync(file, JSON.stringify({ did, username, publicKey, createdAt: Date.now() }, null, 2))
    res.json({ stored: true, did })
  } catch (e) {
    res.status(500).json({ error: 'identity_failed', message: e.message })
  }
})

app.post('/api/wallet/backup', (req, res) => {
  try {
    const { did, encryptedBackup } = req.body || {}
    if (!did || !encryptedBackup) return res.status(400).json({ error: 'missing_fields' })
    const file = path.join(WALLETS_DIR, `${encodeURIComponent(did)}.backup.json`)
    fs.writeFileSync(file, JSON.stringify({ did, encryptedBackup, storedAt: Date.now() }, null, 2))
    res.json({ stored: true, did })
  } catch (e) {
    res.status(500).json({ error: 'wallet_failed', message: e.message })
  }
})

app.listen(port, () => console.log(`Rebuild backend listening on ${port}`))
