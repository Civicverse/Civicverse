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
  HelpCircle,
  ChevronDown
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
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const connectionMode = useMultiplayerStore(state => state.connectionMode);
  const currentLobbyName = useMultiplayerStore(state => state.currentLobbyName);

  return (
    <div className="w-screen h-screen bg-stainless-steel-dark text-white flex flex-col overflow-hidden select-none font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP BAR HEADER: OFFICIAL BRAND, CITIZENS & CONTROLS    */}
      {/* ======================================================== */}
      <header className="h-12 bg-stainless-steel border-b border-stainless-steel px-4 flex items-center justify-between shrink-0 z-30 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-4">
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

          {/* Elevated Citizens in Instance Pill (Top Bar, out of the way) */}
          <div className="flex items-center gap-2 bg-[#141b27]/90 border border-cyan-500/40 rounded-full px-3 py-1 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span className="text-gray-300 text-xs font-semibold">Citizens in Instance:</span>
            <span className="text-cyan-400 font-black text-xs">{1 + peerCount}</span>
            <span className="text-gray-400 text-[10px] font-mono">/ 20</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Clickable How to Play Header (Expands with controls) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsControlsOpen(prev => !prev)}
              aria-expanded={isControlsOpen}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer outline-none ${
                isControlsOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                  : 'bg-[#141b27]/85 text-gray-300 border-[#323d4e] hover:border-cyan-500/50 hover:text-white'
              }`}
              title="Click to toggle controls guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>HOW TO PLAY</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isControlsOpen ? 'rotate-180 text-cyan-400' : 'text-gray-400'}`} />
            </button>

            {isControlsOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-[#090d16]/95 border border-cyan-500/50 backdrop-blur-xl rounded-xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.9)] z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#323d4e]">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>HOW TO PLAY / CONTROLS</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsControlsOpen(false)}
                    className="text-gray-400 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#1f2937]/50">
                    <span className="text-gray-300 font-medium">Movement</span>
                    <div className="flex items-center gap-1">
                      <span className="text-cyan-400 font-mono font-bold bg-[#141b27] px-1.5 py-0.5 rounded border border-[#323d4e]">Right-Click</span>
                      <span className="text-gray-500 text-[10px]">or</span>
                      {['W', 'A', 'S', 'D'].map(k => (
                        <kbd key={k} className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px] text-white">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#1f2937]/50">
                    <span className="text-gray-300 font-medium">Interact / Link</span>
                    <span className="text-gray-300">Click building or aim + <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px] text-white">E</kbd></span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#1f2937]/50">
                    <span className="text-gray-300 font-medium">Nearby Chat Bubbles</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px] text-white">T</kbd>
                      <span className="text-gray-500 text-[10px]">or</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px] text-white">Enter</kbd>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#1f2937]/50">
                    <span className="text-gray-300 font-medium">Camera Perspective</span>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px] text-white">V</kbd>
                      <span className="text-gray-400 text-[10px]">1st / 3rd Person</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#1f2937]/50">
                    <span className="text-gray-300 font-medium">Hotbar / Items</span>
                    <span className="text-cyan-400 font-mono font-bold bg-[#141b27] px-1.5 py-0.5 rounded border border-[#323d4e]">Scroll Wheel</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-[#1f2937]/50">
                    <span className="text-gray-300 font-medium">Jump</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[10px] text-white">Space</kbd>
                  </div>

                  <div className="pt-1.5 text-[11px] text-gray-400 border-t border-[#1f2937]/50 leading-relaxed">
                    <strong className="text-cyan-400 font-semibold">CivicWatch Tabs:</strong> Community, static cams, drone, entertainment, news, education. Join video chat, use emojis & send tips!
                  </div>
                </div>
              </div>
            )}
          </div>

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
      {/* 2. MAIN 3-COLUMN LAYOUT: MAXIMUM GAME & FEED VIEWPORT     */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ------------------------------------------------------ */}
        {/* LEFT COLUMN: CIVICWATCH HUB & MEDIA PLAYER             */}
        {/* ------------------------------------------------------ */}
        <aside className="w-80 sharp-panel border-r border-stainless-steel bg-stainless-steel-dark flex flex-col shrink-0 min-h-0 overflow-y-auto z-10 shadow-[5px_0_25px_rgba(0,0,0,0.5)]">
          <div className="flex-1 min-h-[270px] flex flex-col">
            <CivicWatchDistrictPanel />
          </div>

          {/* SECTION B: FOYER FM BOOMBOX MEDIA PLAYER */}
          <div className="h-[280px] min-h-[280px] flex flex-col bg-stainless-steel-panel overflow-hidden shrink-0 border-t border-stainless-steel">
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
      {/* 3. BOTTOM STATUS HUD (STAINLESS STEEL FINISH)            */}
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
