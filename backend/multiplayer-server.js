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
