import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { CivicFoyer } from './index';
import { CivicIdentity } from '@civicverse/civic-identity';

const app = express();
const port = 3007;
const identity = new CivicIdentity(); 
const foyer = new CivicFoyer(identity);

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'civic-foyer' }));

app.get('/feed', (req, res) => res.json(foyer.getFeed()));

app.post('/feed/post', (req, res) => {
  const { content, tags } = req.body;
  try {
    const postId = foyer.postToFeed(content, tags);
    res.json({ postId });
  } catch (e: any) {
    res.status(403).json({ error: e.message });
  }
});

app.get('/avatar', (req, res) => {
  res.json(foyer.getAvatarData());
});

app.listen(port, () => console.log(`CivicFoyer Service listening on port ${port}`));
