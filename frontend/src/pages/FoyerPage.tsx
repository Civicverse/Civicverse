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

        <div className="flex flex-1 items-center justify-between gap-3 ml-4 min-w-0">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 min-w-0">
            {[
              { id: 'WORLD', label: 'WORLD', icon: Globe, path: '/foyer' },
              { id: 'VAULT', label: 'VAULT', icon: Wallet, path: '/vault', pill: '12,450 CVC' },
              { id: 'GOVERN', label: 'GOVERN', icon: Shield, path: '/governance', badge: '2' },
              { id: 'MISSIONS', label: 'MISSIONS', icon: Flower2, path: '/missions' },
              { id: 'CIVICWATCH', label: 'CIVICWATCH', icon: Compass, path: '/civicwatch' },
              { id: 'MINING', label: 'MINING', icon: Zap, path: '/mining-pool' },
              { id: 'WARDROBE', label: 'WARDROBE', icon: Users, path: '/wardrobe' },
              { id: 'SHOP', label: 'SHOP', icon: ShoppingBag, path: '/wardrobe' },
              { id: 'FRIENDS', label: 'FRIENDS', icon: Users, badge: `${1 + peerCount}` },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = activeTopTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTopTab(link.id);
                    if (link.path && link.path !== '/foyer') {
                      nav(link.path);
                    }
                  }}
                  className={`transition-all px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 relative whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-white bg-cyan-950/60 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-red-500 text-white font-black text-[8px] px-1 rounded-full leading-tight">
                      {link.badge}
                    </span>
                  )}
                  {link.pill && (
                    <span className="bg-cyan-500/20 text-cyan-400 font-mono text-[8px] px-1 py-0.2 rounded font-extrabold border border-cyan-500/30">
                      {link.pill}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-1.5 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f3ff]" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Civicverse..."
                className="bg-[#161c28] border border-[#263147] rounded-full py-1 pl-7 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-32 xl:w-40 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 text-gray-400">
              <button className="p-1 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50" title="Return to Civic Vault" onClick={() => nav('/vault')}>
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
              </button>
              <button className="p-1 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50" title="Missions" onClick={() => nav('/missions')}>
                <Flower2 className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50 relative">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full text-[7px] font-black text-white flex items-center justify-center">2</span>
              </button>
              <button className="p-1 hover:text-cyan-400 rounded-lg hover:bg-gray-800/50 relative">
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
            </div>

            <div 
              onClick={() => nav('/vault')}
              className="flex items-center gap-1.5 bg-[#141b27] border border-[#232f45] rounded-full pl-1 pr-2.5 py-0.5 cursor-pointer hover:border-cyan-500/50 transition-all shrink-0"
              title="Return to Civic Vault"
            >
              <img
                src={user?.avatar || '/images/streamer_metamike.jpg'}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover border border-cyan-400"
              />
              <span className="text-[11px] font-bold text-white">{user?.username || 'XJAY420X'}</span>
              <span className="text-[8px] bg-cyan-500/20 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                VAULT ⮌
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SUB-HEADER / DISTRICT LOCATION BAR                    */}
      {/* ======================================================== */}
      <div className="h-8 bg-[#0a0e16]/90 border-b border-[#1a2333]/80 px-4 flex items-center justify-between shrink-0 text-xs z-20">
        
        {/* Left: District Location & Live Population */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <MapPin className="w-3.5 h-3.5 fill-current text-cyan-400" />
            <span className="text-white font-bold">{currentLobbyName}</span>
          </div>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-[11px]">Citizens in Instance: <strong className="text-cyan-400 font-extrabold">{1 + peerCount}/20</strong></span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> • {connectionMode.toUpperCase()}
          </span>
        </div>

        {/* Right: Clean & Unobstructed above newsfeed (Filler junk removed) */}
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
      {/* 4. BOTTOM STATUS HUD (CONSOLIDATED MAIN TABS AT TOP)     */}
      {/* ======================================================== */}
      <footer className="h-8 bg-[#090c12]/95 border-t border-[#1a2333]/80 px-4 flex items-center justify-between shrink-0 z-30">
        
        {/* Left: Civicverse OS & Mesh Network */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => nav('/vault')}
            className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform" 
            title="Return to Civic Vault"
          >
            <Shield className="w-3.5 h-3.5 text-white" />
          </button>
          <span className="text-[11px] font-mono font-bold text-gray-400">CIVICVERSE OS v2.4</span>
          <span className="text-gray-600">|</span>
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
