import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Search,
  Users,
  TrendingUp,
  Landmark,
  Shield,
  X,
  Check,
  Sparkles,
  SlidersHorizontal,
  Flame,
  FileText
} from 'lucide-react';
import {
  NewsArticle,
  NewsPreferences,
  fetchTrendingArticles,
  fetchCivicArticles,
  getFollowedEntities,
  toggleFollowEntity,
  isFollowingEntity,
  clearAllFollows,
  getNewsPreferences,
  saveNewsPreferences,
  toggleLikeArticle,
  toggleRetweetArticle
} from '../services/newsService';

export const CivicNewsFeed: React.FC = () => {
  // Navigation tab: 'Following' | 'Trending' | 'Civic News'
  const [activeTab, setActiveTab] = useState<'Following' | 'Trending' | 'Civic News'>('Trending');

  // Real-time feeds state
  const [trendingArticles, setTrendingArticles] = useState<NewsArticle[]>([]);
  const [civicArticles, setCivicArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Following list state (starts empty by default)
  const [followedList, setFollowedList] = useState<string[]>(() => getFollowedEntities());

  // Preferences
  const [preferences, setPreferences] = useState<NewsPreferences>(() => getNewsPreferences());
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Auto-scroll mechanics
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const autoScrollRafRef = useRef<number | null>(null);
  const interactionTimeoutRef = useRef<any>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Reset scroll to top on tab change
  useEffect(() => {
    scrollPosRef.current = 0;
    if (feedScrollRef.current) {
      feedScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // --------------------------------------------------------------------------
  // 1. DATA INITIALIZATION & REAL-TIME REFRESH
  // --------------------------------------------------------------------------
  const loadNewsData = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [trending, civic] = await Promise.all([
        fetchTrendingArticles(30),
        fetchCivicArticles(30)
      ]);
      setTrendingArticles(trending);
      setCivicArticles(civic);
      setLastUpdatedTime(new Date());
    } catch (err) {
      console.warn('Error loading real-time news data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNewsData();

    // Background polling interval based on user preferences
    const intervalSec = Math.max(30, preferences.autoRefreshInterval || 60);
    const interval = setInterval(() => {
      loadNewsData(true);
    }, intervalSec * 1000);

    return () => clearInterval(interval);
  }, [preferences.autoRefreshInterval]);

  // --------------------------------------------------------------------------
  // 2. FOLLOWING TAB RESOLUTION
  // --------------------------------------------------------------------------
  const handleToggleFollow = (entityName: string) => {
    const updated = toggleFollowEntity(entityName);
    setFollowedList(updated);
    const nowFollowing = updated.some(e => e.toLowerCase() === entityName.toLowerCase());
    showToast(nowFollowing ? `Followed ${entityName}` : `Unfollowed ${entityName}`);
  };

  // Combine articles matching followed entities
  const followingArticles = useMemo(() => {
    if (followedList.length === 0) return [];

    const lowerFollowed = new Set(followedList.map(f => f.toLowerCase()));
    const all = [...trendingArticles, ...civicArticles];

    return all.filter(article => 
      lowerFollowed.has(article.author.toLowerCase()) ||
      lowerFollowed.has(article.sourceDomain.toLowerCase()) ||
      (article.agency && lowerFollowed.has(article.agency.toLowerCase()))
    );
  }, [followedList, trendingArticles, civicArticles]);

  // Active list filtered by search query
  const displayedArticles = useMemo(() => {
    let list: NewsArticle[] = [];
    if (activeTab === 'Following') list = followingArticles;
    else if (activeTab === 'Trending') list = trendingArticles;
    else list = civicArticles;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.sourceDomain.toLowerCase().includes(q) ||
      (a.abstract && a.abstract.toLowerCase().includes(q))
    );
  }, [activeTab, followingArticles, trendingArticles, civicArticles, searchQuery]);

  // --------------------------------------------------------------------------
  // 3. SILKY AUTO-SCROLL ENGINE (CONTINUOUS TELEPROMPTER)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = feedScrollRef.current;
    if (!container || !preferences.autoScroll) {
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
      return;
    }

    const speedMap = {
      slow: 0.45,   // ~27 px/sec (relaxed reading pace)
      normal: 0.85, // ~50 px/sec (calm teleprompter pace, slowed down just a tad)
      fast: 1.4     // ~84 px/sec (casual scanning pace)
    };
    const speed = speedMap[preferences.scrollSpeed] || 0.85;

    let lastTimestamp = performance.now();
    scrollPosRef.current = container.scrollTop;

    const step = (now: number) => {
      const delta = Math.min(2.5, (now - lastTimestamp) / 16.6); // normalized 60fps delta
      lastTimestamp = now;

      const shouldPause = (preferences.pauseOnHover && isHovered) || isUserInteracting;

      if (!shouldPause && container) {
        scrollPosRef.current += speed * delta;
        const maxScroll = container.scrollHeight - container.clientHeight;

        if (maxScroll > 10) {
          if (scrollPosRef.current >= maxScroll) {
            // Reached bottom: wrap back to top smoothly
            scrollPosRef.current = 0;
            container.scrollTop = 0;
          } else {
            container.scrollTop = Math.round(scrollPosRef.current);
          }
        }
      } else if (container) {
        // Keep accumulator synced with user manual scroll
        scrollPosRef.current = container.scrollTop;
      }

      autoScrollRafRef.current = requestAnimationFrame(step);
    };

    autoScrollRafRef.current = requestAnimationFrame(step);

    return () => {
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
    };
  }, [preferences.autoScroll, preferences.scrollSpeed, preferences.pauseOnHover, isHovered, isUserInteracting, displayedArticles]);

  const handleUserWheel = () => {
    setIsUserInteracting(true);
    if (feedScrollRef.current) {
      scrollPosRef.current = feedScrollRef.current.scrollTop;
    }
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 1800);
  };

  // --------------------------------------------------------------------------
  // 4. ARTICLE ENGAGEMENTS (LIKE, REPOST, SHARE)
  // --------------------------------------------------------------------------
  const handleLike = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    const nextLiked = toggleLikeArticle(article.id);
    
    // Update local state
    const updater = (prev: NewsArticle[]) => prev.map(a => {
      if (a.id === article.id) {
        return {
          ...a,
          liked: nextLiked,
          likes: nextLiked ? a.likes + 1 : Math.max(0, a.likes - 1)
        };
      }
      return a;
    });

    setTrendingArticles(updater);
    setCivicArticles(updater);
  };

  const handleRetweet = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    const nextRetweet = toggleRetweetArticle(article.id);

    const updater = (prev: NewsArticle[]) => prev.map(a => {
      if (a.id === article.id) {
        return {
          ...a,
          retweets: nextRetweet ? a.retweets + 1 : Math.max(0, a.retweets - 1)
        };
      }
      return a;
    });

    setTrendingArticles(updater);
    setCivicArticles(updater);
    showToast(nextRetweet ? 'Broadcasted to Foyer Feed' : 'Broadcast removed');
  };

  const handleShare = (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(article.url);
      showToast('Article link copied to clipboard!');
    }
  };

  const handleUpdatePref = (key: keyof NewsPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    saveNewsPreferences(updated);
  };

  return (
    <div className="h-full flex flex-col bg-[#080d16] overflow-hidden select-none relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10px] font-mono px-3 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.5)] flex items-center gap-1.5 animate-fadeIn">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. TOP HEADER: TITLE & CONTROLS                                     */}
      {/* ==================================================================== */}
      <div className="p-2.5 px-3 bg-stainless-steel flex items-center justify-between border-b border-stainless-steel shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black tracking-wider text-white uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              FOYER FEED
            </span>
          </div>
          <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
            LIVE OPEN WIRE
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          {/* Search Toggle */}
          <button 
            onClick={() => setIsSearchOpen(v => !v)}
            className={`p-1 rounded transition-colors ${isSearchOpen ? 'text-cyan-400 bg-cyan-950/40' : 'hover:text-white'}`}
            title="Search Articles & Bills"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Real-time Refresh */}
          <button 
            onClick={() => loadNewsData(true)}
            className={`p-1 rounded transition-colors hover:text-white ${isRefreshing ? 'text-cyan-400' : ''}`}
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Preferences Settings Modal */}
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-1 rounded hover:text-white transition-colors"
            title="Foyer Feed Preferences & Auto-Scroll"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar (Expandable) */}
      {isSearchOpen && (
        <div className="p-2 bg-[#0b101c] border-b border-gray-800/80 flex items-center gap-2 shrink-0 animate-fadeIn">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter live news, bills, mandates, authors..."
              className="w-full bg-[#121927] border border-gray-700 rounded-lg py-1 pl-8 pr-7 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. NAVIGATION TABS (FOLLOWING | TRENDING | CIVIC NEWS)               */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800/60 bg-[#090e18] shrink-0 text-xs font-bold">
        <div className="flex items-center gap-4">
          {(['Following', 'Trending', 'Civic News'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                className={`relative py-1 transition-all flex items-center gap-1.5 ${
                  isActive ? 'text-white font-extrabold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'Following' && <Users className="w-3 h-3" />}
                {tab === 'Trending' && <Flame className="w-3 h-3 text-orange-400" />}
                {tab === 'Civic News' && <Landmark className="w-3 h-3 text-cyan-400" />}
                <span>{tab}</span>
                {tab === 'Following' && followedList.length > 0 && (
                  <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1 rounded-full font-mono">
                    {followedList.length}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00f3ff]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Auto-Scroll Quick Status Pill & Speed Cycler */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleUpdatePref('autoScroll', !preferences.autoScroll)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all flex items-center gap-1 border ${
              preferences.autoScroll
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                : 'bg-gray-900 border-gray-700 text-gray-500'
            }`}
            title="Toggle Automatic Slow Scrolling (Play / Pause)"
          >
            {preferences.autoScroll ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ROLLING</span>
              </>
            ) : (
              <>
                <Pause className="w-2 h-2 fill-current" />
                <span>PAUSED</span>
              </>
            )}
          </button>

          {preferences.autoScroll && (
            <button
              onClick={() => {
                const nextSpeed = preferences.scrollSpeed === 'slow' ? 'normal' : preferences.scrollSpeed === 'normal' ? 'fast' : 'slow';
                handleUpdatePref('scrollSpeed', nextSpeed);
                showToast(`Auto-Scroll Speed: ${nextSpeed.toUpperCase()}`);
              }}
              className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#101929] border border-cyan-500/30 text-cyan-300 hover:border-cyan-400"
              title="Click to Cycle Speed (Slow / Normal / Fast)"
            >
              {preferences.scrollSpeed === 'slow' ? '0.5x' : preferences.scrollSpeed === 'normal' ? '0.9x' : '1.4x'}
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. POSTS SCROLL FEED (LIVE & AUTO-SCROLLING)                        */}
      {/* ==================================================================== */}
      <div
        ref={feedScrollRef}
        onMouseEnter={() => { if (preferences.pauseOnHover) setIsHovered(true); }}
        onMouseLeave={() => { if (preferences.pauseOnHover) setIsHovered(false); }}
        onWheel={handleUserWheel}
        onTouchMove={handleUserWheel}
        className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin select-text"
      >
        {isLoading ? (
          <div className="py-20 text-center text-cyan-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-xs font-mono">CONNECTING REAL-TIME WIRE...</span>
          </div>
        ) : activeTab === 'Following' && followedList.length === 0 ? (
          
          /* ---------------------------------------------------------------- */
          /* EMPTY STATE FOR FOLLOWING TAB (EXACTLY AS REQUESTED)            */
          /* ---------------------------------------------------------------- */
          <div className="py-10 px-3 text-center flex flex-col items-center justify-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mb-3 text-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.25)]">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
              YOUR FOLLOWING FEED IS EMPTY
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed max-w-[240px] mb-4">
              You aren't following any citizens, agencies, or civic topics yet. In Civicverse, your Following feed is 100% curated by you.
            </p>

            <div className="w-full bg-[#0d1424] border border-gray-800 rounded-xl p-3 mb-4 text-left">
              <div className="text-[9px] font-mono text-cyan-400 uppercase font-bold mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>RECOMMENDED SOURCES TO FOLLOW:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Federal Register',
                  'Torvalds_Team',
                  'Civicverse Core',
                  'Department of Energy',
                  'EPA Government',
                  'NASA'
                ].map(rec => {
                  const isFol = followedList.some(f => f.toLowerCase() === rec.toLowerCase());
                  return (
                    <button
                      key={rec}
                      onClick={() => handleToggleFollow(rec)}
                      className={`text-[9px] font-mono font-bold px-2 py-1 rounded-md border transition-all flex items-center gap-1 ${
                        isFol
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-[#121a2c] border-gray-700 text-gray-300 hover:border-cyan-500'
                      }`}
                    >
                      {isFol ? <Check className="w-2.5 h-2.5" /> : <span>+</span>}
                      <span>{rec}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('Trending')}
              className="bg-cyan-500 text-black px-4 py-1.5 rounded-lg text-xs font-black hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            >
              Explore Trending News
            </button>
          </div>

        ) : displayedArticles.length === 0 ? (
          
          <div className="py-16 text-center text-gray-500 text-xs font-mono">
            No articles match your search filter.
          </div>

        ) : (

          /* ---------------------------------------------------------------- */
          /* REAL-TIME ARTICLE CARDS                                          */
          /* ---------------------------------------------------------------- */
          displayedArticles.map((article) => {
            const isFollowingThis = isFollowingEntity(article.author);

            return (
              <article 
                key={article.id} 
                className="bg-[#0e1422] border border-[#1b263b] hover:border-cyan-500/50 rounded-xl p-3 shadow-md transition-all group relative overflow-hidden"
              >
                {/* Top Row: Author, Domain, Badges, Follow button */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img 
                      src={article.avatar} 
                      alt={article.author} 
                      className="w-7 h-7 rounded-full object-cover border border-cyan-500/30 shrink-0 bg-black"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                          {article.author}
                        </span>
                        {article.verified && (
                          <CheckCircle2 className="w-3 h-3 text-cyan-400 fill-cyan-400/20 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400">
                        <span>{article.sourceDomain}</span>
                        <span>•</span>
                        <span>{article.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Follow Button & Category Badge */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(article.author);
                      }}
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-all border ${
                        isFollowingThis
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                          : 'bg-[#151f33] border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                      }`}
                      title={isFollowingThis ? 'Unfollow author' : 'Follow author'}
                    >
                      {isFollowingThis ? '✓ FOLLOWING' : '+ FOLLOW'}
                    </button>
                    
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${article.badgeColor}`}>
                      {article.typeBadge}
                    </span>
                  </div>
                </div>

                {/* Article Title (Clickable Directly to Official Source) */}
                <a 
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs font-bold text-gray-100 group-hover:text-cyan-300 leading-snug mb-1.5 transition-colors"
                  title="Open official article / bill in new tab"
                >
                  <span className="hover:underline">{article.title}</span>
                  <ExternalLink className="w-3 h-3 inline-block ml-1 text-cyan-400/80 group-hover:text-cyan-300 transition-colors" />
                </a>

                {/* Abstract / Summary for government mandates & bills */}
                {article.abstract && (
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-2 font-sans line-clamp-2">
                    {article.abstract}
                  </p>
                )}

                {/* Bottom Row: Engagements & Source Link */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/60 mt-1">
                  
                  {/* Comments */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                    title="View comments & discussions"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span className="text-[10px] font-mono">{article.comments}</span>
                  </a>

                  {/* Repost / Retweet */}
                  <button 
                    onClick={(e) => handleRetweet(e, article)}
                    className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                    title="Broadcast to Civicverse"
                  >
                    <Repeat2 className="w-3 h-3" />
                    <span className="text-[10px] font-mono">{article.retweets}</span>
                  </button>

                  {/* Like Button */}
                  <button 
                    onClick={(e) => handleLike(e, article)}
                    className={`flex items-center gap-1 transition-colors ${
                      article.liked ? 'text-pink-500 font-bold' : 'hover:text-pink-400'
                    }`}
                    title={article.liked ? 'Unlike' : 'Like'}
                  >
                    <Heart className={`w-3 h-3 ${article.liked ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-mono">{article.likes}</span>
                  </button>

                  {/* Share Link */}
                  <button 
                    onClick={(e) => handleShare(e, article)}
                    className="hover:text-gray-200 p-0.5"
                    title="Copy article link"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>

                  {/* Direct Link pill */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5"
                  >
                    <span>SOURCE</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>

                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. PREFERENCES SETTINGS MODAL (REQUESTED FEATURE)                   */}
      {/* ==================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0f1b] border border-cyan-500/50 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.3)] flex flex-col max-h-[85vh] overflow-hidden animate-fadeIn">
            
            {/* Header */}
            <div className="p-3 bg-[#0d1424] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black text-white tracking-wider uppercase">FOYER FEED PREFERENCES</span>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-4 overflow-y-auto text-xs text-gray-300">
              
              {/* SECTION A: AUTO-SCROLL CONTROLS */}
              <div className="space-y-2 border-b border-gray-800 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Play className="w-3 h-3 text-cyan-400 fill-current" />
                      <span>Automatic Casual Scrolling</span>
                    </div>
                    <div className="text-[10px] text-gray-400">Silky phone-scroll pace through active articles</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.autoScroll}
                    onChange={(e) => handleUpdatePref('autoScroll', e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Speed Selector */}
                {preferences.autoScroll && (
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block mb-1">Scroll Speed:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['slow', 'normal', 'fast'] as const).map(spd => (
                        <button
                          key={spd}
                          onClick={() => handleUpdatePref('scrollSpeed', spd)}
                          className={`py-1 rounded border text-[10px] font-mono font-bold uppercase transition-all ${
                            preferences.scrollSpeed === spd
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                              : 'bg-[#121929] border-gray-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {spd === 'slow' ? '0.5x Relaxed' : spd === 'normal' ? '0.9x Reading' : '1.4x Fast'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pause on Hover */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400">Pause scrolling when cursor hovers over articles</span>
                  <input
                    type="checkbox"
                    checked={preferences.pauseOnHover}
                    onChange={(e) => handleUpdatePref('pauseOnHover', e.target.checked)}
                    className="w-3.5 h-3.5 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* SECTION B: REFRESH INTERVAL */}
              <div className="space-y-2 border-b border-gray-800 pb-3">
                <span className="font-bold text-white block">Real-Time Refresh Frequency:</span>
                <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                  {[30, 60, 120, 300].map(sec => (
                    <button
                      key={sec}
                      onClick={() => handleUpdatePref('autoRefreshInterval', sec)}
                      className={`py-1 rounded border text-center transition-all ${
                        preferences.autoRefreshInterval === sec
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-[#121929] border-gray-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION C: MANAGE FOLLOWED CITIZENS & AGENCIES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span>Followed Entities ({followedList.length})</span>
                  </span>
                  {followedList.length > 0 && (
                    <button
                      onClick={() => {
                        clearAllFollows();
                        setFollowedList([]);
                        showToast('All follows cleared');
                      }}
                      className="text-[9px] font-mono text-red-400 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {followedList.length === 0 ? (
                  <p className="text-[10px] text-gray-500 font-mono italic">
                    Currently following 0 entities. Your Following tab is empty.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-[#080d16] border border-gray-800 rounded-lg">
                    {followedList.map(ent => (
                      <span
                        key={ent}
                        className="text-[9px] font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <span>{ent}</span>
                        <button
                          onClick={() => handleToggleFollow(ent)}
                          className="hover:text-red-400 font-bold"
                          title="Remove follow"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#0d1424] border-t border-gray-800 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Preferences saved to local device</span>
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="bg-cyan-500 text-black px-3 py-1 rounded font-black hover:bg-cyan-400 text-xs"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
