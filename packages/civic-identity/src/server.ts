import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicIdentity } from './index';

const app = express();
const port = 3009;
// In a real flow, DID/PubKey come from the Vault service
const identity = new CivicIdentity("did:civic:proto-node", "cv_pub_proto_123");

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-identity' }));

app.get('/profile', (req, res) => {
  res.json(identity.getProfile());
});

app.post('/pop/complete', async (req, res) => {
  const { sixDigit, qrData, notes } = req.body;
  try {
    const success = await identity.completePoP(sixDigit, qrData, notes);
    res.json({ success, profile: identity.getProfile() });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/avatar/update', (req, res) => {
  const { url } = req.body;
  identity.updateAvatar(url);
  res.json({ success: true, profile: identity.getProfile() });
});

app.listen(port, () => console.log(`CivicIdentity Service (Civic ID & Avatar) listening on port ${port}`));
