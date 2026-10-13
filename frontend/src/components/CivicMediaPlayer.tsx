import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Music, 
  Zap, 
  Radio, 
  Search, 
  Maximize2, 
  X, 
  RefreshCw,
  Sparkles,
  SkipBack,
  SkipForward,
  Activity,
  Disc,
  Sliders
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { 
  MediaStation, 
  CURATED_STATIONS, 
  fetchStationsByTag, 
  searchRadioStations, 
  getLastPlayedStation, 
  saveLastPlayedStation,
  fetchLiveTrackMetadata,
  TrackMetadata
} from '../services/mediaService';

export const CivicMediaPlayer: React.FC = () => {
  const { user } = useGameStore();

  // Playback state
  const [currentStation, setCurrentStation] = useState<MediaStation>(() => getLastPlayedStation());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'buffering' | 'playing' | 'error'>('idle');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamTime, setStreamTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Track Metadata (Title, Artist, Album, Artwork)
  const [metadata, setMetadata] = useState<TrackMetadata>({
    title: currentStation.name,
    artist: currentStation.tags?.[0]?.toUpperCase() || 'CIVICVERSE BROADCAST',
    album: currentStation.description || 'Foyer FM',
    stationName: currentStation.name
  });

  // Visualizer Mode: 'xbox' (OG Xbox toxic-green matrix) | 'winxp' (Windows XP WMP spectrum & scope) | 'vumeter' (analog meters)
  const [visualizerMode, setVisualizerMode] = useState<'xbox' | 'winxp' | 'vumeter'>('xbox');
  const [bassPulse, setBassPulse] = useState<number>(0);

  // Search & 60,000+ Open Stations Explorer Modal
  const [showExplorer, setShowExplorer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaStation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Audio & Animation refs
  const howlRef = useRef<Howl | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Curated Preset Channels for the Boombox
  const PRESET_CHANNELS: MediaStation[] = [
    CURATED_STATIONS.find(s => s.id === 'defcon-radio') || CURATED_STATIONS[0],
    CURATED_STATIONS.find(s => s.id === 'nightwave-plaza') || CURATED_STATIONS[5],
    CURATED_STATIONS.find(s => s.id === 'atomicwave-fm') || CURATED_STATIONS[6],
    CURATED_STATIONS.find(s => s.id === 'soma-groove-salad') || CURATED_STATIONS[8],
  ];

  const PRESET_LABELS = [
    { id: 'defcon', label: 'DEF CON', genre: 'HACK' },
    { id: 'plaza', label: 'PLAZA', genre: 'VAPOR' },
    { id: 'atomic', label: 'ATOMIC', genre: 'SYNTH' },
    { id: 'groove', label: 'GROOVE', genre: 'CHILL' },
  ];

  // --------------------------------------------------------------------------
  // AUDIO ENGINE (HOWLER.JS WITH HTML5 AUDIO STREAMING)
  // --------------------------------------------------------------------------
  const playStation = (station: MediaStation) => {
    if (!station || !station.url) return;

    if (currentStation.id === station.id && howlRef.current) {
      if (isPlaying) {
        howlRef.current.pause();
        setIsPlaying(false);
        setPlaybackState('idle');
      } else {
        howlRef.current.play();
        setIsPlaying(true);
        setPlaybackState('playing');
      }
      return;
    }

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
    setErrorMessage(null);
    setIsPlaying(true);
    setStreamTime(0);

    // Initial placeholder metadata while stream connects
    setMetadata({
      title: station.name,
      artist: 'TUNING STREAM...',
      album: station.description || 'Foyer FM Broadcast',
      stationName: station.name
    });

    try {
      const sound = new Howl({
        src: [station.url],
        html5: true, // Enables continuous stream buffering
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
          console.warn('Howler stream error:', err);
          setPlaybackState('error');
          setIsPlaying(false);
          setErrorMessage('Stream connection offline');
        },
        onplayerror: () => {
          sound.once('unlock', () => sound.play());
          setPlaybackState('error');
          setIsPlaying(false);
          setErrorMessage('Tap play to unlock browser audio');
        }
      });

      howlRef.current = sound;
    } catch (err: any) {
      setPlaybackState('error');
      setIsPlaying(false);
      setErrorMessage(err.message || 'Stream error');
    }
  };

  const handleTogglePlay = () => {
    if (!howlRef.current) {
      playStation(currentStation);
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

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (howlRef.current) {
      howlRef.current.volume(nextMuted ? 0 : volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (howlRef.current) {
      howlRef.current.volume(newVol);
    }
  };

  const handlePrevStation = () => {
    const curIdx = PRESET_CHANNELS.findIndex(s => s.id === currentStation.id);
    const prevIdx = curIdx <= 0 ? PRESET_CHANNELS.length - 1 : curIdx - 1;
    playStation(PRESET_CHANNELS[prevIdx]);
  };

  const handleNextStation = () => {
    const curIdx = PRESET_CHANNELS.findIndex(s => s.id === currentStation.id);
    const nextIdx = curIdx < 0 || curIdx >= PRESET_CHANNELS.length - 1 ? 0 : curIdx + 1;
    playStation(PRESET_CHANNELS[nextIdx]);
  };

  const toggleVisualizerMode = () => {
    setVisualizerMode(prev => {
      if (prev === 'xbox') return 'winxp';
      if (prev === 'winxp') return 'vumeter';
      return 'xbox';
    });
  };

  // --------------------------------------------------------------------------
  // LIVE TRACK METADATA POLLER (TITLE, ARTIST, ALBUM)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      try {
        const data = await fetchLiveTrackMetadata(currentStation);
        if (isMounted) {
          setMetadata(data);
        }
      } catch (err) {
        console.warn('Metadata fetch error:', err);
      }
    };

    loadMetadata();

    // Poll every 10 seconds while playing for live now-playing updates
    let pollInterval: any = null;
    if (isPlaying) {
      pollInterval = setInterval(loadMetadata, 10000);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentStation, isPlaying]);

  // Live timer & position tracker
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

  // --------------------------------------------------------------------------
  // RETRO VISUAL EQUALIZER (OG XBOX & WINDOWS XP MODES)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numBars = 16;
    const barHeights = new Array(numBars).fill(2);
    const peakHeights = new Array(numBars).fill(2);
    const peakHolds = new Array(numBars).fill(0);
    let vuLeft = 0.2;
    let vuRight = 0.2;
    let phase = 0;

    let animId: number;

    const render = () => {
      phase += 0.08;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Procedural audio frequency simulation with realistic beat dynamics
      let bassTotal = 0;
      for (let i = 0; i < numBars; i++) {
        let target = 2;
        if (isPlaying && playbackState === 'playing') {
          const freqWeight = i < 4 
            ? (Math.sin(phase * 1.6 + i * 0.8) * 0.5 + 0.5) * 0.95 + Math.random() * 0.35 // Bass
            : i < 10 
            ? (Math.sin(phase * 2.3 + i * 0.6) * 0.5 + 0.5) * 0.8 + Math.random() * 0.3  // Mids
            : (Math.sin(phase * 3.2 + i * 1.2) * 0.5 + 0.5) * 0.7 + Math.random() * 0.25; // Treble

          target = Math.min(h - 4, Math.max(3, freqWeight * (h - 6)));
        } else if (playbackState === 'buffering') {
          target = (Math.sin(phase * 2 + i * 0.5) * 0.5 + 0.5) * (h * 0.6) + 3;
        }

        barHeights[i] += (target - barHeights[i]) * 0.35;

        // Peak Hold logic with simulated gravity
        if (barHeights[i] >= peakHeights[i]) {
          peakHeights[i] = barHeights[i];
          peakHolds[i] = 12; // Hold at top
        } else {
          if (peakHolds[i] > 0) {
            peakHolds[i]--;
          } else {
            peakHeights[i] = Math.max(2, peakHeights[i] - 1.2); // Gravity decay
          }
        }

        if (i < 4) {
          bassTotal += barHeights[i];
        }
      }

      // Bass pulse value for speaker throbbing
      const normBass = isPlaying && playbackState === 'playing' ? (bassTotal / (4 * h)) : 0;
      setBassPulse(normBass);

      // Stereo VU meter channels
      const targetVuL = (barHeights[1] + barHeights[3] + barHeights[5]) / (3 * h);
      const targetVuR = (barHeights[2] + barHeights[4] + barHeights[6]) / (3 * h);
      vuLeft += (targetVuL - vuLeft) * 0.3;
      vuRight += (targetVuR - vuRight) * 0.3;

      // ------------------------------------------------------------------------
      // RENDER MODE: 1. OG XBOX DASHBOARD EQUALIZER
      // ------------------------------------------------------------------------
      if (visualizerMode === 'xbox') {
        if (isPlaying) {
          const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, w / 2);
          bgGrad.addColorStop(0, 'rgba(0, 255, 65, 0.25)');
          bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);
        }

        const barWidth = Math.floor((w - (numBars * 2.5)) / numBars);
        const segH = 2;
        const segGap = 1;

        for (let i = 0; i < numBars; i++) {
          const x = i * (barWidth + 2.5) + 2;
          const currentH = Math.max(2, barHeights[i]);
          const numSegs = Math.floor(currentH / (segH + segGap));

          ctx.shadowColor = '#00ff41';
          ctx.shadowBlur = isPlaying ? 4 : 0;

          for (let s = 0; s < numSegs; s++) {
            const segY = h - (s + 1) * (segH + segGap);
            ctx.fillStyle = s > 11 ? '#a3ffb8' : '#00ff41';
            ctx.fillRect(x, segY, barWidth, segH);
          }

          // Floating lime-white peak needle
          const peakY = Math.max(1, h - peakHeights[i]);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 4;
          ctx.fillRect(x, peakY, barWidth, 1.5);
        }
        ctx.shadowBlur = 0;

      // ------------------------------------------------------------------------
      // RENDER MODE: 2. WINDOWS XP WMP SPECTRUM & SCOPE
      // ------------------------------------------------------------------------
      } else if (visualizerMode === 'winxp') {
        const barWidth = Math.floor((w - (numBars * 2)) / numBars);
        for (let i = 0; i < numBars; i++) {
          const x = i * (barWidth + 2) + 2;
          const currentH = Math.max(2, barHeights[i]);
          const y = h - currentH;

          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, '#ef4444');   // Red peak
          grad.addColorStop(0.3, '#f59e0b');  // Yellow mid-high
          grad.addColorStop(0.7, '#10b981');  // Green mid
          grad.addColorStop(1, '#00f3ff');    // Cyan base

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, currentH);

          // Peak cap needle
          const peakY = Math.max(1, h - peakHeights[i]);
          ctx.fillStyle = '#f87171';
          ctx.fillRect(x, peakY, barWidth, 1.5);
        }

        // Oscilloscope Sine Waveform
        if (isPlaying && playbackState === 'playing') {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.9)';
          ctx.lineWidth = 1.2;
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 4;
          for (let x = 0; x < w; x += 2) {
            const wave = Math.sin(x * 0.08 + phase) * (normBass * 12 + 3) +
                         Math.sin(x * 0.16 - phase * 1.5) * (normBass * 5 + 1);
            const y = h / 2 + wave;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

      // ------------------------------------------------------------------------
      // RENDER MODE: 3. STEREO ANALOG VU METERS
      // ------------------------------------------------------------------------
      } else {
        const meterW = (w / 2) - 5;
        const meterH = h - 4;

        const drawMeter = (startX: number, level: number, label: string) => {
          ctx.fillStyle = '#061609';
          ctx.fillRect(startX, 2, meterW, meterH);
          ctx.strokeStyle = '#1e3a24';
          ctx.strokeRect(startX, 2, meterW, meterH);

          const glow = ctx.createRadialGradient(startX + meterW / 2, 2 + meterH, 2, startX + meterW / 2, 2 + meterH, meterW);
          glow.addColorStop(0, 'rgba(0, 255, 65, 0.35)');
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(startX, 2, meterW, meterH);

          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1;
          for (let i = 0; i <= 5; i++) {
            const tx = startX + 8 + i * (meterW - 16) / 5;
            ctx.beginPath();
            ctx.moveTo(tx, 6);
            ctx.lineTo(tx, 9);
            ctx.stroke();
          }

          const clampedLvl = Math.min(1, Math.max(0, level));
          const needleAngle = -Math.PI * 0.65 + clampedLvl * (Math.PI * 0.5);
          const pivotX = startX + meterW / 2;
          const pivotY = 2 + meterH + 2;
          const needleLen = meterH * 0.85;

          const tipX = pivotX + Math.cos(needleAngle) * needleLen;
          const tipY = pivotY + Math.sin(needleAngle) * needleLen;

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 3;
          ctx.beginPath();
          ctx.moveTo(pivotX, pivotY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#39ff14';
          ctx.font = '8px monospace';
          ctx.fillText(label, startX + 4, 2 + meterH - 3);

          const isClipping = clampedLvl > 0.82;
          ctx.fillStyle = isClipping ? '#ff0000' : '#450a0a';
          if (isClipping) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 5;
          }
          ctx.beginPath();
          ctx.arc(startX + meterW - 6, 8, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        };

        drawMeter(2, vuLeft, 'CH L');
        drawMeter(w / 2 + 2, vuRight, 'CH R');
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, playbackState, visualizerMode]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        try {
          howlRef.current.stop();
          howlRef.current.unload();
        } catch (e) {}
      }
    };
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSearchStations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchRadioStations(searchQuery.trim(), 20);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#070b14] overflow-hidden select-none border-t border-[#1a253a]">
      
      {/* ==================================================================== */}
      {/* 1. SINGLE UNIFIED HEADER: FOYER FM (CLEAN & SLEEK)                  */}
      {/* ==================================================================== */}
      <div className="p-2 px-3 bg-stainless-steel flex items-center justify-between border-b border-stainless-steel shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black tracking-wider text-white uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
              FOYER FM
            </span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold tracking-tight">
              98.5 MHz • STEREO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Visualizer Mode Toggle Button (Xbox / XP / VU) */}
          <button
            onClick={toggleVisualizerMode}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all border flex items-center gap-1 ${
              visualizerMode === 'xbox'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-[#00ff41] shadow-[0_0_6px_rgba(0,255,65,0.3)]'
                : visualizerMode === 'winxp'
                ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
            }`}
            title="Toggle Visualizer Mode (OG Xbox / Windows XP / VU Meters)"
          >
            <Activity className="w-2.5 h-2.5" />
            <span>{visualizerMode === 'xbox' ? 'XBOX DSP' : visualizerMode === 'winxp' ? 'WMP XP' : 'VU METERS'}</span>
          </button>

          {/* Search / Station Tuner Modal */}
          <button 
            onClick={() => setShowExplorer(true)} 
            className="text-gray-400 hover:text-cyan-400 p-1 hover:bg-cyan-950/40 rounded transition-colors" 
            title="Search 60,000+ Open Stations & Podcasts"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {/* Maximize Player */}
          <button 
            onClick={() => setShowExplorer(true)} 
            className="text-gray-400 hover:text-white p-1 hover:bg-gray-800/40 rounded transition-colors" 
            title="Open Tuner Explorer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. RETRO-CYBER BOOMBOX CHASSIS & CONSOLE                            */}
      {/* ==================================================================== */}
      <div className="relative flex-1 bg-stainless-steel-dark p-2 flex flex-col justify-between overflow-hidden">
        
        {/* Top Metallic Handle & Screw Accents */}
        <div className="flex items-center justify-between px-1 mb-1 shrink-0 opacity-70">
          <span className="text-[7px] font-mono text-gray-500 tracking-widest font-black">⊕ CV-BB9000</span>
          <div className="h-1 flex-1 mx-3 rounded-full bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
          <span className="text-[7px] font-mono text-gray-500 tracking-widest font-black">DSP-HI-FI ⊕</span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* UPPER DECK: DUAL STEREO SPEAKERS + VFD DISPLAY SCREEN               */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between gap-1.5 shrink-0">
          
          {/* LEFT STEREO SPEAKER */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div 
              className="relative w-13 h-13 rounded-full p-1 flex items-center justify-center transition-all duration-75"
              style={{
                width: '50px',
                height: '50px',
                background: 'radial-gradient(circle, #1a2336 0%, #0d131f 70%, #050810 100%)',
                boxShadow: isPlaying 
                  ? (visualizerMode === 'xbox' 
                      ? '0 0 14px rgba(0,255,65,0.45), inset 0 0 6px rgba(0,255,65,0.3)' 
                      : '0 0 14px rgba(0,243,255,0.45), inset 0 0 6px rgba(0,243,255,0.3)')
                  : 'inset 0 2px 4px rgba(0,0,0,0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-full border border-gray-700 pointer-events-none" />
              <div 
                className={`absolute inset-0.5 rounded-full border transition-opacity duration-300 pointer-events-none ${
                  isPlaying 
                    ? (visualizerMode === 'xbox' ? 'border-[#00ff41] opacity-90' : 'border-cyan-400 opacity-90') 
                    : 'border-gray-800 opacity-30'
                }`} 
              />
              {/* Speaker Cone pulsing with Bass */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-75"
                style={{
                  transform: isPlaying ? `scale(${1 + bassPulse * 0.15})` : 'scale(1)',
                  background: 'radial-gradient(circle, #2a3449 10%, #151b26 60%, #090d14 100%)',
                  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.9)'
                }}
              >
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-gray-500/40 shadow-inner"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #4b5563, #111827)'
                  }}
                />
              </div>
            </div>
            <span className="text-[7px] font-mono font-bold text-gray-500 uppercase mt-0.5 tracking-wider">CH-L</span>
          </div>

          {/* CENTER DISPLAY: VFD / CRT SCREEN CONSOLE */}
          <div className="flex-1 min-w-0 bg-[#020a05] border border-[#1b3a23] rounded-lg p-1.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)] relative overflow-hidden flex flex-col justify-between">
            
            {/* Subtle CRT Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.25)_3px)] opacity-60 z-10" />

            {/* Display Header Status Bar */}
            <div className="flex items-center justify-between text-[8px] font-mono shrink-0 mb-1 z-20">
              <span className="flex items-center gap-1 font-bold text-[#00ff41]">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#00ff41] animate-pulse' : 'bg-gray-600'}`} />
                <span>{playbackState === 'buffering' ? 'TUNING...' : isPlaying ? 'ON AIR' : 'STANDBY'}</span>
              </span>
              <span className="text-gray-400 font-bold">
                {isPlaying ? formatTimer(streamTime) : '0:00'}
              </span>
              <span className="text-cyan-400 font-bold tracking-tight">
                {currentStation.codec || 'MP3'} {currentStation.bitrate || 128}K
              </span>
            </div>

            {/* LIVE TRACK METADATA (TITLE & ARTIST DISPLAY) */}
            <div className="min-w-0 z-20 space-y-0.5">
              {/* Title */}
              <div 
                className="text-[11px] font-black text-[#00ff41] font-mono tracking-wide truncate drop-shadow-[0_0_8px_rgba(0,255,65,0.7)]"
                title={metadata.title}
              >
                🎵 {metadata.title || currentStation.name}
              </div>

              {/* Artist & Station Info */}
              <div 
                className="text-[9px] font-bold text-gray-200 font-mono truncate flex items-center gap-1"
                title={metadata.artist}
              >
                <span className="text-cyan-300">🎤 {metadata.artist || 'Civicverse Broadcast'}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-[8px] truncate">{metadata.stationName || currentStation.name}</span>
              </div>
            </div>

            {/* BUILT-IN VISUAL EQUALIZER CANVAS */}
            <div className="w-full h-9 rounded bg-[#010603] border border-[#142e1b] overflow-hidden my-1 flex items-center justify-center relative z-20">
              <canvas ref={canvasRef} width={180} height={36} className="w-full h-full" />
            </div>

          </div>

          {/* RIGHT STEREO SPEAKER */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div 
              className="relative w-13 h-13 rounded-full p-1 flex items-center justify-center transition-all duration-75"
              style={{
                width: '50px',
                height: '50px',
                background: 'radial-gradient(circle, #1a2336 0%, #0d131f 70%, #050810 100%)',
                boxShadow: isPlaying 
                  ? (visualizerMode === 'xbox' 
                      ? '0 0 14px rgba(0,255,65,0.45), inset 0 0 6px rgba(0,255,65,0.3)' 
                      : '0 0 14px rgba(0,243,255,0.45), inset 0 0 6px rgba(0,243,255,0.3)')
                  : 'inset 0 2px 4px rgba(0,0,0,0.8)'
              }}
            >
              <div className="absolute inset-0 rounded-full border border-gray-700 pointer-events-none" />
              <div 
                className={`absolute inset-0.5 rounded-full border transition-opacity duration-300 pointer-events-none ${
                  isPlaying 
                    ? (visualizerMode === 'xbox' ? 'border-[#00ff41] opacity-90' : 'border-cyan-400 opacity-90') 
                    : 'border-gray-800 opacity-30'
                }`} 
              />
              {/* Speaker Cone pulsing with Bass */}
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-75"
                style={{
                  transform: isPlaying ? `scale(${1 + bassPulse * 0.15})` : 'scale(1)',
                  background: 'radial-gradient(circle, #2a3449 10%, #151b26 60%, #090d14 100%)',
                  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.9)'
                }}
              >
                <div 
                  className="w-3.5 h-3.5 rounded-full border border-gray-500/40 shadow-inner"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #4b5563, #111827)'
                  }}
                />
              </div>
            </div>
            <span className="text-[7px] font-mono font-bold text-gray-500 uppercase mt-0.5 tracking-wider">CH-R</span>
          </div>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MIDDLE DECK: 4 TACTILE BOOMBOX PRESET PUSH BUTTONS                  */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-4 gap-1.5 my-1 shrink-0">
          {PRESET_CHANNELS.map((preset, idx) => {
            const isThisPlaying = currentStation.id === preset.id && isPlaying;
            const label = PRESET_LABELS[idx];
            return (
              <button
                key={preset.id}
                onClick={() => playStation(preset)}
                className={`py-1 px-1 rounded-md border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isThisPlaying
                    ? 'border-[#00ff41] bg-[#03220f] shadow-[0_0_8px_rgba(0,255,65,0.4)]'
                    : currentStation.id === preset.id
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                    : 'border-[#1b2537] bg-[#0c1220] hover:border-gray-600 text-gray-300'
                }`}
                title={`Tune to ${preset.name}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[7px] font-mono text-gray-400 font-bold">P{idx + 1}</span>
                  {isThisPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
                  )}
                </div>
                <div className="text-[9px] font-extrabold truncate text-white leading-tight mt-0.5">
                  {label.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* BOTTOM DECK: TACTILE TRANSPORT CONTROLS & VOLUME                   */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-[#090e18] border border-[#1b2639] rounded-lg p-1.5 px-2 flex items-center justify-between shrink-0 shadow-md">
          
          {/* Transport buttons: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-1.5">
            {/* Prev Channel */}
            <button
              onClick={handlePrevStation}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded transition-colors"
              title="Previous Preset Channel"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Play / Pause Master Center Button */}
            <button
              onClick={handleTogglePlay}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                isPlaying 
                  ? (visualizerMode === 'xbox' 
                      ? 'bg-[#00ff41] text-black shadow-[0_0_12px_rgba(0,255,65,0.8)]' 
                      : 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.8)]')
                  : 'bg-[#141e2e] text-white border border-gray-600 hover:border-cyan-400'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {playbackState === 'buffering' ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Channel */}
            <button
              onClick={handleNextStation}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded transition-colors"
              title="Next Preset Channel"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume Deck */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleMute}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-14 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00ff41]"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>

          {/* Quick Tuner Button */}
          <button
            onClick={() => setShowExplorer(true)}
            className="text-[9px] font-mono font-bold bg-[#111927] hover:bg-[#1a2538] text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded transition-all flex items-center gap-1"
            title="Browse 60,000+ Stations"
          >
            <span>TUNE</span>
            <span className="text-gray-400">60K+</span>
          </button>

        </div>

      </div>

      {/* ==================================================================== */}
      {/* 3. EXPANDED FULL-SCREEN 60,000+ STATIONS & PODCAST TUNER MODAL       */}
      {/* ==================================================================== */}
      {showExplorer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a0f1b] border border-cyan-500/50 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-3 bg-[#0d1424] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-sm font-black text-white tracking-wider">FOYER FM GLOBAL TUNER</span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded font-mono">
                  60,000+ OPEN STATIONS
                </span>
              </div>
              <button onClick={() => setShowExplorer(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar & Tag Pills */}
            <div className="p-4 border-b border-gray-800 space-y-3">
              <form onSubmit={handleSearchStations} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 60,000+ radio stations, live podcasts, synthwave, genres..."
                    className="w-full bg-[#121929] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button type="submit" className="bg-cyan-500 text-black px-4 rounded-lg font-bold text-xs hover:bg-cyan-400">
                  Search
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {['cyberpunk', 'synthwave', 'podcast', 'lofi', 'ambient', 'techno', 'rock', 'hiphop', 'jazz'].map(t => (
                  <button
                    key={t}
                    onClick={async () => {
                      setSearchQuery(t);
                      setIsSearching(true);
                      try {
                        const res = await fetchStationsByTag(t, 20);
                        setSearchResults(res);
                      } finally {
                        setIsSearching(false);
                      }
                    }}
                    className="px-2.5 py-1 rounded-full uppercase bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-4 flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="py-12 text-center text-cyan-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Querying open radio directory...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(searchResults.length > 0 ? searchResults : CURATED_STATIONS).map(st => {
                    const isThisPlaying = currentStation.id === st.id && isPlaying;
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          playStation(st);
                          setShowExplorer(false);
                        }}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          currentStation.id === st.id
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-[#101726] border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-bold text-white truncate">{st.name}</div>
                          <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="text-cyan-400 font-mono">{st.bitrate || 128}k {st.codec || 'MP3'}</span>
                            <span>•</span>
                            <span className="capitalize">{st.tags.slice(0, 2).join(', ')}</span>
                          </div>
                        </div>

                        <button className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          isThisPlaying ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300'
                        }`}>
                          {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#0d1424] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Free & Open Source Radio-Browser API (60,000+ Stations)</span>
              </span>
              <button 
                onClick={() => setShowExplorer(false)}
                className="bg-[#192338] text-white px-3 py-1 rounded hover:bg-gray-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
