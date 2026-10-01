import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  Music, 
  Zap, 
  Radio, 
  Podcast, 
  Search, 
  Maximize2, 
  X, 
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { 
  MediaStation, 
  PodcastEpisode, 
  CURATED_STATIONS, 
  fetchStationsByTag, 
  searchRadioStations, 
  fetchLivePodcastStations, 
  searchPodcasts, 
  fetchPodcastEpisodes,
  getFavorites, 
  toggleFavorite, 
  isFavorite, 
  getLastPlayedStation, 
  saveLastPlayedStation 
} from '../services/mediaService';

export const CivicMediaPlayer: React.FC = () => {
  const { user } = useGameStore();

  // Active Service Tab
  const [activeMediaTab, setActiveMediaTab] = useState<'Civic Radio' | 'Spotify' | 'iTunes' | 'Podcasts'>('Civic Radio');

  // Playback state
  const [currentStation, setCurrentStation] = useState<MediaStation>(() => getLastPlayedStation());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'buffering' | 'playing' | 'error'>('idle');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamTime, setStreamTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Explorer Modal
  const [showExplorer, setShowExplorer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaStation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Howler reference
  const howlRef = useRef<Howl | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // --------------------------------------------------------------------------
  // AUDIO ENGINE (HOWLER.JS WITH HTML5 STREAMING POOL)
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

    try {
      const sound = new Howl({
        src: [station.url],
        html5: true, // Enables continuous buffering for live radio & podcast streams
        format: station.codec ? [station.codec.toLowerCase(), 'mp3', 'aac', 'ogg'] : ['mp3', 'aac', 'ogg'],
        volume: isMuted ? 0 : volume,
        autoplay: true,
        onload: () => {
          setPlaybackState('playing');
          setIsPlaying(true);
          setDuration(sound.duration() || 0);
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

  // Audio Visualizer Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let barHeights = new Array(18).fill(2);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const numBars = 18;
      const barWidth = Math.max(2, (canvas.width / numBars) - 1.5);

      for (let i = 0; i < numBars; i++) {
        if (isPlaying && playbackState === 'playing') {
          const target = Math.random() * (canvas.height * 0.9) + 2;
          barHeights[i] += (target - barHeights[i]) * 0.35;
        } else if (playbackState === 'buffering') {
          barHeights[i] = (Math.sin(Date.now() / 250 + i * 0.4) + 1) * (canvas.height * 0.4) + 2;
        } else {
          barHeights[i] += (2 - barHeights[i]) * 0.2;
        }

        const h = Math.max(2, barHeights[i]);
        const x = i * (barWidth + 1.5);
        const y = canvas.height - h;

        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#00f3ff');
        grad.addColorStop(1, '#10b981');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, h);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, playbackState]);

  // Cleanup on unmount
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

  // --------------------------------------------------------------------------
  // CARDS CONFIGURATION PER TAB
  // --------------------------------------------------------------------------
  const getCards = () => {
    if (activeMediaTab === 'Podcasts') {
      return [
        {
          id: 'defcon-radio',
          title: 'DEF CON Talk',
          sub: 'Hacker Cypherpunk',
          color: 'bg-purple-600',
          icon: Podcast,
          station: CURATED_STATIONS[0]
        },
        {
          id: 'npr-news',
          title: 'NPR 24/7 Live',
          sub: 'News & Journalism',
          color: 'bg-blue-600',
          icon: Radio,
          station: CURATED_STATIONS[2]
        },
        {
          id: 'bbc-world',
          title: 'BBC World News',
          sub: 'Global Documentaries',
          color: 'bg-red-600',
          icon: Radio,
          station: CURATED_STATIONS[3]
        },
        {
          id: 'hacker-public',
          title: 'Hacker Public Radio',
          sub: 'Open Source Tech',
          color: 'bg-cyan-600',
          icon: Podcast,
          station: CURATED_STATIONS[1]
        }
      ];
    }

    if (activeMediaTab === 'Spotify' || activeMediaTab === 'iTunes') {
      return [
        {
          id: 'nightwave-plaza',
          title: 'Liked Songs',
          sub: '2,341 songs',
          color: 'bg-purple-600',
          icon: Heart,
          station: CURATED_STATIONS[5]
        },
        {
          id: 'civicverse-hits',
          title: 'Civicverse Hits',
          sub: '50 songs',
          color: 'bg-cyan-600',
          icon: Music,
          station: CURATED_STATIONS[6]
        },
        {
          id: 'workout-mode',
          title: 'Workout Mode',
          sub: '65 songs',
          color: 'bg-amber-600',
          icon: Zap,
          station: CURATED_STATIONS[0]
        },
        {
          id: 'focus-flow',
          title: 'Focus Flow',
          sub: '120 songs',
          color: 'bg-blue-600',
          icon: Radio,
          station: CURATED_STATIONS[8]
        }
      ];
    }

    // Default 'Civic Radio'
    return [
      {
        id: 'nightwave-plaza',
        title: 'Nightwave Plaza',
        sub: 'Vaporwave & Synth',
        color: 'bg-pink-600',
        icon: Music,
        station: CURATED_STATIONS[5]
      },
      {
        id: 'atomicwave',
        title: 'Atomicwave FM',
        sub: 'Dark Synth / Cyber',
        color: 'bg-cyan-600',
        icon: Zap,
        station: CURATED_STATIONS[6]
      },
      {
        id: 'defcon-radio',
        title: 'Soma: DEF CON',
        sub: 'Music for Hacking',
        color: 'bg-purple-600',
        icon: Radio,
        station: CURATED_STATIONS[0]
      },
      {
        id: 'groove-salad',
        title: 'Groove Salad',
        sub: 'Ambient Downtempo',
        color: 'bg-emerald-600',
        icon: Heart,
        station: CURATED_STATIONS[8]
      }
    ];
  };

  const cards = getCards();

  const handleCardClick = (cardStation: MediaStation) => {
    playStation(cardStation);
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
    <div className="h-64 flex flex-col bg-[#080c14] overflow-hidden select-none">
      
      {/* -------------------------------------------------------------------- */}
      {/* 1. HEADER (MEDIA PLAYER TITLE, EXPAND / SEARCH TOGGLE)               */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-2.5 px-3 bg-[#0d131f] flex items-center justify-between border-b border-gray-800/60 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black tracking-wider text-gray-300 uppercase">MEDIA PLAYER</span>
          <span className="text-[9px] bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono px-1 rounded uppercase">
            60K+ OPEN
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <button 
            onClick={() => setShowExplorer(true)} 
            className="hover:text-white p-0.5" 
            title="Search 60,000+ Stations & Live Podcasts"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button 
            onClick={() => setShowExplorer(true)} 
            className="hover:text-white p-0.5" 
            title="Maximize Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. SERVICE TABS (iTUNES, SPOTIFY, CIVIC RADIO, PODCASTS)              */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-gray-800/50 text-xs font-bold text-gray-400 shrink-0 overflow-x-auto scrollbar-none">
        <button 
          onClick={() => setActiveMediaTab('Civic Radio')} 
          className={`relative py-0.5 transition-colors ${
            activeMediaTab === 'Civic Radio' ? 'text-cyan-400 font-extrabold' : 'hover:text-gray-300'
          }`}
        >
          Civic Radio
          {activeMediaTab === 'Civic Radio' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
        </button>

        <button 
          onClick={() => setActiveMediaTab('Podcasts')} 
          className={`relative py-0.5 transition-colors ${
            activeMediaTab === 'Podcasts' ? 'text-purple-400 font-extrabold' : 'hover:text-gray-300'
          }`}
        >
          🎙️ Podcasts
          {activeMediaTab === 'Podcasts' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />}
        </button>

        <button 
          onClick={() => setActiveMediaTab('Spotify')} 
          className={`relative py-0.5 transition-colors ${
            activeMediaTab === 'Spotify' ? 'text-emerald-400 font-extrabold' : 'hover:text-gray-300'
          }`}
        >
          Spotify
          {activeMediaTab === 'Spotify' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />}
        </button>

        <button 
          onClick={() => setActiveMediaTab('iTunes')} 
          className={`relative py-0.5 transition-colors ${
            activeMediaTab === 'iTunes' ? 'text-white' : 'hover:text-gray-300'
          }`}
        >
          iTunes
          {activeMediaTab === 'iTunes' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. MAIN BODY: GREETING, 2x2 PLAYLIST GRID, ACTIVE TRACK BAR          */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
        
        {/* User Greeting */}
        <p className="text-[11px] text-gray-400 shrink-0">
          Good afternoon, <strong className="text-white">{user?.username || 'XJAY420X'}</strong>
        </p>

        {/* 2x2 Playlist Grid */}
        <div className="grid grid-cols-2 gap-2 my-1 shrink-0">
          {cards.map(c => {
            const Icon = c.icon;
            const isThisPlaying = currentStation.id === c.station.id && isPlaying;
            return (
              <div 
                key={c.id}
                onClick={() => handleCardClick(c.station)}
                className={`bg-[#121927] border rounded-lg p-2 flex items-center gap-2 cursor-pointer transition-all ${
                  isThisPlaying 
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                    : 'border-gray-800 hover:border-cyan-500/50'
                }`}
              >
                <div className={`w-7 h-7 ${c.color} rounded flex items-center justify-center shrink-0 shadow`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-white truncate flex items-center gap-1">
                    <span>{c.title}</span>
                    {isThisPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <div className="text-[8px] text-gray-400 truncate">{c.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Now Playing Active Track Bar */}
        <div className="bg-[#0f1522] border border-[#1f2b3e] rounded-xl p-2 flex items-center gap-2.5 shrink-0 shadow-md">
          {/* Station Cover Artwork */}
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-purple-500/30 bg-black flex items-center justify-center relative">
            {currentStation.favicon ? (
              <img 
                src={currentStation.favicon} 
                alt="" 
                className="w-full h-full object-cover" 
                onError={(e) => { (e.target as any).src = '/images/rooftop_garden.jpg'; }} 
              />
            ) : (
              <img 
                src="/images/rooftop_garden.jpg" 
                alt="Track Cover" 
                className="w-full h-full object-cover" 
              />
            )}
            {isPlaying && (
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>

          {/* Track Details & Visualizer Progress */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white truncate max-w-[130px]">
                {currentStation.name}
              </span>
              <span className="text-[8px] font-mono text-cyan-400 font-bold">
                {playbackState === 'buffering' ? 'CONNECTING...' : isPlaying ? '● LIVE' : 'READY'}
              </span>
            </div>

            <div className="text-[9px] text-gray-400 truncate mt-0.5">
              {currentStation.codec || 'MP3'} {currentStation.bitrate || 128}k • {currentStation.category.toUpperCase()}
            </div>

            {/* Visualizer Canvas & Time */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 bg-gray-900 h-2 rounded-full overflow-hidden flex items-center px-0.5">
                <canvas ref={canvasRef} width={120} height={8} className="w-full h-full" />
              </div>
              <span className="text-[8px] font-mono text-gray-400 shrink-0">
                {isPlaying ? formatTimer(streamTime) : '0:00'} / LIVE
              </span>
            </div>
          </div>

          {/* Controls: Mute & Play/Pause */}
          <div className="flex items-center gap-1 text-gray-300 shrink-0">
            <button 
              onClick={handleToggleMute} 
              className="hover:text-white p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button 
              onClick={handleTogglePlay} 
              className={`w-7 h-7 rounded-full text-black flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_10px_#10b981] ${
                isPlaying ? 'bg-cyan-400 text-black shadow-[0_0_10px_#00f3ff]' : 'bg-emerald-500'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {playbackState === 'buffering' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. EXPANDED FULL-SCREEN 60,000+ STATIONS & PODCAST TUNER MODAL       */}
      {/* -------------------------------------------------------------------- */}
      {showExplorer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a0f1b] border border-cyan-500/50 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-3 bg-[#0d1424] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-sm font-black text-white tracking-wider">CIVICVERSE GLOBAL MEDIA TUNER</span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded font-mono">
                  60,000+ OPEN STATIONS & PODCASTS
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

            {/* Footer */}
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
