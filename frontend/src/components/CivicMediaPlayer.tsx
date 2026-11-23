import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useNavigate } from 'react-router-dom';
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
  Navigation, 
  Heart,
  Music,
  Settings,
  Sliders,
  Zap,
  Info,
  Layers,
  Wrench,
  Users
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { getLocalPlayerPosition, useMultiplayerStore } from '../services/multiplayer';
import { 
  MediaStation, 
  CURATED_STATIONS, 
  searchRadioStations, 
  fetchStationsByTag,
  fetchTopStations,
  getLastPlayedStation, 
  saveLastPlayedStation, 
  fetchLiveTrackMetadata, 
  TrackMetadata 
} from '../services/mediaService';
import { CIVICVERSE_LOGO } from '../assets/logo';
import { CivicNewsFeed } from './CivicNewsFeed';
import { CivicWatchClips } from './CivicWatchClips';

type FoyerTabMode = 'music' | 'minimap' | 'citizens' | 'feeds' | 'civicwatch' | 'proximity' | 'emojis' | 'settings';

type RadioGenre = { id: string; label: string; tag: string };

const RADIO_GENRES: RadioGenre[] = [
  { id: 'hiphop', label: 'HIP-HOP', tag: 'hiphop' },
  { id: 'rnb', label: 'R&B', tag: 'rnb' },
  { id: 'urban', label: 'URBAN', tag: 'urban' },
  { id: 'synthwave', label: 'SYNTHWAVE', tag: 'synthwave' },
  { id: 'vaporwave', label: 'VAPORWAVE', tag: 'vaporwave' },
  { id: 'lofi', label: 'LO-FI', tag: 'lofi' },
  { id: 'electronic', label: 'ELECTRONIC', tag: 'electronic' },
  { id: 'ambient', label: 'AMBIENT', tag: 'ambient' },
  { id: 'techno', label: 'TECHNO', tag: 'techno' },
  { id: 'house', label: 'HOUSE', tag: 'house' },
  { id: 'rock', label: 'ROCK', tag: 'rock' },
  { id: 'jazz', label: 'JAZZ', tag: 'jazz' },
  { id: 'gospel', label: 'GOSPEL', tag: 'gospel' },
  { id: 'reggae', label: 'REGGAE', tag: 'reggae' },
  { id: 'country', label: 'COUNTRY', tag: 'country' },
  { id: 'classical', label: 'CLASSICAL', tag: 'classical' }
];

const STATION_PRESETS = [
  { label: 'NEON DRIVE', stationId: 'nightwave-plaza' },
  { label: 'SYNTH RUN', stationId: 'atomicwave-fm' },
  { label: 'LO-FI FOCUS', stationId: 'lofi-cafe' },
  { label: 'AMBIENT DRIFT', stationId: 'soma-groove-salad' },
  { label: 'DEEP SPACE', stationId: 'soma-drone-zone' },
  { label: 'CIVIC RADIO', stationId: 'wnyc-939' }
];

const getInitialStation = (): MediaStation => {
  const savedStation = getLastPlayedStation();
  if (
    savedStation &&
    typeof savedStation.id === 'string' &&
    typeof savedStation.name === 'string' &&
    typeof savedStation.url === 'string' &&
    savedStation.id !== 'city-hiphop' &&
    !/city\s*hip[\s-]*hop/i.test(savedStation.name)
  ) {
    return savedStation;
  }

  const defaultStation = CURATED_STATIONS.find(station => station.id === STATION_PRESETS[0].stationId);
  if (!defaultStation) {
    throw new Error(`The "${STATION_PRESETS[0].label}" preset references a missing station.`);
  }
  return defaultStation;
};

export const CivicMediaPlayer: React.FC = () => {
  const { user } = useGameStore();
  const navigate = useNavigate();

  // Multiplayer store integration (Proximity Chat, Peers, Radar)
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const players = useMultiplayerStore(state => state.players);
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const sendMessage = useMultiplayerStore(state => state.sendMessage);
  const chatAudience = useMultiplayerStore(state => state.chatAudience);
  const setChatAudience = useMultiplayerStore(state => state.setChatAudience);
  const currentLobbyId = useMultiplayerStore(state => state.currentLobbyId);
  const currentLobbyName = useMultiplayerStore(state => state.currentLobbyName);
  const availableLobbies = useMultiplayerStore(state => state.availableLobbies);
  const switchLobby = useMultiplayerStore(state => state.switchLobby);
  const [localPosition, setLocalPosition] = useState(getLocalPlayerPosition);
  const [playerSearch, setPlayerSearch] = useState('');

  // Playback state
  const [currentStation, setCurrentStation] = useState<MediaStation>(getInitialStation);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(() =>
    STATION_PRESETS.findIndex(preset => preset.stationId === currentStation.id)
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'buffering' | 'playing' | 'error'>('idle');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FoyerTabMode>('music');
  const [isRepeat, setIsRepeat] = useState<boolean>(true);
  const [isRandom, setIsRandom] = useState<boolean>(false);

  // Scale Percentage State (Defaults to 55% / Half-size)
  const [scalePercent, setScalePercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('civicverse_foyer_fm_scale_v2');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 35 && parsed <= 140) return parsed;
      }
    } catch {}
    return 85;
  });

  const handleUpdateScale = (val: number) => {
    setScalePercent(val);
    try {
      localStorage.setItem('civicverse_foyer_fm_scale_v2', val.toString());
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

  // Real working live clock (updates every second)
  const [liveClock, setLiveClock] = useState<string>('');

  // Station Selector Overlay (triggered by ▲ OPEN on left pod)
  const [showStationDrawer, setShowStationDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaStation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [stationSearchError, setStationSearchError] = useState<string>('');

  // Proximity Chat Input & Floating Emoji Particles
  const [chatMessage, setChatMessage] = useState<string>('');
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);
  const visibleCitizens = Array.from(players.values()).filter(player =>
    `${player.username} ${player.civicId || ''}`.toLowerCase().includes(playerSearch.trim().toLowerCase())
  );

  // Live Track Metadata
  const [metadata, setMetadata] = useState<TrackMetadata>({
    title: currentStation.name,
    artist: currentStation.tags?.[0]?.toUpperCase() || 'CIVIC BROADCAST',
    album: 'Foyer FM Direct Stream',
    stationName: currentStation.name
  });

  const howlRef = useRef<Howl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!showStationDrawer) return;

    let active = true;
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setStationSearchError('');

      try {
        const genre = RADIO_GENRES.find(item => item.id === selectedGenre);
        const results = searchQuery.trim()
          ? await searchRadioStations(searchQuery.trim(), 40)
          : genre
            ? await fetchStationsByTag(genre.tag, 40)
            : await fetchTopStations(40);

        if (active) {
          setSearchResults(results);
        }
      } catch (error) {
        console.error('[FoyerFM] Could not load the live station directory.', error);
        if (active) {
          setSearchResults([]);
          setStationSearchError('The live station directory is unavailable. Please try again.');
        }
      } finally {
        if (active) setIsSearching(false);
      }
    }, searchQuery.trim() ? 300 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [showStationDrawer, searchQuery, selectedGenre]);

  useEffect(() => {
    const timer = window.setInterval(() => setLocalPosition(getLocalPlayerPosition()), 300);
    return () => window.clearInterval(timer);
  }, []);

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
    setActivePresetIndex(STATION_PRESETS.findIndex(preset => preset.stationId === station.id));
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
        onend: () => {
          if (isRepeat) playStation(station);
          else if (isRandom) stepPreset(1);
          else {
            setIsPlaying(false);
            setPlaybackState('idle');
          }
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

  const stepPreset = (direction: -1 | 1) => {
    const presetCount = STATION_PRESETS.length;
    const nextIndex = activePresetIndex < 0
      ? direction > 0 ? 0 : presetCount - 1
      : isRandom && direction > 0 && presetCount > 1
        ? (activePresetIndex + 1 + Math.floor(Math.random() * (presetCount - 1))) % presetCount
        : (activePresetIndex + direction + presetCount) % presetCount;
    const preset = STATION_PRESETS[nextIndex];
    const station = CURATED_STATIONS.find(item => item.id === preset.stationId);
    if (!station) {
      console.error(`[FoyerFM] The "${preset.label}" preset references a missing station.`);
      return;
    }

    setActivePresetIndex(nextIndex);
    playStation(station);
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
  const handleSearchStations = (query: string) => {
    setSearchQuery(query);
    setSelectedGenre('all');
  };

  // Proximity chat send
  const handleSendProximityChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendMessage(chatMessage.trim(), 'text-cyan-300');
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
          className="fixed bottom-9 right-6 z-40 bg-gradient-to-b from-[#f2f4f5] to-[#aeb4b9] border border-[#5a6066] rounded-full px-3.5 py-1.5 flex items-center gap-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.9)] cursor-pointer hover:scale-105 transition-transform"
          title="Restore Godot Mixmaster (Foyer FM Console)"
        >
          <div className="w-5 h-5 rounded-full bg-[#0b1a1f] border border-[#5a6066] flex items-center justify-center">
            <Radio className={`w-3 h-3 ${isPlaying ? 'text-[#6ee8e9] animate-pulse' : 'text-[#c9d0d6]'}`} />
          </div>
          <span className="font-mono text-xs font-black text-[#14181c] tracking-wider">
            FOYER FM
          </span>
          <span className="text-[10px] text-[#3a3f44] font-mono">[{liveClock}]</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#3a3f44]" />
        </div>
      ) : (

        /* ======================================================== */
        /* FULL GODOT MIXMASTER (FOYER FM) HUD CONSOLE              */
        /* 1:1 High-End Render Replica matching webp visual concept */
        /* ======================================================== */
        <div 
          className="fixed z-40 pointer-events-auto select-none transition-transform"
          style={{
            bottom: '36px', // Raised ~0.25in per user request
            right: '48px', // Shifted left per instructions
            transform: `scale(${scalePercent / 100})`,
            transformOrigin: 'bottom right'
          }}
        >
          {/* Main 430px Circular Chassis Container */}
          <div className="relative w-[430px] h-[430px] flex items-center justify-center drop-shadow-[0_18px_36px_rgba(0,0,0,0.6)] max-sm:scale-[0.8] max-sm:origin-bottom-right">
            
            {/* ---------------------------------------------------- */}
            {/* LAYER A: OUTER SEGMENTED CHAMFERED WHITE ARMOR RING  */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-0 rounded-full border border-[#5a6066] shadow-[0_12px_30px_rgba(0,0,0,0.55),inset_0_2px_3px_rgba(255,255,255,0.85),inset_0_-4px_8px_rgba(0,0,0,0.35)]"
              style={{
                background: 'conic-gradient(from 210deg at 50% 50%, #8b9197 0%, #e9ecee 12%, #b4babf 24%, #f4f6f7 38%, #9aa0a6 52%, #dfe3e6 66%, #858b91 80%, #d5d9dc 92%, #8b9197 100%)'
              }}
            />

            {/* Futuristic Panel Seams / Hard-Surface Radial Grooves */}
            <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
              {/* Radial panel seam notches matching render */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[#4d5359]/70" />
              <div className="absolute top-10 right-16 w-0.5 h-6 bg-[#4d5359]/70 transform rotate-35" />
              <div className="absolute top-24 right-5 w-0.5 h-6 bg-[#4d5359]/70 transform rotate-65" />
              <div className="absolute bottom-24 right-5 w-0.5 h-6 bg-[#4d5359]/70 transform -rotate-65" />
              <div className="absolute bottom-10 right-16 w-0.5 h-6 bg-[#4d5359]/70 transform -rotate-35" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[#4d5359]/70" />

              {/* Top visor seam */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#4d5359]/60 to-transparent opacity-60" />
              {/* Bottom intake vent seam with horizontal notches */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-transparent via-[#4d5359]/60 to-transparent opacity-60 flex items-center justify-center gap-1">
                <span className="w-4 h-0.5 bg-[#4d5359]/70 rounded" />
                <span className="w-4 h-0.5 bg-[#4d5359]/70 rounded" />
                <span className="w-4 h-0.5 bg-[#4d5359]/70 rounded" />
              </div>
            </div>

            {/* Bottom-Left Pod Docking Clamp */}
            <div className="absolute -bottom-1 left-9 w-20 h-6 rounded bg-gradient-to-b from-[#f2f4f5] to-[#aeb4b9] border border-[#5a6066] shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.9)] transform -rotate-25 z-10 flex items-center justify-between px-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3a3f44] border border-[#7c838a] flex items-center justify-center text-[5px] text-[#e9ecee] font-mono">+</span>
              <div className="h-3 w-8 border-x border-[#7c838a] bg-black/[0.08]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#3a3f44] border border-[#7c838a] flex items-center justify-center text-[5px] text-[#e9ecee] font-mono">+</span>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER B: RADIAL BLUE-STEEL ROTOR SEGMENTS            */}
            {/* Raised alternating alloy vanes from the reference    */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-5 rounded-full border border-[#2a2e32] bg-gradient-to-b from-[#3a3f44] to-[#1d2024] shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-3 h-8 rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.8)] ${i % 6 === 0 ? 'bg-gradient-to-b from-[#f7f8f9] to-[#9aa0a6]' : 'bg-gradient-to-b from-[#c3c8cc] to-[#6c7278]'}`}
                  style={{
                    transform: `rotate(${i * 15}deg) translateY(-187px)`,
                    opacity: isPlaying ? 1 : 0.82
                  }}
                />
              ))}
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER C: INSET HEAVY BRUSHED STAINLESS STEEL BEZEL   */}
            {/* Multi-stop anisotropic conic gradient reflections    */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-9 rounded-full border border-[#4d5359] shadow-[inset_0_3px_8px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(255,255,255,0.7),0_0_18px_rgba(0,0,0,0.5)]"
              style={{
                background: 'linear-gradient(180deg, #0f2a30, #081014)'
              }}
            >
              {/* Four Cardinal Alignment Rivets / Indents */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#2a2e32]" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#2a2e32]" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#2a2e32]" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#2a2e32]" />
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER D: CENTRAL DIGITAL LCD SCREEN MONITOR          */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-10 rounded-full bg-gradient-to-b from-[#0b1a1f] to-[#060a0e] border border-[#2a2e32] shadow-[inset_0_3px_10px_rgba(0,0,0,0.8)] flex items-center justify-center p-2 text-white overflow-hidden z-10 font-sans">
              
              {/* Glass Glare & Scanline Texture Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />

              {/* ---------------------------------------------------- */}
              {/* Full circular display. Controls stay on the outside. */}
              {/* ---------------------------------------------------- */}
              <div className="absolute inset-2 z-10 flex overflow-hidden rounded-full bg-[#060a0e]/90">
                
                {/* Main Content Pane */}
                <div className="flex-1 flex flex-col overflow-hidden">

                  {activeTab === 'music' && (
                    <div className="h-full w-full overflow-y-auto px-5 py-6 scrollbar-thin">
                      <div className="mb-4 text-center">
                        <p className="truncate text-lg font-black text-white">{isPlaying ? metadata.title : currentStation.name}</p>
                        <p className={`mt-1 truncate text-xs ${isPlaying ? 'text-[#6ee8e9]' : 'text-[#8d959c]'}`}>{isPlaying ? metadata.artist : 'Choose a station to start listening'}</p>
                        <canvas ref={canvasRef} width={320} height={32} className="mx-auto mt-3 h-8 w-full max-w-sm opacity-90" />
                      </div>
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.03] px-4 py-3 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#8d959c]">Station preset</span>
                        <span className="text-sm font-black tracking-widest text-white">
                          {activePresetIndex >= 0 ? STATION_PRESETS[activePresetIndex].label : 'LIVE DIRECTORY'}
                        </span>
                        <span className="text-[10px] text-[#8d959c]">
                          {activePresetIndex >= 0
                            ? `${activePresetIndex + 1} / ${STATION_PRESETS.length} · Use previous / next to switch presets`
                            : 'Custom station · Use previous / next to browse presets'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowStationDrawer(true)}
                          className="mt-1 flex items-center gap-1.5 rounded-lg border border-white/[0.16] bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9]"
                        >
                          <Search className="h-3 w-3" />
                          Browse live radio
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 1. TACTICAL RADAR MINIMAP */}
                  {activeTab === 'minimap' && (
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#060a0e]">
                      {/* Concentric distance rings */}
                      <div className="absolute inset-2 border border-white/[0.12] rounded-full" />
                      <div className="absolute inset-5 border border-white/[0.09] rounded-full" />
                      <div className="absolute inset-8 border border-white/[0.06] rounded-full" />
                      
                      {/* Compass Axis Lines */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-[1px] bg-white/[0.08]" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-full w-[1px] bg-white/[0.08]" />
                      </div>

                      {/* Rotating Radar Sweep Cone */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#6ee8e9]/15 via-transparent to-transparent rounded-full animate-spin duration-3000 pointer-events-none" />

                      {/* Player Center Blip */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#6ee8e9] border-2 border-white" />
                      </div>

                      {/* Live citizen positions relative to this player */}
                      {Array.from(players.values()).map((p) => (
                        <div
                          key={p.id}
                          className="absolute h-3 w-3 rounded-full border border-white bg-[#7ae2a7]"
                          style={{
                            top: `${Math.max(4, Math.min(96, 50 + ((p.position?.z ?? localPosition.z) - localPosition.z) * 0.4))}%`,
                            left: `${Math.max(4, Math.min(96, 50 + ((p.position?.x ?? localPosition.x) - localPosition.x) * 0.4))}%`
                          }}
                          title={p.username || 'Citizen'}
                        />
                      ))}
                    </div>
                  )}

                  {activeTab === 'citizens' && (
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5 text-white scrollbar-thin">
                      <section>
                        <div className="mb-2 flex items-center justify-between">
                          <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#c9d0d6]">
                            <Users className="h-4 w-4" /> Citizens
                          </h2>
                          <span className="text-[10px] font-mono text-[#c9d0d6]">{1 + peerCount}/20</span>
                        </div>
                        <input
                          value={playerSearch}
                          onChange={event => setPlayerSearch(event.target.value)}
                          placeholder="Search username or Civic ID"
                          className="w-full rounded-lg border border-white/[0.16] bg-black/35 px-3 py-2 text-xs text-white placeholder:text-[#8d959c] focus:border-[#6ee8e9] focus:outline-none"
                        />
                        <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                          {visibleCitizens.map(player => (
                            <button
                              key={player.id}
                              type="button"
                              disabled={!player.civicId}
                              onClick={() => player.civicId && navigate(`/profile/${encodeURIComponent(player.civicId)}`)}
                              className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-left text-xs hover:bg-white/[0.1] disabled:cursor-default disabled:opacity-70"
                            >
                              <span className="truncate font-bold">{player.username}</span>
                              <span className="shrink-0 text-[9px] text-[#8d959c]">{player.civicId ? 'PROFILE' : 'GUEST'}</span>
                            </button>
                          ))}
                          {!visibleCitizens.length && (
                            <p className="py-2 text-center text-[10px] text-slate-400">
                              {playerSearch ? 'No matching citizens.' : 'No other citizens in this lobby.'}
                            </p>
                          )}
                        </div>
                      </section>

                      <section className="border-t border-white/[0.12] pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#c9d0d6]">Lobby</h3>
                          <span className="truncate text-[9px] text-slate-400">{currentLobbyName}</span>
                        </div>
                        <div className="space-y-1">
                          {availableLobbies.map(lobby => (
                            <div key={lobby.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                              <span className="truncate text-[10px] text-slate-200">{lobby.name}</span>
                              {lobby.id === currentLobbyId ? (
                                <span className="shrink-0 text-[9px] font-bold text-[#7ae2a7]">CURRENT</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={lobby.isFull}
                                  onClick={() => switchLobby(lobby.id)}
                                  className="shrink-0 rounded border border-white/[0.16] px-2 py-1 text-[9px] font-bold text-white hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {lobby.isFull ? 'FULL' : 'JOIN'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* Live Civicverse social, trending and government feeds */}
                  {activeTab === 'feeds' && <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden"><CivicNewsFeed embedded scrollSpeed={scrollSpeed} /></div>}

                  {activeTab === 'civicwatch' && <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden"><CivicWatchClips /></div>}

                  {/* 4. REAL MULTIPLAYER PROXIMITY CHAT & INPUT (WITH WORKING AUTO-SCROLL) */}
                  {activeTab === 'proximity' && (
                    <div className="flex min-h-0 flex-1 flex-col gap-2 p-4 text-white">
                      <div className="flex flex-wrap gap-1">
                        {(['nearby', 'friends', 'lobby', 'off'] as const).map(audience => (
                          <button
                            key={audience}
                            type="button"
                            onClick={() => setChatAudience(audience)}
                            className={`rounded-md border px-2 py-1 text-[8px] font-bold uppercase ${
                              chatAudience === audience
                                ? 'border-[#6ee8e9]/70 bg-[#6ee8e9]/15 text-[#6ee8e9]'
                                : 'border-white/10 text-[#8d959c] hover:text-white'
                            }`}
                          >
                            {audience}
                          </button>
                        ))}
                      </div>
                      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg bg-black/25 p-3 text-[10px] scrollbar-thin">
                        {chatHistory.filter(message => !message.isSystem).slice(-20).map(message => (
                          <p key={message.id} className="break-words leading-snug">
                            <span className={`mr-1 font-bold ${message.color || 'text-[#c9d0d6]'}`}>{message.username}:</span>
                            <span className="text-slate-200">{message.text}</span>
                          </p>
                        ))}
                        {!chatHistory.some(message => !message.isSystem) && (
                          <p className="text-center text-slate-500">No messages yet.</p>
                        )}
                      </div>
                      <form onSubmit={handleSendProximityChat} className="flex w-full gap-1 border-t border-white/[0.12] pt-2">
                        <input
                          type="text"
                          value={chatMessage}
                          disabled={chatAudience === 'off'}
                          onChange={e => setChatMessage(e.target.value)}
                          placeholder={chatAudience === 'off' ? 'Chat is off' : `Say to ${chatAudience === 'nearby' ? 'nearby citizens' : chatAudience === 'friends' ? 'friends' : 'the lobby'}...`}
                          className="min-w-0 flex-1 rounded-lg border border-white/[0.16] bg-[#081014] px-3 py-2 text-xs text-white focus:border-[#6ee8e9] focus:outline-none"
                        />
                        <button type="submit" disabled={chatAudience === 'off'} className="rounded-lg border border-white/[0.16] bg-white/[0.06] px-3 text-white hover:bg-white/[0.12] disabled:opacity-50">
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* 5. INTERACTIVE EMOJIS REACTION PAD */}
                  {activeTab === 'emojis' && (
                    <div className="flex-1 flex flex-wrap items-center justify-center gap-3 p-6">
                      {['🔥', '💎', '🚀', '⚡', '🛡️', '🌐', '❤️', '🎉', '👽', '🎧', '🕹️', '👾'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleTriggerEmoji(emoji)}
                          className="text-4xl p-2 rounded-xl hover:bg-white/[0.1] hover:scale-125 transition-transform cursor-pointer"
                          title="Broadcast reaction"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 6. SETTINGS HUD (SCALE ADJUSTER + AUTO-SCROLL SPEED SELECTOR) */}
                  {activeTab === 'settings' && (
                    <div className="flex-1 flex flex-col justify-between px-10 py-14 text-xs font-mono overflow-y-auto scrollbar-thin">
                      <div className="space-y-1.5">
                        
                        {/* Setting 1: HUD SCALE % */}
                        <div>
                          <div className="flex items-center justify-between text-[#c9d0d6] font-bold border-b border-white/[0.12] pb-0.5">
                            <span>HUD SCALE</span>
                            <span className="text-white bg-white/[0.06] px-1 py-0.2 rounded border border-white/[0.16] font-bold">
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
                              className="w-full h-1.5 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#6ee8e9]"
                            />
                            <div className="grid grid-cols-4 gap-1 mt-1">
                              {[
                                { label: '45% Mini', val: 45 },
                                { label: '85% Default', val: 85 },
                                { label: '75% Mid', val: 75 },
                                { label: '100% Max', val: 100 },
                              ].map(p => (
                                <button
                                  key={p.val}
                                  onClick={() => handleUpdateScale(p.val)}
                                  className={`py-0.5 rounded border text-[7px] transition-all cursor-pointer ${
                                    scalePercent === p.val
                                      ? 'bg-[#6ee8e9]/15 border-[#6ee8e9]/70 text-[#6ee8e9] font-bold'
                                      : 'bg-transparent border-white/10 text-[#8d959c] hover:text-white'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Setting 2: AUTO-SCROLL SPEED SELECTOR (User Requirement!) */}
                        <div className="pt-1 border-t border-white/[0.12]">
                          <div className="flex items-center justify-between text-[#c9d0d6] font-bold pb-0.5">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${scrollSpeed > 0 ? 'bg-[#7ae2a7]' : 'bg-[#8d959c]'}`} />
                              <span>AUTO-SCROLL SPEED</span>
                            </div>
                            <span className={`px-1 py-0.2 rounded border font-bold ${scrollSpeed > 0 ? 'bg-[#7ae2a7]/15 text-[#7ae2a7] border-[#7ae2a7]/40' : 'bg-transparent text-[#8d959c] border-white/10'}`}>
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
                              className="w-full h-1.5 bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#6ee8e9]"
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
                                      ? 'bg-[#6ee8e9]/15 border-[#6ee8e9]/70 text-[#6ee8e9] font-bold'
                                      : 'bg-transparent border-white/10 text-[#8d959c] hover:text-white'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER E: HIGH-END LEFT TRANSPORT POD (Items 1-10)    */}
            {/* Exactly matches controller docked to circular bezel */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute -left-12 top-1/2 -translate-y-1/2 w-26 h-52 border border-[#5a6066] rounded-2xl shadow-[0_12px_28px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.25)] p-1.5 flex flex-col justify-between z-20 font-mono text-[8px]"
              style={{
                background: 'linear-gradient(180deg, #e9ecee 0%, #c3c8cc 45%, #9aa0a6 100%)'
              }}
            >
              {/* ▲ OPEN (STATION SELECTOR / EXPANDER - Item 24 in render) */}
              <button
                onClick={() => { setActiveTab('music'); setShowStationDrawer(true); }}
                className="w-full py-1 bg-gradient-to-b from-[#f7f8f9] to-[#c3c8cc] hover:from-white hover:to-[#d9dde0] border border-[#7c838a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.35)] rounded text-[#14181c] font-black text-center tracking-wider focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b1a1f] cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
                title="Open Foyer FM Station Selector (Curated & 60,000+)"
              >
                <Music className="w-2.5 h-2.5" />
                <span>▲ OPEN</span>
              </button>

              {/* Repeat & Random pills (Items 22 & 23 in render) */}
              <div className="grid grid-cols-2 gap-1 my-0.5">
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`py-0.5 rounded border text-[7px] text-center transition-all cursor-pointer ${
                    isRepeat ? 'bg-[#0b1a1f] border-[#0b1a1f] text-[#6ee8e9] font-bold' : 'bg-transparent border-[#7c838a] text-[#3a3f44]'
                  }`}
                >
                  REP
                </button>
                <button
                  onClick={() => setIsRandom(!isRandom)}
                  className={`py-0.5 rounded border text-[7px] text-center transition-all cursor-pointer ${
                    isRandom ? 'bg-[#0b1a1f] border-[#0b1a1f] text-[#6ee8e9] font-bold' : 'bg-transparent border-[#7c838a] text-[#3a3f44]'
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
                  className="w-full py-1 bg-gradient-to-b from-[#f7f8f9] to-[#c3c8cc] hover:from-white hover:to-[#d9dde0] border border-[#7c838a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.35)] rounded flex items-center justify-center text-[#14181c] font-bold active:scale-95 cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b1a1f]"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span className="ml-1 text-[7px]">STOP</span>
                </button>

                {/* Center Big Circular Dial / Play-Pause Wheel (Item 1 in render) */}
                <div className="relative py-1 flex items-center justify-center">
                  <button
                    onClick={handleTogglePlay}
                    className={`w-12 h-12 rounded-full border-2 ${isPlaying ? 'border-[#6ee8e9] shadow-[0_0_18px_rgba(110,232,233,0.35)]' : 'border-[#f7f8f9] shadow-[0_1px_3px_rgba(0,0,0,0.55)]'} flex flex-col items-center justify-center active:scale-95 cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b1a1f] focus-visible:outline-offset-2`}
                    style={{
                      background: 'linear-gradient(180deg, #0f2a30, #081014)'
                    }}
                    title={isPlaying ? 'Pause' : 'Play / Stream'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-[#6ee8e9] fill-current" />
                    ) : (
                      <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                    )}
                    <span className={`text-[6.5px] font-black ${isPlaying ? 'text-[#6ee8e9]' : 'text-[#c9d0d6]'} mt-0.5 tracking-tighter`}>
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </span>
                  </button>
                </div>
              </div>

              {/* PREV / NEXT Buttons (Items 5 & 6 in render) */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => stepPreset(-1)}
                  className="py-1 bg-gradient-to-b from-[#f7f8f9] to-[#c3c8cc] hover:from-white hover:to-[#d9dde0] border border-[#7c838a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.35)] rounded flex items-center justify-center text-[#14181c] active:scale-95 cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b1a1f]"
                  title="Previous preset"
                  aria-label="Previous station preset"
                >
                  <SkipBack className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => stepPreset(1)}
                  className="py-1 bg-gradient-to-b from-[#f7f8f9] to-[#c3c8cc] hover:from-white hover:to-[#d9dde0] border border-[#7c838a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.35)] rounded flex items-center justify-center text-[#14181c] active:scale-95 cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0b1a1f]"
                  title="Next preset"
                  aria-label="Next station preset"
                >
                  <SkipForward className="w-2.5 h-2.5" />
                </button>
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
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9] ${
                  activeTab === 'minimap'
                    ? 'bg-[#0b1a1f] border-[#6ee8e9]/70 text-[#6ee8e9] translate-x-1'
                    : 'bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border-[#5a6066] text-[#14181c] hover:from-white hover:to-[#d9dde0]'
                }`}
              >
                <span>🗺️ MINIMAP</span>
              </button>

              <button
                onClick={() => setActiveTab('citizens')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9] ${
                  activeTab === 'citizens'
                    ? 'bg-[#0b1a1f] border-[#6ee8e9]/70 text-[#6ee8e9] translate-x-1'
                    : 'bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border-[#5a6066] text-[#14181c] hover:from-white hover:to-[#d9dde0]'
                }`}
                title="Search citizens and switch lobbies"
              >
                <Users className="h-3 w-3" />
                <span>PEOPLE</span>
              </button>

              {/* Live social, trending and civic feeds */}
              <button
                onClick={() => setActiveTab('feeds')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9] ${
                  activeTab === 'feeds'
                    ? 'bg-[#0b1a1f] border-[#6ee8e9]/70 text-[#6ee8e9] translate-x-1'
                    : 'bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border-[#5a6066] text-[#14181c] hover:from-white hover:to-[#d9dde0]'
                }`}
              >
                <span>📰 FEEDS</span>
              </button>

              <button
                onClick={() => setActiveTab('civicwatch')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9] ${
                  activeTab === 'civicwatch'
                    ? 'bg-[#0b1a1f] border-[#6ee8e9]/70 text-[#6ee8e9] translate-x-1'
                    : 'bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border-[#5a6066] text-[#14181c] hover:from-white hover:to-[#d9dde0]'
                }`}
                title="CivicWatch community video feed"
              >
                <span>▶ WATCH</span>
              </button>

              {/* Tab 4: 💬 PROX CHAT */}
              <button
                onClick={() => setActiveTab('proximity')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9] ${
                  activeTab === 'proximity'
                    ? 'bg-[#0b1a1f] border-[#6ee8e9]/70 text-[#6ee8e9] translate-x-1'
                    : 'bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border-[#5a6066] text-[#14181c] hover:from-white hover:to-[#d9dde0]'
                }`}
              >
                <span>💬 CHAT</span>
              </button>

              {/* Tab 5: ✨ EMOJIS */}
              <button
                onClick={() => setActiveTab('emojis')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9] ${
                  activeTab === 'emojis'
                    ? 'bg-[#0b1a1f] border-[#6ee8e9]/70 text-[#6ee8e9] translate-x-1'
                    : 'bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border-[#5a6066] text-[#14181c] hover:from-white hover:to-[#d9dde0]'
                }`}
              >
                <span>✨ EMOJIS</span>
              </button>

              {/* Tab 6: ⚙️ SETTINGS (Scale % and Auto-Scroll Speed Selector) */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-2.5 py-1 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6ee8e9] ${
                  activeTab === 'settings'
                    ? 'bg-[#0b1a1f] border-[#6ee8e9]/70 text-[#6ee8e9] translate-x-1'
                    : 'bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border-[#5a6066] text-[#14181c] hover:from-white hover:to-[#d9dde0]'
                }`}
                title="Adjust Console Scale % & Auto-Scroll Speed"
              >
                <span>⚙️ SET</span>
              </button>

              {/* VOLUME ROCKER (- / +) (Item 16 in render) */}
              <div className="flex items-center justify-between bg-gradient-to-b from-[#f2f4f5] to-[#b4babf] border border-[#5a6066] rounded px-1.5 py-0.5 text-[#14181c] shadow-md">
                <button onClick={handleVolumeDown} className="p-0.5 hover:text-black cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                <span className="text-[7px] font-bold">{Math.round(volume * 100)}%</span>
                <button onClick={handleVolumeUp} className="p-0.5 hover:text-black cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
              </div>

              {/* MINIMIZE HUD BUTTON (Item 20 in render) */}
              <button
                onClick={() => setIsMinimized(true)}
                className="px-2.5 py-0.5 rounded-r-lg bg-gradient-to-b from-[#e9ecee] to-[#aeb4b9] hover:from-white hover:to-[#d9dde0] border-y border-r border-[#5a6066] text-[#3a3f44] hover:text-black text-left transition-all cursor-pointer flex items-center gap-1"
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
          <div className="w-full max-w-lg bg-gradient-to-b from-[#0f2a30]/95 to-[#081014]/95 border border-white/[0.12] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-3.5 border-b border-white/[0.12] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#c9d0d6]">
                <Radio className="w-4 h-4" />
                <span className="font-black text-xs tracking-widest text-white uppercase">
                  FOYER FM • OPEN STATION DIRECTORY
                </span>
                <span className="text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded text-[#c9d0d6] font-mono">60,000+ STATIONS</span>
              </div>
              <button onClick={() => setShowStationDrawer(false)} className="text-[#8d959c] hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-white/[0.08]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8d959c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchStations(e.target.value)}
                  placeholder="Search 60,000+ stations by name, genre, city, or country..."
                  className="w-full bg-black/30 border border-white/[0.16] rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-[#8d959c] focus:outline-none focus:border-[#6ee8e9]"
                />
              </div>

              {/* Genre Quick Filters */}
              <div className="flex gap-1 mt-2 overflow-x-auto pb-0.5 text-[10px] font-mono">
                {[{ id: 'all', label: 'ALL' }, ...RADIO_GENRES].map(genre => (
                  <button
                    key={genre.id}
                    onClick={() => {
                      setSelectedGenre(genre.id);
                      setSearchQuery('');
                    }}
                    className={`px-2 py-0.5 rounded-full border transition-all ${
                      selectedGenre === genre.id
                        ? 'bg-[#6ee8e9]/15 border-[#6ee8e9]/70 text-[#6ee8e9] font-bold'
                        : 'bg-transparent border-white/10 text-[#8d959c] hover:text-white'
                    }`}
                  >
                    {genre.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stations Result List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-[48vh] scrollbar-thin">
              {isSearching && (
                <div className="py-6 text-center text-xs text-[#c9d0d6]">
                  Searching the live station directory...
                </div>
              )}
              {!isSearching && stationSearchError && (
                <div role="alert" className="py-6 text-center text-xs text-[#ff5ad9]">
                  {stationSearchError}
                </div>
              )}
              {!isSearching && !stationSearchError && searchResults.length === 0 && (
                <div className="py-6 text-center text-xs text-[#8d959c]">
                  No stations found. Try another name or genre.
                </div>
              )}
              {!isSearching && !stationSearchError && searchResults.map(station => (
                <div
                  key={station.id}
                  onClick={() => {
                    playStation(station);
                    setShowStationDrawer(false);
                  }}
                  className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    currentStation.id === station.id && isPlaying
                      ? 'bg-[#6ee8e9]/10 border-[#6ee8e9]/70 text-white shadow-[0_0_18px_rgba(110,232,233,0.35)]'
                      : 'bg-white/[0.03] border-white/[0.08] text-[#c9d0d6] hover:bg-white/[0.08] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-[#c9d0d6]">
                      <Music className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{station.name}</h4>
                      <p className="text-[9px] text-[#8d959c]">{station.description || station.tags?.slice(0, 3).join(' • ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-[#8d959c] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.08]">
                      {station.bitrate ? `${station.bitrate}k` : '320k'}
                    </span>
                    <Play className="w-3.5 h-3.5 text-[#c9d0d6]" />
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
