const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.json())

// In a real deployment this would create non-custodial payment requests and monitor RPCs
// For V1 demo we simulate immediate confirmation and return a fake txid

app.post('/create-payment', (req, res) => {
  const { amount, currency, recipient, metadata } = req.body
  // Simulate payment address and immediate confirmation
  const paymentId = 'pay_' + Date.now()
  const txid = 'tx_' + Date.now()
  const address = 'demo_address_' + currency

  // Return confirmed payment for demo
  res.json({ paymentId, address, amount, currency, recipient, status: 'confirmed', txid, metadata })
})

app.listen(process.env.PORT || 5000, () => console.log('Wallet Router listening on', process.env.PORT || 5000))
