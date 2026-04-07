import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicOnboarding } from './index';

const app = express();
const port = 3001;
const onboarding = new CivicOnboarding();

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-onboarding' }));

app.post('/tos/accept', (req, res) => {
  onboarding.acceptTOS();
  res.json({ success: true });
});

app.post('/seed/verify', (req, res) => {
  const { words } = req.body;
  try {
    onboarding.verifySeed(words);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/status', (req, res) => {
  res.json(onboarding.getStatus());
});

app.listen(port, () => console.log(`CivicOnboarding Service listening on port ${port}`));
