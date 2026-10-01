const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const ubiEngine = require('./services/UBI-engine/ubi-service');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// ========================================================
// LOBBY INSTANCE SYSTEM (MAX 20 CITIZENS PER INSTANCE)
// ========================================================
const MAX_PLAYERS_PER_LOBBY = 20;

class Lobby {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.playerIds = new Set();
    this.chatHistory = [];
    this.createdAt = Date.now();
  }

  isFull() {
    return this.playerIds.size >= MAX_PLAYERS_PER_LOBBY;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      playerCount: this.playerIds.size,
      maxPlayers: MAX_PLAYERS_PER_LOBBY,
      isFull: this.isFull()
    };
  }
}

const lobbies = new Map(); // lobbyId -> Lobby

// Initialize default lobbies
lobbies.set('district-lobby-1', new Lobby('district-lobby-1', 'New District — Gathering Grounds Alpha'));
lobbies.set('district-lobby-2', new Lobby('district-lobby-2', 'New District — Gathering Grounds Beta'));
lobbies.set('district-lobby-3', new Lobby('district-lobby-3', 'New District — Gathering Grounds Gamma'));

function findAvailableLobby() {
  for (const lobby of lobbies.values()) {
    if (!lobby.isFull()) return lobby;
  }
  // Create a new instance dynamically if all existing are full
  const nextNum = lobbies.size + 1;
  const newLobby = new Lobby(`district-lobby-${nextNum}`, `New District — Gathering Grounds ${nextNum}`);
  lobbies.set(newLobby.id, newLobby);
  return newLobby;
}

function getLobbyList() {
  return Array.from(lobbies.values()).map(l => l.toJSON());
}

// Player state tracking
const players = new Map(); // playerId -> playerState
let playerIdCounter = 0;
const wsByPlayerId = new Map(); // playerId -> WebSocket

// Wallets and matches (simulated CVT token)
const wallets = new Map(); // playerId -> balance (number)
let communityWallet = 0;
const matches = new Map();
let matchIdCounter = 0;

// ToS consents storage
const tosConsents = new Map();
const TOS_FILE = __dirname + '/tos_consents.json';
const CHAT_FILE = __dirname + '/chat_history.json';

const MAX_CHAT_HISTORY = 100;

// Load existing consents if present
try {
  if (fs.existsSync(TOS_FILE)) {
    const raw = fs.readFileSync(TOS_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    Object.entries(parsed).forEach(([k, v]) => tosConsents.set(Number(k), v));
  }
} catch (err) {
  console.error('Failed to load TOS consents:', err);
}

// Combat constants
const DAMAGE_PER_HIT = 25;
const ATTACK_RANGE = 3;
const ATTACK_COOLDOWN = 500;

class Player {
  constructor(id) {
    this.id = id;
    this.username = `Guest_${id}`;
    this.character = null;
    this.lobbyId = 'district-lobby-1';
    this.position = { x: 0, y: 0, z: 20 };
    this.rotation = { x: 0, y: Math.PI, z: 0 };
    this.health = 100;
    this.kills = 0;
    this.deaths = 0;
    this.lastAttackTime = 0;
    this.isAlive = true;
    this.isMoving = false;
    this.matchId = null;
    this.matchKills = 0;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      character: this.character,
      lobbyId: this.lobbyId,
      position: this.position,
      rotation: this.rotation,
      health: this.health,
      kills: this.kills,
      deaths: this.deaths,
      isAlive: this.isAlive,
      isMoving: this.isMoving,
    };
  }
}

// Broadcast player state to clients in a specific lobby instance
function broadcastLobbyPlayers(lobbyId) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;

  const playerList = [];
  lobby.playerIds.forEach(pid => {
    const p = players.get(pid);
    if (p) playerList.push(p.toJSON());
  });

  const message = JSON.stringify({
    type: 'players_update',
    lobbyId: lobbyId,
    lobbyName: lobby.name,
    playerCount: playerList.length,
    maxPlayers: MAX_PLAYERS_PER_LOBBY,
    players: playerList,
  });

  lobby.playerIds.forEach(pid => {
    const ws = wsByPlayerId.get(pid);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// Broadcast chat message to a specific lobby instance
function broadcastLobbyChat(lobbyId, chatMsg) {
  const lobby = lobbies.get(lobbyId);
  if (!lobby) return;

  lobby.chatHistory.push(chatMsg);
  if (lobby.chatHistory.length > MAX_CHAT_HISTORY) {
    lobby.chatHistory.shift();
  }

  const message = JSON.stringify({
    type: 'chat_message',
    lobbyId: lobbyId,
    ...chatMsg,
  });

  lobby.playerIds.forEach(pid => {
    const ws = wsByPlayerId.get(pid);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// 20Hz game tick loop for smooth multiplayer movement sync per lobby
setInterval(() => {
  lobbies.forEach((lobby, lobbyId) => {
    if (lobby.playerIds.size > 0) {
      broadcastLobbyPlayers(lobbyId);
    }
  });
}, 50);

// Assign or move player between lobbies
function assignPlayerToLobby(player, targetLobbyId) {
  // Remove from old lobby
  if (player.lobbyId && lobbies.has(player.lobbyId)) {
    const oldLobby = lobbies.get(player.lobbyId);
    oldLobby.playerIds.delete(player.id);
    broadcastLobbyPlayers(oldLobby.id);
  }

  // Find or use target lobby
  let targetLobby = null;
  if (targetLobbyId && lobbies.has(targetLobbyId)) {
    const candidate = lobbies.get(targetLobbyId);
    if (!candidate.isFull()) {
      targetLobby = candidate;
    }
  }

  if (!targetLobby) {
    targetLobby = findAvailableLobby();
  }

  player.lobbyId = targetLobby.id;
  targetLobby.playerIds.add(player.id);

  const ws = wsByPlayerId.get(player.id);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'lobby_joined',
      lobbyId: targetLobby.id,
      lobbyName: targetLobby.name,
      playerCount: targetLobby.playerIds.size,
      maxPlayers: MAX_PLAYERS_PER_LOBBY,
      availableLobbies: getLobbyList(),
    }));

    // Send lobby-specific chat history
    ws.send(JSON.stringify({
      type: 'chat_history',
      lobbyId: targetLobby.id,
      history: targetLobby.chatHistory,
    }));
  }

  broadcastLobbyPlayers(targetLobby.id);
}

// Check if attack hits another player
function checkAttackHit(attacker, targetId) {
  const target = players.get(targetId);
  if (!target || !target.isAlive || target.lobbyId !== attacker.lobbyId) return false;

  const dx = target.position.x - attacker.position.x;
  const dy = target.position.y - attacker.position.y;
  const dz = target.position.z - attacker.position.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return distance < ATTACK_RANGE;
}

// Handle player attack
function handleAttack(attacker, targetId) {
  const now = Date.now();
  if (now - attacker.lastAttackTime < ATTACK_COOLDOWN) {
    return { success: false, reason: 'cooldown' };
  }
  attacker.lastAttackTime = now;

  if (checkAttackHit(attacker, targetId)) {
    const target = players.get(targetId);
    target.health -= DAMAGE_PER_HIT;

    if (target.health <= 0) {
      target.health = 0;
      target.isAlive = false;
      target.deaths++;
      attacker.kills++;
      attacker.matchKills = (attacker.matchKills || 0) + 1;
      setTimeout(() => respawnPlayer(targetId), 3000);
      return { success: true, hit: true, killed: true, targetId, damage: DAMAGE_PER_HIT };
    }

    return { success: true, hit: true, killed: false, targetId, damage: DAMAGE_PER_HIT };
  }

  return { success: false, reason: 'missed' };
}

// Respawn player
function respawnPlayer(playerId) {
  const player = players.get(playerId);
  if (player) {
    player.health = 100;
    player.isAlive = true;
    player.position = {
      x: (Math.random() - 0.5) * 30,
      y: 0,
      z: (Math.random() - 0.5) * 30 + 10,
    };
    broadcastLobbyPlayers(player.lobbyId);
  }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const playerId = ++playerIdCounter;
  const player = new Player(playerId);
  
  // Random spawn position
  player.position = {
    x: (Math.random() - 0.5) * 20,
    y: 0,
    z: (Math.random() - 0.5) * 20 + 15,
  };
  
  players.set(playerId, player);
  ws.playerId = playerId;
  wsByPlayerId.set(playerId, ws);

  if (!wallets.has(playerId)) wallets.set(playerId, 1000);

  console.log(`Player ${playerId} connected. Total online: ${players.size}`);

  // Send player their ID and UBI status
  ws.send(JSON.stringify({
    type: 'player_id',
    playerId: playerId,
    ubiStatus: ubiEngine.getStatus()
  }));

  // Assign to first open 20-player lobby instance
  assignPlayerToLobby(player, null);

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'join_lobby':
          if (players.has(playerId)) {
            assignPlayerToLobby(players.get(playerId), message.lobbyId);
          }
          break;

        case 'player_move':
          if (players.has(playerId)) {
            const p = players.get(playerId);
            p.position = message.position;
            p.rotation = message.rotation;
            if (message.isMoving !== undefined) p.isMoving = message.isMoving;
          }
          break;

        case 'player_identity':
          if (players.has(playerId)) {
            const p = players.get(playerId);
            p.username = message.username || `Guest_${playerId}`;
            if (message.character) {
              p.character = message.character;
            }
            broadcastLobbyPlayers(p.lobbyId);
          }
          break;

        case 'chat_message':
          if (players.has(playerId)) {
            const p = players.get(playerId);
            const chatMsg = {
              id: message.id || Date.now().toString(),
              playerId: playerId,
              username: message.username || p.username,
              text: message.text,
              color: message.color || 'text-cyan-400',
              timestamp: new Date().toISOString()
            };
            broadcastLobbyChat(p.lobbyId, chatMsg);
          }
          break;

        case 'microtransaction':
          // Process microtransaction with 1% passive contribution to UBI pool
          if (players.has(playerId)) {
            const p = players.get(playerId);
            const amt = Math.max(0.1, Number(message.amount) || 1.0);
            const { netAmount, taxAmount } = ubiEngine.processTransaction(amt);

            const txEvent = {
              type: 'microtransaction_event',
              id: `tx_${Date.now()}`,
              senderId: playerId,
              senderUsername: p.username,
              recipient: message.recipient || 'Community Treasury',
              grossAmount: amt,
              netAmount,
              passiveUbiCut: taxAmount,
              memo: message.memo || 'Citizen Micro-Contribution',
              timestamp: new Date().toISOString(),
              ubiStatus: ubiEngine.getStatus()
            };

            // Broadcast to the lobby
            const lobby = lobbies.get(p.lobbyId);
            if (lobby) {
              const noticeMsg = {
                id: `notice_${Date.now()}`,
                playerId: 'system',
                username: '🏛️ CIVIC TREASURY',
                text: `${p.username} made a micro-contribution of ${amt} CIVIC (${taxAmount.toFixed(3)} CIVIC routed to Sovereign UBI Pool)!`,
                color: 'text-amber-400',
                timestamp: new Date().toISOString()
              };
              broadcastLobbyChat(p.lobbyId, noticeMsg);

              lobby.playerIds.forEach(pid => {
                const clientWs = wsByPlayerId.get(pid);
                if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify(txEvent));
                }
              });
            }
          }
          break;

        case 'player_attack':
          if (players.has(playerId)) {
            const attacker = players.get(playerId);
            const result = handleAttack(attacker, message.targetId);
            
            const lobby = lobbies.get(attacker.lobbyId);
            if (lobby) {
              const resMsg = JSON.stringify({
                type: 'attack_result',
                attacker: playerId,
                target: message.targetId,
                result: result,
              });
              lobby.playerIds.forEach(pid => {
                const clientWs = wsByPlayerId.get(pid);
                if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(resMsg);
                }
              });
            }
            broadcastLobbyPlayers(attacker.lobbyId);
          }
          break;

        case 'get_lobbies':
          ws.send(JSON.stringify({
            type: 'lobbies_list',
            lobbies: getLobbyList(),
            currentLobbyId: player.lobbyId
          }));
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
    if (player.lobbyId && lobbies.has(player.lobbyId)) {
      const lobby = lobbies.get(player.lobbyId);
      lobby.playerIds.delete(playerId);
      broadcastLobbyPlayers(lobby.id);
    }
    players.delete(playerId);
    wsByPlayerId.delete(playerId);
    console.log(`Player ${playerId} disconnected. Total online: ${players.size}`);
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for player ${playerId}:`, err);
  });
});

// REST endpoints
app.get('/api/lobbies', (req, res) => {
  res.json({
    lobbies: getLobbyList(),
    maxPlayersPerLobby: MAX_PLAYERS_PER_LOBBY,
    totalOnline: players.size
  });
});

app.get('/api/players', (req, res) => {
  const playerList = Array.from(players.values()).map(p => p.toJSON());
  res.json({
    count: playerList.length,
    players: playerList,
  });
});

app.get('/api/wallet/:playerId', (req, res) => {
  const pid = Number(req.params.playerId);
  res.json({ balance: wallets.get(pid) || 0 });
});

app.get('/api/community_wallet', (req, res) => {
  res.json({ community: communityWallet });
});

app.get('/api/ubi/status', (req, res) => {
  res.json(ubiEngine.getStatus());
});

app.post('/api/microtransaction', (req, res) => {
  const { amount, memo, playerId } = req.body;
  const amt = Number(amount) || 1.0;
  const result = ubiEngine.processTransaction(amt);
  res.json({
    ok: true,
    amount: amt,
    netAmount: result.netAmount,
    passiveUbiCut: result.taxAmount,
    memo: memo || 'REST micro-contribution',
    ubiStatus: ubiEngine.getStatus()
  });
});

app.post('/api/reset', (req, res) => {
  players.clear();
  playerIdCounter = 0;
  lobbies.forEach(l => l.playerIds.clear());
  res.json({ message: 'Game reset', players: 0 });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    lobbies: getLobbyList(),
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.MULTIPLAYER_PORT || 8080;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`Instances: 20 Citizens per Lobby configured.`);
});
