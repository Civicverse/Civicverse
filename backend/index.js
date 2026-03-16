const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const app = express()
const port = process.env.PORT || 3003

const DATA_DIR = path.join(__dirname, '..', 'data')
const ID_DIR = path.join(DATA_DIR, 'identities')
const WALLETS_DIR = path.join(DATA_DIR, 'wallets')
try { fs.mkdirSync(ID_DIR, { recursive: true }) } catch(e) {}
try { fs.mkdirSync(WALLETS_DIR, { recursive: true }) } catch(e) {}

const ubiEngine = require('./services/UBI-engine/ubi-service');
const civicWatch = require('./services/civicwatch-service');

// Security Middleware
app.use(helmet())
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || '*', 
  optionsSuccessStatus: 200 
}))

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

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

app.post('/api/jobs', (req, res) => {
    try {
        const job = civicWatch.createJob(req.body);
        res.json(job);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/jobs/accept', (req, res) => {
  const { jobId, workerId } = req.body;
  try {
    const job = civicWatch.acceptJob(jobId, workerId);
    res.json(job);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/jobs/stream', (req, res) => {
    const { jobId, workerId, isStreaming } = req.body;
    try {
        const job = civicWatch.toggleStreaming(jobId, workerId, isStreaming);
        res.json(job);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/jobs/verify', async (req, res) => {
  try {
    const { jobId, workerId, proofText, proofImage, gpsData } = req.body;
    const result = await civicWatch.submitVerification(jobId, workerId, proofText, proofImage, gpsData);
    
    // Result now includes payoutDetails if verified
    res.json({ success: true, result, payoutDetails: result.payoutDetails });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- Governance & Treasury ---
const governanceService = require('./services/governance-service');

app.get('/api/governance/status', (req, res) => {
  res.json({
    treasuryBalance: governanceService.getTreasuryBalance(),
    proposalCount: governanceService.getProposals().length
  });
});

app.get('/api/governance/proposals', (req, res) => {
  res.json(governanceService.getProposals());
});

app.post('/api/governance/proposals', (req, res) => {
    try {
        const prop = governanceService.createProposal(req.body);
        res.json(prop);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/governance/vote', (req, res) => {
    try {
        const { proposalId, choice, voterId, weight, voterLevel } = req.body;
        // weight is the number of votes to add, voterLevel is identity level (1 or 2)
        const result = governanceService.vote(proposalId, choice, voterId, weight || 1, voterLevel || 1);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/governance/execute', (req, res) => {
    try {
        const { proposalId } = req.body;
        const result = governanceService.executeProposal(proposalId);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});



app.listen(port, () => console.log(`Rebuild backend listening on ${port}`))
