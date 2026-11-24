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
  weaponSlot?: number;
  weaponFiredAt?: number;
  weaponShot?: { id: string; firedAt: number; slot: number; origin: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; impact: boolean };
  lastSeen: number;
  lobbyId?: string;
}

export interface LobbyInvite {
  id: string;
  senderCivicId: string;
  senderUsername: string;
  lobbyId: string;
  lobbyName: string;
  createdAt: number;
}

export interface OnlineFriend {
  civicId: string;
  username: string;
  lobbyId: string;
  lobbyName: string;
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
  localHealth: number;
  combatEvent: { id: string; kind: 'hit' | 'death' | 'respawn'; playerId: string; damage?: number } | null;

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
  incomingLobbyInvites: LobbyInvite[];
  onlineFriends: OnlineFriend[];
  ubiStatus: UbiStatus | null;

  // Methods
  initialize: (username: string, character?: CharacterConfig, civicId?: string) => () => void;
  disconnect: () => void;
  sendMessage: (text: string, color?: string, proximity?: boolean, channelId?: string, audienceOverride?: ChatAudience) => void;
  setChatAudience: (audience: ChatAudience) => void;
  setFriendCivicIds: (ids: string[]) => void;
  inviteFriendToLobby: (civicId: string) => void;
  acceptLobbyInvite: (inviteId: string) => void;
  dismissLobbyInvite: (inviteId: string) => void;
  updatePosition: (position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }, isMoving?: boolean) => void;
  setIdentity: (username: string, character?: CharacterConfig, civicId?: string) => void;
  fireWeapon: (slot: number, targetPlayerId?: string, shot?: { origin: { x: number; y: number; z: number }; end: { x: number; y: number; z: number }; impact: boolean }) => void;
  respawn: () => void;
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
let hostElectionInProgress = false;
const activeDataConnections = new Map<string, DataConnection>();
const civicIdByPeerId = new Map<string, string>();
const lobbyIdByPeerId = new Map<string, string>();
const onlinePresenceByCivicId = new Map<string, OnlineFriend>();

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
  localHealth: 100,
  combatEvent: null,
  currentLobbyId: 'district-lobby-1',
  currentLobbyName: 'Gathering Grounds 1 (20 Max)',
  maxLobbySize: 20,
  availableLobbies: DEFAULT_LOBBIES,
  players: new Map(),
  chatHistory: [],
  chatAudience: loadChatAudience(),
  friendCivicIds: [],
  incomingLobbyInvites: [],
  onlineFriends: [],
  ubiStatus: null,

  initialize: (username: string, character?: CharacterConfig, civicId?: string) => {
    localUsername = username || 'Citizen';
    localCharacter = character;
    localCivicId = civicId || '';
    localServerPlayerId = '';
    (window as any)._cv_username = localUsername;
    (window as any)._cv_character = character;

    const multiplayerMode = (import.meta as any).env?.VITE_MULTIPLAYER_MODE;
    // Peer-to-peer is enabled for desktop and web builds by default. Set
    // VITE_MULTIPLAYER_MODE=local only when deliberately testing offline.
    localOnlyMode = multiplayerMode === 'local';
    try {
      const savedFriends = JSON.parse(localStorage.getItem(`civicverse:friend_civic_ids:${localCivicId}`) || '[]');
      if (Array.isArray(savedFriends)) set({ friendCivicIds: savedFriends.filter((id): id is string => typeof id === 'string').slice(0, 500) });
    } catch {}

    // BroadcastChannel connects same-origin tabs; WebRTC carries the shared
    // lobby between devices, with WebSocket as an optional local fallback.
    if (!localOnlyMode) setupBroadcastChannel(activeLobbyId);

    // 2. Initialize WebSocket relay
    initWebSocket(localUsername, localCharacter);

    // Local-only testing can opt out with VITE_MULTIPLAYER_MODE=local.
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

  setFriendCivicIds: (ids) => {
    const uniqueIds = [...new Set(ids.filter(id => typeof id === 'string' && id && id !== localCivicId))].slice(0, 500);
    try { localStorage.setItem(`civicverse:friend_civic_ids:${localCivicId}`, JSON.stringify(uniqueIds)); } catch {}
    set({ friendCivicIds: uniqueIds });
  },

  inviteFriendToLobby: (civicId) => {
    if (!civicId || !get().friendCivicIds.includes(civicId)) return;
    const invite: LobbyInvite = {
      id: `invite_${LOCAL_ID}_${Date.now()}`,
      senderCivicId: localCivicId,
      senderUsername: localUsername,
      lobbyId: activeLobbyId,
      lobbyName: get().currentLobbyName,
      createdAt: Date.now()
    };
    broadcastPacket({ type: 'lobby_invite', recipientCivicId: civicId, invite, lobbyId: activeLobbyId });
  },

  acceptLobbyInvite: (inviteId) => {
    const invite = get().incomingLobbyInvites.find(item => item.id === inviteId);
    if (!invite || !get().friendCivicIds.includes(invite.senderCivicId)) return;
    set(state => ({ incomingLobbyInvites: state.incomingLobbyInvites.filter(item => item.id !== inviteId) }));
    get().switchLobby(invite.lobbyId);
  },

  dismissLobbyInvite: (inviteId) => set(state => ({ incomingLobbyInvites: state.incomingLobbyInvites.filter(item => item.id !== inviteId) })),

  sendMessage: (text: string, color = 'text-cyan-400', _proximity = false, channelId?: string, audienceOverride?: ChatAudience) => {
    const audience = audienceOverride || get().chatAudience;
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

  fireWeapon: (slot, targetPlayerId, shot) => {
    const safeSlot = Math.min(8, Math.max(1, Math.round(slot)));
    const firedAt = Date.now();
    if (targetPlayerId) {
      const players = new Map(useMultiplayerStore.getState().players);
      const target = players.get(targetPlayerId);
      if (target) {
        const damageBySlot: Record<number, number> = { 1: 24, 2: 48, 3: 62, 4: 78, 5: 34, 6: 16, 7: 12, 8: 52 };
        target.health = Math.max(0, target.health - damageBySlot[safeSlot]);
        target.isAlive = target.health > 0;
        useMultiplayerStore.setState({ players });
      }
    }
    const id = `shot_${LOCAL_ID}_${firedAt}_${Math.random().toString(36).slice(2, 7)}`;
    broadcastPacket({ type: 'player_shot', playerId: LOCAL_ID, lobbyId: activeLobbyId, slot: safeSlot, targetPlayerId, firedAt, id, shot });
  },

  respawn: () => {
    useMultiplayerStore.setState({ localHealth: 100, combatEvent: { id: `respawn_${Date.now()}`, kind: 'respawn', playerId: LOCAL_ID } });
    broadcastPacket({ type: 'player_respawn', playerId: LOCAL_ID, lobbyId: activeLobbyId, id: `respawn_${LOCAL_ID}_${Date.now()}` });
  },

  setIdentity: (username: string, character?: CharacterConfig, civicId?: string) => {
    localUsername = username || 'Citizen';
    localCharacter = character;
    localCivicId = civicId || '';
    (window as any)._cv_username = localUsername;
    (window as any)._cv_character = character;
    try {
      const savedFriends = JSON.parse(localStorage.getItem(`civicverse:friend_civic_ids:${localCivicId}`) || '[]');
      useMultiplayerStore.setState({ friendCivicIds: Array.isArray(savedFriends) ? savedFriends.filter((id): id is string => typeof id === 'string').slice(0, 500) : [] });
    } catch { useMultiplayerStore.setState({ friendCivicIds: [] }); }

    broadcastPacket({
      type: 'player_identity',
      playerId: LOCAL_ID,
      lobbyId: activeLobbyId,
      username: localUsername,
      civicId: localCivicId,
      character: localCharacter,
      timestamp: Date.now()
    });
    broadcastPacket({
      type: 'social_presence', civicId: localCivicId, username: localUsername,
      lobbyId: activeLobbyId, lobbyName: get().currentLobbyName, timestamp: Date.now()
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

    // Keep the shared peer rendezvous alive so invites can cross game lobbies.
    if (!localOnlyMode) broadcastPacket({
      type: 'social_presence', civicId: localCivicId, username: localUsername,
      lobbyId, lobbyName: get().currentLobbyName, timestamp: Date.now()
    });

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
  if (data.lobbyId && data.lobbyId !== activeLobbyId && data.type !== 'social_presence' && data.type !== 'lobby_invite') return;

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
        health: data.health ?? existing?.health ?? 100,
        isAlive: data.isAlive !== undefined ? data.isAlive : (existing?.isAlive ?? true),
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

    case 'player_shot': {
      if (!data.playerId || !Number.isFinite(data.slot)) return;
      const players = new Map(store.players);
      const shooter = players.get(data.playerId);
      if (shooter) {
        shooter.weaponSlot = Math.min(8, Math.max(1, Math.round(data.slot)));
        shooter.weaponFiredAt = Number(data.firedAt) || Date.now();
        if (data.shot?.origin && data.shot?.end && [data.shot.origin.x, data.shot.origin.y, data.shot.origin.z, data.shot.end.x, data.shot.end.y, data.shot.end.z].every(Number.isFinite)) {
          shooter.weaponShot = {
            id: String(data.id || `shot_${shooter.weaponFiredAt}`), firedAt: shooter.weaponFiredAt, slot: shooter.weaponSlot,
            origin: { x: data.shot.origin.x, y: data.shot.origin.y, z: data.shot.origin.z },
            end: { x: data.shot.end.x, y: data.shot.end.y, z: data.shot.end.z }, impact: data.shot.impact === true
          };
        }
        shooter.lastSeen = Date.now();
      }
      if (data.targetPlayerId === LOCAL_ID) {
        if (store.localHealth <= 0) break;
        const damageBySlot: Record<number, number> = { 1: 24, 2: 48, 3: 62, 4: 78, 5: 34, 6: 16, 7: 12, 8: 52 };
        const damage = damageBySlot[Math.min(8, Math.max(1, Math.round(data.slot)))] || 20;
        const health = Math.max(0, store.localHealth - damage);
        useMultiplayerStore.setState({ localHealth: health, combatEvent: { id: String(data.id || Date.now()), kind: health === 0 ? 'death' : 'hit', playerId: LOCAL_ID, damage } });
      } else if (typeof data.targetPlayerId === 'string') {
        const target = players.get(data.targetPlayerId);
        if (target) {
          const damageBySlot: Record<number, number> = { 1: 24, 2: 48, 3: 62, 4: 78, 5: 34, 6: 16, 7: 12, 8: 52 };
          target.health = Math.max(0, target.health - (damageBySlot[data.slot] || 20));
          target.isAlive = target.health > 0;
        }
      }
      useMultiplayerStore.setState({ players });
      break;
    }

    case 'player_respawn': {
      if (data.playerId === LOCAL_ID) {
        useMultiplayerStore.setState({ localHealth: 100, combatEvent: { id: String(data.id || Date.now()), kind: 'respawn', playerId: LOCAL_ID } });
      } else if (data.playerId) {
        const players = new Map(store.players);
        const player = players.get(data.playerId);
        if (player) { player.health = 100; player.isAlive = true; }
        useMultiplayerStore.setState({ players });
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

    case 'social_presence': {
      if (typeof data.civicId !== 'string' || !data.civicId || data.civicId === localCivicId) return;
      const presence: OnlineFriend = {
        civicId: data.civicId,
        username: typeof data.username === 'string' ? data.username : 'Citizen',
        lobbyId: typeof data.lobbyId === 'string' ? data.lobbyId : 'district-lobby-1',
        lobbyName: typeof data.lobbyName === 'string' ? data.lobbyName : 'Gathering Grounds'
      };
      onlinePresenceByCivicId.set(presence.civicId, presence);
      useMultiplayerStore.setState({ onlineFriends: [...onlinePresenceByCivicId.values()] });
      break;
    }

    case 'social_presence_leave': {
      if (typeof data.civicId !== 'string') return;
      onlinePresenceByCivicId.delete(data.civicId);
      useMultiplayerStore.setState({ onlineFriends: [...onlinePresenceByCivicId.values()] });
      break;
    }

    case 'lobby_invite': {
      const invite = data.invite as LobbyInvite | undefined;
      if (!invite || data.recipientCivicId !== localCivicId || !invite.id || !invite.lobbyId ||
          invite.senderCivicId === localCivicId || !getIsFriend(invite.senderCivicId)) return;
      useMultiplayerStore.setState(state => ({
        incomingLobbyInvites: [...state.incomingLobbyInvites.filter(item => item.id !== invite.id), invite].slice(-10)
      }));
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
  // A shared peer rendezvous carries presence and lobby invites across rooms.
  return 'civicverse-foyer-global-host';
}

function getIsFriend(civicId: string) {
  return useMultiplayerStore.getState().friendCivicIds.includes(civicId);
}

function keepPeerSignalingAlive(peer: Peer) {
  peer.on('disconnected', () => {
    window.setTimeout(() => {
      if (peer.disconnected && !peer.destroyed) {
        try { peer.reconnect(); } catch {}
      }
    }, 1200);
  });
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
    keepPeerSignalingAlive(peer);

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
  if (hostElectionInProgress || (peerInstance?.id === hostId && !peerInstance.destroyed)) return;
  hostElectionInProgress = true;
  if (peerInstance && !peerInstance.destroyed) {
    peerInstance.destroy();
  }

  try {
    const hostPeer = new Peer(hostId, { debug: 0 });
    peerInstance = hostPeer;
    keepPeerSignalingAlive(hostPeer);

    hostPeer.on('open', (id) => {
      hostElectionInProgress = false;
      console.debug('[PeerJS] Registered as Room Host for:', hostId);
    });

    hostPeer.on('connection', (conn) => {
      setupConnection(conn, username, character);
    });

    hostPeer.on('error', (err: any) => {
      hostElectionInProgress = false;
      if (err?.type === 'unavailable-id') {
        window.setTimeout(() => initPeerJS(localUsername, localCharacter, activeLobbyId), 1200);
      }
    });
  } catch (e) { hostElectionInProgress = false; }
}

function connectToRemotePeer(peerId: string, username: string, character?: CharacterConfig) {
  if (!peerInstance || peerInstance.destroyed) return;
  const existing = activeDataConnections.get(peerId);
  if (existing?.open) return;
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
    conn.send({
      type: 'social_presence', civicId: localCivicId, username,
      lobbyId: activeLobbyId, lobbyName: useMultiplayerStore.getState().currentLobbyName,
      timestamp: Date.now()
    });
    if (peerInstance?.id === getRoomHostId(activeLobbyId)) {
      onlinePresenceByCivicId.forEach(presence => {
        if (presence.civicId !== localCivicId) conn.send({ type: 'social_presence', ...presence });
      });
    }
  });

  conn.on('data', (data) => {
    // Hosted PeerJS rooms use the browser that owns the well-known room ID as
    // their signaling relay. Forward each chat packet to the other room peers;
    // do not echo it back to its sender. The message ID deduplicates the sender's
    // local copy and any duplicate WebSocket/PeerJS delivery.
    const isRoomHost = peerInstance?.id === getRoomHostId(activeLobbyId);
    if (isRoomHost && ['player_join', 'player_identity', 'social_presence'].includes(data?.type) && typeof data.civicId === 'string') {
      civicIdByPeerId.set(conn.peer, data.civicId);
      if (typeof data.lobbyId === 'string') lobbyIdByPeerId.set(conn.peer, data.lobbyId);
    }
    if (isRoomHost && data?.type === 'player_leave') lobbyIdByPeerId.delete(conn.peer);
    if (isRoomHost && ['chat_message', 'player_join', 'player_identity', 'player_move', 'player_leave', 'player_shot', 'player_respawn'].includes(data?.type)) {
      activeDataConnections.forEach((otherConn, peerId) => {
        const sameLobby = lobbyIdByPeerId.get(peerId) === data.lobbyId;
        const allowed = data.audience === 'friends'
          ? Array.isArray(data.recipientIds) && data.recipientIds.includes(civicIdByPeerId.get(peerId) || '')
          : sameLobby;
        if (peerId !== conn.peer && otherConn.open && allowed) {
          try { otherConn.send(data); } catch {}
        }
      });
    }
    if (isRoomHost && data?.type === 'lobby_invite') {
      activeDataConnections.forEach((otherConn, peerId) => {
        if (peerId !== conn.peer && otherConn.open && civicIdByPeerId.get(peerId) === data.recipientCivicId) {
          try { otherConn.send(data); } catch {}
        }
      });
    }
    if (isRoomHost && data?.type === 'social_presence' && typeof data.civicId === 'string') {
      onlinePresenceByCivicId.set(data.civicId, {
        civicId: data.civicId, username: data.username || 'Citizen',
        lobbyId: data.lobbyId || 'district-lobby-1', lobbyName: data.lobbyName || 'Gathering Grounds'
      });
      activeDataConnections.forEach((otherConn, peerId) => {
        if (peerId !== conn.peer && otherConn.open) {
          try { otherConn.send(data); } catch {}
        }
      });
    }
    handleIncomingNetworkMessage(data, 'webrtc');
  });

  conn.on('close', () => {
    const departedCivicId = civicIdByPeerId.get(conn.peer);
    const isRoomHost = peerInstance?.id === getRoomHostId(activeLobbyId);
    if (isRoomHost && departedCivicId) {
      onlinePresenceByCivicId.delete(departedCivicId);
      activeDataConnections.forEach(otherConn => {
        if (otherConn.open) {
          try { otherConn.send({ type: 'social_presence_leave', civicId: departedCivicId }); } catch {}
        }
      });
    }
    activeDataConnections.delete(conn.peer);
    civicIdByPeerId.delete(conn.peer);
    lobbyIdByPeerId.delete(conn.peer);
    if (departedCivicId) {
      onlinePresenceByCivicId.delete(departedCivicId);
      useMultiplayerStore.setState({ onlineFriends: [...onlinePresenceByCivicId.values()] });
    }
    if (conn.peer === getRoomHostId(activeLobbyId)) {
      onlinePresenceByCivicId.clear();
      useMultiplayerStore.setState({ onlineFriends: [] });
    } else if (peerInstance && !peerInstance.destroyed && peerInstance.id !== getRoomHostId(activeLobbyId)) {
      window.setTimeout(() => connectToRemotePeer(getRoomHostId(activeLobbyId), localUsername, localCharacter), 2500);
    }
  });

  conn.on('error', (err: any) => {
    activeDataConnections.delete(conn.peer);
    civicIdByPeerId.delete(conn.peer);
    lobbyIdByPeerId.delete(conn.peer);
    if (err?.type === 'peer-unavailable' && peerInstance && !peerInstance.destroyed && peerInstance.id !== getRoomHostId(activeLobbyId)) {
      window.setTimeout(() => becomeRoomHost(localUsername, localCharacter, activeLobbyId), 750);
    }
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
