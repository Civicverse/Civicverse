import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GodotFoyer, CivicMediaPlayer, CivicNewsFeed } from '../components';
import { 
  Shield, 
  Search, 
  Bell, 
  Mail, 
  Globe, 
  Flower2, 
  MessageCircle, 
  MapPin, 
  TrendingUp, 
  Zap, 
  Star, 
  MoreHorizontal, 
  X, 
  Heart, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Settings, 
  Maximize2, 
  Share2, 
  Repeat2, 
  CheckCircle2, 
  Wallet, 
  Users, 
  ShoppingBag, 
  Map as MapIcon, 
  Compass, 
  Radio, 
  Music,
  Send
} from 'lucide-react';
import { useMultiplayerStore } from '../services/multiplayer';

export default function FoyerPage() {
  const nav = useNavigate();
  const { user } = useGameStore();
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Real-time Multiplayer Chat state
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const connectionMode = useMultiplayerStore(state => state.connectionMode);
  const currentLobbyName = useMultiplayerStore(state => state.currentLobbyName);
  const sendMessage = useMultiplayerStore(state => state.sendMessage);
  const [streamChatInput, setStreamChatInput] = useState('');

  const handleSendStreamChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamChatInput.trim()) return;
    sendMessage(streamChatInput.trim(), 'text-cyan-400');
    setStreamChatInput('');
  };

  return (
    <div className="w-screen h-screen bg-stainless-steel-dark text-white flex flex-col overflow-hidden select-none font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP BAR HEADER: OFFICIAL LOGO & CLEAN CIVICVERSE BRAND */}
      {/* ======================================================== */}
      <header className="h-12 bg-stainless-steel border-b border-stainless-steel px-4 flex items-center justify-between shrink-0 z-30 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        <div 
          onClick={() => nav('/vault')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to Civic Vault"
        >
          <img 
            src="/Civicverselogo.png" 
            alt="Civicverse Logo" 
            className="w-8 h-8 rounded-full object-cover shadow-[0_0_15px_rgba(255,107,0,0.6)] border border-orange-500/50 group-hover:scale-105 transition-transform" 
          />
          <span className="font-black text-sm tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">CIVICVERSE</span>
        </div>

        <div className="flex items-center gap-3">
          <div 
            onClick={() => nav('/vault')}
            className="flex items-center gap-2 bg-[#141b27]/85 hover:bg-[#1a2334] border border-[#323d4e] rounded-full pl-1.5 pr-3 py-1 cursor-pointer hover:border-cyan-500/50 transition-all shadow-[0_0_12px_rgba(0,0,0,0.4)]"
            title="Return to Civic Vault (Access Govern, Missions, CivicWatch)"
          >
            <img
              src={user?.avatar || '/images/streamer_metamike.jpg'}
              alt="Avatar"
              className="w-6 h-6 rounded-full object-cover border border-cyan-400"
            />
            <span className="text-xs font-bold text-white">{user?.username || 'XJAY420X'}</span>
            <span className="text-[9px] bg-cyan-500/20 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded-full uppercase">
              VAULT ⮌
            </span>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SUB-HEADER / DISTRICT LOCATION BAR                    */}
      {/* ======================================================== */}
      <div className="h-8 bg-stainless-steel-dark/95 border-b border-stainless-steel px-4 flex items-center justify-between shrink-0 text-xs z-20">
        
        {/* Left: District Location & Live Population */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <MapPin className="w-3.5 h-3.5 fill-current text-cyan-400" />
            <span className="text-white font-bold">{currentLobbyName}</span>
          </div>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300 text-[11px]">Citizens in Instance: <strong className="text-cyan-400 font-extrabold">{1 + peerCount}/20</strong></span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> • {connectionMode.toUpperCase()}
          </span>
        </div>

        {/* Right: Quick Controls Hint */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-400">
          <span className="text-cyan-400 font-bold">CONTROLS:</span>
          <span>Right-Click Walk</span>
          <span>•</span>
          <span>Left-Click Shoot</span>
          <span>•</span>
          <span>Scroll Wheel Swap</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN 3-COLUMN LAYOUT                                  */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ------------------------------------------------------ */}
        {/* LEFT COLUMN: LIVESTREAM & MEDIA PLAYER                 */}
        {/* ------------------------------------------------------ */}
        <aside className="w-80 sharp-panel border-r border-stainless-steel bg-stainless-steel-dark flex flex-col shrink-0 overflow-hidden z-10 shadow-[5px_0_25px_rgba(0,0,0,0.5)]">
          
          {/* SECTION A: LIVESTREAM */}
          <div className="flex-1 flex flex-col border-b border-stainless-steel overflow-hidden">
            {/* Header */}
            <div className="p-2.5 px-3 bg-stainless-steel flex items-center justify-between border-b border-stainless-steel">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-black tracking-wider text-white uppercase">DISTRICT LIVE CHAT</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{1 + peerCount} ONLINE</span>
              </div>
            </div>

            {/* Video View */}
            <div className="relative h-44 bg-stainless-steel-dark overflow-hidden group">
              <img 
                src="/images/streamer_metamike.jpg" 
                alt="Streamer" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* LIVE Badge */}
              <div className="absolute top-2 left-2 bg-red-600/90 text-white font-black text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider shadow">
                ★ LIVE
              </div>

              {/* Viewer Count */}
              <div className="absolute top-2 right-2 bg-[#04070c]/90 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 border border-[#323d4e] shadow-[0_0_18px_rgba(0,0,0,0.35)]">
                👁 {1 + peerCount} CITIZENS
              </div>

              {/* Streamer Title Overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-white">MetaMike</span>
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />
                </div>
                <p className="text-[11px] text-gray-200 font-medium truncate">Exploring New District!</p>
                <div className="text-[9px] text-cyan-400 font-mono mt-0.5">#Civicverse #Gameplay #Web3</div>
              </div>
            </div>

            {/* Stream Chat Feed */}
            <div className="flex-1 flex flex-col p-2.5 overflow-hidden bg-stainless-steel-dark">
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-sans text-[11px] scrollbar-thin">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className="leading-tight break-words">
                    <span className={`font-bold mr-1.5 ${msg.color || 'text-cyan-400'}`}>{msg.username}:</span>
                    <span className="text-gray-200">{msg.text}</span>
                  </div>
                ))}
              </div>

              {/* Stream Chat Input */}
              <form onSubmit={handleSendStreamChat} className="mt-2 relative">
                <input
                  type="text"
                  value={streamChatInput}
                  onChange={(e) => setStreamChatInput(e.target.value)}
                  placeholder="Broadcast to district..."
                  className="w-full bg-[#121824]/90 border border-[#323d4e] rounded-lg py-1.5 pl-3 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* SECTION B: FOYER FM BOOMBOX MEDIA PLAYER */}
          <div className="h-[310px] flex flex-col bg-stainless-steel-panel overflow-hidden shrink-0 border-t border-stainless-steel">
            <CivicMediaPlayer />
          </div>
        </aside>

        {/* ------------------------------------------------------ */}
        {/* CENTER COLUMN: 3D GAME ENGINE VIEWPORT & HUD          */}
        {/* ------------------------------------------------------ */}
        <main className="flex-1 relative bg-stainless-steel-dark overflow-hidden">
          <GodotFoyer onExit={() => nav('/vault')} />
        </main>

        {/* ------------------------------------------------------ */}
        {/* RIGHT COLUMN: REAL-TIME CIVIC & OPEN SOURCE NEWSFEED   */}
        {/* ------------------------------------------------------ */}
        <aside className="w-80 sharp-panel border-l border-stainless-steel bg-stainless-steel-dark flex flex-col shrink-0 overflow-hidden z-10 shadow-[-5px_0_25px_rgba(0,0,0,0.5)]">
          <CivicNewsFeed />
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM STATUS HUD (STAINLESS STEEL FINISH)            */}
      {/* ======================================================== */}
      <footer className="h-8 bg-stainless-steel border-t border-stainless-steel px-4 flex items-center justify-between shrink-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.4)]">
        
        {/* Left: Civicverse OS & Mesh Network */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => nav('/vault')}
            className="w-6 h-6 rounded-full overflow-hidden shadow-[0_0_10px_rgba(255,107,0,0.6)] border border-orange-500/50 hover:scale-105 transition-transform" 
            title="Return to Civic Vault"
          >
            <img src="/Civicverselogo.png" alt="CV" className="w-full h-full object-cover" />
          </button>
          <span className="text-[11px] font-mono font-bold text-gray-300">CIVICVERSE OS v2.4</span>
          <span className="text-gray-500">|</span>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>P2P MESH ONLINE</span>
          </div>
        </div>

        {/* Center: Subtle District Status */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-gray-500">
          <span>INSTANCE: {currentLobbyName.toUpperCase()}</span>
          <span>•</span>
          <span className="text-cyan-500/70">HUD ACTIVE</span>
        </div>

        {/* Right: Performance & System Specs */}
        <div className="flex items-center gap-3 text-xs font-mono font-bold text-gray-400">
          <span className="text-emerald-400">60 FPS</span>
          <span>45 MS</span>
          <span className="text-gray-600">|</span>

          <button onClick={() => setIsMicMuted(!isMicMuted)} className="hover:text-white p-1" title={isMicMuted ? "Unmute Mic" : "Mute Mic"}>
            {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white p-1" title={isMuted ? "Unmute Audio" : "Mute Audio"}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button className="hover:text-white p-1" title="Settings">
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button 
            className="hover:text-white p-1" 
            title="Fullscreen"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
