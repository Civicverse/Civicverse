const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

const app = express()
app.use(bodyParser.json())

const LEDGER_URL = process.env.LEDGER_URL || 'http://ledger:4000'

// In-memory matches store (demo). Production should use a DB.
const matches = {}
let nextMatchId = 1

function computeTax(amount){
  const communityTax = +(amount * 0.01).toFixed(8)
  // placeholder for real-world tax calculation
  const realWorldTax = 0
  const net = +(amount - communityTax - realWorldTax).toFixed(8)
  return { communityTax, realWorldTax, net }
}

// Create a match instance
app.post('/create', async (req,res)=>{
  try{
    const { name, maxPlayers = 8 } = req.body
    const id = nextMatchId++
    matches[id] = { id, name: name||`match-${id}`, players: [], maxPlayers, bets: {}, pot: 0, status: 'waiting' }
    return res.json(matches[id])
  }catch(e){
    console.error(e)
    res.status(500).json({error:e.message})
  }
})

// Join a match
app.post('/join', (req,res)=>{
  try{
    const { matchId, player } = req.body
    const m = matches[matchId]
    if(!m) return res.status(404).json({error:'not_found'})
    if(m.players.length >= m.maxPlayers) return res.status(400).json({error:'full'})
    if(!m.players.includes(player)) m.players.push(player)
    return res.json(m)
  }catch(e){res.status(500).json({error:e.message})}
})

// Place a bet (wager) in-game currency
app.post('/bet', async (req,res)=>{
  try{
    const { matchId, player, amount } = req.body
    const m = matches[matchId]
    if(!m) return res.status(404).json({error:'not_found'})
    if(m.status !== 'waiting') return res.status(400).json({error:'match_not_open'})

    const amt = Number(amount)
    if(isNaN(amt) || amt <= 0) return res.status(400).json({error:'invalid_amount'})

    const { communityTax, realWorldTax, net } = computeTax(amt)

    // Record bet locally
    m.bets[player] = (m.bets[player]||0) + net
    m.pot = +(m.pot + net).toFixed(8)

    // Create ledger entry for the bet (records gross amount and tax)
    try{
      await axios.post(`${LEDGER_URL}/entry`, {
        type: 'bet', amount: amt, tax: communityTax, net, currency: 'CVT', recipient: 'community_wallet', listingId: `tdm:${matchId}`
      })
    }catch(e){console.warn('ledger entry failed', e.message)}

    return res.json({match: m, applied:{communityTax, realWorldTax, net}})
  }catch(e){res.status(500).json({error:e.message})}
})

// Start match (move to active)
app.post('/start', (req,res)=>{
  try{
    const { matchId } = req.body
    const m = matches[matchId]
    if(!m) return res.status(404).json({error:'not_found'})
    m.status = 'active'
    m.startedAt = new Date().toISOString()
    return res.json(m)
  }catch(e){res.status(500).json({error:e.message})}
})

// End match and settle pot. winners: array of player ids with weights
app.post('/settle', async (req,res)=>{
  try{
    const { matchId, winners } = req.body
    const m = matches[matchId]
    if(!m) return res.status(404).json({error:'not_found'})
    // compute split
    const totalWeight = (winners||[]).reduce((s,w)=>s+(w.weight||1),0)
    const payouts = []
    for(const w of winners||[]){
      const share = ((w.weight||1) / totalWeight) * m.pot
      payouts.push({ player: w.player, amount: +share.toFixed(8) })
      // ledger settle action for payout
      try{ await axios.post(`${LEDGER_URL}/entry`, { type:'payout', amount: share, tax:0, net:share, currency:'CVT', recipient:w.player, listingId:`tdm:settle:${matchId}` }) }catch(e){}
    }

    m.status = 'settled'
    m.settledAt = new Date().toISOString()
    m.payouts = payouts

    // In a real system, call ledger/settle to attach txids
    return res.json({match:m, payouts})
  }catch(e){res.status(500).json({error:e.message})}
})

app.get('/matches', (req,res)=>res.json(Object.values(matches)))

const port = process.env.PORT || 4100
app.listen(port, ()=>console.log('TDM Arena listening on', port))
