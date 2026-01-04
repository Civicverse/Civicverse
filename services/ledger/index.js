const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const connectionString = process.env.POSTGRES_URL || 'postgres://postgres:postgres@postgres:5432/civicverse'
const pool = new Pool({ connectionString })

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    type TEXT,
    amount NUMERIC,
    tax NUMERIC,
    net NUMERIC,
    currency TEXT,
    recipient TEXT,
    listing_id TEXT,
    status TEXT DEFAULT 'pending',
    txid TEXT,
    created_at TIMESTAMP DEFAULT now(),
    settled_at TIMESTAMP
  )`)
}

app.post('/entry', async (req, res) => {
  try {
    const { type, amount, tax, net, currency, recipient, listingId } = req.body
    const r = await pool.query('INSERT INTO transactions(type, amount, tax, net, currency, recipient, listing_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at', [type, amount, tax, net, currency, recipient, listingId])
    res.json({ id: r.rows[0].id, createdAt: r.rows[0].created_at })
  } catch (e) {
    console.error('entry error', e)
    res.status(500).json({ error: e.message })
  }
})

app.post('/settle', async (req, res) => {
  try {
    const { id, txid } = req.body
    await pool.query('UPDATE transactions SET status=$1, txid=$2, settled_at=now() WHERE id=$3', ['settled', txid, id])
    res.json({ id, txid, status: 'settled' })
  } catch (e) {
    console.error('settle error', e)
    res.status(500).json({ error: e.message })
  }
})

app.get('/transactions', async (req, res) => {
  const r = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 200')
  res.json(r.rows)
})

init().then(() => {
  const port = process.env.PORT || 4000
  app.listen(port, () => console.log('Ledger listening on', port))
}).catch(e => { console.error('failed to init ledger', e) })
