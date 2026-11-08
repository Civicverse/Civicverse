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
  Music,
  Settings,
  Sliders,
  RotateCcw,
  Zap,
  Info,
  Layers,
  Wrench
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
import { CIVICVERSE_LOGO } from '../assets/logo';

type FoyerTabMode = 'minimap' | 'trending' | 'news' | 'proximity' | 'emojis' | 'settings';

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

  // Scale Percentage State (Defaults to 55% / Half-size)
  const [scalePercent, setScalePercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('civicverse_foyer_fm_scale');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 35 && parsed <= 140) return parsed;
      }
    } catch {}
    return 55; // 55% default half-size
  });

  const handleUpdateScale = (val: number) => {
    setScalePercent(val);
    try {
      localStorage.setItem('civicverse_foyer_fm_scale', val.toString());
    } catch {}
  };

  // Auto-Scroll Speed State (px/second, defaults to 30 px/s)
  const [scrollSpeed, setScrollSpeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('civicverse_foyer_scroll_speed');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 120) return parsed;
      }
    } catch {}
    return 30; // 30 px/s normal default
  });

  const handleUpdateScrollSpeed = (val: number) => {
    setScrollSpeed(val);
    try {
      localStorage.setItem('civicverse_foyer_scroll_speed', val.toString());
    } catch {}
  };

  // Auto-scroll mechanics with hover-pause
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const [isFeedHovered, setIsFeedHovered] = useState<boolean>(false);
  const scrollAccumulatorRef = useRef<number>(0);

  // Reset accumulator on tab change
  useEffect(() => {
    scrollAccumulatorRef.current = 0;
  }, [activeTab]);

  useEffect(() => {
    if (scrollSpeed <= 0) return;

    let animId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const deltaSec = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!isFeedHovered && feedScrollRef.current) {
        const el = feedScrollRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;

        if (maxScroll > 4) {
          scrollAccumulatorRef.current += scrollSpeed * deltaSec;
          if (scrollAccumulatorRef.current >= 1) {
            const pxToScroll = Math.floor(scrollAccumulatorRef.current);
            scrollAccumulatorRef.current -= pxToScroll;

            if (el.scrollTop >= maxScroll - 1) {
              // Smooth loop back to top
              el.scrollTop = 0;
            } else {
              el.scrollTop += pxToScroll;
            }
          }
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [scrollSpeed, isFeedHovered, activeTab]);

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
      avatar: './images/streamer_metamike.jpg',
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
    },
    {
      id: 'post-5',
      author: 'KokomoRunner',
      handle: '@Kokomo',
      time: '34m ago',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kokomo',
      content: 'Local Kokomo node synchronization verified. Monero micro-dividends credited to citizen vault.',
      likes: 57,
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
        onloaderror: (_id, err) => {
          console.warn('[FoyerFM] Stream error, fallbacking:', err);
          setPlaybackState('error');
        }
      });

      howlRef.current = sound;
      sound.play();
    } catch (err) {
      console.error('[FoyerFM] Howl init failed:', err);
      setPlaybackState('error');
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      if (howlRef.current) howlRef.current.pause();
      setIsPlaying(false);
    } else {
      if (howlRef.current) {
        howlRef.current.play();
        setIsPlaying(true);
      } else {
        playStation(currentStation);
      }
    }
  };

  const handleStop = () => {
    if (howlRef.current) {
      howlRef.current.stop();
    }
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
    const newVol = Math.min(1, volume + 0.1);
    setVolume(newVol);
    if (howlRef.current) howlRef.current.volume(newVol);
  };

  const handleVolumeDown = () => {
    const newVol = Math.max(0, volume - 0.1);
    setVolume(newVol);
    if (howlRef.current) howlRef.current.volume(newVol);
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
      const results = await searchRadioStations(query);
      setSearchResults(results.slice(0, 25));
    } catch (e) {
      console.warn('Radio search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Interactive like on trending post
  const handleToggleLike = (postId: string) => {
    setTrendingPosts(prev => prev.map(p => {
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

  // Proximity chat send
  const handleSendProximityChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessage(chatMessage.trim(), 'text-cyan-300', true);
    setChatMessage('');
  };

  // Emoji burst trigger
  const handleTriggerEmoji = (emoji: string) => {
    sendMessage(emoji, 'text-pink-400', true);
    const id = Date.now() + Math.random();
    setFloatingEmojis(prev => [...prev, { id, emoji, x: 50 + (Math.random() * 40 - 20), y: 80 }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2200);
  };

  // Audio spectrum visualizer canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 28;
      const barWidth = canvas.width / bars - 1;

      for (let i = 0; i < bars; i++) {
        let height = 2;
        if (isPlaying) {
          const s = Math.sin(phase + i * 0.45) * 0.5 + 0.5;
          const c = Math.cos(phase * 1.5 + i * 0.25) * 0.5 + 0.5;
          height = Math.max(2, (s * 0.6 + c * 0.4) * (canvas.height - 2));
        }

        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.6, '#00e5ff');
        grad.addColorStop(1, '#a5f3fc');

        ctx.fillStyle = grad;
        ctx.fillRect(i * (barWidth + 1), canvas.height - height, barWidth, height);
      }

      phase += isPlaying ? 0.12 : 0.02;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <>
      {/* Floating Emojis */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map(item => (
          <div
            key={item.id}
            className="absolute text-2xl animate-float-up"
            style={{ left: `${item.x}%`, bottom: `${100 - item.y}%` }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* MINIMIZED DOCK PILL (When user clicks MIN) */}
      {isMinimized ? (
        <div 
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-3 right-6 z-40 bg-gradient-to-r from-[#091524] via-[#10243b] to-[#091524] border-2 border-cyan-400/80 rounded-full px-3.5 py-1.5 flex items-center gap-2.5 shadow-[0_0_25px_rgba(0,217,255,0.5),0_8px_20px_rgba(0,0,0,0.8)] cursor-pointer hover:scale-105 transition-transform"
          title="Restore Godot Mixmaster (Foyer FM Console)"
        >
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
            <Radio className="w-3 h-3 text-cyan-300 animate-pulse" />
          </div>
          <span className="font-mono text-xs font-black text-cyan-200 tracking-wider">
            FOYER FM • {isPlaying ? 'LIVE 320K' : 'STANDBY'}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">[{liveClock}]</span>
          <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      ) : (

        /* ======================================================== */
        /* FULL GODOT MIXMASTER (FOYER FM) HUD CONSOLE              */
        /* 1:1 High-End Render Replica matching webp visual concept */
        /* ======================================================== */
        <div 
          className="fixed z-30 pointer-events-auto select-none transition-transform"
          style={{
            bottom: '12px',
            right: '48px', // Shifted left per instructions
            transform: `scale(${scalePercent / 100})`,
            transformOrigin: 'bottom right'
          }}
        >
          {/* Main 430px Circular Chassis Container */}
          <div className="relative w-[430px] h-[430px] flex items-center justify-center drop-shadow-[0_24px_50px_rgba(0,0,0,0.92)]">
            
            {/* ---------------------------------------------------- */}
            {/* LAYER A: OUTER SEGMENTED CHAMFERED WHITE ARMOR RING  */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-0 rounded-full border-[3px] border-[#93a8c0] shadow-[0_20px_45px_rgba(0,0,0,0.95),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-4px_8px_rgba(0,0,0,0.45)]"
              style={{
                background: 'radial-gradient(circle at 45% 35%, #ffffff 0%, #edf3f8 45%, #d1dde8 75%, #a8bccd 100%)'
              }}
            />

            {/* Futuristic Panel Seams / Hard-Surface Notches */}
            <div className="absolute inset-0 rounded-full pointer-events-none">
              {/* Top visor seam */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#768c9f] to-transparent opacity-60" />
              {/* Bottom intake vent seam */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-40 h-1.5 bg-gradient-to-r from-transparent via-[#5a7288] to-transparent opacity-80" />
            </div>

            {/* Segmented Armor Plates Overlays */}
            {/* Top-Right White Armor Plate Arch */}
            <div className="absolute -top-1.5 right-12 w-28 h-8 rounded-t-lg bg-gradient-to-b from-white via-slate-100 to-slate-300 border-t-2 border-x border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_3px_rgba(255,255,255,1)] transform rotate-18 z-10 flex items-center justify-around px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-300 shadow-inner" />
              <div className="h-3 w-10 border-x border-slate-400 bg-slate-200/80 shadow-inner" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-300 shadow-inner" />
            </div>

            {/* Bottom-Right White Armor Plate Arch */}
            <div className="absolute -bottom-1.5 right-14 w-28 h-8 rounded-b-lg bg-gradient-to-t from-white via-slate-100 to-slate-300 border-b-2 border-x border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_3px_rgba(255,255,255,1)] transform -rotate-18 z-10 flex items-center justify-around px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-300 shadow-inner" />
              <div className="h-3 w-10 border-x border-slate-400 bg-slate-200/80 shadow-inner" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-300 shadow-inner" />
            </div>

            {/* Bottom-Left White Clamp */}
            <div className="absolute -bottom-1 left-9 w-22 h-7 rounded bg-gradient-to-b from-white via-slate-100 to-slate-300 border border-slate-400 shadow-[0_4px_12px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.9)] transform -rotate-25 z-10 flex items-center justify-between px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center text-[5px] text-white font-mono">+</span>
              <div className="h-3.5 w-10 border-x border-slate-400/80 bg-slate-200/60 shadow-inner" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center text-[5px] text-white font-mono">+</span>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER B: LUMINESCENT CYAN COOLING LOUVERS RING       */}
            {/* Deep Cobalt Trench with 24 Radial Turbine Blades    */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-5 rounded-full border-2 border-[#122e50] bg-gradient-to-b from-[#0a1e36] to-[#040e1c] flex items-center justify-center overflow-hidden shadow-[inset_0_0_30px_rgba(0,217,255,0.45)]">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-6 bg-gradient-to-t from-cyan-400 to-[#0284c7] rounded-xs shadow-[0_0_8px_#00e1ff,0_0_16px_rgba(0,225,255,0.6)]"
                  style={{
                    transform: `rotate(${i * 15}deg) translateY(-145px)`,
                    opacity: isPlaying ? 0.95 : 0.4
                  }}
                />
              ))}
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER C: INSET HEAVY BRUSHED STAINLESS STEEL BEZEL   */}
            {/* Multi-stop anisotropic conic gradient reflections    */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-9 rounded-full border-[3px] border-[#374e69] shadow-[inset_0_4px_10px_rgba(0,0,0,0.95),inset_0_-3px_5px_rgba(255,255,255,0.7),0_0_18px_rgba(0,0,0,0.85)]"
              style={{
                background: 'conic-gradient(from 45deg at 50% 50%, #5a738e 0%, #d4e4f2 22%, #ffffff 38%, #5d7895 55%, #c8ddf0 72%, #ffffff 88%, #5a738e 100%)'
              }}
            >
              {/* Four Cardinal Alignment Rivets / Indents */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 border border-white/60 shadow-inner" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 border border-white/60 shadow-inner" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 border border-white/60 shadow-inner" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 border border-white/60 shadow-inner" />
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER D: CENTRAL DIGITAL LCD SCREEN MONITOR          */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-12 rounded-full bg-gradient-to-b from-[#0e243d] via-[#071626] to-[#030a13] border-2 border-cyan-400/60 shadow-[inset_0_0_35px_rgba(0,217,255,0.35),inset_0_2px_8px_rgba(0,0,0,0.95)] flex flex-col items-center justify-between p-3.5 text-white overflow-hidden z-10 font-sans">
              
              {/* Glass Glare & Scanline Texture Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.035)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />

              {/* REAL WORKING CLOCK & LIVE HD STATUS (Item 11 in render) */}
              <div className="w-full px-3 flex items-center justify-between border-b border-cyan-500/25 pb-0.5 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-base font-black text-cyan-300 tracking-wider drop-shadow-[0_0_6px_#00e1ff]">
                    {liveClock || '09:24:00'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-right font-mono text-[9px]">
                  <span className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${isPlaying ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 shadow-[0_0_6px_rgba(16,185,129,0.3)]' : 'bg-gray-800 text-gray-400'}`}>
                    {isPlaying ? 'STEREO 320K' : 'STANDBY'}
                  </span>
                  <span className="text-cyan-400/80 font-semibold">42MS</span>
                </div>
              </div>

              {/* DYNAMIC SCROLLING MARQUEE BANNER */}
              <div className="w-full px-2 py-0.5 bg-[#081829]/95 border border-cyan-500/35 rounded text-center overflow-hidden z-10 my-0.5">
                <div className="font-mono text-[11px] font-black text-cyan-200 tracking-wide truncate drop-shadow-[0_0_5px_rgba(0,217,255,0.6)]">
                  {metadata.title} - {metadata.artist} ▶
                </div>
              </div>

              {/* AUDIO SPECTRUM CANVAS BAR */}
              <div className="w-full px-2 h-3 z-10">
                <canvas ref={canvasRef} width={220} height={12} className="w-full h-full" />
              </div>

              {/* ---------------------------------------------------- */}
              {/* DYNAMIC MIDDLE CONTENT AREA + RIGHT ACTION COLUMN   */}
              {/* Incorporates Item 15a action column from the render! */}
              {/* ---------------------------------------------------- */}
              <div className="w-full flex-1 max-h-[128px] overflow-hidden my-0.5 rounded bg-[#05111e]/90 border border-cyan-500/35 p-1 flex gap-1 z-10">
                
                {/* Main Content Pane */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* 1. TACTICAL RADAR MINIMAP */}
                  {activeTab === 'minimap' && (
                    <div className="flex-1 relative rounded-full overflow-hidden flex items-center justify-center bg-[#040e1a] border border-cyan-500/40">
                      {/* Concentric distance rings */}
                      <div className="absolute inset-2 border border-cyan-500/25 rounded-full" />
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
                      <div className="absolute bottom-1 right-2 text-[7px] font-mono text-cyan-300/90 bg-black/70 px-1 rounded border border-cyan-500/30">
                        42.8N, 71.4W
                      </div>
                    </div>
                  )}

                  {/* 2. TRENDING FOYER SOCIAL FEED (WITH WORKING AUTO-SCROLL & LIKES) */}
                  {activeTab === 'trending' && (
                    <div 
                      ref={feedScrollRef}
                      onMouseEnter={() => setIsFeedHovered(true)}
                      onMouseLeave={() => setIsFeedHovered(false)}
                      onTouchStart={() => setIsFeedHovered(true)}
                      onTouchEnd={() => setTimeout(() => setIsFeedHovered(false), 1500)}
                      className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin text-[9.5px] select-text"
                    >
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

                  {/* 3. REAL CIVIC PROTOCOL NEWS TICKER (WITH WORKING AUTO-SCROLL) */}
                  {activeTab === 'news' && (
                    <div 
                      ref={feedScrollRef}
                      onMouseEnter={() => setIsFeedHovered(true)}
                      onMouseLeave={() => setIsFeedHovered(false)}
                      onTouchStart={() => setIsFeedHovered(true)}
                      onTouchEnd={() => setTimeout(() => setIsFeedHovered(false), 1500)}
                      className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin text-[9.5px] select-text"
                    >
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

                      <div className="p-1.5 rounded bg-[#091a2d]/80 border border-cyan-500/30">
                        <div className="flex items-center gap-1 text-fuchsia-400 font-bold uppercase text-[8px]">
                          <span>FOYER FM MULTICAST</span>
                        </div>
                        <p className="text-gray-200 mt-0.5 leading-snug">Decentralized audio wizard online. Auto-scroll streaming active.</p>
                      </div>
                    </div>
                  )}

                  {/* 4. REAL MULTIPLAYER PROXIMITY CHAT & INPUT (WITH WORKING AUTO-SCROLL) */}
                  {activeTab === 'proximity' && (
                    <div className="flex-1 flex flex-col overflow-hidden text-[9px]">
                      <div 
                        ref={feedScrollRef}
                        onMouseEnter={() => setIsFeedHovered(true)}
                        onMouseLeave={() => setIsFeedHovered(false)}
                        onTouchStart={() => setIsFeedHovered(true)}
                        onTouchEnd={() => setTimeout(() => setIsFeedHovered(false), 1500)}
                        className="flex-1 overflow-y-auto space-y-1 pr-0.5 font-mono scrollbar-thin select-text"
                      >
                        {chatHistory.slice(-8).map(msg => (
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

                  {/* 6. SETTINGS HUD (SCALE ADJUSTER + AUTO-SCROLL SPEED SELECTOR) */}
                  {activeTab === 'settings' && (
                    <div className="flex-1 flex flex-col justify-between p-1 text-[8.5px] font-mono overflow-y-auto scrollbar-thin">
                      <div className="space-y-1.5">
                        
                        {/* Setting 1: HUD SCALE % */}
                        <div>
                          <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-cyan-500/25 pb-0.5">
                            <span>HUD SCALE</span>
                            <span className="text-white bg-cyan-500/30 px-1 py-0.2 rounded border border-cyan-400 font-bold">
                              {scalePercent}%
                            </span>
                          </div>

                          <div className="pt-1">
                            <input
                              type="range"
                              min="40"
                              max="130"
                              step="5"
                              value={scalePercent}
                              onChange={e => handleUpdateScale(parseInt(e.target.value, 10))}
                              className="w-full h-1.5 bg-[#0a1829] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                            <div className="grid grid-cols-4 gap-1 mt-1">
                              {[
                                { label: '45% Mini', val: 45 },
                                { label: '55% Def', val: 55 },
                                { label: '75% Mid', val: 75 },
                                { label: '100% Max', val: 100 },
                              ].map(p => (
                                <button
                                  key={p.val}
                                  onClick={() => handleUpdateScale(p.val)}
                                  className={`py-0.5 rounded border text-[7px] transition-all cursor-pointer ${
                                    scalePercent === p.val
                                      ? 'bg-cyan-500/40 border-cyan-400 text-white font-bold shadow-[0_0_8px_rgba(0,217,255,0.4)]'
                                      : 'bg-[#0a1829] border-white/10 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Setting 2: AUTO-SCROLL SPEED SELECTOR (User Requirement!) */}
                        <div className="pt-1 border-t border-cyan-500/25">
                          <div className="flex items-center justify-between text-cyan-300 font-bold pb-0.5">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${scrollSpeed > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                              <span>AUTO-SCROLL SPEED</span>
                            </div>
                            <span className={`px-1 py-0.2 rounded border font-bold ${scrollSpeed > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                              {scrollSpeed > 0 ? `${scrollSpeed} px/s` : 'OFF'}
                            </span>
                          </div>

                          <div className="pt-0.5">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={scrollSpeed}
                              onChange={e => handleUpdateScrollSpeed(parseInt(e.target.value, 10))}
                              className="w-full h-1.5 bg-[#0a1829] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                            />
                            
                            {/* Quick speed preset buttons */}
                            <div className="grid grid-cols-5 gap-0.5 mt-1">
                              {[
                                { label: 'OFF', val: 0 },
                                { label: 'SLOW', val: 15 },
                                { label: 'NORM', val: 30 },
                                { label: 'FAST', val: 60 },
                                { label: 'HYPER', val: 90 },
                              ].map(s => (
                                <button
                                  key={s.val}
                                  onClick={() => handleUpdateScrollSpeed(s.val)}
                                  className={`py-0.5 rounded border text-[6.5px] transition-all cursor-pointer ${
                                    scrollSpeed === s.val
                                      ? 'bg-emerald-500/40 border-emerald-400 text-emerald-200 font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                      : 'bg-[#0a1829] border-white/10 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className="pt-1 mt-1 border-t border-cyan-500/20 flex items-center justify-between text-[7px] text-gray-400">
                        <span>FEEDS: AUTO-LOOP ON</span>
                        <span className="text-emerald-400">P2P HD AUDIO</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right LCD Action Buttons Stack (Item 15a in render) */}
                <div className="w-8 flex flex-col justify-between py-0.5 border-l border-cyan-500/30 pl-1 font-mono text-[7px] font-bold text-cyan-300">
                  <button 
                    onClick={() => setShowStationDrawer(true)}
                    className="p-0.5 rounded bg-[#091726] border border-cyan-500/30 hover:bg-cyan-500/30 text-center hover:text-white transition-all cursor-pointer"
                    title="Add station"
                  >
                    ADD
                  </button>
                  <button 
                    onClick={() => {
                      if (activeTab === 'proximity') useMultiplayerStore.setState({ chatHistory: [] });
                    }}
                    className="p-0.5 rounded bg-[#091726] border border-cyan-500/30 hover:bg-cyan-500/30 text-center hover:text-white transition-all cursor-pointer"
                    title="Clear chat"
                  >
                    CLR
                  </button>
                  <button 
                    onClick={() => setShowStationDrawer(true)}
                    className="p-0.5 rounded bg-[#091726] border border-cyan-500/30 hover:bg-cyan-500/30 text-center hover:text-white transition-all cursor-pointer"
                    title="Load stations"
                  >
                    LOAD
                  </button>
                  {/* AUTO-SCROLL QUICK TOGGLE BUTTON (Item requested by user!) */}
                  <button 
                    onClick={() => handleUpdateScrollSpeed(scrollSpeed > 0 ? 0 : 30)}
                    className={`p-0.5 rounded border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      scrollSpeed > 0 
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.5)]' 
                        : 'bg-[#091726] border-gray-700 text-gray-500'
                    }`}
                    title="Toggle Auto-Scroll"
                  >
                    <span>AUTO</span>
                    <span className={`w-1 h-1 rounded-full mt-0.2 ${scrollSpeed > 0 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className="p-0.5 rounded bg-[#091726] border border-cyan-500/30 hover:bg-cyan-500/30 text-center hover:text-white transition-all cursor-pointer"
                    title="Settings"
                  >
                    INFO
                  </button>
                  <button 
                    onClick={() => setShowStationDrawer(true)}
                    className="p-0.5 rounded bg-[#091726] border border-cyan-500/30 hover:bg-cyan-500/30 text-center hover:text-white transition-all cursor-pointer flex items-center justify-center"
                    title="Search Radio"
                  >
                    <Search className="w-2.5 h-2.5" />
                  </button>
                </div>

              </div>

              {/* LOWER EMBOSSED METALLIC ARC (Item 14 in render: GODOT EMBLEM) */}
              <div 
                className="w-full py-1 px-3 flex items-center justify-between border-t-2 border-[#546e89] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_4px_rgba(255,255,255,0.3)] z-10 rounded-b-full"
                style={{
                  background: 'linear-gradient(180deg, #334860 0%, #1c2b3c 60%, #0d1722 100%)'
                }}
              >
                <div className="flex items-center gap-1.5">
                  {/* Godot Robot Icon (SVG replica matching Item 14 in render) */}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cyan-400 filter drop-shadow-[0_0_5px_rgba(0,217,255,0.7)]">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 2.87 8.16 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" />
                  </svg>
                  <span className="font-black text-[11px] tracking-widest text-cyan-200 drop-shadow-[0_0_6px_#00e1ff]">
                    GODOT
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono text-[8px] text-cyan-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>TOTAL: 01:55:20</span>
                </div>
              </div>

            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER E: HIGH-END LEFT TRANSPORT POD (Items 1-10)    */}
            {/* Exactly matches controller docked to circular bezel */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute -left-12 top-1/2 -translate-y-1/2 w-26 h-52 border-2 border-[#3b5575] rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(255,255,255,0.4)] p-1.5 flex flex-col justify-between z-20 font-mono text-[8px]"
              style={{
                background: 'linear-gradient(135deg, #182e47 0%, #0d1a29 50%, #060e17 100%)'
              }}
            >
              {/* ▲ OPEN (STATION SELECTOR / EXPANDER - Item 24 in render) */}
              <button
                onClick={() => setShowStationDrawer(true)}
                className="w-full py-1 bg-gradient-to-r from-cyan-600/60 to-blue-600/60 hover:from-cyan-500/80 hover:to-blue-500/80 border border-cyan-400/80 rounded text-cyan-100 font-black text-center tracking-wider shadow-[0_0_8px_rgba(0,217,255,0.5)] cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
                title="Open Foyer FM Station Selector (Curated & 60,000+)"
              >
                <span>▲ OPEN</span>
              </button>

              {/* Repeat & Random pills (Items 22 & 23 in render) */}
              <div className="grid grid-cols-2 gap-1 my-0.5">
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`py-0.5 rounded border text-[7px] text-center transition-all cursor-pointer ${
                    isRepeat ? 'bg-cyan-500/35 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_6px_rgba(0,217,255,0.3)]' : 'bg-[#0a1420] border-white/10 text-gray-500'
                  }`}
                >
                  REP
                </button>
                <button
                  onClick={() => setIsRandom(!isRandom)}
                  className={`py-0.5 rounded border text-[7px] text-center transition-all cursor-pointer ${
                    isRandom ? 'bg-cyan-500/35 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_6px_rgba(0,217,255,0.3)]' : 'bg-[#0a1420] border-white/10 text-gray-500'
                  }`}
                >
                  SHUF
                </button>
              </div>

              {/* Main Deck (Items 1-6 in render) */}
              <div className="space-y-1 my-0.5">
                {/* ■ STOP button (Item 2 in render) */}
                <button
                  onClick={handleStop}
                  className="w-full py-1 bg-[#0b1624] hover:bg-red-500/25 border border-red-500/50 rounded flex items-center justify-center text-red-400 font-bold active:scale-95 cursor-pointer transition-all shadow-[0_0_6px_rgba(239,68,68,0.2)]"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span className="ml-1 text-[7px]">STOP</span>
                </button>

                {/* Center Big Circular Dial / Play-Pause Wheel (Item 1 in render) */}
                <div className="relative py-1 flex items-center justify-center">
                  <button
                    onClick={handleTogglePlay}
                    className="w-12 h-12 rounded-full border-2 border-cyan-400 shadow-[0_0_12px_rgba(0,217,255,0.5),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center active:scale-95 cursor-pointer transition-all"
                    style={{
                      background: 'radial-gradient(circle at 40% 35%, #1e4570 0%, #0d223a 65%, #050d17 100%)'
                    }}
                    title={isPlaying ? 'Pause' : 'Play / Stream'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-cyan-300 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 text-cyan-300 fill-current ml-0.5" />
                    )}
                    <span className="text-[6.5px] font-black text-cyan-200 mt-0.5 tracking-tighter">
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </span>
                  </button>
                </div>
              </div>

              {/* PREV / NEXT Buttons (Items 5 & 6 in render) */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={handlePrevStation}
                  className="py-1 bg-[#0b1624] hover:bg-white/15 border border-white/20 rounded flex items-center justify-center text-gray-300 active:scale-95 cursor-pointer transition-all"
                  title="Previous Station"
                >
                  <SkipBack className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={handleNextStation}
                  className="py-1 bg-[#0b1624] hover:bg-white/15 border border-white/20 rounded flex items-center justify-center text-gray-300 active:scale-95 cursor-pointer transition-all"
                  title="Next Station"
                >
                  <SkipForward className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* CD COPY & IN/OUT Status (Items 7, 8, 9 in render) */}
              <div className="pt-0.5 border-t border-white/10 flex items-center justify-between text-[6.5px] text-cyan-400/80 font-bold">
                <div className="flex items-center gap-0.5">
                  <span className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
                  <span>CD COPY</span>
                </div>
                <span>.WAV</span>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER F: RIGHT PERIMETER TABS & CONTOUR CONTROLS     */}
            {/* Items 16-21 from render & Foyer Feature Tabs         */}
            {/* ---------------------------------------------------- */}
            <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20 font-mono text-[8px] font-bold">
              
              {/* Tab 1: 🗺️ MINIMAP */}
              <button
                onClick={() => setActiveTab('minimap')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'minimap'
                    ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,217,255,0.5)] translate-x-1'
                    : 'bg-[#101e30]/95 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>🗺️ MINIMAP</span>
              </button>

              {/* Tab 2: 🔥 TRENDING */}
              <button
                onClick={() => setActiveTab('trending')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'trending'
                    ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,217,255,0.5)] translate-x-1'
                    : 'bg-[#101e30]/95 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>🔥 TRENDING</span>
              </button>

              {/* Tab 3: 📰 CIVIC NEWS */}
              <button
                onClick={() => setActiveTab('news')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'news'
                    ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,217,255,0.5)] translate-x-1'
                    : 'bg-[#101e30]/95 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>📰 NEWS</span>
              </button>

              {/* Tab 4: 💬 PROX CHAT */}
              <button
                onClick={() => setActiveTab('proximity')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'proximity'
                    ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,217,255,0.5)] translate-x-1'
                    : 'bg-[#101e30]/95 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>💬 CHAT</span>
              </button>

              {/* Tab 5: ✨ EMOJIS */}
              <button
                onClick={() => setActiveTab('emojis')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'emojis'
                    ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,217,255,0.5)] translate-x-1'
                    : 'bg-[#101e30]/95 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
              >
                <span>✨ EMOJIS</span>
              </button>

              {/* Tab 6: ⚙️ SETTINGS (Scale % and Auto-Scroll Speed Selector) */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,217,255,0.5)] translate-x-1'
                    : 'bg-[#101e30]/95 border-white/20 text-gray-300 hover:text-white hover:bg-[#182b42]'
                }`}
                title="Adjust Console Scale % & Auto-Scroll Speed"
              >
                <span>⚙️ SET</span>
              </button>

              {/* VOLUME ROCKER (- / +) (Item 16 in render) */}
              <div className="flex items-center justify-between bg-[#0b1624] border border-cyan-500/50 rounded px-1.5 py-0.5 text-cyan-300 shadow-md">
                <button onClick={handleVolumeDown} className="p-0.5 hover:text-white cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                <span className="text-[7px] font-bold">{Math.round(volume * 100)}%</span>
                <button onClick={handleVolumeUp} className="p-0.5 hover:text-white cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
              </div>

              {/* MINIMIZE HUD BUTTON (Item 20 in render) */}
              <button
                onClick={() => setIsMinimized(true)}
                className="px-2.5 py-0.5 rounded-r-lg bg-white/5 hover:bg-white/15 border-y border-r border-white/15 text-gray-400 hover:text-white text-left transition-all cursor-pointer flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#091422] border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_50px_rgba(0,217,255,0.45)] overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in zoom-in-95">
            
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
