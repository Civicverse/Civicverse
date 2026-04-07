import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicGovernance } from './index';
import { CivicIdentity } from '@civicverse/civic-identity';

const app = express();
const port = 3004;
const identity = new CivicIdentity(); 
const gov = new CivicGovernance(identity);

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-governance' }));

app.get('/proposals', (req, res) => res.json(gov.getProposals()));

app.post('/proposals/create', (req, res) => {
  const { title, description } = req.body;
  try {
    const propId = gov.createProposal(title, description);
    res.json({ propId });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.post('/proposals/vote', (req, res) => {
  const { proposalId, choice, tokens } = req.body;
  try {
    gov.vote(proposalId, choice, tokens);
    res.json({ success: true });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`CivicGovernance Service listening on port ${port}`));
