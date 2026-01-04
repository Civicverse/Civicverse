const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Configuration: if MONERO_WALLET_RPC_URL is set, use it; otherwise demo mode
const MONERO_WALLET_RPC_URL = process.env.MONERO_WALLET_RPC_URL || ''
const LEDGER_URL = process.env.LEDGER_URL || 'http://ledger:4000'

// Helper: call Monero wallet RPC
async function moneroRpc(method, params = {}) {
  const url = MONERO_WALLET_RPC_URL
  const resp = await axios.post(url, { jsonrpc: '2.0', id: '0', method, params })
  return resp.data.result
}

// Create payment: supports demo immediate confirm, or Monero integrated address + polling
app.post('/create-payment', async (req, res) => {
  const { amount, currency, recipient, metadata } = req.body
  if (MONERO_WALLET_RPC_URL && currency === 'XMR') {
    try {
      // create integrated address to correlate payment
      const make = await moneroRpc('make_integrated_address')
      const address = make.integrated_address
      const paymentId = make.payment_id || ('p_' + Date.now())

      // respond with payment details (pending)
      res.json({ paymentId, address, amount, currency, recipient, status: 'pending', paymentId })

      // start background poll to detect payment (in production use webhooks or wallet notifications)
      (async function poll() {
        for (let i = 0; i < 300; i++) { // ~5 minutes
          try {
            const payments = await moneroRpc('get_payments', { payment_id: paymentId })
            if (payments && payments.payments && payments.payments.length > 0) {
              const tx = payments.payments[0]
              // notify ledger settle
              try { await axios.post(`${LEDGER_URL}/settle`, { id: metadata?.entryId || null, txid: tx.tx_hash }) } catch(e){}
              break
            }
          } catch (e) {}
          await new Promise(r => setTimeout(r, 1000 * 5))
        }
      })()
      return
    } catch (e) {
      console.error('monero create error', e.message)
      // fallthrough to demo
    }
  }

  // Demo immediate confirmation
  const paymentId = 'pay_' + Date.now()
  const txid = 'tx_' + Date.now()
  const address = 'demo_address_' + currency
  // attempt to settle ledger if entryId provided
  if (metadata && metadata.entryId) {
    try { await axios.post(`${LEDGER_URL}/settle`, { id: metadata.entryId, txid }) } catch (e) {}
  }
  res.json({ paymentId, address, amount, currency, recipient, status: 'confirmed', txid, metadata })
})

app.listen(process.env.PORT || 5000, () => console.log('Wallet Router listening on', process.env.PORT || 5000))
