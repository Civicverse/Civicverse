import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Howl } from 'howler';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Radio, 
  Search, 
  X, 
  SkipBack, 
  SkipForward, 
  Flame, 
  Newspaper, 
  MessageSquare, 
  Smile, 
  ChevronUp, 
  ChevronDown, 
  Send, 
  Plus, 
  Minus, 
  Sparkles, 
  Compass, 
  MapPin, 
  Navigation, 
  Heart,
  Music
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../services/multiplayer';
import { 
  MediaStation, 
  CURATED_STATIONS, 
  searchRadioStations, 
  getLastPlayedStation, 
  saveLastPlayedStation, 
  fetchLiveTrackMetadata, 
  TrackMetadata 
} from '../services/mediaService';

type FoyerTabMode = 'minimap' | 'trending' | 'news' | 'proximity' | 'emojis';

export const CivicMediaPlayer: React.FC = () => {
  const { user } = useGameStore();

  // Multiplayer store integration (Proximity Chat, Peers, Radar)
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const players = useMultiplayerStore(state => state.players);
  const sendMessage = useMultiplayerStore(state => state.sendMessage);

  // Playback state
  const [currentStation, setCurrentStation] = useState<MediaStation>(() => getLastPlayedStation() || CURATED_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'buffering' | 'playing' | 'error'>('idle');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FoyerTabMode>('minimap');
  const [isRepeat, setIsRepeat] = useState<boolean>(true);
  const [isRandom, setIsRandom] = useState<boolean>(false);

  // Real working live clock (updates every second)
  const [liveClock, setLiveClock] = useState<string>('');

  // Station Selector Overlay (triggered by ▲ OPEN on left pod)
  const [showStationDrawer, setShowStationDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaStation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Interactive Trending Feed state with working likes
  const [trendingPosts, setTrendingPosts] = useState([
    {
      id: 'post-1',
      author: 'MetaMike',
      handle: '@MetaMike',
      time: '2m ago',
      avatar: '/images/streamer_metamike.jpg',
      content: 'District live streams are peaking in Plaza Alpha! Node mesh holding strong at 60 FPS.',
      likes: 24,
      liked: false
    },
    {
      id: 'post-2',
      author: 'NovaVoxel',
      handle: '@NovaVoxel',
      time: '7m ago',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
      content: 'New rooftop DJ set broadcasting on Foyer FM right now. Turn on high quality 320k stream!',
      likes: 41,
      liked: false
    },
    {
      id: 'post-3',
      author: 'AuraCipher',
      handle: '@AuraCipher',
      time: '15m ago',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cipher',
      content: 'Verified smart contract reward pool just added 500 CVT for the night exploration mission.',
      likes: 18,
      liked: false
    },
    {
      id: 'post-4',
      author: 'Kira_Cyber',
      handle: '@Kira',
      time: '22m ago',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kira',
      content: 'Meet me at the central fountain plaza for the speed race tournament in 10 minutes!',
      likes: 33,
      liked: false
    }
  ]);

  // Proximity Chat Input & Floating Emoji Particles
  const [chatMessage, setChatMessage] = useState<string>('');
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);

  // Live Track Metadata
  const [metadata, setMetadata] = useState<TrackMetadata>({
    title: currentStation.name,
    artist: currentStation.tags?.[0]?.toUpperCase() || 'CIVIC BROADCAST',
    album: 'Foyer FM Direct Stream',
    stationName: currentStation.name
  });

  const howlRef = useRef<Howl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Curated Foyer FM channels
  const FOYER_STATIONS: MediaStation[] = useMemo(() => [
    CURATED_STATIONS[0] || currentStation,
    CURATED_STATIONS.find(s => s.id === 'nightwave-plaza') || CURATED_STATIONS[1] || currentStation,
    CURATED_STATIONS.find(s => s.id === 'atomicwave-fm') || CURATED_STATIONS[2] || currentStation,
    CURATED_STATIONS.find(s => s.id === 'soma-groove-salad') || CURATED_STATIONS[3] || currentStation,
    CURATED_STATIONS[4] || currentStation,
    CURATED_STATIONS[5] || currentStation,
    CURATED_STATIONS[6] || currentStation,
  ], [currentStation]);

  const [activeStationIndex, setActiveStationIndex] = useState<number>(0);

  // Real clock update hook
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Playback
  const playStation = (station: MediaStation) => {
    if (!station || !station.url) return;

    if (howlRef.current) {
      try {
        howlRef.current.stop();
        howlRef.current.unload();
      } catch (e) {}
      howlRef.current = null;
    }

    setCurrentStation(station);
    saveLastPlayedStation(station);
    setPlaybackState('buffering');
    setIsPlaying(true);

    setMetadata({
      title: station.name,
      artist: station.tags?.[0]?.toUpperCase() || 'CIVICVERSE BROADCAST',
      stationName: station.name
    });

    try {
      const sound = new Howl({
        src: [station.url],
        html5: true,
        format: station.codec ? [station.codec.toLowerCase(), 'mp3', 'aac', 'ogg'] : ['mp3', 'aac', 'ogg'],
        volume: isMuted ? 0 : volume,
        autoplay: true,
        onload: () => {
          setPlaybackState('playing');
          setIsPlaying(true);
        },
        onplay: () => {
          setPlaybackState('playing');
          setIsPlaying(true);
        },
        onpause: () => {
          setIsPlaying(false);
          setPlaybackState('idle');
        },
        onstop: () => {
          setIsPlaying(false);
          setPlaybackState('idle');
        },
        onloaderror: () => {
          setPlaybackState('error');
          setIsPlaying(false);
        },
        onplayerror: () => {
          sound.once('unlock', () => sound.play());
          setPlaybackState('error');
          setIsPlaying(false);
        }
      });

      howlRef.current = sound;
    } catch (err) {
      setPlaybackState('error');
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    if (!howlRef.current) {
      playStation(FOYER_STATIONS[activeStationIndex] || currentStation);
      return;
    }

    if (isPlaying) {
      howlRef.current.pause();
      setIsPlaying(false);
      setPlaybackState('idle');
    } else {
      howlRef.current.play();
      setIsPlaying(true);
      setPlaybackState('playing');
    }
  };

  const handleStop = () => {
    if (howlRef.current) howlRef.current.stop();
    setIsPlaying(false);
    setPlaybackState('idle');
  };

  const handleNextStation = () => {
    const nextIdx = (activeStationIndex + 1) % FOYER_STATIONS.length;
    setActiveStationIndex(nextIdx);
    playStation(FOYER_STATIONS[nextIdx]);
  };

  const handlePrevStation = () => {
    const prevIdx = (activeStationIndex - 1 + FOYER_STATIONS.length) % FOYER_STATIONS.length;
    setActiveStationIndex(prevIdx);
    playStation(FOYER_STATIONS[prevIdx]);
  };

  const handleVolumeUp = () => {
    const newVol = Math.min(1, Math.round((volume + 0.05) * 100) / 100);
    setVolume(newVol);
    setIsMuted(false);
    if (howlRef.current) howlRef.current.volume(newVol);
  };

  const handleVolumeDown = () => {
    const newVol = Math.max(0, Math.round((volume - 0.05) * 100) / 100);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (howlRef.current) howlRef.current.volume(newVol);
  };

  // Live Track Metadata polling
  useEffect(() => {
    let isMounted = true;
    const loadMetadata = async () => {
      try {
        const data = await fetchLiveTrackMetadata(currentStation);
        if (isMounted && data.title) {
          setMetadata(data);
        }
      } catch {}
    };
    loadMetadata();
    const interval = setInterval(loadMetadata, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentStation]);

  // Spectrum Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const draw = () => {
      phase += 0.06;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const numBars = 20;
      const barWidth = w / numBars - 1.5;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 2;
        if (isPlaying) {
          const amp = Math.sin(phase * 1.8 + i * 0.5) * 0.5 + 0.5;
          const noise = Math.random() * 0.3;
          barHeight = Math.max(2, (amp * 0.8 + noise * 0.2) * (h - 2));
        }

        const grad = ctx.createLinearGradient(0, h, 0, h - barHeight);
        grad.addColorStop(0, '#00d9ff');
        grad.addColorStop(0.7, '#0284c7');
        grad.addColorStop(1, '#ffffff');

        ctx.fillStyle = grad;
        ctx.fillRect(i * (barWidth + 1.5), h - barHeight, barWidth, barHeight);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Proximity Chat Submission
  const handleSendProximityChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessage(chatMessage.trim(), 'text-cyan-400', true);
    setChatMessage('');
  };

  // Emojis reaction trigger
  const handleTriggerEmoji = (emoji: string) => {
    sendMessage(emoji, 'text-yellow-400', true);
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      x: 75 + Math.random() * 15,
      y: 70
    };
    setFloatingEmojis(prev => [...prev.slice(-8), newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  };

  // Toggle Post Like
  const handleToggleLike = (postId: string) => {
    setTrendingPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
          liked: !post.liked
        };
      }
      return post;
    }));
  };

  // Search stations
  const handleSearchStations = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchRadioStations(query, 20);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* FLOATING EMOJI PARTICLES                                 */}
      {/* ======================================================== */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            className="absolute text-2xl animate-bounce transition-all duration-1000 ease-out"
            style={{
              left: `${item.x}%`,
              bottom: `${item.y}%`,
              opacity: 0.95,
              filter: 'drop-shadow(0 0 8px rgba(0,217,255,0.8))'
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 1. MINIMIZED SLIM DOCK (Lower Right)                     */}
      {/* ======================================================== */}
      {isMinimized ? (
        <div className="fixed bottom-10 right-6 z-40 flex items-center gap-2.5 bg-[#0a1424]/95 border border-cyan-500/60 backdrop-blur-xl px-3.5 py-1.5 rounded-full shadow-[0_0_25px_rgba(0,217,255,0.4)] select-none animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-cyan-400 opacity-75' : 'bg-transparent'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-cyan-400 shadow-[0_0_8px_#00d9ff]' : 'bg-gray-500'}`} />
            </span>
            <span className="text-[11px] font-black tracking-widest text-cyan-300 font-mono">FOYER FM</span>
          </div>

          <span className="text-gray-600">|</span>

          <span className="text-[11px] font-mono text-cyan-200 truncate max-w-[120px]">
            {metadata.title}
          </span>

          <button
            onClick={handleTogglePlay}
            className="w-6 h-6 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/60 flex items-center justify-center text-cyan-300 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer"
          >
            <ChevronUp className="w-3 h-3 text-cyan-400" />
            <span>EXPAND</span>
          </button>
        </div>
      ) : (

        /* ======================================================== */
        /* 2. REASONABLE LOWER-RIGHT 1:1 CYBERNETIC DISC CONSOLE     */
        /* (350px x 350px, perfectly balanced, crisp & high-end)    */
        /* ======================================================== */
        <div className="fixed bottom-10 right-6 z-40 select-none animate-in fade-in zoom-in-95 duration-200">
          
          <div className="relative w-[345px] h-[345px] aspect-square flex items-center justify-center filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
            
            {/* ---------------------------------------------------- */}
            {/* LAYER A: HIGH-END ANODIZED BLUE/STEEL CHASSIS RING   */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-0 rounded-full border-[5px] border-[#223d60] shadow-[inset_0_2px_6px_rgba(255,255,255,0.4),0_0_30px_rgba(0,0,0,0.9)]"
              style={{
                background: 'conic-gradient(from 180deg at 50% 50%, #0d1e33 0deg, #1b3554 45deg, #0e2138 90deg, #264a75 135deg, #10243d 180deg, #1d395a 225deg, #0e2036 270deg, #284c78 315deg, #0d1e33 360deg)'
              }}
            />

            {/* WHITE COMPOSITE CLAMP BRACKETS (1:1 with Concept)   */}
            {/* Top-Right White Clamp */}
            <div className="absolute -top-1 right-9 w-20 h-6 rounded bg-gradient-to-b from-white via-slate-100 to-slate-300 border border-slate-400 shadow-lg transform rotate-25 z-10 flex items-center justify-between px-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-inner" />
              <div className="h-3 w-8 border-x border-slate-400/80 bg-slate-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-inner" />
            </div>

            {/* Bottom-Left White Clamp */}
            <div className="absolute -bottom-1 left-9 w-20 h-6 rounded bg-gradient-to-b from-white via-slate-100 to-slate-300 border border-slate-400 shadow-lg transform -rotate-25 z-10 flex items-center justify-between px-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-inner" />
              <div className="h-3 w-8 border-x border-slate-400/80 bg-slate-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shadow-inner" />
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER B: LUMINESCENT CYAN COOLING LOUVERS RING       */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-4 rounded-full border-2 border-[#122e50] bg-gradient-to-b from-[#0a1e36] to-[#040e1c] flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,217,255,0.3)]">
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-5 bg-gradient-to-t from-cyan-400 to-[#0284c7] rounded-xs shadow-[0_0_6px_#00e1ff]"
                  style={{
                    transform: `rotate(${i * 20}deg) translateY(-145px)`,
                    opacity: isPlaying ? 0.95 : 0.35
                  }}
                />
              ))}
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER C: INSET BRUSHED ALUMINUM BEZEL                */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-8 rounded-full border-[3px] border-[#415a78] shadow-[inset_0_3px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(0,0,0,0.8)]"
              style={{
                background: 'conic-gradient(from 0deg at 50% 50%, #9cb2c9 0deg, #d3e1f0 90deg, #7c93ab 180deg, #d3e1f0 270deg, #9cb2c9 360deg)'
              }}
            />

            {/* ---------------------------------------------------- */}
            {/* LAYER D: CENTRAL DIGITAL LCD SCREEN                  */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-11 rounded-full bg-gradient-to-b from-[#0e243d] via-[#071626] to-[#030a13] border border-cyan-400/50 shadow-[inset_0_0_30px_rgba(0,217,255,0.25)] flex flex-col items-center justify-between p-3.5 text-white overflow-hidden z-10 font-sans">
              
              {/* Scanline Texture Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />

              {/* REAL WORKING CLOCK & LIVE HD STATUS (NO PLACEHOLDERS) */}
              <div className="w-full px-3 flex items-center justify-between border-b border-cyan-500/25 pb-0.5 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-base font-black text-cyan-300 tracking-wider drop-shadow-[0_0_6px_#00e1ff]">
                    {liveClock || '08:52:10'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-right font-mono text-[9px]">
                  <span className={`px-1 py-0.2 rounded font-bold uppercase tracking-wider ${isPlaying ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'}`}>
                    {isPlaying ? 'LIVE 320K' : 'STANDBY'}
                  </span>
                  <span className="text-cyan-400/70 font-semibold">42MS</span>
                </div>
              </div>

              {/* DYNAMIC SCROLLING MARQUEE BANNER */}
              <div className="w-full px-2 py-0.5 bg-[#081829]/90 border border-cyan-500/30 rounded text-center overflow-hidden z-10 my-0.5">
                <div className="font-mono text-[11px] font-black text-cyan-200 tracking-wide truncate drop-shadow-[0_0_5px_rgba(0,217,255,0.6)]">
                  {metadata.title} - {metadata.artist} ▶
                </div>
              </div>

              {/* AUDIO SPECTRUM CANVAS BAR */}
              <div className="w-full px-2 h-3 z-10">
                <canvas ref={canvasRef} width={200} height={12} className="w-full h-full" />
              </div>

              {/* ---------------------------------------------------- */}
              {/* DYNAMIC MIDDLE CONTENT AREA: MINIMAP, FEEDS, CHAT    */}
              {/* ---------------------------------------------------- */}
              <div className="w-full flex-1 max-h-[120px] overflow-hidden my-0.5 rounded bg-[#05111e]/90 border border-cyan-500/30 p-1.5 flex flex-col z-10">
                
                {/* 1. TACTICAL RADAR MINIMAP (Item requested by user!) */}
                {activeTab === 'minimap' && (
                  <div className="flex-1 relative rounded-full overflow-hidden flex items-center justify-center bg-[#040e1a] border border-cyan-500/40">
                    {/* Concentric distance rings */}
                    <div className="absolute inset-2 border border-cyan-500/20 rounded-full" />
                    <div className="absolute inset-5 border border-cyan-500/20 rounded-full" />
                    <div className="absolute inset-8 border border-cyan-500/15 rounded-full" />
                    
                    {/* Compass Axis Lines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-cyan-500/20" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-full w-[1px] bg-cyan-500/20" />
                    </div>

                    {/* North Cardinal Pointer */}
                    <span className="absolute top-0.5 font-mono text-[8px] font-black text-cyan-400">N</span>

                    {/* Rotating Radar Sweep Cone */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/25 via-transparent to-transparent rounded-full animate-spin duration-3000 pointer-events-none" />

                    {/* Player Center Blip */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_8px_#00e1ff]" />
                    </div>

                    {/* POI Blips */}
                    <div className="absolute top-3 right-6 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_6px_#ec4899]" />
                      <span className="text-[7px] font-mono text-pink-300">HUB</span>
                    </div>

                    <div className="absolute bottom-4 left-6 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15]" />
                      <span className="text-[7px] font-mono text-yellow-300">VAULT</span>
                    </div>

                    {/* Multiplayer Citizen Peer Dots */}
                    {Array.from(players.values()).slice(0, 4).map((p, i) => (
                      <div
                        key={p.peerId || i}
                        className="absolute w-2 h-2 rounded-full bg-emerald-400 border border-white shadow-[0_0_6px_#10b981]"
                        style={{
                          top: `${25 + (i * 18)}%`,
                          left: `${30 + (i * 15)}%`
                        }}
                        title={p.username || 'Citizen'}
                      />
                    ))}

                    {/* Coordinates & District HUD */}
                    <div className="absolute bottom-1 right-2 text-[7px] font-mono text-cyan-300/80 bg-black/60 px-1 rounded border border-cyan-500/30">
                      42.8N, 71.4W
                    </div>
                  </div>
                )}

                {/* 2. TRENDING FOYER SOCIAL FEED (WITH WORKING LIKES) */}
                {activeTab === 'trending' && (
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin text-[9.5px]">
                    {trendingPosts.map(post => (
                      <div key={post.id} className="p-1.5 rounded bg-[#091a2d]/80 border border-cyan-500/30 hover:border-cyan-400/60 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 font-bold text-cyan-300">
                            <span>{post.handle}</span>
                            <span className="text-gray-500 text-[8px] font-normal">{post.time}</span>
                          </div>
                          <button
                            onClick={() => handleToggleLike(post.id)}
                            className="flex items-center gap-0.5 text-pink-400 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Heart className={`w-2.5 h-2.5 ${post.liked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`} />
                            <span className="text-[8px]">{post.likes}</span>
                          </button>
                        </div>
                        <p className="text-gray-200 mt-0.5 leading-snug">{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. REAL CIVIC PROTOCOL NEWS TICKER */}
                {activeTab === 'news' && (
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin text-[9.5px]">
                    <div className="p-1.5 rounded bg-[#091a2d]/80 border border-cyan-500/30">
                      <div className="flex items-center gap-1 text-cyan-400 font-bold uppercase text-[8px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>P2P MESH v2.4 DEPLOYED</span>
                      </div>
                      <p className="text-gray-200 mt-0.5 leading-snug">Sub-50ms latency established across decentralized regional nodes.</p>
                    </div>

                    <div className="p-1.5 rounded bg-[#091a2d]/80 border border-cyan-500/30">
                      <div className="flex items-center gap-1 text-emerald-400 font-bold uppercase text-[8px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>COMMUNITY TREASURY SYNC</span>
                      </div>
                      <p className="text-gray-200 mt-0.5 leading-snug">+250 CVT distributed to high-bandwidth streaming node operators.</p>
                    </div>

                    <div className="p-1.5 rounded bg-[#091a2d]/80 border border-cyan-500/30">
                      <div className="flex items-center gap-1 text-yellow-400 font-bold uppercase text-[8px]">
                        <span>DISPATCH NOTICE</span>
                      </div>
                      <p className="text-gray-200 mt-0.5 leading-snug">Verified CivicWatch missions available in the Vault portal.</p>
                    </div>
                  </div>
                )}

                {/* 4. REAL MULTIPLAYER PROXIMITY CHAT & INPUT */}
                {activeTab === 'proximity' && (
                  <div className="flex-1 flex flex-col overflow-hidden text-[9px]">
                    <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 font-mono scrollbar-thin">
                      {chatHistory.slice(-5).map(msg => (
                        <div key={msg.id} className="leading-tight break-words">
                          <span className={`font-bold mr-1 ${msg.color || 'text-cyan-400'}`}>{msg.username}:</span>
                          <span className="text-gray-200">{msg.text}</span>
                          <span className="ml-1 text-[7px] text-fuchsia-300 font-normal">[Nearby]</span>
                        </div>
                      ))}
                      {chatHistory.length === 0 && (
                        <p className="text-gray-500 italic text-center py-2">No nearby messages yet. Say hello!</p>
                      )}
                    </div>

                    {/* Proximity Chat Input */}
                    <form onSubmit={handleSendProximityChat} className="mt-1 flex gap-1 pt-1 border-t border-cyan-500/20">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        placeholder="Say to nearby citizens..."
                        className="flex-1 bg-[#081524] border border-cyan-500/40 rounded px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button type="submit" className="px-1.5 py-0.5 bg-cyan-500/30 border border-cyan-400 rounded text-cyan-300 hover:bg-cyan-500/50 cursor-pointer">
                        <Send className="w-2.5 h-2.5" />
                      </button>
                    </form>
                  </div>
                )}

                {/* 5. INTERACTIVE EMOJIS REACTION PAD */}
                {activeTab === 'emojis' && (
                  <div className="flex-1 flex flex-wrap items-center justify-center gap-1 p-1">
                    {['🔥', '💎', '🚀', '⚡', '🛡️', '🌐', '❤️', '🎉', '👽', '🎧', '🕹️', '👾'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleTriggerEmoji(emoji)}
                        className="text-base p-1 rounded hover:bg-cyan-500/20 hover:scale-125 transition-transform cursor-pointer"
                        title="Broadcast reaction"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* REPLACING "GODOT" WITH "FOYER FM" (1:1 with Concept Item 14) */}
              <div className="w-full pb-0.5 flex items-center justify-center gap-1.5 border-t border-cyan-500/30 pt-1 z-10">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="font-black text-xs tracking-widest text-cyan-300 drop-shadow-[0_0_8px_#00e1ff]">
                  FOYER FM
                </span>
                <span className="text-[8px] font-mono text-cyan-400/80 uppercase">AUDIO WIZARD</span>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER E: STREAMLINED LEFT TRANSPORT POD (NO REC)     */}
            {/* User instruction: Remove REC, make smaller & sleeker */}
            {/* ---------------------------------------------------- */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-24 h-48 bg-gradient-to-r from-[#111e2e] to-[#1a2c42] border-2 border-[#2c435e] rounded-xl shadow-2xl p-1.5 flex flex-col justify-between z-20 font-mono text-[8px]">
              
              {/* ▲ OPEN (STATION SELECTOR / EXPANDER - Item 24) */}
              <button
                onClick={() => setShowStationDrawer(true)}
                className="w-full py-1 bg-gradient-to-r from-cyan-600/50 to-blue-600/50 hover:from-cyan-500/70 hover:to-blue-500/70 border border-cyan-400 rounded text-cyan-200 font-black text-center tracking-wider shadow-[0_0_8px_rgba(0,217,255,0.4)] cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                title="Open Foyer FM Station Selector (Curated & 60,000+)"
              >
                <span>▲ OPEN</span>
              </button>

              {/* Repeat & Random pills */}
              <div className="grid grid-cols-2 gap-1 my-0.5">
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`py-0.5 rounded border text-[7px] text-center transition-all ${
                    isRepeat ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold' : 'bg-[#0a1420] border-white/10 text-gray-500'
                  }`}
                >
                  REP
                </button>
                <button
                  onClick={() => setIsRandom(!isRandom)}
                  className={`py-0.5 rounded border text-[7px] text-center transition-all ${
                    isRandom ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold' : 'bg-[#0a1420] border-white/10 text-gray-500'
                  }`}
                >
                  SHUF
                </button>
              </div>

              {/* Main Transport Deck */}
              <div className="space-y-1 my-1">
                {/* PLAY / PAUSE */}
                <button
                  onClick={handleTogglePlay}
                  className="w-full py-1.5 bg-[#0b1624] hover:bg-cyan-500/30 border border-cyan-400 rounded flex items-center justify-center text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,217,255,0.3)] active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  <span className="ml-1 text-[8px]">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                {/* STOP */}
                <button
                  onClick={handleStop}
                  className="w-full py-1 bg-[#0b1624] hover:bg-red-500/20 border border-red-500/40 rounded flex items-center justify-center text-red-400 font-bold active:scale-95 cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span className="ml-1 text-[7px]">STOP</span>
                </button>
              </div>

              {/* PREV / NEXT */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={handlePrevStation}
                  className="py-1 bg-[#0b1624] hover:bg-white/10 border border-white/20 rounded flex items-center justify-center text-gray-300 active:scale-95 cursor-pointer"
                  title="Previous Station"
                >
                  <SkipBack className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={handleNextStation}
                  className="py-1 bg-[#0b1624] hover:bg-white/10 border border-white/20 rounded flex items-center justify-center text-gray-300 active:scale-95 cursor-pointer"
                  title="Next Station"
                >
                  <SkipForward className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Sleek Format Tag */}
              <div className="pt-0.5 border-t border-white/10 text-[7px] text-cyan-400/80 text-center font-bold">
                FOYER • 320K
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER F: RIGHT PERIMETER TABS (MINIMAP, TRENDING...) */}
            {/* User instruction: Put Minimap above Trending!        */}
            {/* ---------------------------------------------------- */}
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20 font-mono text-[8px] font-bold">
              
              {/* Tab 1: 🗺️ MINIMAP (Placed ABOVE Trending per user!) */}
              <button
                onClick={() => setActiveTab('minimap')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'minimap'
                    ? 'bg-cyan-500/35 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,217,255,0.4)]'
                    : 'bg-[#101e30]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>🗺️ MINIMAP</span>
              </button>

              {/* Tab 2: 🔥 TRENDING */}
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'trending'
                    ? 'bg-cyan-500/35 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,217,255,0.4)]'
                    : 'bg-[#101e30]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>🔥 TRENDING</span>
              </button>

              {/* Tab 3: 📰 CIVIC NEWS */}
              <button
                onClick={() => setActiveTab('news')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'news'
                    ? 'bg-cyan-500/35 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,217,255,0.4)]'
                    : 'bg-[#101e30]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>📰 NEWS</span>
              </button>

              {/* Tab 4: 💬 PROX CHAT */}
              <button
                onClick={() => setActiveTab('proximity')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'proximity'
                    ? 'bg-cyan-500/35 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,217,255,0.4)]'
                    : 'bg-[#101e30]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>💬 CHAT</span>
              </button>

              {/* Tab 5: ✨ EMOJIS */}
              <button
                onClick={() => setActiveTab('emojis')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'emojis'
                    ? 'bg-cyan-500/35 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,217,255,0.4)]'
                    : 'bg-[#101e30]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>✨ EMOJIS</span>
              </button>

              {/* VOLUME ROCKER (- / +) */}
              <div className="flex items-center justify-between bg-[#0b1624] border border-cyan-500/40 rounded px-1.5 py-0.5 text-cyan-300">
                <button onClick={handleVolumeDown} className="p-0.5 hover:text-white cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                <span className="text-[7px]">{Math.round(volume * 100)}%</span>
                <button onClick={handleVolumeUp} className="p-0.5 hover:text-white cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
              </div>

              {/* MINIMIZE HUD BUTTON */}
              <button
                onClick={() => setIsMinimized(true)}
                className="px-2.5 py-0.5 rounded-r-lg bg-white/5 hover:bg-white/15 border-y border-r border-white/10 text-gray-400 hover:text-white text-left transition-all cursor-pointer flex items-center gap-1"
                title="Minimize Console to Dock"
              >
                <ChevronDown className="w-2.5 h-2.5" />
                <span className="text-[7px]">MIN</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. STATIONS & CHANNEL EXPANDER DRAWER (Via ▲ OPEN)       */}
      {/* ======================================================== */}
      {showStationDrawer && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#091422] border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_40px_rgba(0,217,255,0.4)] overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-3.5 bg-gradient-to-r from-[#0d2238] to-[#163656] border-b border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="font-black text-xs tracking-widest text-white uppercase">
                  FOYER FM • STATION SELECTOR
                </span>
                <span className="text-[9px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono">60,000+ STATIONS</span>
              </div>
              <button onClick={() => setShowStationDrawer(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 bg-[#06101c] border-b border-cyan-500/20">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchStations(e.target.value)}
                  placeholder="Search station name, genre (e.g. Synthwave, Lofi, Cyberpunk, SomaFM)..."
                  className="w-full bg-[#0a1829] border border-cyan-500/40 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Genre Quick Filters */}
              <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 text-[10px] font-mono">
                {['ALL', 'SYNTH', 'VAPOR', 'LOFI', 'HACK', 'CHILL', 'AMBIENT'].map(genre => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre.toLowerCase());
                      if (genre !== 'ALL') handleSearchStations(genre.toLowerCase());
                      else setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded-full border transition-all ${
                      selectedGenre === genre.toLowerCase()
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Stations Result List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-[48vh] scrollbar-thin">
              {(searchQuery.trim() ? searchResults : FOYER_STATIONS).map((station, idx) => (
                <div
                  key={station.id}
                  onClick={() => {
                    setActiveStationIndex(idx);
                    playStation(station);
                    setShowStationDrawer(false);
                  }}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    currentStation.id === station.id && isPlaying
                      ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,217,255,0.25)]'
                      : 'bg-[#0a1829]/70 border-[#23354d] text-gray-300 hover:bg-[#10243b] hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <Music className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{station.name}</h4>
                      <p className="text-[9px] text-gray-400">{station.description || station.tags?.slice(0, 3).join(' • ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {station.bitrate ? `${station.bitrate}k` : '320k'}
                    </span>
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
