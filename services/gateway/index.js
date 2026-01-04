const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const LEDGER_URL = process.env.LEDGER_URL || 'http://ledger:4000'
const WALLET_URL = process.env.WALLET_URL || 'http://wallet-router:5000'

// Simple health
app.get('/health', (req, res) => res.json({ status: 'gateway ok' }))

// Checkout: enforce 1% micro-tax, create ledger entry, request payment
app.post('/checkout', async (req, res) => {
  try {
    const { amount, currency = 'XMR', recipient, listingId } = req.body
    if (!amount || !recipient) return res.status(400).json({ error: 'missing_fields' })

    const tax = +(amount * 0.01).toFixed(8)
    const net = +(amount - tax).toFixed(8)

    // Create ledger pending entry
    const entryResp = await axios.post(`${LEDGER_URL}/entry`, { type: 'checkout', amount, tax, net, currency, recipient, listingId })
    const entry = entryResp.data

    // Request payment from wallet-router
    const payResp = await axios.post(`${WALLET_URL}/create-payment`, { amount, currency, recipient, metadata: { entryId: entry.id } })
    const payment = payResp.data

    // If wallet-router confirms immediately, settle
    if (payment && payment.status === 'confirmed') {
      await axios.post(`${LEDGER_URL}/settle`, { id: entry.id, txid: payment.txid })
      return res.json({ entry, payment, status: 'settled' })
    }

    // Otherwise return pending and wait for webhook (demo returns immediate)
    res.json({ entry, payment, status: 'pending' })
  } catch (e) {
    console.error('checkout error', e.message)
    res.status(500).json({ error: e.message })
  }
})

const port = process.env.PORT || 4001
app.listen(port, () => console.log('Gateway listening on', port))
