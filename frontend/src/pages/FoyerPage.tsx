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
  const [activeTopTab, setActiveTopTab] = useState('WORLD');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Real-time Multiplayer Chat state
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const connectionMode = useMultiplayerStore(state => state.connectionMode);
  const currentLobbyName = useMultiplayerStore(state => state.currentLobbyName);
  const ubiStatus = useMultiplayerStore(state => state.ubiStatus);
  const sendMessage = useMultiplayerStore(state => state.sendMessage);
  const [streamChatInput, setStreamChatInput] = useState('');

  const handleSendStreamChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamChatInput.trim()) return;
    sendMessage(streamChatInput.trim(), 'text-cyan-400');
    setStreamChatInput('');
  };

  return (
    <div className="w-screen h-screen bg-[#07090e] text-white flex flex-col overflow-hidden select-none font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP BAR HEADER (MATCHING FOYER_FORMAT.JPG EXACTLY)    */}
      {/* ======================================================== */}
      <header className="h-12 bg-[#0b1121] border-b border-[#1f293b]/60 px-4 flex items-center justify-between shrink-0 z-30 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-500 flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            <div className="w-full h-full bg-[#0c1017] rounded-[6px] flex items-center justify-center">
              <span className="text-[11px] font-black text-cyan-400 tracking-tighter">CV</span>
            </div>
          </div>
          <span className="font-extrabold text-sm tracking-wider text-white">CIVICVERSE</span>
        </div>

        <div className="flex flex-1 items-center justify-between gap-8 ml-6">
          <nav className="flex items-center gap-5 text-xs font-semibold text-gray-300">
            {[
              { id: 'HOME', label: 'VAULT', path: '/vault' },
              { id: 'WORLD', label: 'WORLD', path: '/foyer' },
              { id: 'GOVERN', label: 'GOVERN', path: '/governance' },
              { id: 'MISSIONS', label: 'MISSIONS', path: '/missions' },
              { id: 'CIVICWATCH', label: 'CIVICWATCH', path: '/civicwatch' },
              { id: 'MINING', label: 'MINING', path: '/mining-pool' },
              { id: 'WARDROBE', label: 'WARDROBE', path: '/wardrobe' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTopTab(link.id);
                  if (link.path !== '/foyer') {
                    nav(link.path);
                  }
                }}
                className={`transition-colors py-1 relative ${
                  activeTopTab === link.id
                    ? 'text-white font-bold'
                    : 'hover:text-cyan-400'
                }`}
              >
                {link.label}
                {activeTopTab === link.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f3ff]" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Civicverse..."
                className="bg-[#161c28] border border-[#263147] rounded-full py-1 pl-8 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-48 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 text-gray-400">
              <button className="p-1.5 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50" title="Return to Civic Vault" onClick={() => nav('/vault')}>
                <Shield className="w-4 h-4 text-cyan-400" />
              </button>
              <button className="p-1.5 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50" title="Missions" onClick={() => nav('/missions')}>
                <Flower2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50 relative">
                <MessageCircle className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full text-[8px] font-black text-white flex items-center justify-center">2</span>
              </button>
              <button className="p-1.5 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50 relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>

            <div 
              onClick={() => nav('/vault')}
              className="flex items-center gap-2 bg-[#141b27] border border-[#232f45] rounded-full pl-1 pr-3 py-1 cursor-pointer hover:border-cyan-500/50 transition-all"
              title="Return to Civic Vault"
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
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SUB-HEADER / STATS BAR (LOCATION & ECONOMY TICKER)   */}
      {/* ======================================================== */}
      <div className="h-9 bg-[#0a0e16]/90 border-b border-[#1a2333]/80 px-4 flex items-center justify-between shrink-0 text-xs z-20">
        
        {/* Left: District Location & Live Population */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <MapPin className="w-4 h-4 fill-current text-cyan-400" />
            <span className="text-white font-bold">{currentLobbyName}</span>
          </div>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">Citizens in Instance: <strong className="text-cyan-400 font-extrabold">{1 + peerCount}/20</strong></span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> • {connectionMode.toUpperCase()}
          </span>
        </div>

        {/* Right: Economy Ticker Pills */}
        <div className="flex items-center gap-4">
          {/* 1% UBI POOL */}
          <div className="flex items-center gap-1.5 bg-neon-pink/10 border border-neon-pink/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,0,128,0.2)]">
            <span className="text-neon-pink font-bold text-[10px] uppercase">1% UBI POOL</span>
            <span className="text-white font-extrabold font-mono text-[11px]">{ubiStatus?.ubiPool ? ubiStatus.ubiPool.toFixed(2) : '1,240.50'} CIVIC</span>
          </div>

          {/* $CVC */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold">$CVC</span>
            <span className="text-white font-extrabold">2.45</span>
            <span className="text-emerald-400 font-bold text-[11px]">+4.35%</span>
          </div>

          {/* CREDIT */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold">CREDIT</span>
            <span className="text-white font-extrabold">12,450</span>
            <span className="text-emerald-400 font-bold text-[11px]">+3.2%</span>
          </div>

          {/* REPUTATION */}
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-gray-400 font-bold">REPUTATION</span>
            <span className="text-white font-extrabold">8,920</span>
            <span className="text-amber-400 font-serif italic font-bold">Legendary</span>
          </div>

          {/* ENERGY */}
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span className="text-gray-400 font-bold">ENERGY</span>
            <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div className="bg-cyan-400 h-full w-[86%]" />
            </div>
            <span className="text-white font-bold font-mono text-[11px]">86/100</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN 3-COLUMN LAYOUT                                  */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ------------------------------------------------------ */}
        {/* LEFT COLUMN: LIVESTREAM & MEDIA PLAYER                 */}
        {/* ------------------------------------------------------ */}
        <aside className="w-80 sharp-panel border-r border-[#1a2333]/80 flex flex-col shrink-0 overflow-hidden z-10">
          
          {/* SECTION A: LIVESTREAM */}
          <div className="flex-1 flex flex-col border-b border-[#1a2333]/80 overflow-hidden">
            {/* Header */}
            <div className="p-2.5 px-3 bg-[#0d131f] flex items-center justify-between border-b border-gray-800/60">
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
            <div className="relative h-44 bg-black overflow-hidden group">
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
              <div className="absolute top-2 right-2 bg-[#04070c] text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 border border-[#1a2233] shadow-[0_0_18px_rgba(0,0,0,0.25)]">
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
            <div className="flex-1 flex flex-col p-2.5 overflow-hidden bg-[#090d16]">
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-sans text-[11px] scrollbar-thin">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className="leading-tight break-words">
                    <span className={`font-bold mr-1.5 ${msg.color || 'text-cyan-400'}`}>{msg.username}:</span>
                    <span className="text-gray-300">{msg.text}</span>
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
                  className="w-full bg-[#121824] border border-[#232f45] rounded-lg py-1.5 pl-3 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* SECTION B: FOYER FM BOOMBOX MEDIA PLAYER */}
          <div className="h-[310px] flex flex-col bg-[#080c14] overflow-hidden shrink-0">
            <CivicMediaPlayer />
          </div>
        </aside>

        {/* ------------------------------------------------------ */}
        {/* CENTER COLUMN: 3D GAME ENGINE VIEWPORT & HUD          */}
        {/* ------------------------------------------------------ */}
        <main className="flex-1 relative bg-black overflow-hidden">
          <GodotFoyer onExit={() => nav('/vault')} />
        </main>

        {/* ------------------------------------------------------ */}
        {/* RIGHT COLUMN: REAL-TIME CIVIC & OPEN SOURCE NEWSFEED   */}
        {/* ------------------------------------------------------ */}
        <aside className="w-80 sharp-panel border-l border-[#1a2333]/80 flex flex-col shrink-0 overflow-hidden z-10">
          <CivicNewsFeed />
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM NAVIGATION BAR / DOCK                          */}
      {/* ======================================================== */}
      <footer className="h-12 bg-[#090c12]/95 border-t border-[#1a2333]/80 px-4 flex items-center justify-between shrink-0 z-30">
        
        {/* Left: Civicverse Emblem */}
        <button className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform">
          <Shield className="w-4 h-4 text-white" />
        </button>

        {/* Center: Dock Navigation Buttons with Badges */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50">
            <span>Civic ID</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50 relative">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wallet</span>
            <span className="bg-red-500 text-white font-black text-[9px] px-1 rounded-full">12</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-400 font-extrabold border border-cyan-500/30">
            <span>12,450 CVC</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50">
            <span>Messages</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Friends</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50">
            <span>Inventory</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Shop</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50">
            <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Map</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50">
            <span>Quests</span>
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50 relative">
            <span>Governance</span>
            <span className="bg-red-500 text-white font-black text-[9px] px-1 rounded-full">2</span>
          </button>

          <button className="p-1.5 rounded-lg bg-gray-800/40 hover:bg-gray-800 text-xs text-gray-200 font-bold border border-gray-700/50 relative">
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">3</span>
          </button>
        </div>

        {/* Right: Performance & System Specs */}
        <div className="flex items-center gap-3 text-xs font-mono font-bold text-gray-400">
          <span className="text-emerald-400">60 FPS</span>
          <span>45 MS</span>

          <button onClick={() => setIsMicMuted(!isMicMuted)} className="hover:text-white p-1">
            {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white p-1">
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button className="hover:text-white p-1">
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button className="hover:text-white p-1">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
