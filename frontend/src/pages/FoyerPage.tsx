import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GodotFoyer, CivicMediaPlayer, CivicNewsFeed } from '../components';
import CivicWatchDistrictPanel from '../components/CivicWatchDistrictPanel';
import { 
  Shield, 
  Search, 
  Bell, 
  Mail, 
  Globe, 
  Flower2, 
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
  Wallet, 
  Users, 
  ShoppingBag, 
  Map as MapIcon, 
  Compass, 
} from 'lucide-react';
import { useMultiplayerStore } from '../services/multiplayer';

export default function FoyerPage() {
  const nav = useNavigate();
  const { user } = useGameStore();

  const handleReturnToVault = () => {
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch {}
    }
    nav('/vault');
  };
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const connectionMode = useMultiplayerStore(state => state.connectionMode);
  const currentLobbyName = useMultiplayerStore(state => state.currentLobbyName);

  return (
    <div className="w-screen h-screen bg-stainless-steel-dark text-white flex flex-col overflow-hidden select-none font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP BAR HEADER: OFFICIAL LOGO & CLEAN CIVICVERSE BRAND */}
      {/* ======================================================== */}
      <header className="h-12 bg-stainless-steel border-b border-stainless-steel px-4 flex items-center justify-between shrink-0 z-30 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        <button 
          type="button"
          onClick={handleReturnToVault}
          className="flex items-center gap-3 cursor-pointer group bg-transparent border-none p-0 text-left outline-none"
          title="Return to Civic Vault"
        >
          <img 
            src="/Civicverselogo.png" 
            alt="Civicverse Logo" 
            className="w-8 h-8 rounded-full object-cover shadow-[0_0_15px_rgba(255,107,0,0.6)] border border-orange-500/50 group-hover:scale-105 transition-transform" 
          />
          <span className="font-black text-sm tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">CIVICVERSE</span>
        </button>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleReturnToVault}
            className="flex items-center gap-2 bg-[#141b27]/85 hover:bg-[#1a2334] border border-[#323d4e] rounded-full pl-1.5 pr-3 py-1 cursor-pointer hover:border-cyan-500/50 transition-all shadow-[0_0_12px_rgba(0,0,0,0.4)] outline-none"
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
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SUB-HEADER / DISTRICT LOCATION BAR                    */}
      {/* ======================================================== */}
      <div className="min-h-8 bg-stainless-steel-dark/95 border-b border-stainless-steel px-4 py-1 flex items-center justify-between gap-4 shrink-0 text-xs z-20">
        
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
        <div className="hidden sm:block max-w-[58%] text-right text-[10px] leading-relaxed font-mono text-gray-300">
          <span className="font-bold text-cyan-400">HOW TO PLAY:</span>
          <span> Right-click walks · Click a billboard/building or aim + E for links · T/Enter opens nearby chat with timed gamertag bubbles · V camera · Scroll hotbar</span>
          <span className="block text-gray-400">CivicWatch tabs: community, static cams, drone, entertainment, news, education · play a video to join its CivicWatch chat · emojis and donations</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN 3-COLUMN LAYOUT                                  */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ------------------------------------------------------ */}
        {/* LEFT COLUMN: CIVICWATCH HUB & MEDIA PLAYER             */}
        {/* ------------------------------------------------------ */}
        <aside className="w-80 sharp-panel border-r border-stainless-steel bg-stainless-steel-dark flex flex-col shrink-0 overflow-hidden z-10 shadow-[5px_0_25px_rgba(0,0,0,0.5)]">
          <CivicWatchDistrictPanel />

          {/* SECTION B: FOYER FM BOOMBOX MEDIA PLAYER */}
          <div className="h-[120px] flex flex-col bg-stainless-steel-panel overflow-hidden shrink-0 border-t border-stainless-steel">
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
          <div className="min-h-0 flex-1 overflow-hidden"><CivicNewsFeed /></div>
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM STATUS HUD (STAINLESS STEEL FINISH)            */}
      {/* ======================================================== */}
      <footer className="h-8 bg-stainless-steel border-t border-stainless-steel px-4 flex items-center justify-between shrink-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.4)]">
        
        {/* Left: Civicverse OS & Mesh Network */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleReturnToVault}
            className="w-6 h-6 rounded-full overflow-hidden shadow-[0_0_10px_rgba(255,107,0,0.6)] border border-orange-500/50 hover:scale-105 transition-transform outline-none" 
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
