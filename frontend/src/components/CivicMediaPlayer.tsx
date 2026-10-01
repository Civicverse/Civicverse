import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward, 
  Star, 
  Radio, 
  Podcast, 
  Zap, 
  Search, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  Check, 
  X, 
  Headphones,
  Music,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
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

interface CivicMediaPlayerProps {
  onStationChange?: (station: MediaStation) => void;
}

export const CivicMediaPlayer: React.FC<CivicMediaPlayerProps> = ({ onStationChange }) => {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'PODCAST' | 'SYNTH' | 'RADIO' | 'FAVORITES' | 'CUSTOM'>('SYNTH');
  
  // Audio playback state
  const [currentStation, setCurrentStation] = useState<MediaStation>(() => getLastPlayedStation());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackState, setPlaybackState] = useState<'idle' | 'buffering' | 'playing' | 'error'>('idle');
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamDuration, setStreamDuration] = useState<number>(0);
  const [streamPosition, setStreamPosition] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Station library & search states
  const [stations, setStations] = useState<MediaStation[]>(CURATED_STATIONS);
  const [favorites, setFavorites] = useState<MediaStation[]>(() => getFavorites());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>('synthwave');

  // Live Podcast Tune-In state
  const [podcastQuery, setPodcastQuery] = useState<string>('Darknet Diaries');
  const [podcastSearchResults, setPodcastSearchResults] = useState<any[]>([]);
  const [isSearchingPodcasts, setIsSearchingPodcasts] = useState<boolean>(false);
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [activePodcastTitle, setActivePodcastTitle] = useState<string>('');
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);

  // Custom Stream URL state
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  // UI state
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showVolumePopup, setShowVolumePopup] = useState<boolean>(false);

  // Howler reference
  const howlRef = useRef<Howl | null>(null);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // --------------------------------------------------------------------------
  // AUDIO ENGINE INITIALIZATION & STREAM MANAGEMENT (HOWLER.JS)
  // --------------------------------------------------------------------------
  const playStation = (station: MediaStation) => {
    if (!station || !station.url) return;

    // If already playing this station, toggle play/pause
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

    // Stop and unload existing stream instance
    if (howlRef.current) {
      try {
        howlRef.current.stop();
        howlRef.current.unload();
      } catch (e) {
        console.warn('Error stopping previous howl:', e);
      }
      howlRef.current = null;
    }

    setCurrentStation(station);
    saveLastPlayedStation(station);
    setPlaybackState('buffering');
    setErrorMessage(null);
    setIsPlaying(true);
    setStreamPosition(0);

    if (onStationChange) {
      onStationChange(station);
    }

    try {
      const sound = new Howl({
        src: [station.url],
        html5: true, // Enables true continuous streaming for live radio & podcast streams
        format: station.codec ? [station.codec.toLowerCase(), 'mp3', 'aac', 'ogg'] : ['mp3', 'aac', 'ogg'],
        volume: isMuted ? 0 : volume,
        autoplay: true,
        onload: () => {
          setPlaybackState('playing');
          setIsPlaying(true);
          setStreamDuration(sound.duration());
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
          console.warn('Howler stream load error:', err, station.url);
          setPlaybackState('error');
          setIsPlaying(false);
          setErrorMessage('Stream connection timed out or offline');
        },
        onplayerror: (_id, err) => {
          console.warn('Howler stream play error:', err);
          sound.once('unlock', () => {
            sound.play();
          });
          setPlaybackState('error');
          setIsPlaying(false);
          setErrorMessage('Audio locked by browser - tap play to unlock');
        }
      });

      howlRef.current = sound;
    } catch (err: any) {
      console.error('Failed to instantiate stream player:', err);
      setPlaybackState('error');
      setIsPlaying(false);
      setErrorMessage(err.message || 'Stream initialization error');
    }
  };

  // Toggle Play / Pause
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

  // Skip to Next Station in current list
  const handleSkipNext = () => {
    const list = getActiveStationList();
    if (!list || list.length === 0) return;
    const currentIndex = list.findIndex(s => s.id === currentStation.id || s.url === currentStation.url);
    const nextIndex = (currentIndex + 1) % list.length;
    playStation(list[nextIndex]);
  };

  // Skip to Previous Station in current list
  const handleSkipPrevious = () => {
    const list = getActiveStationList();
    if (!list || list.length === 0) return;
    const currentIndex = list.findIndex(s => s.id === currentStation.id || s.url === currentStation.url);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    playStation(list[prevIndex]);
  };

  // Volume & Mute Controls
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (howlRef.current) {
      howlRef.current.volume(newVolume);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (howlRef.current) {
      howlRef.current.volume(nextMuted ? 0 : volume);
    }
  };

  // Seek position tracker (for podcast episodes)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        if (howlRef.current && howlRef.current.playing()) {
          const pos = typeof howlRef.current.seek() === 'number' ? (howlRef.current.seek() as number) : 0;
          setStreamPosition(pos);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (howlRef.current) {
        try {
          howlRef.current.stop();
          howlRef.current.unload();
        } catch (e) {}
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // --------------------------------------------------------------------------
  // AUDIO SPECTRUM VISUALIZER (CANVAS)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let barHeights = new Array(24).fill(2);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const numBars = 24;
      const barWidth = Math.max(2, (canvas.width / numBars) - 1.5);

      for (let i = 0; i < numBars; i++) {
        if (isPlaying && playbackState === 'playing') {
          // Dynamic waveform animation with harmonic frequency modulation
          const target = Math.random() * (canvas.height * 0.85) + (canvas.height * 0.15);
          barHeights[i] += (target - barHeights[i]) * 0.35;
        } else if (playbackState === 'buffering') {
          // Pulsing wave
          barHeights[i] = (Math.sin(Date.now() / 200 + i * 0.3) + 1) * (canvas.height * 0.35) + 3;
        } else {
          // Resting baseline
          barHeights[i] += (2 - barHeights[i]) * 0.2;
        }

        const h = Math.max(2, barHeights[i]);
        const x = i * (barWidth + 1.5);
        const y = canvas.height - h;

        // Cyberpunk Cyan to Magenta gradient
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#00f3ff');
        grad.addColorStop(0.5, '#7928ca');
        grad.addColorStop(1, '#ff007f');

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

  // --------------------------------------------------------------------------
  // DATA FETCHING & TAB SWITCHING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab === 'SYNTH') {
      const synths = CURATED_STATIONS.filter(s => s.category === 'synth' || s.category === 'ambient');
      setStations(synths);
    } else if (activeTab === 'PODCAST') {
      loadPodcastTabStations();
    } else if (activeTab === 'RADIO') {
      loadRadioStations(selectedTag);
    } else if (activeTab === 'FAVORITES') {
      setStations(favorites);
    }
  }, [activeTab]);

  const loadPodcastTabStations = async () => {
    setIsSearching(true);
    try {
      const data = await fetchLivePodcastStations(15);
      setStations(data);
    } catch (e) {
      setStations(CURATED_STATIONS.filter(s => s.category === 'podcast'));
    } finally {
      setIsSearching(false);
    }
  };

  const loadRadioStations = async (tag: string) => {
    setIsSearching(true);
    try {
      const data = await fetchStationsByTag(tag, 20);
      setStations(data);
    } catch (e) {
      setStations(CURATED_STATIONS);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchRadioStations(searchQuery.trim(), 25);
      setStations(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchPodcasts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastQuery.trim()) return;
    setIsSearchingPodcasts(true);
    try {
      const results = await searchPodcasts(podcastQuery.trim(), 10);
      setPodcastSearchResults(results);
    } finally {
      setIsSearchingPodcasts(false);
    }
  };

  const handleSelectPodcastShow = async (show: any) => {
    if (!show.feedUrl) return;
    setActivePodcastTitle(show.title);
    setIsLoadingEpisodes(true);
    try {
      const eps = await fetchPodcastEpisodes(show.feedUrl);
      setPodcastEpisodes(eps);
      if (eps.length > 0) {
        // Auto play latest episode
        handlePlayPodcastEpisode(eps[0], show);
      }
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  const handlePlayPodcastEpisode = (ep: PodcastEpisode, show?: any) => {
    const stationObj: MediaStation = {
      id: ep.id,
      name: `${show?.title || ep.podcastTitle}: ${ep.title}`,
      url: ep.audioUrl,
      favicon: ep.artwork || show?.artwork,
      tags: ['podcast', 'episode', 'talk'],
      country: 'Global',
      codec: 'MP3',
      bitrate: 128,
      category: 'podcast',
      isLive: false,
      description: ep.description || `Episode of ${show?.title || ep.podcastTitle}`
    };
    playStation(stationObj);
  };

  const handleCustomTuneIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const customStation: MediaStation = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || 'Custom Stream Node',
      url: customUrl.trim(),
      tags: ['custom', 'stream'],
      country: 'Local',
      codec: 'MP3',
      bitrate: 128,
      category: 'custom',
      isLive: true,
      description: 'Citizen custom audio feed'
    };
    playStation(customStation);
    const updated = toggleFavorite(customStation);
    setFavorites(updated);
    setCustomUrl('');
    setCustomName('');
  };

  const handleToggleFavoriteStation = (station: MediaStation) => {
    const updated = toggleFavorite(station);
    setFavorites(updated);
    if (activeTab === 'FAVORITES') {
      setStations(updated);
    }
  };

  const getActiveStationList = (): MediaStation[] => {
    return stations.length > 0 ? stations : CURATED_STATIONS;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return 'LIVE';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================================================
  // RENDER COMPONENT
  // ==========================================================================
  return (
    <div className="flex flex-col h-full bg-[#080c14] border-t border-[#1a2333]/80 select-none overflow-hidden relative">
      
      {/* -------------------------------------------------------------------- */}
      {/* HEADER: TITLE, LIVE STATUS & TOOLBAR                                */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-2 px-3 bg-[#0d131f] flex items-center justify-between border-b border-gray-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <span className="text-[11px] font-black tracking-wider text-gray-200 uppercase">CIVIC MEDIA HUB</span>
          <span className="text-[9px] bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono px-1 rounded uppercase">
            60K+ OPEN
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400">
          <button 
            onClick={() => handleToggleFavoriteStation(currentStation)} 
            className={`p-1 hover:text-amber-400 transition-colors ${isFavorite(currentStation) ? 'text-amber-400' : 'text-gray-400'}`}
            title="Bookmark Station"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite(currentStation) ? 'fill-amber-400' : ''}`} />
          </button>
          
          <button 
            onClick={() => setIsExpanded(true)}
            className="p-1 hover:text-cyan-400 transition-colors"
            title="Expand Full 60,000+ Tuner & Podcast Explorer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* NAVIGATION TABS: PODCAST | SYNTH | 60K RADIO | FAVS | TUNE IN        */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-1 px-2.5 py-1 bg-[#0b101a] border-b border-gray-800/50 text-[10px] font-bold overflow-x-auto scrollbar-none shrink-0">
        {[
          { id: 'SYNTH', label: '⚡ Cyber Synth', icon: Zap },
          { id: 'PODCAST', label: '🎙️ Live Podcast', icon: Podcast },
          { id: 'RADIO', label: '📻 60K+ Radio', icon: Radio },
          { id: 'FAVORITES', label: '⭐ Favs', icon: Star },
          { id: 'CUSTOM', label: '🔗 Tune URL', icon: LinkIcon }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)] font-extrabold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
              }`}
            >
              <Icon className="w-2.5 h-2.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MAIN TAB CONTENT CONTAINER                                           */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin bg-[#070a12]">
        
        {/* TAB 1: CYBER SYNTH & AMBIENT (VAPORWAVE, RETRO, LOFI) */}
        {activeTab === 'SYNTH' && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-gray-400 px-1 flex items-center justify-between">
              <span>CYBERVERSE BROADCAST NODES</span>
              <span className="text-[9px] text-cyan-400 font-mono font-bold">24/7 LIVE</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {CURATED_STATIONS.filter(s => s.category === 'synth' || s.category === 'ambient').map(st => {
                const isThisStation = currentStation.id === st.id;
                const isThisPlaying = isThisStation && isPlaying;
                return (
                  <div
                    key={st.id}
                    onClick={() => playStation(st)}
                    className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isThisStation
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-[#0f1522] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#162032] border border-cyan-500/30 flex items-center justify-center shrink-0 overflow-hidden">
                        {st.favicon ? (
                          <img src={st.favicon} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                        ) : (
                          <Headphones className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                          <span>{st.name}</span>
                          {isThisPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        </div>
                        <div className="text-[9px] text-gray-400 truncate flex items-center gap-1">
                          <span className="text-cyan-400 font-mono uppercase">{st.codec} {st.bitrate}k</span>
                          <span>•</span>
                          <span className="capitalize">{st.tags.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <button className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                      isThisPlaying ? 'bg-cyan-500 text-black shadow-[0_0_8px_#06b6d4]' : 'bg-[#182338] text-gray-300 hover:text-white'
                    }`}>
                      {isThisPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE PODCASTS & TALK DIRECTORY */}
        {activeTab === 'PODCAST' && (
          <div className="space-y-2">
            {/* Podcast search bar */}
            <form onSubmit={handleSearchPodcasts} className="relative">
              <input
                type="text"
                value={podcastQuery}
                onChange={(e) => setPodcastQuery(e.target.value)}
                placeholder="Search millions of podcasts..."
                className="w-full bg-[#111726] border border-gray-800 rounded-md py-1 pl-2.5 pr-7 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300">
                <Search className="w-3 h-3" />
              </button>
            </form>

            {/* Live Broadcast / 24/7 Podcast Stations */}
            <div>
              <div className="text-[10px] text-gray-400 font-bold px-1 mb-1 flex items-center justify-between">
                <span>LIVE TALK & CYBER PODCAST FEEDS</span>
                <span className="text-[9px] text-emerald-400 font-mono">LIVE TUNER</span>
              </div>
              <div className="space-y-1">
                {CURATED_STATIONS.filter(s => s.category === 'podcast').map(st => {
                  const isThisPlaying = currentStation.id === st.id && isPlaying;
                  return (
                    <div
                      key={st.id}
                      onClick={() => playStation(st)}
                      className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        currentStation.id === st.id
                          ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                          : 'bg-[#0f1522] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded bg-purple-900/40 border border-purple-500/40 flex items-center justify-center shrink-0">
                          <Podcast className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white truncate">{st.name}</div>
                          <div className="text-[9px] text-gray-400 truncate">{st.description}</div>
                        </div>
                      </div>
                      <button className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isThisPlaying ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300'
                      }`}>
                        {isThisPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Podcast Search Results */}
            {podcastSearchResults.length > 0 && (
              <div>
                <div className="text-[10px] text-cyan-400 font-bold px-1 mb-1">
                  PODCAST SHOW RESULTS ({podcastSearchResults.length})
                </div>
                <div className="space-y-1">
                  {podcastSearchResults.map(pod => (
                    <div
                      key={pod.id}
                      onClick={() => handleSelectPodcastShow(pod)}
                      className="p-1.5 rounded-lg border border-gray-800 bg-[#0c121e] hover:border-cyan-500/50 cursor-pointer flex items-center gap-2"
                    >
                      <img src={pod.artwork} alt="" className="w-7 h-7 rounded object-cover border border-gray-700 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-white truncate">{pod.title}</div>
                        <div className="text-[8px] text-gray-400 truncate">{pod.artist} • {pod.trackCount} eps</div>
                      </div>
                      <span className="text-[9px] text-cyan-400 font-extrabold uppercase shrink-0">TUNE IN ⮌</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 60K+ OPEN RADIO STATIONS BROWSER */}
        {activeTab === 'RADIO' && (
          <div className="space-y-2">
            {/* Search input */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 60,000+ stations worldwide..."
                className="w-full bg-[#111726] border border-gray-800 rounded-md py-1 pl-2.5 pr-7 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300">
                <Search className="w-3 h-3" />
              </button>
            </form>

            {/* Quick Genre Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 text-[9px] font-bold text-gray-400">
              {['synthwave', 'cyberpunk', 'lofi', 'electronic', 'ambient', 'techno', 'rock', 'hiphop', 'jazz'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    loadRadioStations(tag);
                  }}
                  className={`px-2 py-0.5 rounded uppercase whitespace-nowrap transition-colors ${
                    selectedTag === tag ? 'bg-cyan-500 text-black font-extrabold' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Station List */}
            {isSearching ? (
              <div className="py-6 text-center text-xs text-cyan-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning 60,000+ open stations...</span>
              </div>
            ) : (
              <div className="space-y-1">
                {stations.map(st => {
                  const isThisPlaying = currentStation.id === st.id && isPlaying;
                  return (
                    <div
                      key={st.id}
                      onClick={() => playStation(st)}
                      className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        currentStation.id === st.id
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                          : 'bg-[#0f1522] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-[11px] font-bold text-white truncate flex items-center gap-1.5">
                          <span>{st.name}</span>
                          <span className="text-[8px] bg-gray-800 text-gray-400 px-1 rounded uppercase font-mono">{st.country}</span>
                        </div>
                        <div className="text-[9px] text-gray-400 truncate flex items-center gap-1">
                          <span className="text-cyan-400 font-mono">{st.bitrate}k {st.codec}</span>
                          <span>•</span>
                          <span>{st.tags.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleFavoriteStation(st); }}
                          className="p-1 text-gray-500 hover:text-amber-400"
                        >
                          <Star className={`w-3 h-3 ${isFavorite(st) ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                        <button className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isThisPlaying ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300'
                        }`}>
                          {isThisPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FAVORITES (PINNED STATIONS) */}
        {activeTab === 'FAVORITES' && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-gray-400 px-1 flex items-center justify-between">
              <span>SAVED BOOKMARKS ({favorites.length})</span>
              <span className="text-[9px] text-amber-400 font-bold">LOCAL PERSISTENT</span>
            </div>
            {favorites.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                <Star className="w-6 h-6 mx-auto mb-1 text-gray-600" />
                <p>No saved stations yet.</p>
                <p className="text-[10px] text-gray-600">Click the star on any station to bookmark it!</p>
              </div>
            ) : (
              favorites.map(st => {
                const isThisPlaying = currentStation.id === st.id && isPlaying;
                return (
                  <div
                    key={st.id}
                    onClick={() => playStation(st)}
                    className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer ${
                      currentStation.id === st.id ? 'bg-amber-950/30 border-amber-500/50' : 'bg-[#0f1522] border-gray-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{st.name}</div>
                      <div className="text-[9px] text-gray-400 truncate">{st.description || st.tags.join(', ')}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleFavoriteStation(st); }}
                        className="text-amber-400 p-1 hover:opacity-80"
                      >
                        <Star className="w-3 h-3 fill-amber-400" />
                      </button>
                      <button className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isThisPlaying ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-gray-300'
                      }`}>
                        {isThisPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 5: CUSTOM TUNE IN BY URL */}
        {activeTab === 'CUSTOM' && (
          <form onSubmit={handleCustomTuneIn} className="space-y-2 p-1">
            <div className="text-[10px] text-gray-400">
              Paste any live stream URL (Icecast, Shoutcast, HLS, or direct MP3/AAC/OGG):
            </div>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Station / Stream Label (optional)"
              className="w-full bg-[#111726] border border-gray-800 rounded-md py-1 px-2.5 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="url"
              required
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://stream.example.com/audio.mp3"
              className="w-full bg-[#111726] border border-gray-800 rounded-md py-1 px-2.5 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[10px] py-1.5 rounded-md flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>TUNE IN LIVE STREAM</span>
            </button>
          </form>
        )}

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* NOW PLAYING ACTIVE DOCK & AUDIO CONTROLS                              */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-2 bg-[#0a0f1b] border-t border-gray-800/80 shrink-0">
        
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mb-1 text-[9px] text-red-400 bg-red-950/40 border border-red-800/60 rounded px-1.5 py-0.5 truncate flex items-center justify-between">
            <span>⚠ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Station Avatar / Visualizer Thumbnail */}
          <div className="relative w-10 h-10 rounded-lg bg-[#141b2a] border border-cyan-500/40 overflow-hidden shrink-0 flex items-center justify-center">
            {currentStation.favicon ? (
              <img src={currentStation.favicon} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
            ) : (
              <Headphones className="w-5 h-5 text-cyan-400" />
            )}
            
            {/* Live Indicator Pill */}
            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black shadow-[0_0_4px_#10b981]" />
          </div>

          {/* Station Details & Spectrum Visualizer */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-white truncate max-w-[140px]">
                {currentStation.name}
              </span>
              <span className="text-[8px] font-mono text-cyan-400 font-bold">
                {playbackState === 'buffering' ? 'BUFFERING...' : isPlaying ? '● LIVE' : 'PAUSED'}
              </span>
            </div>

            {/* Frequency spectrum canvas visualizer */}
            <div className="mt-1 h-3 w-full bg-black/40 rounded overflow-hidden flex items-center">
              <canvas ref={canvasRef} width={180} height={12} className="w-full h-full" />
            </div>
          </div>

          {/* Quick Audio Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Prev */}
            <button 
              onClick={handleSkipPrevious} 
              className="p-1 text-gray-400 hover:text-white"
              title="Previous Station"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={handleTogglePlay}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isPlaying 
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_#00f3ff]' 
                  : 'bg-emerald-500 text-black shadow-[0_0_10px_#10b981] hover:scale-105'
              }`}
              title={isPlaying ? 'Pause' : 'Play Live Stream'}
            >
              {playbackState === 'buffering' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button 
              onClick={handleSkipNext} 
              className="p-1 text-gray-400 hover:text-white"
              title="Next Station"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Volume Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-1 text-gray-400 hover:text-white relative"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Volume Scrubbing Slider */}
        <div className="mt-1.5 flex items-center gap-2 px-1">
          <span className="text-[8px] font-mono text-gray-500">VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[8px] font-mono text-gray-400 w-6 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* EXPANDED FULL-SCREEN TUNER MODAL (60,000+ STATIONS EXPLORER)        */}
      {/* -------------------------------------------------------------------- */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a0f1b] border border-cyan-500/50 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-3 bg-[#0d1424] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-sm font-black text-white tracking-wider">CIVICVERSE GLOBAL MEDIA TUNER</span>
                <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded font-mono">
                  60,000+ OPEN STATIONS
                </span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Search input */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any station, artist, language, country, or genre..."
                    className="w-full bg-[#121929] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button type="submit" className="bg-cyan-500 text-black px-4 rounded-lg font-bold text-xs hover:bg-cyan-400">
                  Search
                </button>
              </form>

              {/* Tag filters */}
              <div className="flex flex-wrap gap-1.5">
                {['synthwave', 'cyberpunk', 'lofi', 'podcast', 'ambient', 'techno', 'house', 'rock', 'hiphop', 'classical', 'jazz'].map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedTag(t);
                      loadRadioStations(t);
                    }}
                    className={`text-xs px-3 py-1 rounded-full uppercase font-bold transition-all ${
                      selectedTag === t ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Stations Grid */}
              <div className="grid grid-cols-2 gap-2">
                {stations.map(st => {
                  const isThisPlaying = currentStation.id === st.id && isPlaying;
                  return (
                    <div
                      key={st.id}
                      onClick={() => playStation(st)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        currentStation.id === st.id
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-[#101726] border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-white truncate">{st.name}</div>
                        <div className="text-[10px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                          <span className="text-cyan-400 font-mono">{st.bitrate}k {st.codec}</span>
                          <span>•</span>
                          <span className="capitalize">{st.tags.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>

                      <button className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isThisPlaying ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-300 hover:text-white'
                      }`}>
                        {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#0d1424] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Powered by Howler.js & Open Radio Browser Directory</span>
              </span>
              <button 
                onClick={() => setIsExpanded(false)}
                className="bg-[#192338] text-white px-3 py-1 rounded hover:bg-gray-700 text-xs font-bold"
              >
                Close Tuner
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
