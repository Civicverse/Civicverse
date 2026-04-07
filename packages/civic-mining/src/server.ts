import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicMining } from './index';
import { CivicIdentity } from '@civicverse/civic-identity';

const app = express();
const port = 3005;
const identity = new CivicIdentity(); 
const mining = new CivicMining(identity);

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-mining' }));

app.get('/stats', (req, res) => {
  res.json(mining.getStats());
});

app.post('/stats/update', (req, res) => {
  const { hashrate, mined } = req.body;
  try {
    mining.updateStats(hashrate, mined);
    res.json({ success: true, stats: mining.getStats() });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`CivicMining Service listening on port ${port}`));
