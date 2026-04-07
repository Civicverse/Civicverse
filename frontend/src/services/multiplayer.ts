import { create } from 'zustand';

interface ChatMessage {
  id: string;
  playerId: number;
  username: string;
  text: string;
  timestamp: string;
}

interface Player {
  id: number;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  health: number;
  isAlive: boolean;
}

interface MultiplayerState {
  socket: WebSocket | null;
  isConnected: boolean;
  playerId: number | null;
  players: Map<number, Player>;
  chatHistory: ChatMessage[];
  
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  updatePosition: (position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }) => void;
  setIdentity: (username: string) => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  socket: null,
  isConnected: false,
  playerId: null,
  players: new Map(),
  chatHistory: [],

  connect: (url: string) => {
    if (get().socket) return;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      set({ isConnected: true, socket });
      console.log('Connected to multiplayer server');
    };

    socket.onclose = () => {
      set({ isConnected: false, socket: null, playerId: null });
      console.log('Disconnected from multiplayer server');
      // Auto-reconnect
      setTimeout(() => get().connect(url), 3000);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'player_id':
          set({ playerId: message.playerId });
          break;
        
        case 'players_update':
          const playersMap = new Map();
          message.players.forEach((p: Player) => playersMap.set(p.id, p));
          set({ players: playersMap });
          break;

        case 'chat_history':
          set({ chatHistory: message.history });
          break;

        case 'chat_message':
          set((state) => ({
            chatHistory: [...state.chatHistory, message].slice(-100)
          }));
          break;
      }
    };
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, isConnected: false });
    }
  },

  sendMessage: (text: string) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: 'chat_message', text }));
    }
  },

  updatePosition: (position, rotation) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: 'player_move', position, rotation }));
    }
  },

  setIdentity: (username: string) => {
    const { socket, isConnected } = get();
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: 'player_identity', username }));
    }
  }
}));
