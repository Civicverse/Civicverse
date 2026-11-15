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
  proximity?: boolean;
  position?: { x: number; y: number; z: number };
  sentAt?: number;
  channelId?: string;
  audience?: 'nearby' | 'friends' | 'lobby';
  recipientIds?: string[];
  bubble?: boolean;
}

export type ChatAudience = 'nearby' | 'friends' | 'lobby' | 'off';

export interface RemotePlayer {
  id: string;
  username: string;
  civicId?: string;
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
  chatAudience: ChatAudience;
  friendCivicIds: string[];
  ubiStatus: UbiStatus | null;

  // Methods
  initialize: (username: string, character?: CharacterConfig, civicId?: string) => () => void;
  disconnect: () => void;
  sendMessage: (text: string, color?: string, proximity?: boolean, channelId?: string) => void;
  setChatAudience: (audience: ChatAudience) => void;
  updatePosition: (position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }, isMoving?: boolean) => void;
  setIdentity: (username: string, character?: CharacterConfig, civicId?: string) => void;
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
const civicIdByPeerId = new Map<string, string>();

// WebSocket instance (for backend server)
let wsClient: WebSocket | null = null;

let localUsername = 'Citizen';
let localCharacter: CharacterConfig | undefined;
let localCivicId = '';
let localPosition = { x: 0, y: 0, z: 20 };
let activeLobbyId = 'district-lobby-1';
let localOnlyMode = false;
let localServerPlayerId = '';

export const getLocalPlayerPosition = () => ({ ...localPosition });

// Deduplication cache for recently seen messages
const processedMsgIds = new Set<string>();
const CHAT_MESSAGE_TTL_MS = 4500;
function loadChatAudience(): ChatAudience {
  try {
    const saved = localStorage.getItem('civicverse_chat_audience');
    if (saved === 'nearby' || saved === 'friends' || saved === 'lobby' || saved === 'off') return saved;
  } catch {}
  return 'nearby';
}
function expireChatMessage(id: string) {
  window.setTimeout(() => {
    useMultiplayerStore.setState(state => ({
      chatHistory: state.chatHistory.filter(message => message.id !== id)
    }));
  }, CHAT_MESSAGE_TTL_MS);
}

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
  { id: 'district-lobby-1', name: 'Gathering Grounds 1', playerCount: 1, maxPlayers: 20, isFull: false },
  { id: 'district-lobby-2', name: 'Gathering Grounds 2', playerCount: 0, maxPlayers: 20, isFull: false },
  { id: 'district-lobby-3', name: 'Gathering Grounds 3', playerCount: 0, maxPlayers: 20, isFull: false },
];

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  isConnected: false,
  connectionMode: 'offline',
  localPlayerId: LOCAL_ID,
  peerCount: 0,
  currentLobbyId: 'district-lobby-1',
  currentLobbyName: 'Gathering Grounds 1 (20 Max)',
  maxLobbySize: 20,
  availableLobbies: DEFAULT_LOBBIES,
  players: new Map(),
  chatHistory: [],
  chatAudience: loadChatAudience(),
  friendCivicIds: [],
  ubiStatus: null,

  initialize: (username: string, character?: CharacterConfig, civicId?: string) => {
    localUsername = username || 'Citizen';
    localCharacter = character;
    localCivicId = civicId || '';
    localServerPlayerId = '';
    (window as any)._cv_username = localUsername;
    (window as any)._cv_character = character;

    const localHost = typeof window !== 'undefined'
      && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const multiplayerMode = (import.meta as any).env?.VITE_MULTIPLAYER_MODE;
    localOnlyMode = localHost && multiplayerMode !== 'online';

    // Local sessions use the local relay as their single source of truth.
    // BroadcastChannel plus WebSocket reported the same tab under two IDs.
    if (!localOnlyMode) setupBroadcastChannel(activeLobbyId);

    // 2. Initialize WebSocket relay
    initWebSocket(localUsername, localCharacter);

    // Local testing uses only the localhost WebSocket relay. Joining the public
    // PeerJS room here mixed hosted visitors into a developer's local session.
    // Opt in to public P2P from localhost with VITE_MULTIPLAYER_MODE=online.
    if (!localOnlyMode) {
      initPeerJS(localUsername, localCharacter, activeLobbyId);
    }

    // 4. Send initial join announcement
    const joinTimeout = setTimeout(() => {
      broadcastPacket({
        type: 'player_join',
        playerId: LOCAL_ID,
        lobbyId: activeLobbyId,
        username: localUsername,
        civicId: localCivicId,
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
        civicId: localCivicId,
        character: localCharacter,
        timestamp: now
      });
    }, 3000);

    return () => {
      clearTimeout(joinTimeout);
      clearInterval(interval);
      get().disconnect();
    };
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

    localServerPlayerId = '';

    activeDataConnections.clear();
    set({ isConnected: false, connectionMode: 'offline', players: new Map(), peerCount: 0 });
  },

  setChatAudience: (audience) => {
    try { localStorage.setItem('civicverse_chat_audience', audience); } catch {}
    set({ chatAudience: audience });
  },

  sendMessage: (text: string, color = 'text-cyan-400', _proximity = false, channelId?: string) => {
    const audience = get().chatAudience;
    if (!text.trim() || audience === 'off') return;

    const trimmed = text.trim().slice(0, 500);

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
      proximity: audience === 'nearby',
      audience: audience === 'off' ? undefined : audience,
      recipientIds: audience === 'friends' ? get().friendCivicIds : undefined,
      bubble: true,
      position: localPosition,
      sentAt: Date.now(),
      channelId,
      color,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    isDuplicate(chatMsg.id);
    set((state) => ({
      chatHistory: [...state.chatHistory, chatMsg].slice(-100)
    }));
    expireChatMessage(chatMsg.id);

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
    localPosition = position;
    broadcastPacket({
      type: 'player_move',
      playerId: LOCAL_ID,
      lobbyId: activeLobbyId,
      username: localUsername,
      character: localCharacter,
      civicId: localCivicId,
      position,
      rotation,
      isMoving,
      timestamp: Date.now()
    });
  },

  setIdentity: (username: string, character?: CharacterConfig, civicId?: string) => {
    localUsername = username || 'Citizen';
    localCharacter = character;
    localCivicId = civicId || '';
    (window as any)._cv_username = localUsername;
    (window as any)._cv_character = character;

    broadcastPacket({
      type: 'player_identity',
      playerId: LOCAL_ID,
      lobbyId: activeLobbyId,
      username: localUsername,
      civicId: localCivicId,
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
    if (!localOnlyMode) setupBroadcastChannel(activeLobbyId);

    // Clear remote players from old instance
    set({
      currentLobbyId: lobbyId,
      currentLobbyName: `Gathering Grounds ${lobbyId.match(/(\d+)$/)?.[1] || '1'}`,
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

    // Re-init the public WebRTC peer for this room when using hosted play.
    if (!localOnlyMode) initPeerJS(localUsername, localCharacter, lobbyId);

    // Send join packet to new lobby
    setTimeout(() => {
      broadcastPacket({
        type: 'player_join',
        playerId: LOCAL_ID,
        lobbyId,
        username: localUsername,
        civicId: localCivicId,
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
        civicId: data.civicId || existing?.civicId,
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
          civicId: localCivicId,
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
          civicId: data.civicId,
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
      if (store.chatAudience === 'off') return;
      if (data.audience === 'friends' && (!Array.isArray(data.recipientIds) || !data.recipientIds.includes(localCivicId))) return;
      if (data.proximity && data.position) {
        const dx = data.position.x - localPosition.x;
        const dz = data.position.z - localPosition.z;
        if (dx * dx + dz * dz > 30 * 30) return;
      }
      const chatMsg: ChatMessage = {
        id: data.id || `chat_${Date.now()}_${Math.random()}`,
        playerId: String(data.playerId || 'unknown'),
        username: data.username || 'Citizen',
        text: data.text,
        color: data.color || 'text-cyan-400',
        timestamp: data.timestamp ? (data.timestamp.length > 8 ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : data.timestamp) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: !!data.isSystem,
        proximity: !!data.proximity,
        position: data.position,
        sentAt: typeof data.sentAt === 'number' ? data.sentAt : Date.now(),
        channelId: typeof data.channelId === 'string' ? data.channelId : undefined,
        audience: data.audience === 'friends' || data.audience === 'lobby' || data.audience === 'nearby' ? data.audience : undefined,
        recipientIds: Array.isArray(data.recipientIds) ? data.recipientIds.filter((id: unknown) => typeof id === 'string').slice(0, 100) : undefined,
        bubble: data.bubble === true || data.audience === 'friends' || data.audience === 'lobby' || data.audience === 'nearby'
      };

      useMultiplayerStore.setState((state) => ({
        chatHistory: [...state.chatHistory, chatMsg].slice(-100)
      }));
      expireChatMessage(chatMsg.id);
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

    case 'player_id': {
      localServerPlayerId = String(data.playerId || '');
      break;
    }

    case 'players_update': {
      // Backend server broadcast array (max 20 players for this lobby instance)
      if (Array.isArray(data.players)) {
        const currentPlayers = new Map(store.players);
        data.players.forEach((p: any) => {
          const pid = String(p.id);
          if (pid === LOCAL_ID || pid === localServerPlayerId) return;
          const existing = currentPlayers.get(pid);
          currentPlayers.set(pid, {
            id: pid,
            username: p.username || existing?.username || `Citizen_${pid}`,
            civicId: p.civicId || existing?.civicId,
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
      civicId: localCivicId,
      character,
      position: { x: 0, y: 0, z: 20 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      timestamp: Date.now()
    });
  });

  conn.on('data', (data) => {
    // Hosted PeerJS rooms use the browser that owns the well-known room ID as
    // their signaling relay. Forward each chat packet to the other room peers;
    // do not echo it back to its sender. The message ID deduplicates the sender's
    // local copy and any duplicate WebSocket/PeerJS delivery.
    const isRoomHost = peerInstance?.id === getRoomHostId(activeLobbyId);
    if (isRoomHost && data?.type === 'player_join' && data.lobbyId === activeLobbyId && typeof data.civicId === 'string') {
      civicIdByPeerId.set(conn.peer, data.civicId);
    }
    if (isRoomHost && data?.type === 'chat_message' && data.lobbyId === activeLobbyId) {
      activeDataConnections.forEach((otherConn, peerId) => {
        const allowed = data.audience !== 'friends' || (Array.isArray(data.recipientIds) && data.recipientIds.includes(civicIdByPeerId.get(peerId) || ''));
        if (peerId !== conn.peer && otherConn.open && allowed) {
          try { otherConn.send(data); } catch {}
        }
      });
    }
    handleIncomingNetworkMessage(data, 'webrtc');
  });

  conn.on('close', () => {
    activeDataConnections.delete(conn.peer);
    civicIdByPeerId.delete(conn.peer);
  });

  conn.on('error', () => {
    activeDataConnections.delete(conn.peer);
    civicIdByPeerId.delete(conn.peer);
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
        civicId: localCivicId,
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
