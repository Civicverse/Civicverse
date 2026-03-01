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

const ubiEngine = require('./services/UBI-engine/ubi-service');
const civicWatch = require('./services/civicwatch-service');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(bodyParser.json({ limit: '10mb' })) // Increased limit for image proofs

app.get('/api/status', (req, res) => {
  res.json({ status: 'rebuild-backend', time: new Date().toISOString() })
})

// --- Identity & Wallet ---

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

// --- CivicWatch Jobs ---

app.get('/api/jobs', (req, res) => {
  res.json(civicWatch.getJobs());
});

app.post('/api/jobs/accept', (req, res) => {
  try {
    const { jobId, workerId } = req.body;
    const job = civicWatch.acceptJob(jobId, workerId);
    res.json({ success: true, job });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/jobs/verify', async (req, res) => {
  try {
    const { jobId, workerId, proofData } = req.body;
    const result = await civicWatch.submitVerification(jobId, workerId, proofData);
    
    // If finalized immediately (mock), handle payout
    if (result.status === 'verified') {
        const payoutDetails = civicWatch.finalizeJob(jobId);
        // Note: In a real app, we'd update the wallet here. 
        // For now, we return the details so the frontend knows what happened.
        res.json({ success: true, result, payoutDetails });
    } else {
        res.json({ success: true, result });
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- Governance (Simple In-Memory) ---
// TODO: Move to a proper service
const proposals = [];
app.get('/api/governance/proposals', (req, res) => {
  res.json(proposals);
});

app.post('/api/governance/proposals', (req, res) => {
    const prop = { ...req.body, id: `prop_${Date.now()}`, votesFor: 0, votesAgainst: 0, status: 'voting' };
    proposals.push(prop);
    res.json(prop);
});

app.post('/api/governance/vote', (req, res) => {
    const { proposalId, choice } = req.body;
    const prop = proposals.find(p => p.id === proposalId);
    if (!prop) return res.status(404).json({ error: 'Proposal not found' });
    
    if (choice === 'yes') prop.votesFor++;
    if (choice === 'no') prop.votesAgainst++;
    
    res.json({ success: true, proposal: prop });
});

app.listen(port, () => console.log(`Rebuild backend listening on ${port}`))
