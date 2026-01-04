const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// Player state tracking
const players = new Map(); // playerId -> playerState
let playerIdCounter = 0;

// Wallets and matches (simulated CVT token)
const wallets = new Map(); // playerId -> balance (number)
let communityWallet = 0;
const matches = new Map(); // matchId -> { id, owner, participants: Set, bets: Map(playerId->amount), status }
let matchIdCounter = 0;

// Combat constants
const DAMAGE_PER_HIT = 25;
const ATTACK_RANGE = 3;
const ATTACK_COOLDOWN = 500;

class Player {
  constructor(id) {
    this.id = id;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.health = 100;
    this.kills = 0;
    this.deaths = 0;
    this.lastAttackTime = 0;
    this.isAlive = true;
    this.matchId = null;
    this.matchKills = 0;
  }

  toJSON() {
    return {
      id: this.id,
      position: this.position,
      rotation: this.rotation,
      health: this.health,
      kills: this.kills,
      deaths: this.deaths,
      isAlive: this.isAlive,
    };
  }
}

// Broadcast player state to all clients
function broadcastPlayers() {
  const playerList = Array.from(players.values()).map(p => p.toJSON());
  const message = JSON.stringify({
    type: 'players_update',
    players: playerList,
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Check if attack hits another player
function checkAttackHit(attacker, targetId) {
  const target = players.get(targetId);
  if (!target || !target.isAlive) return false;

  const dx = target.position.x - attacker.position.x;
  const dy = target.position.y - attacker.position.y;
  const dz = target.position.z - attacker.position.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return distance < ATTACK_RANGE;
}

// Handle player attack
function handleAttack(attacker, targetId) {
  const now = Date.now();
  
  // Check cooldown
  if (now - attacker.lastAttackTime < ATTACK_COOLDOWN) {
    return { success: false, reason: 'cooldown' };
  }

  attacker.lastAttackTime = now;

  // Check if hit target
  if (checkAttackHit(attacker, targetId)) {
    const target = players.get(targetId);
    if (target && target.isAlive) {
      target.health -= DAMAGE_PER_HIT;
      
      if (target.health <= 0) {
        // Kill
        target.health = 0;
        target.isAlive = false;
        attacker.kills++;
        // match-scoped kill
        if (attacker.matchId) {
          attacker.matchKills = (attacker.matchKills || 0) + 1;
        }
        target.deaths++;
        
        // Schedule respawn
        setTimeout(() => respawnPlayer(targetId), 3000);
        
        return {
          success: true,
          killed: targetId,
          killerKills: attacker.kills,
        };
      }

      return {
        success: true,
        hit: targetId,
        targetHealth: target.health,
      };
    }
  }

  return { success: false, reason: 'missed' };
}

// Respawn player
function respawnPlayer(playerId) {
  const player = players.get(playerId);
  if (player) {
    player.health = 100;
    player.isAlive = true;
    // Random spawn position
    player.position = {
      x: (Math.random() - 0.5) * 50,
      y: 0,
      z: (Math.random() - 0.5) * 50,
    };
    broadcastPlayers();
  }
}

// map of playerId -> ws
const wsByPlayerId = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
  const playerId = ++playerIdCounter;
  const player = new Player(playerId);
  
  // Random spawn position
  player.position = {
    x: (Math.random() - 0.5) * 50,
    y: 0,
    z: (Math.random() - 0.5) * 50,
  };
  
  players.set(playerId, player);

  // initialize simulated wallet for player (if not present)
  if (!wallets.has(playerId)) wallets.set(playerId, 1000); // start with 1000 CVT

  // store ws for potential direct messages
  ws.playerId = playerId;
  wsByPlayerId.set(playerId, ws);

  console.log(`Player ${playerId} connected. Total players: ${players.size}`);

  // Send player their ID
  ws.send(JSON.stringify({
    type: 'player_id',
    playerId: playerId,
  }));

  // Broadcast initial player list
  broadcastPlayers();

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'player_move':
          if (players.has(playerId)) {
            players.get(playerId).position = message.position;
            players.get(playerId).rotation = message.rotation;
          }
          break;

        case 'player_attack':
          if (players.has(playerId)) {
            const attacker = players.get(playerId);
            const result = handleAttack(attacker, message.targetId);
            
            // Broadcast result to all players
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'attack_result',
                  attacker: playerId,
                  target: message.targetId,
                  result: result,
                }));
              }
            });

            // Broadcast updated player states
            broadcastPlayers();
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    players.delete(playerId);
    console.log(`Player ${playerId} disconnected. Total players: ${players.size}`);
    broadcastPlayers();
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for player ${playerId}:`, err);
  });
});

// REST endpoints for testing/admin
app.get('/api/players', (req, res) => {
  const playerList = Array.from(players.values()).map(p => p.toJSON());
  res.json({
    count: playerList.length,
    players: playerList,
  });
});

// Create a royal deathmatch (simulated)
app.post('/api/match/create', (req, res) => {
  const owner = req.body.owner || null;
  const id = ++matchIdCounter;
  const match = {
    id,
    owner,
    participants: new Set(),
    bets: new Map(),
    status: 'open', // open, running, finished
    createdAt: Date.now(),
  };
  matches.set(id, match);
  res.json({ matchId: id });
});

app.post('/api/match/join', (req, res) => {
  const { matchId, playerId } = req.body;
  const match = matches.get(Number(matchId));
  const player = players.get(Number(playerId));
  if (!match) return res.status(404).json({ error: 'match not found' });
  if (!player) return res.status(404).json({ error: 'player not found' });
  match.participants.add(Number(playerId));
  player.matchId = match.id;
  player.matchKills = 0;
  res.json({ ok: true, matchId });
});

app.post('/api/match/place_bet', (req, res) => {
  const { matchId, playerId, amount } = req.body;
  const match = matches.get(Number(matchId));
  const pid = Number(playerId);
  const amt = Number(amount) || 0;
  if (!match) return res.status(404).json({ error: 'match not found' });
  if (!players.has(pid)) return res.status(404).json({ error: 'player not found' });
  const balance = wallets.get(pid) || 0;
  if (amt <= 0 || balance < amt) return res.status(400).json({ error: 'insufficient funds' });
  // deduct immediately (escrow)
  wallets.set(pid, balance - amt);
  match.bets.set(pid, (match.bets.get(pid) || 0) + amt);
  res.json({ ok: true, balance: wallets.get(pid), bet: match.bets.get(pid) });
});

app.post('/api/match/start', (req, res) => {
  const { matchId } = req.body;
  const match = matches.get(Number(matchId));
  if (!match) return res.status(404).json({ error: 'match not found' });
  match.status = 'running';
  // reset matchKills for participants
  match.participants.forEach(pid => {
    const p = players.get(pid);
    if (p) p.matchKills = 0;
  });
  // broadcast match state
  const msg = JSON.stringify({ type: 'match_update', match: serializeMatch(match) });
  wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(msg));
  res.json({ ok: true });
});

// Force end and resolve match (for testing or when time expires)
app.post('/api/match/end', (req, res) => {
  const { matchId } = req.body;
  const match = matches.get(Number(matchId));
  if (!match) return res.status(404).json({ error: 'match not found' });
  const result = resolveMatch(match.id);
  res.json({ ok: true, result });
});

app.get('/api/match/:id', (req, res) => {
  const match = matches.get(Number(req.params.id));
  if (!match) return res.status(404).json({ error: 'match not found' });
  res.json(serializeMatch(match));
});

app.get('/api/wallet/:playerId', (req, res) => {
  const pid = Number(req.params.playerId);
  res.json({ balance: wallets.get(pid) || 0 });
});

app.get('/api/community_wallet', (req, res) => {
  res.json({ community: communityWallet });
});

function serializeMatch(match) {
  return {
    id: match.id,
    owner: match.owner,
    participants: Array.from(match.participants),
    bets: Array.from(match.bets.entries()),
    status: match.status,
    createdAt: match.createdAt,
  };
}

function resolveMatch(matchId) {
  const match = matches.get(Number(matchId));
  if (!match) return null;
  // determine winner by highest matchKills
  let topKills = -1;
  let winners = [];
  match.participants.forEach(pid => {
    const p = players.get(pid);
    const mk = (p && p.matchKills) || 0;
    if (mk > topKills) { topKills = mk; winners = [pid]; }
    else if (mk === topKills) winners.push(pid);
  });
  if (winners.length === 0) {
    match.status = 'finished';
    return { winners: [], distributed: 0 };
  }
  const winner = winners[Math.floor(Math.random() * winners.length)];
  // sum bets
  let total = 0;
  match.bets.forEach(v => total += v);
  const fee = total * 0.01;
  const payout = total - fee;
  communityWallet += fee;
  wallets.set(winner, (wallets.get(winner) || 0) + payout);
  match.status = 'finished';
  // clear participants' matchId
  match.participants.forEach(pid => {
    const p = players.get(pid);
    if (p) { p.matchId = null; p.matchKills = 0; }
  });
  // broadcast match result
  const msg = JSON.stringify({ type: 'match_result', matchId: match.id, winner, payout, fee });
  wss.clients.forEach(c => c.readyState === WebSocket.OPEN && c.send(msg));
  return { winner, payout, fee };
}

app.post('/api/reset', (req, res) => {
  players.clear();
  playerIdCounter = 0;
  res.json({ message: 'Game reset', players: 0 });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.MULTIPLAYER_PORT || 8080;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
