import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicMarketplace } from './index';
import { CivicIdentity } from '@civicverse/civic-identity';

const app = express();
const port = 3006;
const identity = new CivicIdentity(); 
const marketplace = new CivicMarketplace(identity);

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-marketplace' }));

app.get('/tips', (req, res) => res.json(marketplace.getTips()));

app.post('/tips/send', (req, res) => {
  const { toPubKey, amount } = req.body;
  try {
    const tip = marketplace.sendTip(toPubKey, amount);
    res.json(tip);
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`CivicMarketplace Service listening on port ${port}`));
