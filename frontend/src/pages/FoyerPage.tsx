import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CivicIdentity from '../lib/civicIdentity';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../services/multiplayer';
import { 
  Shield, 
  Zap,
  MessageSquare,
  Radio,
  Eye,
  Send,
  Mic,
  Settings,
  Circle
} from 'lucide-react';
import { GodotFoyer } from '../components';

export default function FoyerPage() {
  const nav = useNavigate();
  const [did, setDid] = useState<string | null>(null);
  const { user } = useGameStore();
  const { connect, sendMessage, chatHistory, setIdentity } = useMultiplayerStore();
  const [inputValue, setInputValue] = useState('');
  
  useEffect(() => {
    const fetchDid = async () => {
      const storedDid = await CivicIdentity.getStoredDID();
      setDid(storedDid);
    };
    fetchDid();

    // Connect to multiplayer server
    const host = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${host}:8080/ws`;
    connect(wsUrl);
  }, [connect]);

  useEffect(() => {
    if (user?.username) {
      setIdentity(user.username);
    }
  }, [user?.username, setIdentity]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !user) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="h-[calc(100vh-0px)] bg-[#0a0c10] text-white flex flex-col overflow-hidden">
      {/* Social Media Navigation Tabs */}
      <div className="bg-[#161b22] border-b border-gray-800/50 px-6 py-3 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-500 w-6 h-6" />
            <span className="text-white font-bold text-lg">CivicVerse Hub</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => nav('/vault')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium">Vault</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Explore</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <Radio className="w-4 h-4" />
              <span className="font-medium">Live</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">Messages</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* CivicWatch Live Stream - Left Side */}
        <div className="w-80 bg-gradient-to-b from-[#1a1d23] to-[#0f1419] border-r border-gray-800/50 overflow-hidden shadow-2xl flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-1">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-xs">CivicWatch Live</span>
              </h3>
              <div className="flex gap-1">
                <button className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30">
                  <Circle className="w-3 h-3 fill-current" />
                </button>
                <button className="w-6 h-6 rounded bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-gray-700/50">
                  <Settings className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-400 text-sm">Live Stream</p>
              <p className="text-cyan-400 text-xs mt-1">Community Events</p>
            </div>
          </div>
        </div>

        {/* Game - Fills center */}
        <div className="flex-1 relative bg-black">
          <GodotFoyer onExit={() => nav('/vault')} />
        </div>

        {/* CivicWatch Live Stream - Right Side */}
        <div className="w-80 bg-gradient-to-b from-[#1a1d23] to-[#0f1419] border-l border-gray-800/50 overflow-hidden shadow-2xl flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-xs">Chat</span>
              </h3>
              <div className="flex gap-1">
                <button className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30">
                  <Mic className="w-3 h-3" />
                </button>
                <button className="w-6 h-6 rounded bg-gray-800/50 flex items-center justify-center text-gray-400 hover:bg-gray-700/50">
                  <Settings className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div className="flex gap-2 justify-center">
              <div className="bg-cyan-500/20 text-cyan-400 text-[10px] uppercase tracking-widest px-2 py-1 rounded font-black">
                System: Welcome to the Foyer
              </div>
            </div>
            
            {chatHistory.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg text-xs shrink-0`}>
                  {msg.username?.[0] || 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-white font-bold text-[10px] truncate">{msg.username}</span>
                    <span className="text-gray-500 text-[9px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-gray-300 text-[11px] leading-tight break-words bg-white/5 p-2 rounded-lg border border-white/5">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-800/50 bg-[#0f1419]">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type to the foyer..."
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none text-[11px] transition-all"
              />
              <button 
                type="submit"
                className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
