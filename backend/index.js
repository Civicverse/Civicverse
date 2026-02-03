const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/market',(req,res)=>{
  res.json(market)
})

app.post('/api/market/create',(req,res)=>{
  const {title,price,sellerId} = req.body || {}
  if(!title || !price) return res.status(400).json({ok:false,error:'title and price required'})
  const item = {id: nextMarketId++, title, price: Number(price), sellerId: sellerId || null}
  market.push(item)
  try{ persistMarket(item) }catch(e){ console.warn('persist market failed', e.message) }
  res.json({ok:true,item})
})

// Miner config endpoints
let minerConfig = {cpus:1,mode:'low'}
app.get('/api/miner', (req,res)=> res.json(minerConfig))
app.post('/api/miner', (req,res)=>{ minerConfig = Object.assign(minerConfig, req.body); res.json(minerConfig) })

// Proxy to miner control (simulated miner runs on port 9090)
app.post('/api/miner/set', async (req,res)=>{
  try{
    const resp = await fetch('http://localhost:9090/set',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(req.body)})
    const text = await resp.text()
    res.send({ok:true,resp:text})
  }catch(e){ res.status(500).send({ok:false,error:String(e)}) }
})
app.get('/api/miner/status', async (req,res)=>{
  try{
    const resp = await fetch('http://localhost:9090/status')
    const json = await resp.json()
    res.json({ok:true,status:json,config:minerConfig})
  }catch(e){ res.json({ok:false,error:String(e)}) }
})

// Simulated miner pool and treasury
let minerPool = [ {id:'local-miner',hashRate:10} ]
let treasury = {balance: 0.0, currency:'CV', multisig:'0xDEMO_MULTISIG'}
// Persistence with better-sqlite3
const Database = require('better-sqlite3')
const path = require('path')
const dbPath = path.resolve(__dirname, 'data.db')
const db = new Database(dbPath)

// create tables if not exist
db.exec(`
CREATE TABLE IF NOT EXISTS citizens (id TEXT PRIMARY KEY, name TEXT, balance REAL, created INTEGER, cls TEXT);
CREATE TABLE IF NOT EXISTS market (id INTEGER PRIMARY KEY, title TEXT, price REAL, sellerId TEXT);
CREATE TABLE IF NOT EXISTS quests (id INTEGER PRIMARY KEY, title TEXT, reward REAL, claimed INTEGER, claimedBy TEXT);
CREATE TABLE IF NOT EXISTS miner_pool (id TEXT PRIMARY KEY, hashRate REAL);
CREATE TABLE IF NOT EXISTS treasury (id INTEGER PRIMARY KEY, balance REAL, currency TEXT, multisig TEXT);
CREATE TABLE IF NOT EXISTS ubi (id INTEGER PRIMARY KEY, pool REAL, currency TEXT, lastDistributed INTEGER);
`)

// load persisted data into memory-friendly variables
let citizens = db.prepare('SELECT * FROM citizens').all() || []
let market = db.prepare('SELECT * FROM market').all() || []
let quests = db.prepare('SELECT * FROM quests').all() || []
let minerPool = db.prepare('SELECT * FROM miner_pool').all() || []
let treasury = db.prepare('SELECT * FROM treasury LIMIT 1').get() || {balance:0.0, currency:'CV', multisig:'0xDEMO_MULTISIG'}
let ubi = db.prepare('SELECT * FROM ubi LIMIT 1').get() || {pool:0.0, currency:'CV', lastDistributed:null}

// if empty, seed demo data
if(market.length===0){
  const insertMarket = db.prepare('INSERT INTO market (title,price,sellerId) VALUES (?,?,?)')
  insertMarket.run('Neon Jacket',3.5,null)
  insertMarket.run('Pixel Car',12,null)
  market = db.prepare('SELECT * FROM market').all()
}
if(quests.length===0){
  const insertQuest = db.prepare('INSERT INTO quests (title,reward,claimed) VALUES (?,?,?)')
  insertQuest.run('Find the Neon Key',0.5,0)
  insertQuest.run('Deliver Packet',0.2,0)
  quests = db.prepare('SELECT * FROM quests').all()
}

// helper persistence functions
function persistCitizen(c){
  db.prepare('INSERT OR REPLACE INTO citizens (id,name,balance,created,cls) VALUES (?,?,?,?,?)').run(c.id,c.name,c.balance||0,c.created||Date.now(),c.class||c.cls||null)
}
function persistMarket(item){
  db.prepare('INSERT OR REPLACE INTO market (id,title,price,sellerId) VALUES (?,?,?,?)').run(item.id,item.title,item.price,item.sellerId||null)
}
function persistQuest(q){
  db.prepare('INSERT OR REPLACE INTO quests (id,title,reward,claimed,claimedBy) VALUES (?,?,?,?,?)').run(q.id,q.title,q.reward,q.claimed?1:0,q.claimedBy||null)
}
function persistMiner(m){
  db.prepare('INSERT OR REPLACE INTO miner_pool (id,hashRate) VALUES (?,?)').run(m.id,m.hashRate)
}
function persistTreasury(){
  db.prepare('DELETE FROM treasury').run()
  db.prepare('INSERT INTO treasury (id,balance,currency,multisig) VALUES (1,?,?,?)').run(treasury.balance, treasury.currency, treasury.multisig)
}
function persistUbi(){
  db.prepare('DELETE FROM ubi').run()
  db.prepare('INSERT INTO ubi (id,pool,currency,lastDistributed) VALUES (1,?,?,?)').run(1, ubi.pool||0, ubi.currency||'CV', ubi.lastDistributed?ubi.lastDistributed.time:null)
}

// Optional on-chain multisig integration (reads balance from chain if RPC configured)
const { ethers } = require('ethers')
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545'
let provider
try{ provider = new ethers.JsonRpcProvider(RPC_URL) }catch(e){ provider = null }

async function getOnChainBalance(address){
  if(!provider) return null
  try{
    const balance = await provider.getBalance(address)
    return Number(ethers.formatEther(balance))
  }catch(e){ return null }
}

// Try to load deployed addresses if present (from smart-contracts/scripts/deploy.js)
const fs = require('fs')
try{
  const deployedRaw = fs.readFileSync(path.resolve(__dirname, '../smart-contracts/deployed.json'),'utf8')
  const deployed = JSON.parse(deployedRaw)
  if(deployed && deployed.MultiSigTaxWallet){
    treasury.multisig = deployed.MultiSigTaxWallet
    console.log('Using on-chain multisig:', treasury.multisig)
    persistTreasury()
  }
}catch(e){ /* ignore if not present */ }

// Signer for on-chain tax transfers (optional)
let signer = null
if(process.env.ENABLE_ONCHAIN === 'true' && process.env.PRIVATE_KEY){
  try{
    signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
    console.log('On-chain tax sender configured with signer', signer.address)
  }catch(e){ console.warn('Failed to configure signer for on-chain operations', e.message) }
}
let nextMarketId = (market.length? Math.max(...market.map(m=>m.id))+1 : 1)

app.get('/api/miner/pool', (req,res)=>{
  const combined = minerPool.reduce((s,m)=>s+m.hashRate,0)
  res.json({miners:minerPool,combinedHash:combined})
})

app.post('/api/miner/register',(req,res)=>{
  const body = req.body || {}
  if(!body.id || !body.hashRate) return res.status(400).json({ok:false,error:'id,hashRate required'})
  minerPool.push({id:body.id,hashRate:body.hashRate})
  try{ persistMiner({id:body.id,hashRate:body.hashRate}) }catch(e){ console.warn('persist miner failed', e.message) }
  res.json({ok:true,miners:minerPool})
})

app.get('/api/treasury',(req,res)=>{
  // In a real deployment read from on-chain multisig; demo uses in-memory value
  res.json(treasury)
})

app.post('/api/treasury/credit',(req,res)=>{
  const {amount} = req.body || {}
  treasury.balance = Number(treasury.balance) + Number(amount || 0)
  try{ persistTreasury() }catch(e){ console.warn('persist treasury failed', e.message) }
  res.json(treasury)
})

// Marketplace purchase endpoint — applies 1% tax to treasury and returns order
app.post('/api/purchase', async (req,res)=>{
  const {itemId, buyer='demo-buyer'} = req.body || {}
  const item = market.find(m=>m.id==itemId)
  if(!item) return res.status(404).json({ok:false,error:'item not found'})
  const price = Number(item.price || 0)
  const tax = +(price * 0.01).toFixed(6) // 1% tax to treasury / multisig
  const ubiShare = +(price * 0.001).toFixed(6) // 0.1% to UBI pool (demo)
  const sellerAmount = +(price - tax - ubiShare).toFixed(6)

  // credit the treasury (in demo in-memory and optionally on-chain)
  treasury.balance = Number((Number(treasury.balance) + tax).toFixed(6))
  ubi.pool = Number((Number(ubi.pool) + ubiShare).toFixed(6))

  try{ persistTreasury() }catch(e){ console.warn('persist treasury failed', e.message) }
  try{ persistUbi() }catch(e){ console.warn('persist ubi failed', e.message) }

  // Optional: if on-chain enabled and signer available, send the tax amount (in ETH) to multisig contract
  let onchainReceipt = null
  if(process.env.ENABLE_ONCHAIN === 'true' && signer && treasury.multisig){
    try{
      const tx = await signer.sendTransaction({to: treasury.multisig, value: ethers.parseEther(String(tax))})
      await tx.wait()
      onchainReceipt = {txHash: tx.hash}
    }catch(e){ console.warn('Failed to send on-chain tax:', e.message) }
  }

  // In a production system we'd create escrow, record order, and process payment via on-chain txs
  const order = {id:Date.now(),item,price,tax,sellerAmount,buyer}

  // optional: if provider present and multisig is an address, fetch on-chain balance for display
  const onChainBal = await getOnChainBalance(treasury.multisig).catch(()=>null)

  res.json({ok:true,order,treasury:{...treasury,onChainBalance:onChainBal},onchainReceipt})
})

// UBI endpoints
app.get('/api/ubi', (req,res)=>{
  res.json(ubi)
})

// Distribute UBI equally to all registered citizens (demo)
app.post('/api/ubi/distribute', (req,res)=>{
  if(citizens.length===0) return res.status(400).json({ok:false,error:'no citizens'})
  const per = +(ubi.pool / citizens.length).toFixed(6)
  const payments = citizens.map(c=>({citizen:c.id,amount:per}))
  // credit each citizen balance
  citizens = citizens.map(c=>{
    const updated = {...c, balance: Number((Number(c.balance) + per).toFixed(6))}
    try{ persistCitizen(updated) }catch(e){ console.warn('persist citizen during ubi distribute failed', e.message) }
    return updated
  })
  // clear pool and record distribution
  ubi.pool = 0
  ubi.lastDistributed = {time: Date.now(), perCitizen: per, payments}
  try{ persistUbi() }catch(e){ console.warn('persist ubi failed', e.message) }
  res.json({ok:true,ubi,citizens})
})

// Citizen and quest simple APIs

app.post('/api/citizen', (req,res)=>{
  const body = req.body || {}
  if(!body.name) return res.status(400).json({ok:false,error:'name required'})
  const id = 'cit-'+(Math.floor(Math.random()*90000)+10000)
  const c = {id, name: body.name, created:Date.now(), balance: 0}
  citizens.push(c)
  try{ persistCitizen(c) }catch(e){ console.warn('persist citizen failed', e.message) }
  res.json({ok:true,citizen:c})
})

app.get('/api/citizens', (req,res)=>{
  res.json(citizens)
})

app.get('/api/citizens/:id', (req,res)=>{
  const c = citizens.find(x=>x.id===req.params.id)
  if(!c) return res.status(404).json({ok:false,error:'not found'})
  res.json(c)
})

app.post('/api/citizen/update', (req,res)=>{
  const {id, cls} = req.body || {}
  if(!id) return res.status(400).json({ok:false,error:'id required'})
  const c = citizens.find(x=>x.id===id)
  if(!c) return res.status(404).json({ok:false,error:'not found'})
  c.class = cls
  try{ persistCitizen(c) }catch(e){ console.warn('persist citizen update failed', e.message) }
  res.json({ok:true,c})
})

// Withdraw balance for a citizen (demo - simulates payout)
app.post('/api/citizen/withdraw', (req,res)=>{
  const {id, amount} = req.body || {}
  if(!id || amount==null) return res.status(400).json({ok:false,error:'id and amount required'})
  const c = citizens.find(x=>x.id===id)
  if(!c) return res.status(404).json({ok:false,error:'citizen not found'})
  const amt = Number(amount)
  if(amt <= 0) return res.status(400).json({ok:false,error:'amount must be positive'})
  if(Number(c.balance) < amt) return res.status(400).json({ok:false,error:'insufficient balance'})
  c.balance = Number((Number(c.balance) - amt).toFixed(6))
  try{ persistCitizen(c) }catch(e){ console.warn('persist citizen withdraw failed', e.message) }
  // In demo we do not send real funds; return a receipt
  const receipt = {time: Date.now(), citizen: c.id, amount: amt}
  res.json({ok:true,receipt,c})
})

app.get('/api/quests', (req,res)=> res.json(quests))

app.post('/api/quests/claim', (req,res)=>{
  const {questId,citizenId} = req.body || {}
  const q = quests.find(x=>x.id==questId)
  if(!q) return res.status(404).json({ok:false,error:'quest not found'})
  if(q.claimed) return res.status(400).json({ok:false,error:'already claimed'})
  q.claimed = true
  // reward citizen
  q.claimedBy = citizenId || 'unknown'
  const citizen = citizens.find(c=>c.id===citizenId)
  if(citizen){
    citizen.balance = Number((Number(citizen.balance) + Number(q.reward)).toFixed(6))
    try{ persistCitizen(citizen) }catch(e){ console.warn('persist citizen after quest failed', e.message) }
  }
  try{ persistQuest(q) }catch(e){ console.warn('persist quest failed', e.message) }
  res.json({ok:true,quest:q,citizen})
})

app.get('/api/news',(req,res)=>{
  res.json([{id:1,who:'Reporter',text:'Demo news: neon parade!'}])
})

app.listen(8081, ()=>console.log('Backend API listening on 8081'))
