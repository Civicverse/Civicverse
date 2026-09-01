import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { GodotFoyer } from '../components';
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

export default function FoyerPage() {
  const nav = useNavigate();
  const { user } = useGameStore();
  const [activeTopTab, setActiveTopTab] = useState('WORLD');
  const [activeNewsTab, setActiveNewsTab] = useState('Following');
  const [activeMediaTab, setActiveMediaTab] = useState('Spotify');
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  
  // Live Stream Chat state
  const [streamChatInput, setStreamChatInput] = useState('');
  const [streamChatMessages, setStreamChatMessages] = useState([
    { id: 1, user: 'blockchick24', text: 'That lighting tho 🔥', color: 'text-amber-400' },
    { id: 2, user: 'civiclah', text: 'this game is next level', color: 'text-cyan-400' },
    { id: 3, user: 'kevlar88', text: 'just minted my first property!', color: 'text-emerald-400' },
    { id: 4, user: 'token_traveler', text: 'See you at the rally!', color: 'text-purple-400' }
  ]);

  // Newsfeed Posts Interactive State
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'CivicVerse Official',
      handle: '@CivicVerse',
      time: '2h',
      verified: true,
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=civicverse',
      content: 'New governance proposal is LIVE! Vote now on funding for the Green District initiative 🌿',
      comments: 256,
      retweets: 1200,
      likes: 3400,
      liked: false
    },
    {
      id: 2,
      author: 'MetaMike',
      handle: '@MetaMike',
      time: '3h',
      verified: true,
      avatar: '/images/streamer_metamike.jpg',
      content: 'Just discovered a hidden rooftop garden in New District 🤫 #Civicverse',
      image: '/images/rooftop_garden.jpg',
      comments: 89,
      retweets: 420,
      likes: 1100,
      liked: false
    },
    {
      id: 3,
      author: 'SatoshiStreetBets',
      handle: '@SatoshiSt...',
      time: '4h',
      verified: false,
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=satoshistreet',
      content: '$CVC breaking out! The future is decentralized 🚀',
      chart: true,
      comments: 120,
      retweets: 560,
      likes: 2100,
      liked: false
    },
    {
      id: 4,
      author: 'Civician_Chick',
      handle: '@CivicianChick',
      time: '5h',
      verified: true,
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=civicianchick',
      content: "Hosting a community clean up event this Saturday! Let's make Civic City beautiful 💚",
      image: '/images/cleanup_event.jpg',
      comments: 45,
      retweets: 230,
      likes: 900,
      liked: false
    }
  ]);

  const handleSendStreamChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamChatInput.trim()) return;
    setStreamChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        user: user?.username || 'XJAY420X',
        text: streamChatInput,
        color: 'text-cyan-400'
      }
    ]);
    setStreamChatInput('');
  };

  const toggleLike = (postId: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
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
          <div className="flex items-center gap-1.5 text-red-400 font-bold">
            <MapPin className="w-4 h-4 fill-current text-red-500" />
            <span className="text-white font-bold">New District, Civic City</span>
          </div>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">Population: <strong className="text-gray-200">12,398</strong></span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> • Live
          </span>
        </div>

        {/* Right: Economy Ticker Pills */}
        <div className="flex items-center gap-6">
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
              <span className="text-xs font-black tracking-wider text-gray-300 uppercase">LIVESTREAM</span>
              <div className="flex items-center gap-1 text-gray-400">
                <button className="hover:text-white p-0.5"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                <button className="hover:text-white p-0.5"><X className="w-3.5 h-3.5" /></button>
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
                👁 7.2K
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
                {streamChatMessages.map((msg) => (
                  <div key={msg.id} className="leading-tight break-words">
                    <span className={`font-bold mr-1.5 ${msg.color}`}>{msg.user}:</span>
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
                  placeholder="Say something..."
                  className="w-full bg-[#121824] border border-[#232f45] rounded-lg py-1.5 pl-3 pr-8 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* SECTION B: MEDIA PLAYER */}
          <div className="h-64 flex flex-col bg-[#080c14] overflow-hidden">
            {/* Header */}
            <div className="p-2.5 px-3 bg-[#0d131f] flex items-center justify-between border-b border-gray-800/60">
              <span className="text-xs font-black tracking-wider text-gray-300 uppercase">MEDIA PLAYER</span>
              <div className="flex items-center gap-1 text-gray-400">
                <button className="hover:text-white p-0.5"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                <button className="hover:text-white p-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Service Tabs */}
            <div className="flex items-center gap-4 px-3 py-1.5 border-b border-gray-800/50 text-xs font-bold text-gray-400">
              <button 
                onClick={() => setActiveMediaTab('iTunes')} 
                className={activeMediaTab === 'iTunes' ? 'text-white' : 'hover:text-gray-300'}
              >
                iTunes
              </button>
              <button 
                onClick={() => setActiveMediaTab('Spotify')} 
                className={`relative py-0.5 ${activeMediaTab === 'Spotify' ? 'text-emerald-400 font-extrabold' : 'hover:text-gray-300'}`}
              >
                Spotify
                {activeMediaTab === 'Spotify' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />}
              </button>
              <button 
                onClick={() => setActiveMediaTab('Civic Radio')} 
                className={activeMediaTab === 'Civic Radio' ? 'text-white' : 'hover:text-gray-300'}
              >
                Civic Radio
              </button>
            </div>

            <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
              <p className="text-[11px] text-gray-400">Good afternoon, <strong className="text-white">{user?.username || 'XJAY420X'}</strong></p>

              {/* 2x2 Playlist Grid */}
              <div className="grid grid-cols-2 gap-2 my-1">
                <div className="bg-[#121927] border border-gray-800 rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-cyan-500/50 transition-all">
                  <div className="w-7 h-7 bg-purple-600 rounded flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 text-white fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">Liked Songs</div>
                    <div className="text-[8px] text-gray-400">2,341 songs</div>
                  </div>
                </div>

                <div className="bg-[#121927] border border-gray-800 rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-cyan-500/50 transition-all">
                  <div className="w-7 h-7 bg-cyan-600 rounded flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">Civicverse Hits</div>
                    <div className="text-[8px] text-gray-400">50 songs</div>
                  </div>
                </div>

                <div className="bg-[#121927] border border-gray-800 rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-cyan-500/50 transition-all">
                  <div className="w-7 h-7 bg-amber-600 rounded flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-white fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">Workout Mode</div>
                    <div className="text-[8px] text-gray-400">65 songs</div>
                  </div>
                </div>

                <div className="bg-[#121927] border border-gray-800 rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-cyan-500/50 transition-all">
                  <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-white truncate">Focus Flow</div>
                    <div className="text-[8px] text-gray-400">120 songs</div>
                  </div>
                </div>
              </div>

              {/* Now Playing Active Track Bar */}
              <div className="bg-[#0f1522] border border-[#1f2b3e] rounded-xl p-2 flex items-center gap-2.5">
                <img 
                  src="/images/rooftop_garden.jpg" 
                  alt="Track Cover" 
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-purple-500/30"
                />

                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white truncate">Conquer The Day</div>
                  <div className="text-[9px] text-gray-400 truncate">EpicSoulz • Civicverse Vol. 1</div>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex-1 bg-gray-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[45%]" />
                    </div>
                    <span className="text-[8px] font-mono text-gray-400">1:42 / 3:45</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 text-gray-300 shrink-0">
                  <button onClick={() => setIsMuted(!isMuted)} className="hover:text-white p-1">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setIsPlaying(!isPlaying)} className="w-7 h-7 bg-emerald-500 rounded-full text-black flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_10px_#10b981]">
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------ */}
        {/* CENTER COLUMN: 3D GAME ENGINE VIEWPORT & HUD          */}
        {/* ------------------------------------------------------ */}
        <main className="flex-1 relative bg-black overflow-hidden">
          <GodotFoyer onExit={() => nav('/vault')} />
        </main>

        {/* ------------------------------------------------------ */}
        {/* RIGHT COLUMN: NEWSFEED (MATCHING FOYER_FORMAT.JPG)     */}
        {/* ------------------------------------------------------ */}
        <aside className="w-80 sharp-panel border-l border-[#1a2333]/80 flex flex-col shrink-0 overflow-hidden z-10">
          
          {/* Header */}
          <div className="p-2.5 px-3 bg-[#0d131f] flex items-center justify-between border-b border-gray-800/60">
            <span className="text-xs font-black tracking-wider text-gray-300 uppercase">NEWSFEED</span>
            <div className="flex items-center gap-1 text-gray-400">
              <button className="hover:text-white p-0.5"><MoreHorizontal className="w-3.5 h-3.5" /></button>
              <button className="hover:text-white p-0.5"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-6 px-3 py-2 border-b border-gray-800/50 text-xs font-bold text-gray-400">
            {['Following', 'Trending', 'Civic News'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveNewsTab(tab)}
                className={`relative py-0.5 transition-colors ${
                  activeNewsTab === tab ? 'text-white font-extrabold' : 'hover:text-gray-300'
                }`}
              >
                {tab}
                {activeNewsTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00f3ff]" />
                )}
              </button>
            ))}
          </div>

          {/* Posts Scroll Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            {posts.map((post) => (
              <article key={post.id} className="bg-[#101622] border border-[#1d273a] rounded-xl p-3 shadow-lg">
                {/* Author row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img 
                      src={post.avatar} 
                      alt={post.author} 
                      className="w-7 h-7 rounded-full object-cover border border-cyan-500/40"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">{post.author}</span>
                        {post.verified && <CheckCircle2 className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{post.handle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{post.time}</span>
                </div>

                {/* Content */}
                <p className="text-xs text-gray-200 leading-relaxed mb-2.5">{post.content}</p>

                {/* Attached Image */}
                {post.image && (
                  <div className="rounded-lg overflow-hidden border border-gray-800 mb-2.5">
                    <img src={post.image} alt="Attachment" className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                )}

                {/* Crypto Chart Graph Attachment */}
                {post.chart && (
                  <div className="bg-[#090d16] border border-emerald-950/60 rounded-lg p-2.5 mb-2.5">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                      <span>$CVC / USD</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +14.2%</span>
                    </div>
                    {/* SVG Line Graph */}
                    <svg className="w-full h-12 stroke-emerald-400 fill-emerald-500/10" viewBox="0 0 200 40">
                      <path d="M0,35 Q30,20 60,28 T120,15 T180,8 L200,5 L200,40 L0,40 Z" />
                      <path d="M0,35 Q30,20 60,28 T120,15 T180,8 L200,5" fill="none" strokeWidth="2" />
                    </svg>
                  </div>
                )}

                {/* Action Counts Row */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/60">
                  <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span>{post.retweets > 999 ? `${(post.retweets/1000).toFixed(1)}K` : post.retweets}</span>
                  </button>
                  <button 
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1 transition-colors ${post.liked ? 'text-pink-500 font-bold' : 'hover:text-pink-400'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-current' : ''}`} />
                    <span>{post.likes > 999 ? `${(post.likes/1000).toFixed(1)}K` : post.likes}</span>
                  </button>
                  <button className="hover:text-gray-200">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
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
