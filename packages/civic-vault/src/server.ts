import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicVault } from './index';

const app = express();
const port = 3008;
const vault = new CivicVault();

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-vault' }));

app.post('/generate', (req, res) => {
  const mnemonic = vault.generateMnemonic();
  res.json({ mnemonic });
});

app.post('/import', (req, res) => {
  const { mnemonic } = req.body;
  try {
    vault.importMnemonic(mnemonic);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/keys', (req, res) => {
  try {
    res.json(vault.getDerivedKeys());
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.listen(port, () => console.log(`CivicVault Service listening on port ${port}`));
