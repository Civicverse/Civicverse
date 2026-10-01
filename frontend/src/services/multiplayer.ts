import { create } from 'zustand';
import { CharacterConfig } from '../store/gameStore';
import { Peer, DataConnection } from 'peerjs';

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  text: string;
  timestamp: string;
  color?: string;
  isSystem?: boolean;
}

export interface RemotePlayer {
  id: string;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  isMoving?: boolean;
  health: number;
  isAlive: boolean;
  character?: CharacterConfig;
  lastSeen: number;
}

export interface LobbyInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isFull: boolean;
}

export interface UbiStatus {
  communityTreasury: number;
  ubiPool: number;
  totalDistributed: number;
  nextDistribution: number;
  taxRate: number;
}

export interface MultiplayerState {
  // Connection info
  isConnected: boolean;
  connectionMode: 'offline' | 'p2p' | 'websocket' | 'mesh';
  localPlayerId: string;
  peerCount: number;

  // Lobby instances (Max 20 citizens per instance)
  currentLobbyId: string;
  currentLobbyName: string;
  maxLobbySize: number;
  availableLobbies: LobbyInfo[];

  // Players & Chat
  players: Map<string, RemotePlayer>;
  chatHistory: ChatMessage[];
  ubiStatus: UbiStatus | null;

  // Methods
  initialize: (username: string, character?: CharacterConfig) => () => void;
  disconnect: () => void;
  sendMessage: (text: string, color?: string) => void;
  updatePosition: (position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }, isMoving?: boolean) => void;
  setIdentity: (username: string, character?: CharacterConfig) => void;
  switchLobby: (lobbyId: string) => void;
  sendMicrotransaction: (amount: number, memo?: string) => void;
}

// Generate persistent unique session ID for this browser tab
const LOCAL_ID = `cv_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36).slice(-4)}`;

// BroadcastChannel for instant local cross-tab multiplayer
const CHANNEL_NAME_PREFIX = 'civicverse_foyer_lobby_';
let broadcastChannel: BroadcastChannel | null = null;

// PeerJS instances
let peerInstance: Peer | null = null;
const activeDataConnections = new Map<string, DataConnection>();

// WebSocket instance (for backend server)
let wsClient: WebSocket | null = null;

let localUsername = 'Citizen';
let localCharacter: CharacterConfig | undefined;
let activeLobbyId = 'district-lobby-1';

// Deduplication cache for recently seen messages
const processedMsgIds = new Set<string>();
function isDuplicate(id: string): boolean {
  if (!id) return false;
  if (processedMsgIds.has(id)) return true;
  processedMsgIds.add(id);
  if (processedMsgIds.size > 500) {
    const first = processedMsgIds.values().next().value;
    if (first) processedMsgIds.delete(first);
  }
  return false;
}

const DEFAULT_LOBBIES: LobbyInfo[] = [
  { id: 'district-lobby-1', name: 'New District — Plaza Alpha', playerCount: 1, maxPlayers: 20, isFull: false },
  { id: 'district-lobby-2', name: 'New District — Plaza Beta', playerCount: 0, maxPlayers: 20, isFull: false },
  { id: 'district-lobby-3', name: 'New District — Plaza Gamma', playerCount: 0, maxPlayers: 20, isFull: false },
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'sys_1',
    playerId: 'system',
    username: '🏛️ CIVICVERSE CORE',
    text: 'Welcome to Gathering Grounds! Decentralized non-custodial avatars online (20 citizens / lobby instance).',
    color: 'text-amber-400',
    timestamp: new Date(Date.now() - 180000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSystem: true
  },
  {
    id: 'sys_2',
    playerId: 'system',
    username: '💡 PROTOCOL TIP',
    text: 'WASD to move, Space to jump, V to toggle 1st/3rd person, T or Enter to chat. Microtransactions generate 1% passive UBI contribution!',
    color: 'text-cyan-400',
    timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSystem: true
  }
];

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  isConnected: false,
  connectionMode: 'offline',
  localPlayerId: LOCAL_ID,
  peerCount: 0,
  currentLobbyId: 'district-lobby-1',
  currentLobbyName: 'New District — Plaza Alpha (20 Max)',
  maxLobbySize: 20,
  availableLobbies: DEFAULT_LOBBIES,
  players: new Map(),
  chatHistory: INITIAL_CHAT_MESSAGES,
  ubiStatus: null,

  initialize: (username: string, character?: CharacterConfig) => {
    localUsername = username || 'Citizen';
    localCharacter = character;
    (window as any)._cv_username = localUsername;
    (window as any)._cv_character = character;

    // 1. Initialize BroadcastChannel for local tabs in this lobby
    setupBroadcastChannel(activeLobbyId);

    // 2. Initialize WebSocket relay
    initWebSocket(localUsername, localCharacter);

    // 3. Initialize PeerJS WebRTC P2P mesh
    initPeerJS(localUsername, localCharacter, activeLobbyId);

    // 4. Send initial join announcement
    setTimeout(() => {
      broadcastPacket({
        type: 'player_join',
        playerId: LOCAL_ID,
        lobbyId: activeLobbyId,
        username: localUsername,
        character: localCharacter,
        position: { x: 0, y: 0, z: 20 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        isMoving: false,
        timestamp: Date.now()
      });
    }, 400);

    set({ isConnected: true, connectionMode: 'p2p' });

    // Periodic heartbeat & stale player cleanup every 3 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      const currentPlayers = new Map(get().players);
      let changed = false;

      currentPlayers.forEach((player, id) => {
        // Drop players not seen in 15 seconds
        if (now - player.lastSeen > 15000) {
          currentPlayers.delete(id);
          changed = true;
        }
      });

      if (changed) {
        set({ players: currentPlayers, peerCount: currentPlayers.size });
      }

      // Send heartbeat
      broadcastPacket({
        type: 'heartbeat',
        playerId: LOCAL_ID,
        lobbyId: activeLobbyId,
        username: localUsername,
        character: localCharacter,
        timestamp: now
      });
    }, 3000);

    return () => clearInterval(interval);
  },

  disconnect: () => {
    try {
      broadcastPacket({
        type: 'player_leave',
        playerId: LOCAL_ID,
        lobbyId: activeLobbyId
      });
    } catch (e) {}

    if (broadcastChannel) {
      try { broadcastChannel.close(); } catch (e) {}
      broadcastChannel = null;
    }

    if (peerInstance) {
      try { peerInstance.destroy(); } catch (e) {}
      peerInstance = null;
    }

    if (wsClient) {
      try { wsClient.close(); } catch (e) {}
      wsClient = null;
    }

    activeDataConnections.clear();
    set({ isConnected: false, connectionMode: 'offline', players: new Map(), peerCount: 0 });
  },

  sendMessage: (text: string, color = 'text-cyan-400') => {
    if (!text.trim()) return;

    const trimmed = text.trim();

    // Support chat command /tip @target [amount]
    if (trimmed.startsWith('/tip')) {
      const parts = trimmed.split(/\s+/);
      const amount = parseFloat(parts[2] || parts[1]) || 5.0;
      get().sendMicrotransaction(amount, `Chat Tip from ${localUsername}`);
      return;
    }

    const chatMsg: ChatMessage = {
      id: `chat_${LOCAL_ID}_${Date.now()}`,
      playerId: LOCAL_ID,
      username: localUsername,
      text: trimmed,
      color,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    isDuplicate(chatMsg.id);
    set((state) => ({
      chatHistory: [...state.chatHistory, chatMsg].slice(-100)
    }));

    broadcastPacket({
      type: 'chat_message',
      lobbyId: activeLobbyId,
      ...chatMsg
    });
  },

  sendMicrotransaction: (amount: number, memo = 'Citizen Micro-Contribution') => {
    const amt = Math.max(0.1, amount);
    const tax = amt * 0.01;

    const noticeMsg: ChatMessage = {
      id: `notice_${Date.now()}`,
      playerId: 'system',
      username: '💸 PASSIVE UBI SYSTEM',
      text: `${localUsername} initiated ${amt} CIVIC microtransaction (+${tax.toFixed(3)} CIVIC passive contribution to sovereign UBI pool)!`,
      color: 'text-amber-400',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    };

    set((state) => ({
      chatHistory: [...state.chatHistory, noticeMsg].slice(-100)
    }));

    broadcastPacket({
      type: 'microtransaction',
      lobbyId: activeLobbyId,
      amount: amt,
      memo
    });
  },

  updatePosition: (position, rotation, isMoving = false) => {
    broadcastPacket({
      type: 'player_move',
      playerId: LOCAL_ID,
      lobbyId: activeLobbyId,
      username: localUsername,
      character: localCharacter,
      position,
      rotation,
      isMoving,
      timestamp: Date.now()
    });
  },

  setIdentity: (username: string, character?: CharacterConfig) => {
    localUsername = username || 'Citizen';
    localCharacter = character;
    (window as any)._cv_username = localUsername;
    (window as any)._cv_character = character;

    broadcastPacket({
      type: 'player_identity',
      playerId: LOCAL_ID,
      lobbyId: activeLobbyId,
      username: localUsername,
      character: localCharacter,
      timestamp: Date.now()
    });
  },

  switchLobby: (lobbyId: string) => {
    if (lobbyId === activeLobbyId) return;

    // Leave current lobby
    broadcastPacket({
      type: 'player_leave',
      playerId: LOCAL_ID,
      lobbyId: activeLobbyId
    });

    activeLobbyId = lobbyId;
    setupBroadcastChannel(activeLobbyId);

    // Clear remote players from old instance
    set({
      currentLobbyId: lobbyId,
      currentLobbyName: `New District — ${lobbyId.replace('district-', '').toUpperCase()}`,
      players: new Map(),
      peerCount: 0
    });

    // Notify WebSocket server
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(JSON.stringify({
        type: 'join_lobby',
        lobbyId
      }));
    }

    // Re-init WebRTC peer for this room
    initPeerJS(localUsername, localCharacter, lobbyId);

    // Send join packet to new lobby
    setTimeout(() => {
      broadcastPacket({
        type: 'player_join',
        playerId: LOCAL_ID,
        lobbyId,
        username: localUsername,
        character: localCharacter,
        position: { x: 0, y: 0, z: 20 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        isMoving: false,
        timestamp: Date.now()
      });
    }, 300);
  }
}));

// ========================================================
// INTERNAL NETWORKING HELPERS
// ========================================================

function setupBroadcastChannel(lobbyId: string) {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
  try {
    if (broadcastChannel) {
      broadcastChannel.close();
    }
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME_PREFIX + lobbyId);
    broadcastChannel.onmessage = (event) => {
      handleIncomingNetworkMessage(event.data, 'broadcast');
    };
  } catch (e) {
    console.warn('[Multiplayer] BroadcastChannel init error:', e);
  }
}

function broadcastPacket(data: any) {
  const packet = { ...data, lobbyId: data.lobbyId || activeLobbyId };
  const packetStr = JSON.stringify(packet);

  // 1. BroadcastChannel (local browser tabs)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(packet);
    } catch (e) {}
  }

  // 2. WebRTC PeerJS
  activeDataConnections.forEach((conn) => {
    if (conn.open) {
      try {
        conn.send(packet);
      } catch (e) {}
    }
  });

  // 3. WebSocket Server
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    try {
      wsClient.send(packetStr);
    } catch (e) {}
  }
}

function handleIncomingNetworkMessage(data: any, source: string) {
  if (!data || !data.type) return;

  // Ignore self messages
  if (data.playerId === LOCAL_ID && data.type !== 'players_update') return;

  // Filter messages belonging to other lobby instances
  if (data.lobbyId && data.lobbyId !== activeLobbyId) return;

  // Deduplicate
  if (data.id && isDuplicate(data.id)) return;

  const store = useMultiplayerStore.getState();

  switch (data.type) {
    case 'player_join':
    case 'heartbeat':
    case 'player_identity': {
      if (!data.playerId || data.playerId === LOCAL_ID) return;

      const currentPlayers = new Map(store.players);
      const existing = currentPlayers.get(data.playerId);

      // Enforce 20-player lobby capacity limit
      if (!existing && currentPlayers.size >= 20) {
        return;
      }

      const updated: RemotePlayer = {
        id: data.playerId,
        username: data.username || existing?.username || `Citizen_${data.playerId.slice(0, 6)}`,
        position: data.position || existing?.position || { x: 0, y: 0, z: 20 },
        rotation: data.rotation || existing?.rotation || { x: 0, y: Math.PI, z: 0 },
        isMoving: data.isMoving !== undefined ? data.isMoving : (existing?.isMoving || false),
        health: data.health || 100,
        isAlive: data.isAlive !== undefined ? data.isAlive : true,
        character: data.character || existing?.character,
        lastSeen: Date.now()
      };

      currentPlayers.set(data.playerId, updated);
      useMultiplayerStore.setState({ players: currentPlayers, peerCount: currentPlayers.size });

      // Reply with our presence so the new peer immediately learns our avatar & position
      if (data.type === 'player_join') {
        broadcastPacket({
          type: 'player_identity',
          lobbyId: activeLobbyId,
          playerId: LOCAL_ID,
          username: localUsername,
          character: localCharacter,
          timestamp: Date.now()
        });
      }
      break;
    }

    case 'player_move': {
      if (!data.playerId || data.playerId === LOCAL_ID) return;

      const currentPlayers = new Map(store.players);
      const existing = currentPlayers.get(data.playerId);

      if (existing) {
        existing.position = data.position || existing.position;
        existing.rotation = data.rotation || existing.rotation;
        existing.isMoving = data.isMoving;
        if (data.character && !existing.character) existing.character = data.character;
        existing.lastSeen = Date.now();
        useMultiplayerStore.setState({ players: currentPlayers });
      } else {
        if (currentPlayers.size >= 20) return;
        currentPlayers.set(data.playerId, {
          id: data.playerId,
          username: data.username || `Citizen_${data.playerId.slice(0, 6)}`,
          position: data.position || { x: 0, y: 0, z: 20 },
          rotation: data.rotation || { x: 0, y: Math.PI, z: 0 },
          isMoving: data.isMoving || false,
          health: 100,
          isAlive: true,
          character: data.character,
          lastSeen: Date.now()
        });
        useMultiplayerStore.setState({ players: currentPlayers, peerCount: currentPlayers.size });
      }
      break;
    }

    case 'player_leave': {
      if (!data.playerId) return;
      const currentPlayers = new Map(store.players);
      if (currentPlayers.delete(data.playerId)) {
        useMultiplayerStore.setState({ players: currentPlayers, peerCount: currentPlayers.size });
      }
      break;
    }

    case 'chat_message': {
      const chatMsg: ChatMessage = {
        id: data.id || `chat_${Date.now()}_${Math.random()}`,
        playerId: data.playerId || 'unknown',
        username: data.username || 'Citizen',
        text: data.text,
        color: data.color || 'text-cyan-400',
        timestamp: data.timestamp ? (data.timestamp.length > 8 ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : data.timestamp) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: !!data.isSystem
      };

      useMultiplayerStore.setState((state) => ({
        chatHistory: [...state.chatHistory, chatMsg].slice(-100)
      }));
      break;
    }

    case 'lobby_joined': {
      activeLobbyId = data.lobbyId || activeLobbyId;
      useMultiplayerStore.setState({
        currentLobbyId: activeLobbyId,
        currentLobbyName: data.lobbyName || `Lobby ${activeLobbyId}`,
        availableLobbies: data.availableLobbies || store.availableLobbies
      });
      break;
    }

    case 'chat_history': {
      if (Array.isArray(data.history) && data.history.length > 0) {
        useMultiplayerStore.setState((state) => ({
          chatHistory: [...state.chatHistory, ...data.history].slice(-100)
        }));
      }
      break;
    }

    case 'players_update': {
      // Backend server broadcast array (max 20 players for this lobby instance)
      if (Array.isArray(data.players)) {
        const currentPlayers = new Map(store.players);
        data.players.forEach((p: any) => {
          const pid = String(p.id);
          if (pid === LOCAL_ID) return;
          const existing = currentPlayers.get(pid);
          currentPlayers.set(pid, {
            id: pid,
            username: p.username || existing?.username || `Citizen_${pid}`,
            position: p.position || existing?.position || { x: 0, y: 0, z: 20 },
            rotation: p.rotation || existing?.rotation || { x: 0, y: 0, z: 0 },
            isMoving: p.isMoving,
            health: p.health || 100,
            isAlive: p.isAlive !== undefined ? p.isAlive : true,
            character: p.character || existing?.character,
            lastSeen: Date.now()
          });
        });
        useMultiplayerStore.setState({
          players: currentPlayers,
          peerCount: currentPlayers.size,
          currentLobbyName: data.lobbyName || store.currentLobbyName
        });
      }
      break;
    }

    case 'microtransaction_event': {
      if (data.ubiStatus) {
        useMultiplayerStore.setState({ ubiStatus: data.ubiStatus });
      }
      break;
    }
  }
}

// ========================================================
// PEERJS WEBRTC SETUP
// ========================================================

function getRoomHostId(lobbyId: string) {
  return `civicverse-foyer-${lobbyId}-host`;
}

function initPeerJS(username: string, character?: CharacterConfig, lobbyId = 'district-lobby-1') {
  const hostId = getRoomHostId(lobbyId);

  try {
    if (peerInstance && !peerInstance.destroyed) {
      peerInstance.destroy();
    }

    const peer = new Peer({
      debug: 0
    });

    peerInstance = peer;

    peer.on('open', (id) => {
      console.debug('[PeerJS] Signaling open ID:', id, 'for lobby:', lobbyId);
      if (id !== hostId) {
        connectToRemotePeer(hostId, username, character);
      }
    });

    peer.on('connection', (conn) => {
      setupConnection(conn, username, character);
    });

    peer.on('error', (err: any) => {
      if (err.type === 'peer-unavailable') {
        becomeRoomHost(username, character, lobbyId);
      }
    });

  } catch (e) {
    console.warn('[PeerJS] WebRTC initialization skipped:', e);
  }
}

function becomeRoomHost(username: string, character?: CharacterConfig, lobbyId = 'district-lobby-1') {
  const hostId = getRoomHostId(lobbyId);
  if (peerInstance && !peerInstance.destroyed) {
    peerInstance.destroy();
  }

  try {
    const hostPeer = new Peer(hostId, { debug: 0 });
    peerInstance = hostPeer;

    hostPeer.on('open', (id) => {
      console.debug('[PeerJS] Registered as Room Host for:', hostId);
    });

    hostPeer.on('connection', (conn) => {
      setupConnection(conn, username, character);
    });

    hostPeer.on('error', () => {});
  } catch (e) {}
}

function connectToRemotePeer(peerId: string, username: string, character?: CharacterConfig) {
  if (!peerInstance || peerInstance.destroyed) return;
  try {
    const conn = peerInstance.connect(peerId, { reliable: true });
    setupConnection(conn, username, character);
  } catch (e) {}
}

function setupConnection(conn: DataConnection, username: string, character?: CharacterConfig) {
  conn.on('open', () => {
    activeDataConnections.set(conn.peer, conn);
    useMultiplayerStore.setState({ connectionMode: 'mesh' });

    conn.send({
      type: 'player_join',
      playerId: LOCAL_ID,
      lobbyId: activeLobbyId,
      username,
      character,
      position: { x: 0, y: 0, z: 20 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      timestamp: Date.now()
    });
  });

  conn.on('data', (data) => {
    handleIncomingNetworkMessage(data, 'webrtc');
  });

  conn.on('close', () => {
    activeDataConnections.delete(conn.peer);
  });

  conn.on('error', () => {
    activeDataConnections.delete(conn.peer);
  });
}

// ========================================================
// WEBSOCKET RELAY SETUP
// ========================================================

function initWebSocket(username: string, character?: CharacterConfig) {
  const envUrl = (import.meta as any).env?.VITE_MULTIPLAYER_WS_URL;
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const wsUrl = envUrl || (isLocal ? `ws://${window.location.hostname}:8080/ws` : null);
  if (!wsUrl) return;

  try {
    const ws = new WebSocket(wsUrl);
    wsClient = ws;

    ws.onopen = () => {
      console.debug('[Multiplayer] Connected to WebSocket relay:', wsUrl);
      useMultiplayerStore.setState({ connectionMode: 'websocket' });
      ws.send(JSON.stringify({
        type: 'join_lobby',
        lobbyId: activeLobbyId
      }));
      ws.send(JSON.stringify({
        type: 'player_identity',
        lobbyId: activeLobbyId,
        username,
        character
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleIncomingNetworkMessage(data, 'websocket');
      } catch (e) {}
    };

    ws.onclose = () => {
      wsClient = null;
      console.debug('[Multiplayer] WebSocket relay disconnected, maintaining P2P mesh');
    };

    ws.onerror = () => {
      wsClient = null;
    };
  } catch (e) {
    console.debug('[Multiplayer] WebSocket relay unavailable');
  }
}
