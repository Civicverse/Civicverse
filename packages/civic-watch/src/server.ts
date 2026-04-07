import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicWatch } from './index';
import { CivicIdentity } from '@civicverse/civic-identity';

const app = express();
const port = 3002;
// Identity must be passed in - in a real microservice, this would call the identity service or use a shared key.
// For this standalone setup, we'll initialize a local identity or rely on the core logic.
const identity = new CivicIdentity(); 
const watch = new CivicWatch(identity);

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-watch' }));

app.get('/jobs', (req, res) => res.json(watch.getJobs()));

app.post('/jobs/create', (req, res) => {
  const { title, description, reward } = req.body;
  try {
    const jobId = watch.createJob(title, description, reward);
    res.json({ jobId });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.post('/jobs/accept', (req, res) => {
  const { jobId } = req.body;
  try {
    watch.acceptJob(jobId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.post('/jobs/submit-proof', (req, res) => {
  const { jobId, proof } = req.body;
  try {
    watch.submitProof(jobId, proof);
    res.json({ success: true });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`CivicWatch Service listening on port ${port}`));
