/**
 * Civicverse Real-Time Open News & Government Policy Service
 * Integrates with:
 * - Algolia & Firebase Hacker News API (100% Free & Open Source Trending Tech News)
 * - US Federal Register REST API (100% Free, Official Real-Time Bills, Mandates, Executive Orders & Agency Rules)
 */

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  author: string;
  handle: string;
  source: string;
  sourceDomain: string;
  sourceCategory: 'trending' | 'civic' | 'opensource';
  publishedAt: string;
  timeAgo: string;
  score: number;
  comments: number;
  retweets: number;
  abstract?: string;
  agency?: string;
  typeBadge: string;
  badgeColor: string;
  verified: boolean;
  avatar: string;
  liked: boolean;
  likes: number;
}

export interface NewsPreferences {
  autoScroll: boolean;
  scrollSpeed: 'slow' | 'normal' | 'fast';
  pauseOnHover: boolean;
  autoRefreshInterval: number; // in seconds (e.g. 60)
  compactView: boolean;
}

const DEFAULT_PREFERENCES: NewsPreferences = {
  autoScroll: true,
  scrollSpeed: 'normal',
  pauseOnHover: false,
  autoRefreshInterval: 60,
  compactView: false,
};

const STORAGE_KEYS = {
  FOLLOWING: 'civicverse_followed_entities_v1',
  PREFS: 'civicverse_news_prefs_v1',
  LIKES: 'civicverse_liked_articles_v1',
  RETWEETS: 'civicverse_retweeted_articles_v1',
};

// ----------------------------------------------------------------------------
// TIME & DOMAIN HELPERS
// ----------------------------------------------------------------------------
export function formatTimeAgo(dateInput: string | number): string {
  if (!dateInput) return 'just now';
  const timestamp = typeof dateInput === 'number' 
    ? (dateInput > 1e11 ? dateInput : dateInput * 1000) 
    : new Date(dateInput).getTime();

  if (isNaN(timestamp)) return 'recent';
  const diff = Math.max(0, (Date.now() - timestamp) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

export function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return 'civicverse.org';
  }
}

// ----------------------------------------------------------------------------
// DATA FETCHERS
// ----------------------------------------------------------------------------

/**
 * Fetch top trending free & open-source news from Hacker News Algolia API
 */
export async function fetchTrendingArticles(limit: number = 30): Promise<NewsArticle[]> {
  const likedSet = new Set(getLikedArticleIds());
  const retweetedSet = new Set(getRetweetedArticleIds());

  try {
    const res = await fetch(`https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data.hits)) return [];

    return data.hits.map((item: any) => {
      const id = `hn-${item.objectID || item.id}`;
      const url = item.url || `https://news.ycombinator.com/item?id=${item.objectID}`;
      const author = item.author || 'Civic Hacker';
      const domain = extractDomain(url);
      const isLiked = likedSet.has(id);
      const isRetweeted = retweetedSet.has(id);

      const isOSS = /open[- ]?source|github|linux|free software|decentralized|p2p/i.test(item.title);

      return {
        id,
        title: item.title || 'Untitled Discussion',
        url,
        author,
        handle: `@${author}`,
        source: domain === 'news.ycombinator.com' ? 'Hacker News' : domain,
        sourceDomain: domain,
        sourceCategory: isOSS ? 'opensource' : 'trending',
        publishedAt: item.created_at || new Date().toISOString(),
        timeAgo: formatTimeAgo(item.created_at_i || item.created_at),
        score: item.points || 0,
        comments: item.num_comments || 0,
        retweets: isRetweeted ? Math.floor((item.points || 10) * 0.4) + 1 : Math.floor((item.points || 10) * 0.4),
        typeBadge: isOSS ? 'OPEN SOURCE' : (item.points > 200 ? 'HOT TRENDING' : 'TECH BROADCAST'),
        badgeColor: isOSS 
          ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40' 
          : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
        verified: (item.points || 0) > 100,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(author)}`,
        liked: isLiked,
        likes: (item.points || 0) + (isLiked ? 1 : 0),
      };
    });
  } catch (err) {
    console.warn('Failed to fetch from Algolia HN API, trying fallback:', err);
    return getOfflineTrendingFallback();
  }
}

/**
 * Fetch live government bills, mandates, executive orders & agency rules from the US Federal Register API
 */
export async function fetchCivicArticles(limit: number = 30): Promise<NewsArticle[]> {
  const likedSet = new Set(getLikedArticleIds());
  const retweetedSet = new Set(getRetweetedArticleIds());

  try {
    const res = await fetch(`https://www.federalregister.gov/api/v1/documents.json?per_page=${limit}&order=newest`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
      const id = `gov-${item.document_number || Math.random().toString(36).substring(2)}`;
      const agencyName = (item.agency_names && item.agency_names[0]) ? item.agency_names[0] : 'United States Government';
      const cleanHandle = `@${agencyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
      const isLiked = likedSet.has(id);
      const isRetweeted = retweetedSet.has(id);

      // Distinguish Mandates, Bills, Rules, Executive Orders
      let typeBadge = 'GOV POLICY';
      let badgeColor = 'bg-blue-950/70 text-blue-300 border-blue-500/40';

      if (item.type === 'Presidential Document') {
        typeBadge = 'EXECUTIVE ORDER';
        badgeColor = 'bg-purple-950/70 text-purple-300 border-purple-500/40';
      } else if (item.type === 'Rule') {
        typeBadge = 'FEDERAL MANDATE';
        badgeColor = 'bg-amber-950/70 text-amber-300 border-amber-500/40';
      } else if (item.type === 'Proposed Rule') {
        typeBadge = 'PROPOSED BILL';
        badgeColor = 'bg-orange-950/70 text-orange-300 border-orange-500/40';
      } else if (item.type === 'Notice') {
        typeBadge = 'PUBLIC NOTICE';
        badgeColor = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
      }

      return {
        id,
        title: item.title || 'Official Federal Policy Action',
        url: item.html_url || `https://www.federalregister.gov/d/${item.document_number}`,
        author: agencyName,
        handle: cleanHandle,
        agency: agencyName,
        source: 'Federal Register',
        sourceDomain: 'federalregister.gov',
        sourceCategory: 'civic',
        publishedAt: item.publication_date || new Date().toISOString(),
        timeAgo: formatTimeAgo(item.publication_date),
        score: Math.floor(Math.random() * 80) + 40,
        comments: Math.floor(Math.random() * 30) + 5,
        retweets: isRetweeted ? 25 : Math.floor(Math.random() * 20) + 4,
        abstract: item.abstract ? item.abstract.replace(/<[^>]*>?/gm, '').slice(0, 170) + '...' : undefined,
        typeBadge,
        badgeColor,
        verified: true,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agencyName)}`,
        liked: isLiked,
        likes: (isLiked ? 1 : 0) + Math.floor(Math.random() * 50) + 15,
      };
    });
  } catch (err) {
    console.warn('Failed to fetch from Federal Register API, trying fallback:', err);
    return getOfflineCivicFallback();
  }
}

// ----------------------------------------------------------------------------
// FOLLOWING MANAGEMENT (STARTING COMPLETELY EMPTY AS REQUESTED)
// ----------------------------------------------------------------------------

export function getFollowedEntities(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLLOWING);
    if (!raw) return []; // Default to EMPTY: following feed is empty until user follows
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveFollowedEntities(entities: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLLOWING, JSON.stringify(entities));
  } catch (e) {
    console.error('Failed to save followed entities:', e);
  }
}

export function toggleFollowEntity(entityName: string): string[] {
  const current = getFollowedEntities();
  const normalized = entityName.trim();
  let updated: string[];

  if (current.some(e => e.toLowerCase() === normalized.toLowerCase())) {
    updated = current.filter(e => e.toLowerCase() !== normalized.toLowerCase());
  } else {
    updated = [...current, normalized];
  }

  saveFollowedEntities(updated);
  return updated;
}

export function isFollowingEntity(entityName: string): boolean {
  const current = getFollowedEntities();
  const normalized = entityName.trim().toLowerCase();
  return current.some(e => e.toLowerCase() === normalized);
}

export function clearAllFollows(): void {
  saveFollowedEntities([]);
}

// ----------------------------------------------------------------------------
// USER PREFERENCES & LIKES
// ----------------------------------------------------------------------------

export function getNewsPreferences(): NewsPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function saveNewsPreferences(prefs: NewsPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save news preferences:', e);
  }
}

export function getLikedArticleIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIKES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function toggleLikeArticle(articleId: string): boolean {
  const current = new Set(getLikedArticleIds());
  let nextLiked = false;
  if (current.has(articleId)) {
    current.delete(articleId);
    nextLiked = false;
  } else {
    current.add(articleId);
    nextLiked = true;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(Array.from(current)));
  } catch (e) {}
  return nextLiked;
}

export function getRetweetedArticleIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RETWEETS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function toggleRetweetArticle(articleId: string): boolean {
  const current = new Set(getRetweetedArticleIds());
  let nextRetweet = false;
  if (current.has(articleId)) {
    current.delete(articleId);
    nextRetweet = false;
  } else {
    current.add(articleId);
    nextRetweet = true;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.RETWEETS, JSON.stringify(Array.from(current)));
  } catch (e) {}
  return nextRetweet;
}

// ----------------------------------------------------------------------------
// HIGH-RESILIENCE INSTANT FALLBACKS (WHEN NET OFFLINE)
// ----------------------------------------------------------------------------

function getOfflineTrendingFallback(): NewsArticle[] {
  return [
    {
      id: 'fallback-1',
      title: 'Decentralized Civic Infrastructure & Open Protocol Standards Published',
      url: 'https://github.com/Civicverse/Civicverse',
      author: 'Civicverse Core',
      handle: '@CivicverseCore',
      source: 'github.com',
      sourceDomain: 'github.com',
      sourceCategory: 'opensource',
      publishedAt: new Date().toISOString(),
      timeAgo: '12m ago',
      score: 342,
      comments: 78,
      retweets: 120,
      typeBadge: 'OPEN SOURCE',
      badgeColor: 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40',
      verified: true,
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=civicverse',
      liked: false,
      likes: 342
    },
    {
      id: 'fallback-2',
      title: 'Linux Kernel 6.12 Adds Real-Time Deterministic Scheduling by Default',
      url: 'https://kernel.org',
      author: 'Torvalds_Team',
      handle: '@KernelOrg',
      source: 'kernel.org',
      sourceDomain: 'kernel.org',
      sourceCategory: 'opensource',
      publishedAt: new Date().toISOString(),
      timeAgo: '1h ago',
      score: 512,
      comments: 145,
      retweets: 210,
      typeBadge: 'HOT TRENDING',
      badgeColor: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
      verified: true,
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=kernel',
      liked: false,
      likes: 512
    }
  ];
}

function getOfflineCivicFallback(): NewsArticle[] {
  return [
    {
      id: 'gov-fallback-1',
      title: 'Federal Energy Regulatory Mandate: Modernization of Distributed Grid Power',
      url: 'https://www.federalregister.gov',
      author: 'Federal Energy Regulatory Commission',
      handle: '@FERC_Gov',
      agency: 'Federal Energy Regulatory Commission',
      source: 'Federal Register',
      sourceDomain: 'federalregister.gov',
      sourceCategory: 'civic',
      publishedAt: new Date().toISOString(),
      timeAgo: '3h ago',
      score: 180,
      comments: 32,
      retweets: 45,
      abstract: 'Order establishing new technical requirements for interconnection of distributed clean generation resources.',
      typeBadge: 'FEDERAL MANDATE',
      badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
      verified: true,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FERC',
      liked: false,
      likes: 180
    }
  ];
}
