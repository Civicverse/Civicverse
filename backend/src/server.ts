import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicIdentity } from '@civicverse/civic-identity';
import { CivicWatch } from '@civicverse/civic-watch';
import { CivicGovernance } from '@civicverse/civic-governance';
import { CivicMining } from '@civicverse/civic-mining';
import { CivicFoyer } from '@civicverse/civic-foyer';

const app = express();
const port = 3003;

app.use(cors());
app.use(bodyParser.json());

// Initialize Modular Packages
const identity = new CivicIdentity();
const watch = new CivicWatch(identity);
const gov = new CivicGovernance(identity);
const mining = new CivicMining(identity);
const foyer = new CivicFoyer(identity);

// --- Identity Routes ---
app.post('/api/identity/create', async (req, res) => {
  const mnemonic = await identity.createWallet();
  res.json({ mnemonic });
});

app.post('/api/identity/import', async (req, res) => {
  const { mnemonic } = req.body;
  const pubKey = await identity.importWallet(mnemonic);
  res.json({ pubKey, profile: identity.getProfile() });
});

app.post('/api/identity/verify', async (req, res) => {
  const { sixDigit, qrData, notes } = req.body;
  const success = await identity.completePoP(sixDigit, qrData, notes);
  res.json({ success, profile: identity.getProfile() });
});

// --- CivicWatch Routes (Gated by isVerified) ---
app.get('/api/watch/jobs', (req, res) => {
  res.json(watch.getJobs());
});

app.post('/api/watch/jobs', (req, res) => {
  try {
    const { title, description, reward } = req.body;
    const jobId = watch.createJob(title, description, reward);
    res.json({ jobId });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

// --- Foyer Feed ---
app.get('/api/foyer/feed', (req, res) => {
  res.json(foyer.getFeed());
});

app.listen(port, () => {
  console.log(`CivicVerse Modular Backend listening on port ${port}`);
});
