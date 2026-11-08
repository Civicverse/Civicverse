import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Howl } from 'howler';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Music, 
  Radio, 
  Search, 
  X, 
  SkipBack, 
  SkipForward, 
  Activity, 
  Disc, 
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
  RefreshCw,
  ExternalLink,
  Layers,
  Heart
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

type FoyerFeedTab = 'playlist' | 'trending' | 'news' | 'proximity' | 'emojis';

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  station: MediaStation;
}

export const CivicMediaPlayer: React.FC = () => {
  const { user } = useGameStore();

  // Multiplayer store integration (for Proximity Chat & Emojis)
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const sendMessage = useMultiplayerStore(state => state.sendMessage);

  // Playback state
  const [currentStation, setCurrentStation] = useState<MediaStation>(() => getLastPlayedStation() || CURATED_STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'buffering' | 'playing' | 'error'>('idle');
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamTime, setStreamTime] = useState<number>(213); // 03:33 default aesthetic
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeSideTab, setActiveSideTab] = useState<FoyerFeedTab>('playlist');
  const [isRepeat, setIsRepeat] = useState<boolean>(true);
  const [isRandom, setIsRandom] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingPulse, setRecordingPulse] = useState<number>(0);

  // Channel Expander Modal (triggered by ▲ OPEN)
  const [showChannelExpander, setShowChannelExpander] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaStation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  // Proximity Chat Input & Floating Emoji Particles
  const [chatMessage, setChatMessage] = useState<string>('');
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number; y: number }>>([]);

  // Live Track Metadata
  const [metadata, setMetadata] = useState<TrackMetadata>({
    title: 'Near the Edge',
    artist: 'Penguu',
    album: 'Foyer FM Broadcast',
    stationName: currentStation?.name || 'Foyer FM'
  });

  const howlRef = useRef<Howl | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1:1 Godot Mixmaster Curated Playlist matching the reference asset
  const MIXMASTER_PLAYLIST: TrackItem[] = useMemo(() => [
    {
      id: 'track-1',
      title: 'Near the Edge',
      artist: 'Penguu',
      duration: '03:33',
      station: CURATED_STATIONS[0] || currentStation
    },
    {
      id: 'track-2',
      title: 'Chasing',
      artist: 'Evil Pete',
      duration: '04:24',
      station: CURATED_STATIONS.find(s => s.id === 'nightwave-plaza') || CURATED_STATIONS[1] || currentStation
    },
    {
      id: 'track-3',
      title: 'Radio Ego',
      artist: 'R&R',
      duration: '02:36',
      station: CURATED_STATIONS.find(s => s.id === 'atomicwave-fm') || CURATED_STATIONS[2] || currentStation
    },
    {
      id: 'track-4',
      title: 'Never Gettin Released',
      artist: 'Tool',
      duration: '01:55',
      station: CURATED_STATIONS.find(s => s.id === 'soma-groove-salad') || CURATED_STATIONS[3] || currentStation
    },
    {
      id: 'track-5',
      title: 'Tall Wonder',
      artist: 'UTB',
      duration: '04:07',
      station: CURATED_STATIONS[4] || currentStation
    },
    {
      id: 'track-6',
      title: 'Soaking Drums',
      artist: 'The Q',
      duration: '06:14',
      station: CURATED_STATIONS[5] || currentStation
    },
    {
      id: 'track-7',
      title: "Don't Touch",
      artist: 'JP Flex',
      duration: '03:01',
      station: CURATED_STATIONS[6] || currentStation
    }
  ], [currentStation]);

  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);

  // Audio Playback
  const playStation = (station: MediaStation, trackOverride?: { title: string; artist: string }) => {
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
    setStreamTime(0);

    if (trackOverride) {
      setMetadata({
        title: trackOverride.title,
        artist: trackOverride.artist,
        stationName: station.name
      });
    }

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
          console.warn('Foyer FM stream error:', err);
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
      playStation(currentStation, {
        title: MIXMASTER_PLAYLIST[activeTrackIndex].title,
        artist: MIXMASTER_PLAYLIST[activeTrackIndex].artist
      });
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
    if (howlRef.current) {
      howlRef.current.stop();
    }
    setIsPlaying(false);
    setPlaybackState('idle');
    setStreamTime(0);
  };

  const handleNextTrack = () => {
    const nextIdx = (activeTrackIndex + 1) % MIXMASTER_PLAYLIST.length;
    setActiveTrackIndex(nextIdx);
    playStation(MIXMASTER_PLAYLIST[nextIdx].station, {
      title: MIXMASTER_PLAYLIST[nextIdx].title,
      artist: MIXMASTER_PLAYLIST[nextIdx].artist
    });
  };

  const handlePrevTrack = () => {
    const prevIdx = (activeTrackIndex - 1 + MIXMASTER_PLAYLIST.length) % MIXMASTER_PLAYLIST.length;
    setActiveTrackIndex(prevIdx);
    playStation(MIXMASTER_PLAYLIST[prevIdx].station, {
      title: MIXMASTER_PLAYLIST[prevIdx].title,
      artist: MIXMASTER_PLAYLIST[prevIdx].artist
    });
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

  const handleRecRip = () => {
    setIsRecording(!isRecording);
    setRecordingPulse(prev => prev + 1);
  };

  // Timer simulation
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setStreamTime(t => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

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
    const interval = setInterval(loadMetadata, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentStation]);

  // Canvas Oscilloscope / Spectrum Visualizer inside the Foyer FM Screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const draw = () => {
      phase += 0.05;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const numBars = 24;
      const barWidth = w / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 3;
        if (isPlaying) {
          const amp = Math.sin(phase * 1.8 + i * 0.45) * 0.5 + 0.5;
          const noise = Math.random() * 0.35;
          barHeight = Math.max(3, (amp * 0.8 + noise * 0.2) * (h - 4));
        }

        const grad = ctx.createLinearGradient(0, h, 0, h - barHeight);
        grad.addColorStop(0, '#00d9ff');
        grad.addColorStop(0.7, '#00a3ff');
        grad.addColorStop(1, '#ffffff');

        ctx.fillStyle = grad;
        ctx.fillRect(i * (barWidth + 2), h - barHeight, barWidth, barHeight);
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
      x: 35 + Math.random() * 30,
      y: 70
    };
    setFloatingEmojis(prev => [...prev.slice(-10), newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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
      const results = await searchRadioStations(query, 25);
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
            className="absolute text-3xl animate-bounce transition-all duration-1000 ease-out"
            style={{
              left: `${item.x}%`,
              bottom: `${item.y}%`,
              opacity: 0.9,
              filter: 'drop-shadow(0 0 10px rgba(0,217,255,0.8))'
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 1. MINIMIZED SLIM DOCK CAPSULE                           */}
      {/* ======================================================== */}
      {isMinimized ? (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#0c1422]/95 border border-cyan-500/50 backdrop-blur-xl px-4 py-2 rounded-full shadow-[0_0_30px_rgba(0,217,255,0.35)] select-none animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-cyan-400 opacity-75' : 'bg-transparent'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-cyan-500 shadow-[0_0_8px_#00d9ff]' : 'bg-gray-500'}`} />
            </span>
            <span className="text-xs font-black tracking-widest text-cyan-400 font-mono">FOYER FM</span>
          </div>

          <span className="text-gray-500">|</span>

          {/* Marquee snippet */}
          <div className="w-48 overflow-hidden whitespace-nowrap text-xs text-white font-medium">
            <span className="animate-marquee inline-block">
              {metadata.title} - {metadata.artist}
            </span>
          </div>

          {/* Mini Play/Pause */}
          <button
            onClick={handleTogglePlay}
            className="w-7 h-7 rounded-full bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/60 flex items-center justify-center text-cyan-300 transition-all cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* Expand to full 1:1 Mixmaster Disc */}
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer"
            title="Expand Full Console"
          >
            <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPAND</span>
          </button>
        </div>
      ) : (

        /* ======================================================== */
        /* 2. FULL 1:1 GODOT MIXMASTER (FOYER FM) ASSET REPLICA    */
        /* ======================================================== */
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 select-none animate-in fade-in zoom-in-95 duration-200">
          
          {/* Main Cybernetic Disc Body Container */}
          <div className="relative w-[500px] h-[500px] max-w-[96vw] max-h-[82vh] aspect-square flex items-center justify-center filter drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
            
            {/* ---------------------------------------------------- */}
            {/* LAYER A: BRUSHED TITANIUM / STEEL OUTER BEZEL RING   */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-0 rounded-full border-[6px] border-[#2a3b50] shadow-[inset_0_2px_8px_rgba(255,255,255,0.4),0_0_35px_rgba(0,0,0,0.9)]"
              style={{
                background: 'conic-gradient(from 180deg at 50% 50%, #152233 0deg, #27384d 45deg, #172436 90deg, #374d68 135deg, #182638 180deg, #2a3c52 225deg, #152233 270deg, #364c67 315deg, #152233 360deg)'
              }}
            />

            {/* WHITE ARMOR CLAMPS / MOUNTING BRACKETS (1:1 with Image) */}
            {/* Clamp 1: Top-Right Bracket */}
            <div className="absolute -top-1.5 right-12 w-28 h-8 rounded-md bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-slate-500 shadow-xl transform rotate-25 z-10 flex items-center justify-between px-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
              <div className="h-4 w-12 border-x border-slate-400/80 bg-slate-300/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
            </div>

            {/* Clamp 2: Bottom-Left Bracket */}
            <div className="absolute -bottom-1.5 left-12 w-28 h-8 rounded-md bg-gradient-to-b from-white via-slate-200 to-slate-400 border border-slate-500 shadow-xl transform -rotate-25 z-10 flex items-center justify-between px-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
              <div className="h-4 w-12 border-x border-slate-400/80 bg-slate-300/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-inner" />
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER B: RADIAL TURBINE NOTCHES / GLOWING CYAN LOUVERS */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-5 rounded-full border-[3px] border-[#132c4a] bg-gradient-to-b from-[#0f233a] to-[#071322] flex items-center justify-center overflow-hidden shadow-[inset_0_0_25px_rgba(0,180,255,0.25)]">
              {/* Radial Notched Louver Fins */}
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-7 bg-gradient-to-t from-cyan-400 to-[#0066aa] rounded-sm shadow-[0_0_8px_#00e1ff]"
                  style={{
                    transform: `rotate(${i * 20}deg) translateY(-210px)`,
                    opacity: isPlaying ? 0.9 : 0.4
                  }}
                />
              ))}
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER C: BRUSHED SILVER INNER BEZEL                   */}
            {/* ---------------------------------------------------- */}
            <div 
              className="absolute inset-10 rounded-full border-[5px] border-[#536882] shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_0_20px_rgba(0,0,0,0.7)]"
              style={{
                background: 'conic-gradient(from 0deg at 50% 50%, #9cb2c9 0deg, #cbd7e4 90deg, #7c93ab 180deg, #cbd7e4 270deg, #9cb2c9 360deg)'
              }}
            />

            {/* ---------------------------------------------------- */}
            {/* LAYER D: CENTRAL DIGITAL LCD SCREEN (DARK CYAN GLASS) */}
            {/* ---------------------------------------------------- */}
            <div className="absolute inset-14 rounded-full bg-gradient-to-b from-[#10243b] via-[#081524] to-[#040b14] border-2 border-cyan-400/40 shadow-[inset_0_0_40px_rgba(0,217,255,0.25),0_0_15px_rgba(0,0,0,0.9)] flex flex-col items-center justify-between p-5 text-white overflow-hidden z-10 font-sans">
              
              {/* Scanline Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />

              {/* TOP HEADER: TIME & BITRATE FORMAT (1:1 Item 11) */}
              <div className="w-full pt-1 px-4 flex items-center justify-between border-b border-cyan-500/25 pb-1 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xl font-black text-cyan-300 drop-shadow-[0_0_8px_#00e1ff]">
                    {formatTime(streamTime)}
                  </span>
                  <span className="text-[9px] text-cyan-400/70 font-mono uppercase tracking-wider">TRACK</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-cyan-200 block tracking-wider uppercase">
                    STEREO 128 kBit/s
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono font-semibold flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
                  </span>
                </div>
              </div>

              {/* MARQUEE RUNNER: SONG NAME HERE - LAL ▶ */}
              <div className="w-full px-2 py-0.5 bg-[#0a1829]/90 border border-cyan-500/30 rounded text-center overflow-hidden z-10 my-1">
                <div className="font-mono text-xs font-black text-white tracking-wider truncate text-cyan-300 drop-shadow-[0_0_6px_rgba(0,217,255,0.5)]">
                  {metadata.title} - {metadata.artist} ▶
                </div>
              </div>

              {/* TRACK POSITION AUDIO EQUALIZER BARS (Visualizer) */}
              <div className="w-full px-2 h-4 z-10">
                <canvas ref={canvasRef} width={280} height={16} className="w-full h-full" />
              </div>

              {/* ---------------------------------------------------- */}
              {/* CENTER CONSOLIDATED SCREEN (PLAYLIST / FEEDS / CHAT) */}
              {/* ---------------------------------------------------- */}
              <div className="w-full flex-1 max-h-[145px] overflow-hidden my-1 rounded bg-[#06101c]/80 border border-cyan-500/30 p-1.5 flex flex-col z-10">
                
                {/* 1. FOYER FM PLAYLIST VIEW (Default) */}
                {activeSideTab === 'playlist' && (
                  <div className="flex-1 flex gap-2 overflow-hidden text-[11px] font-mono">
                    {/* Tracklist Items */}
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {MIXMASTER_PLAYLIST.map((track, idx) => (
                        <button
                          key={track.id}
                          onClick={() => {
                            setActiveTrackIndex(idx);
                            playStation(track.station, { title: track.title, artist: track.artist });
                          }}
                          className={`w-full flex items-center justify-between px-1.5 py-0.5 rounded text-left transition-all cursor-pointer ${
                            activeTrackIndex === idx && isPlaying
                              ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/50 shadow-[0_0_8px_rgba(0,217,255,0.3)]'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate max-w-[140px]">{track.title} - {track.artist}</span>
                          <span className="text-[10px] text-cyan-400/80 ml-1">{track.duration}</span>
                        </button>
                      ))}
                    </div>

                    {/* Right Playlist Actions (1:1 with Image Item 15a) */}
                    <div className="w-12 flex flex-col gap-0.5 shrink-0 text-[8px] font-mono font-bold">
                      <button onClick={() => setShowChannelExpander(true)} className="px-1 py-0.5 bg-[#0e2136] hover:bg-cyan-600/40 border border-cyan-500/40 rounded text-cyan-300 text-center">ADD</button>
                      <button onClick={handleStop} className="px-1 py-0.5 bg-[#0e2136] hover:bg-cyan-600/40 border border-cyan-500/40 rounded text-cyan-300 text-center">CLEAR</button>
                      <button onClick={() => playStation(CURATED_STATIONS[0])} className="px-1 py-0.5 bg-[#0e2136] hover:bg-cyan-600/40 border border-cyan-500/40 rounded text-cyan-300 text-center">LOAD</button>
                      <button onClick={() => saveLastPlayedStation(currentStation)} className="px-1 py-0.5 bg-[#0e2136] hover:bg-cyan-600/40 border border-cyan-500/40 rounded text-cyan-300 text-center">SAVE</button>
                      <button onClick={() => setShowChannelExpander(true)} className="px-1 py-0.5 bg-[#0e2136] hover:bg-cyan-600/40 border border-cyan-500/40 rounded text-cyan-300 text-center">INFO</button>
                    </div>
                  </div>
                )}

                {/* 2. TRENDING / FOLLOWING FOYER FEED */}
                {activeSideTab === 'trending' && (
                  <div className="flex-1 overflow-y-auto space-y-1.5 text-[10px] pr-1">
                    <div className="p-1 rounded bg-[#0d2238]/60 border border-cyan-500/30">
                      <div className="flex items-center justify-between text-cyan-400 font-bold">
                        <span>★ @MetaMike</span>
                        <span className="text-gray-400">2m ago</span>
                      </div>
                      <p className="text-gray-200 mt-0.5">District live streams are peaking in Plaza Alpha! Node mesh holding strong.</p>
                    </div>
                    <div className="p-1 rounded bg-[#0d2238]/60 border border-cyan-500/30">
                      <div className="flex items-center justify-between text-cyan-400 font-bold">
                        <span>★ @NovaVoxel</span>
                        <span className="text-gray-400">8m ago</span>
                      </div>
                      <p className="text-gray-200 mt-0.5">New rooftop DJ set broadcasting on Foyer FM right now.</p>
                    </div>
                  </div>
                )}

                {/* 3. CIVIC NEWS FEED */}
                {activeSideTab === 'news' && (
                  <div className="flex-1 overflow-y-auto space-y-1.5 text-[10px] pr-1">
                    <div className="p-1 rounded bg-[#0d2238]/60 border border-cyan-500/30">
                      <span className="text-cyan-400 font-bold block">PROTOCOL ALERT</span>
                      <span className="text-gray-200">Decentralized radio nodes synchronized. High-bandwidth audio mesh active.</span>
                    </div>
                    <div className="p-1 rounded bg-[#0d2238]/60 border border-cyan-500/30">
                      <span className="text-emerald-400 font-bold block">TREASURY PROPOSAL #14</span>
                      <span className="text-gray-200">Community pool funding for creator streaming node verified.</span>
                    </div>
                  </div>
                )}

                {/* 4. PROXIMITY CHAT WITH LIVE INPUT */}
                {activeSideTab === 'proximity' && (
                  <div className="flex-1 flex flex-col overflow-hidden text-[10px]">
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono">
                      {chatHistory.slice(-5).map(msg => (
                        <div key={msg.id} className="leading-tight">
                          <span className={`font-bold mr-1 ${msg.color || 'text-cyan-400'}`}>{msg.username}:</span>
                          <span className="text-gray-200">{msg.text}</span>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendProximityChat} className="mt-1 flex gap-1">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        placeholder="Say to nearby citizens..."
                        className="flex-1 bg-[#0b1b2d] border border-cyan-500/40 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button type="submit" className="px-2 py-0.5 bg-cyan-500/30 border border-cyan-400 rounded text-cyan-300">
                        <Send className="w-2.5 h-2.5" />
                      </button>
                    </form>
                  </div>
                )}

                {/* 5. INTERACTIVE EMOJIS REACTION PAD */}
                {activeSideTab === 'emojis' && (
                  <div className="flex-1 flex flex-wrap items-center justify-center gap-1.5 p-1">
                    {['🔥', '💎', '🚀', '⚡', '🛡️', '🌐', '❤️', '🎉', '👽', '🎧', '🕹️', '👾'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleTriggerEmoji(emoji)}
                        className="text-lg p-1 rounded hover:bg-cyan-500/20 hover:scale-125 transition-transform cursor-pointer"
                        title="Send emoji reaction"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PLAYLIST POSITION BAR (1:1 with Image Item 13) */}
              <div className="w-full flex items-center justify-between text-[8px] font-mono text-cyan-400/80 px-2 py-0.5 border-t border-cyan-500/20 z-10">
                <span>PLAYLIST POSITION</span>
                <span className="text-white font-bold">TOTAL: 01:55:20</span>
              </div>

              {/* ---------------------------------------------------- */}
              {/* REPLACING "GODOT" WITH "FOYER FM" (1:1 Item 14)      */}
              {/* ---------------------------------------------------- */}
              <div className="w-full pb-1 flex items-center justify-center gap-2 border-t border-cyan-500/30 pt-1 z-10">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-black text-sm tracking-widest text-cyan-300 drop-shadow-[0_0_10px_#00e1ff]">
                  FOYER FM
                </span>
                <span className="text-[9px] font-mono text-cyan-400/70 uppercase">AUDIO WIZARD</span>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER E: LEFT MECHANICAL CONTROL POD (1:1 Item 1-10)  */}
            {/* ---------------------------------------------------- */}
            <div className="absolute -left-14 top-1/2 -translate-y-1/2 w-32 h-64 bg-gradient-to-r from-[#17273a] to-[#20334a] border-2 border-[#384e68] rounded-xl shadow-2xl p-2 flex flex-col justify-between z-20 font-mono text-[9px]">
              
              {/* Top Tabs: REPEAT PLAYLIST / RANDOM (1:1 Item 22, 23) */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`w-full py-0.5 px-1 rounded border text-center transition-all ${
                    isRepeat ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold' : 'bg-[#0f1d2c] border-white/10 text-gray-400'
                  }`}
                >
                  REPEAT PLAYLIST
                </button>
                <button
                  onClick={() => setIsRandom(!isRandom)}
                  className={`w-full py-0.5 px-1 rounded border text-center transition-all ${
                    isRandom ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 font-bold' : 'bg-[#0f1d2c] border-white/10 text-gray-400'
                  }`}
                >
                  RANDOM
                </button>
              </div>

              {/* ▲ OPEN (CHANNEL EXPANDER - Item 24) */}
              <button
                onClick={() => setShowChannelExpander(true)}
                className="w-full py-1.5 bg-gradient-to-r from-cyan-600/40 to-blue-600/40 hover:from-cyan-500/60 hover:to-blue-500/60 border border-cyan-400 rounded text-cyan-200 font-black text-center tracking-wider shadow-[0_0_12px_rgba(0,217,255,0.3)] cursor-pointer flex items-center justify-center gap-1"
                title="Open Channel Expander (60,000+ Stations)"
              >
                <span>▲ OPEN</span>
              </button>

              {/* Main Transport Deck (1:1 Items 1, 2, 3, 4, 5, 6) */}
              <div className="grid grid-cols-2 gap-1 my-1">
                {/* STOP (Item 2) */}
                <button
                  onClick={handleStop}
                  className="py-1.5 bg-[#0e1926] hover:bg-red-500/20 border border-red-500/40 rounded flex flex-col items-center justify-center text-red-400 font-bold"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span className="text-[7px] mt-0.5">STOP</span>
                </button>

                {/* PLAY / PAUSE (Item 3, 4) */}
                <button
                  onClick={handleTogglePlay}
                  className="py-1.5 bg-[#0e1926] hover:bg-cyan-500/30 border border-cyan-400 rounded flex flex-col items-center justify-center text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,217,255,0.3)]"
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span className="text-[7px] mt-0.5">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>
              </div>

              {/* Center Large REC/RIP Dial (1:1 Item 1) */}
              <div className="flex items-center justify-center my-1">
                <button
                  onClick={handleRecRip}
                  className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-600/40 border-red-400 text-white shadow-[0_0_15px_#ef4444]'
                      : 'bg-[#0f1d2c] border-[#384e68] text-gray-300 hover:border-cyan-400'
                  }`}
                  title="Record / Rip Stream Clip"
                >
                  <div className={`w-3 h-3 rounded-full mb-0.5 ${isRecording ? 'bg-red-500 animate-ping' : 'bg-red-500/70'}`} />
                  <span className="text-[6.5px] font-black">REC/RIP</span>
                </button>
              </div>

              {/* NEXT / PREV (1:1 Items 5, 6) */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={handlePrevTrack}
                  className="py-1 bg-[#0e1926] hover:bg-white/10 border border-white/20 rounded flex items-center justify-center text-gray-300"
                >
                  <SkipBack className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNextTrack}
                  className="py-1 bg-[#0e1926] hover:bg-white/10 border border-white/20 rounded flex items-center justify-center text-gray-300"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>

              {/* Bottom Tags: CD COPY, FILE .WAV (1:1 Items 7, 8, 9) */}
              <div className="pt-1 border-t border-white/10 text-[7px] text-gray-400 text-center">
                <span>IN • OUT | .WAV / 320K</span>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* LAYER F: RIGHT PERIMETER TABS (REPLACING CLOSE/MIN)  */}
            {/* USER INSTRUCTION: Replace with Trending, News, Chat  */}
            {/* ---------------------------------------------------- */}
            <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 font-mono text-[9px] font-bold">
              
              {/* Tab 1: FOYER PLAYLIST */}
              <button
                onClick={() => setActiveSideTab('playlist')}
                className={`px-3 py-1.5 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer ${
                  activeSideTab === 'playlist'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.4)]'
                    : 'bg-[#142335]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#1a2d44]'
                }`}
              >
                <span>📻 STATIONS</span>
              </button>

              {/* Tab 2: TRENDING / FOLLOWING */}
              <button
                onClick={() => setActiveSideTab('trending')}
                className={`px-3 py-1.5 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer ${
                  activeSideTab === 'trending'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.4)]'
                    : 'bg-[#142335]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#1a2d44]'
                }`}
              >
                <span>🔥 TRENDING</span>
              </button>

              {/* Tab 3: CIVIC NEWS */}
              <button
                onClick={() => setActiveSideTab('news')}
                className={`px-3 py-1.5 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer ${
                  activeSideTab === 'news'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.4)]'
                    : 'bg-[#142335]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#1a2d44]'
                }`}
              >
                <span>📰 CIVIC NEWS</span>
              </button>

              {/* Tab 4: PROXIMITY CHAT */}
              <button
                onClick={() => setActiveSideTab('proximity')}
                className={`px-3 py-1.5 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer ${
                  activeSideTab === 'proximity'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.4)]'
                    : 'bg-[#142335]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#1a2d44]'
                }`}
              >
                <span>💬 PROX CHAT</span>
              </button>

              {/* Tab 5: EMOJIS */}
              <button
                onClick={() => setActiveSideTab('emojis')}
                className={`px-3 py-1.5 rounded-r-lg border-y border-r transition-all text-left shadow-lg cursor-pointer ${
                  activeSideTab === 'emojis'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.4)]'
                    : 'bg-[#142335]/90 border-white/20 text-gray-300 hover:text-white hover:bg-[#1a2d44]'
                }`}
              >
                <span>✨ EMOJIS</span>
              </button>

              {/* VOLUME ROCKER (- / + VOLUME - 1:1 Item 16, 17) */}
              <div className="mt-1 flex items-center justify-between bg-[#0e1926] border border-cyan-500/40 rounded px-1.5 py-1 text-cyan-300">
                <button onClick={handleVolumeDown} className="p-0.5 hover:text-white cursor-pointer"><Minus className="w-3 h-3" /></button>
                <span className="text-[7.5px]">{Math.round(volume * 100)}%</span>
                <button onClick={handleVolumeUp} className="p-0.5 hover:text-white cursor-pointer"><Plus className="w-3 h-3" /></button>
              </div>

              {/* MINIMIZE HUD BUTTON */}
              <button
                onClick={() => setIsMinimized(true)}
                className="mt-1 px-3 py-1 rounded-r-lg bg-white/5 hover:bg-white/15 border-y border-r border-white/10 text-gray-400 hover:text-white text-left transition-all cursor-pointer flex items-center gap-1"
                title="Minimize Media Asset to Dock"
              >
                <ChevronDown className="w-3 h-3" />
                <span className="text-[8px]">MIN DOCK</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CHANNEL EXPANDER MODAL (Triggered by ▲ OPEN Button)   */}
      {/* ======================================================== */}
      {showChannelExpander && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#09131f] border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_50px_rgba(0,217,255,0.4)] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#0d2238] to-[#163656] border-b border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="font-black text-sm tracking-widest text-white uppercase">
                  FOYER FM • CHANNEL EXPANDER
                </span>
                <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 font-mono">60,000+ STATIONS</span>
              </div>
              <button onClick={() => setShowChannelExpander(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 bg-[#06101c] border-b border-cyan-500/20">
              <div className="relative">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchStations(e.target.value)}
                  placeholder="Search stations by name, genre, frequency (e.g. Synthwave, Lofi, Cyberpunk, SomaFM)..."
                  className="w-full bg-[#0a1829] border border-cyan-500/40 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Genre Quick Filters */}
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 text-[11px] font-mono">
                {['ALL', 'SYNTH', 'VAPOR', 'LOFI', 'HACK', 'CHILL', 'AMBIENT', 'PODCAST'].map(genre => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre.toLowerCase());
                      if (genre !== 'ALL') handleSearchStations(genre.toLowerCase());
                      else setSearchQuery('');
                    }}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap border transition-all ${
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
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[50vh] scrollbar-thin">
              {(searchQuery.trim() ? searchResults : CURATED_STATIONS).map(station => (
                <div
                  key={station.id}
                  onClick={() => {
                    playStation(station, { title: station.name, artist: station.tags?.[0]?.toUpperCase() || 'BROADCAST' });
                    setShowChannelExpander(false);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    currentStation.id === station.id && isPlaying
                      ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,217,255,0.2)]'
                      : 'bg-[#0a1829]/70 border-[#23354d] text-gray-300 hover:bg-[#10243b] hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{station.name}</h4>
                      <p className="text-[10px] text-gray-400">{station.description || station.tags?.join(' • ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {station.bitrate ? `${station.bitrate}k` : '128k'}
                    </span>
                    <Play className="w-4 h-4 text-cyan-400" />
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
