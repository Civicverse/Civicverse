const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const os = require('os')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const trust = require('./lib/trust')
const STATS_LOG = path.join(__dirname, '..', 'data', 'stats.log')

// Data folders
const ACCOUNTS_DIR = path.join(__dirname, '..', 'data', 'accounts')
const ACTIONS_DIR = path.join(__dirname, '..', 'data', 'actions')
const REWARDS_DIR = path.join(__dirname, '..', 'data', 'rewards')

try { fs.mkdirSync(ACCOUNTS_DIR, { recursive: true }) } catch(e) {}
try { fs.mkdirSync(ACTIONS_DIR, { recursive: true }) } catch(e) {}
try { fs.mkdirSync(REWARDS_DIR, { recursive: true }) } catch(e) {}
const GUILDS_DIR = path.join(__dirname, '..', 'data', 'guilds')
try { fs.mkdirSync(GUILDS_DIR, { recursive: true }) } catch(e) {}

// Ensure data directory exists
try {
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true })
} catch (e) {}

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

// System stats endpoint (CPU, RAM, optional GPU via nvidia-smi)
app.get('/api/stats', async (req, res) => {
  try {
    const cpus = os.cpus()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const stats = {
      cpu: {
        model: cpus[0].model,
        cores: cpus.length,
        loadavg: os.loadavg(),
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usedPercent: Math.round((usedMem / totalMem) * 10000) / 100,
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      gpu: {
        available: false,
        devices: [],
      }
    }

    // Try to query nvidia-smi for GPU info if available
    exec('nvidia-smi --query-gpu=name,utilization.gpu,memory.total,memory.used --format=csv,noheader,nounits', { timeout: 2000 }, (err, stdout) => {
      if (!err && stdout) {
        try {
          const lines = stdout.trim().split('\n')
          lines.forEach(line => {
            const parts = line.split(',').map(p => p.trim())
            // name, utilization, mem_total, mem_used
            if (parts.length >= 4) {
              stats.gpu.available = true
              stats.gpu.devices.push({ name: parts[0], utilization: Number(parts[1]), memoryTotal: Number(parts[2]), memoryUsed: Number(parts[3]) })
            }
          })
        } catch (parseErr) {
          // ignore parse
        }
      }

      // Append to log for persistence
      try {
        const entry = { ts: Date.now(), stats }
        fs.appendFile(STATS_LOG, JSON.stringify(entry) + '\n', () => {})
      } catch (e) {
        // ignore write errors
      }

      res.json(stats)
    })
  } catch (err) {
    res.status(500).json({ error: 'failed to collect stats', message: err.message })
  }
})

// Return historical stats (last N entries)
app.get('/api/stats/history', (req, res) => {
  const limit = Math.min(1000, parseInt(req.query.limit || '200', 10)) || 200
  try {
    if (!fs.existsSync(STATS_LOG)) return res.json([])
    const data = fs.readFileSync(STATS_LOG, 'utf8')
    const lines = data.trim().split('\n').filter(Boolean)
    const selected = lines.slice(-limit).map(l => {
      try { return JSON.parse(l) } catch (e) { return null }
    }).filter(Boolean)
    res.json(selected)
  } catch (e) {
    res.status(500).json({ error: 'failed to read history' })
  }
})

// Create account genesis (no KYC) — prefer client-generated key (public key PEM)
app.post('/api/genesis', express.json(), (req, res) => {
  try {
    const clientEntropy = req.body?.clientEntropy || crypto.randomBytes(16).toString('hex')
    const timestamp = Date.now()
    const protocolSalt = process.env.PROTOCOL_SALT || 'civicverse-default-salt'

    // Accept public key from client (PEM). If absent, generate a public key but DO NOT store private key.
    let pubPem = req.body?.publicKey
    if (!pubPem) {
      const { publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
      pubPem = publicKey.export({ type: 'spki', format: 'pem' })
    }

    const ath = trust.computeATH({ publicKeyPem: pubPem, timestamp, clientEntropy, protocolSalt })

    // Persist account without private key
    const acct = { ath, publicKey: pubPem, createdAt: timestamp }
    fs.writeFileSync(path.join(ACCOUNTS_DIR, `${ath}.json`), JSON.stringify(acct, null, 2))

    res.json({ ath, publicKey: pubPem, createdAt: timestamp })
  } catch (err) {
    res.status(500).json({ error: 'genesis_failed', message: err.message })
  }
})

// Submit an action proof (APH) — expects signed payload when possible
app.post('/api/action', express.json(), (req, res) => {
  try {
    const { ath, actionType, sessionNonce, timestamp, outcome, signature } = req.body
    if (!ath || !actionType || !timestamp) return res.status(400).json({ error: 'missing_fields' })

    const acctPath = path.join(ACCOUNTS_DIR, `${ath}.json`)
    if (!fs.existsSync(acctPath)) return res.status(404).json({ error: 'account_not_found' })
    const acct = JSON.parse(fs.readFileSync(acctPath, 'utf8'))

    const aphInput = { ath, actionType, sessionNonce, timestamp, outcome }
    const aph = trust.computeAPH(aphInput)

    // Rate-limit: simple anti-farm burst protection (max 10 actions per minute)
    const actionsLog = path.join(ACTIONS_DIR, `${ath}.log`)
    let recentLines = []
    if (fs.existsSync(actionsLog)) {
      recentLines = fs.readFileSync(actionsLog, 'utf8').trim().split('\n').filter(Boolean)
    }
    const now = Date.now()
    const lastMinute = recentLines.map(l => JSON.parse(l)).filter(l => (now - l.ts) < 60 * 1000).length
    if (lastMinute > 60) return res.status(429).json({ error: 'rate_limited', message: 'too many actions recently' })

    // Require signature for authenticity; verify using stored public key (ECDSA P-256 + SHA-256)
    if (!signature) return res.status(400).json({ error: 'missing_signature' })
    const ok = trust.verifySignatureECDSA(acct.publicKey, JSON.stringify(aphInput), signature)
    if (!ok) return res.status(400).json({ error: 'invalid_signature' })

    // Append action to account action log
    const entry = { ts: Date.now(), aph, actionType, sessionNonce, timestamp, outcome }
    fs.appendFileSync(actionsLog, JSON.stringify(entry) + '\n')

    res.json({ aph, stored: true })
  } catch (err) {
    res.status(500).json({ error: 'action_failed', message: err.message })
  }
})

// Compute simple karma and level from stored actions (deterministic, explainable)
function computeKarmaAndLevel(ath) {
  const actionsLog = path.join(ACTIONS_DIR, `${ath}.log`)
  if (!fs.existsSync(actionsLog)) return { karmaBand: 'none', level: 1, karmaScore: 0 }
  const lines = fs.readFileSync(actionsLog, 'utf8').trim().split('\n').filter(Boolean)
  const acctPath = path.join(ACCOUNTS_DIR, `${ath}.json`)
  const acct = fs.existsSync(acctPath) ? JSON.parse(fs.readFileSync(acctPath, 'utf8')) : { createdAt: Date.now() }
  return trust.computeKarmaAndLevelFromActions(lines, acct.createdAt)
}

// Account summary
app.get('/api/account/:ath', (req, res) => {
  const ath = req.params.ath
  const acctPath = path.join(ACCOUNTS_DIR, `${ath}.json`)
  if (!fs.existsSync(acctPath)) return res.status(404).json({ error: 'account_not_found' })
  const acct = JSON.parse(fs.readFileSync(acctPath, 'utf8'))
  const stats = computeKarmaAndLevel(ath)
  res.json({ ath, publicKey: acct.publicKey, createdAt: acct.createdAt, ...stats })
})

// Rewards endpoint (simple earned credits calculation)
app.get('/api/rewards/:ath', (req, res) => {
  const ath = req.params.ath
  const actionsLog = path.join(ACTIONS_DIR, `${ath}.log`)
  if (!fs.existsSync(actionsLog)) return res.json({ credits: 0, details: {} })
  const lines = fs.readFileSync(actionsLog, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
  const { karmaBand } = computeKarmaAndLevel(ath)
  const base = lines.length * 1 // 1 credit per action
  const multiplier = { none: 0.2, bronze: 0.6, silver: 1, gold: 1.5, platinum: 2 }[karmaBand] || 0.5
  const credits = Math.floor(base * multiplier)
  res.json({ credits, base, multiplier, karmaBand })
})

app.listen(port, () => {
  console.log(`Civicverse backend stub listening on port ${port}`)
})

// Startup sanitization: remove any privateKey fields from persisted accounts
;(function sanitizeAccounts() {
  try {
    const files = fs.readdirSync(ACCOUNTS_DIR)
    files.forEach(f => {
      try {
        const p = path.join(ACCOUNTS_DIR, f)
        const obj = JSON.parse(fs.readFileSync(p, 'utf8'))
        if (obj.privateKey) {
          delete obj.privateKey
          fs.writeFileSync(p, JSON.stringify(obj, null, 2))
          console.log('Sanitized privateKey from', f)
        }
      } catch (e) {}
    })
  } catch (e) {}
})()

// Guild invite endpoint: sponsors sign an invite for a new ATH
app.post('/api/guild/invite', express.json(), (req, res) => {
  try {
    const { ath_new, sponsors, signatures, timestamp } = req.body
    if (!ath_new || !Array.isArray(sponsors) || !Array.isArray(signatures) || sponsors.length < 3) return res.status(400).json({ error: 'invalid_request' })
    const ts = timestamp || Date.now()
    const inviteInput = { ath_new, sponsors, timestamp: ts }
    const inviteHash = crypto.createHash('sha256').update(trust.stableStringify(inviteInput)).digest('hex')

    // Verify each sponsor signature
    for (let i = 0; i < sponsors.length; i++) {
      const s = sponsors[i]
      const sig = signatures[i]
      const acctPath = path.join(ACCOUNTS_DIR, `${s}.json`)
      if (!fs.existsSync(acctPath)) return res.status(404).json({ error: 'sponsor_not_found', sponsor: s })
      const acct = JSON.parse(fs.readFileSync(acctPath, 'utf8'))
      const ok = trust.verifySignatureECDSA(acct.publicKey, trust.stableStringify(inviteInput), sig)
      if (!ok) return res.status(400).json({ error: 'invalid_sponsor_signature', sponsor: s })
    }

    const invitePath = path.join(GUILDS_DIR, `${inviteHash}.json`)
    const inviteObj = { inviteHash, ath_new, sponsors, timestamp: ts, createdAt: Date.now() }
    fs.writeFileSync(invitePath, JSON.stringify(inviteObj, null, 2))

    // If new account exists, mark as invited and record sponsor list
    const newAcctPath = path.join(ACCOUNTS_DIR, `${ath_new}.json`)
    if (fs.existsSync(newAcctPath)) {
      const acct = JSON.parse(fs.readFileSync(newAcctPath, 'utf8'))
      acct.guildInvite = { inviteHash, sponsors, invitedAt: Date.now() }
      fs.writeFileSync(newAcctPath, JSON.stringify(acct, null, 2))
    }

    res.json({ inviteHash, stored: true })
  } catch (e) {
    res.status(500).json({ error: 'invite_failed', message: e.message })
  }
})

// Compute and distribute rewards (manual/triggered run for demo)
app.post('/api/rewards/compute', express.json(), (req, res) => {
  try {
    // For each account with actions, compute credits and write to rewards dir
    const acctFiles = fs.readdirSync(ACCOUNTS_DIR).filter(Boolean)
    const results = []
    acctFiles.forEach(f => {
      try {
        const ath = path.basename(f, '.json')
        const actionsLog = path.join(ACTIONS_DIR, `${ath}.log`)
        if (!fs.existsSync(actionsLog)) return
        const lines = fs.readFileSync(actionsLog, 'utf8').trim().split('\n').filter(Boolean)
        const { karmaBand } = computeKarmaAndLevel(ath)
        const base = lines.length * 1
        const multiplier = { none: 0.2, bronze: 0.6, silver: 1, gold: 1.5, platinum: 2 }[karmaBand] || 0.5
        const credits = Math.floor(base * multiplier)
        const out = { ath, credits, base, multiplier, karmaBand, computedAt: Date.now() }
        fs.writeFileSync(path.join(REWARDS_DIR, `${ath}.json`), JSON.stringify(out, null, 2))
        results.push(out)
      } catch (e) {}
    })
    res.json({ distributed: results.length, results })
  } catch (e) {
    res.status(500).json({ error: 'compute_failed', message: e.message })
  }
})
