import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Camera, ExternalLink, Heart, Newspaper, Plane, Radio, RefreshCw, Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../services/multiplayer';

type CivicWatchTab = 'community' | 'city-cams' | 'drone' | 'entertainment' | 'news' | 'education';

interface DistrictStory {
  id: string;
  title: string;
  author: string;
  category: CivicWatchTab;
  sourceUrl: string;
  profileUrl?: string;
  authorId?: string;
  imageUrl?: string;
  mediaMimeType?: string;
  timestamp?: number;
  description?: string;
}

interface CivicWatchFeeds {
  community: DistrictStory[];
  cityCams: DistrictStory[];
  drone: DistrictStory[];
  entertainment: DistrictStory[];
  news: DistrictStory[];
  education: DistrictStory[];
}

const TABS: Array<{ id: CivicWatchTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'community', label: 'Community', icon: Users },
  { id: 'city-cams', label: 'Static cams', icon: Camera },
  { id: 'drone', label: 'Drone', icon: Plane },
  { id: 'entertainment', label: 'Entertainment', icon: Radio },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'education', label: 'Education', icon: BookOpen }
];

const EMPTY_FEEDS: CivicWatchFeeds = {
  community: [],
  cityCams: [],
  drone: [],
  entertainment: [],
  news: [],
  education: []
};
const EMOJIS = ['👋', '😀', '❤️', '👍', '🎉', '😂'];

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function classifyCommunityStory(text: string): CivicWatchTab[] {
  const content = text.toLowerCase();
  const categories: CivicWatchTab[] = [];
  if (/\b(camera|cctv|street|traffic|surveillance|safety|incident|city cam)\b/.test(content)) categories.push('city-cams');
  if (/\b(drone|aerial|uav|flyover)\b/.test(content)) categories.push('drone');
  if (/\b(music|concert|game|gaming|art|film|show|entertainment|event)\b/.test(content)) categories.push('entertainment');
  if (/\b(news|report|breaking|policy|city council|local government)\b/.test(content)) categories.push('news');
  if (/\b(learn|lesson|education|educational|class|course|tutorial|school|training)\b/.test(content)) categories.push('education');
  return categories;
}

function timestampLabel(timestamp?: number) {
  if (!timestamp || !Number.isFinite(timestamp)) return 'Community share';
  return new Date(timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

export default function CivicWatchDistrictPanel() {
  const navigate = useNavigate();
  const user = useGameStore(state => state.user);
  const wallet = useGameStore(state => state.wallet);
  const chatHistory = useMultiplayerStore(state => state.chatHistory);
  const peerCount = useMultiplayerStore(state => state.peerCount);
  const sendMessage = useMultiplayerStore(state => state.sendMessage);
  const [activeTab, setActiveTab] = useState<CivicWatchTab>('community');
  const [activeVideo, setActiveVideo] = useState<DistrictStory | null>(null);
  const [chatText, setChatText] = useState('');
  const [feeds, setFeeds] = useState<CivicWatchFeeds>(EMPTY_FEEDS);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [donationOpen, setDonationOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('1');
  const [donationMessage, setDonationMessage] = useState('');
  const [donationError, setDonationError] = useState('');
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    let active = true;
    const loadFeeds = async () => {
      const results = await Promise.allSettled([
        fetch('/api/social/explore?limit=50').then(async response => {
          if (!response.ok) throw new Error(`Community feed returned HTTP ${response.status}.`);
          return response.json();
        }),
        fetch('/api/civicwatch/media?limit=2').then(async response => {
          if (!response.ok) throw new Error(`CivicWatch media returned HTTP ${response.status}.`);
          return response.json();
        }),
        fetch('/api/billboard/news').then(async response => {
          if (!response.ok) throw new Error(`Open news feed returned HTTP ${response.status}.`);
          return response.json();
        }),
        fetch('/api/jobs').then(async response => {
          if (!response.ok) throw new Error(`CivicWatch missions returned HTTP ${response.status}.`);
          return response.json();
        })
      ]);
      if (!active) return;

      const [communityResult, mediaResult, newsResult, jobsResult] = results;
      const community: DistrictStory[] = [];
      const cityCams: DistrictStory[] = [];
      const drone: DistrictStory[] = [];
      const entertainment: DistrictStory[] = [];
      const news: DistrictStory[] = [];
      const education: DistrictStory[] = [];
      const errors: string[] = [];

      if (communityResult.status === 'fulfilled' && Array.isArray(communityResult.value.posts)) {
        for (const post of communityResult.value.posts) {
          if (!post || typeof post.id !== 'string' || typeof post.authorId !== 'string') continue;
          const text = typeof post.content === 'string' ? post.content.trim() : '';
          const profileUrl = `/profile/${encodeURIComponent(post.authorId)}`;
          const mediaUrl = typeof post.media?.url === 'string' &&
            typeof post.media.mimeType === 'string' &&
            /^(image|video|audio)\//.test(post.media.mimeType) &&
            /^\/api\/social\/media\/[0-9a-f-]{36}$/i.test(post.media.url)
            ? post.media.url
            : undefined;
          if (!text && !mediaUrl) continue;
          const linkedUrl = text.match(/https?:\/\/[^\s<>"']+/)?.[0];
          const story: DistrictStory = {
            id: `post-${post.id}`,
            title: text || post.media?.name || 'Community media',
            author: typeof post.authorName === 'string' ? post.authorName : 'Civicverse member',
            category: 'community',
            sourceUrl: linkedUrl && isHttpUrl(linkedUrl) ? linkedUrl : profileUrl,
            profileUrl,
            authorId: post.authorId,
            imageUrl: mediaUrl,
            mediaMimeType: mediaUrl ? post.media.mimeType : undefined,
            timestamp: typeof post.createdAt === 'number' ? post.createdAt : undefined
          };
          community.push(story);
          for (const category of classifyCommunityStory(story.title)) {
            const categorizedStory = { ...story, category };
            if (category === 'city-cams') cityCams.push(categorizedStory);
            if (category === 'drone') drone.push(categorizedStory);
            if (category === 'entertainment') entertainment.push(categorizedStory);
            if (category === 'news') news.push(categorizedStory);
            if (category === 'education') education.push(categorizedStory);
          }
        }
      } else {
        errors.push('Community posts are unavailable.');
      }

      if (mediaResult.status === 'fulfilled' && Array.isArray(mediaResult.value.items)) {
        for (const item of mediaResult.value.items) {
          if (typeof item?.id !== 'string' || typeof item.title !== 'string') continue;
          const imageUrl = typeof item.image === 'string' && /^data:image\/(?:jpeg|png|webp);base64,/.test(item.image)
            ? item.image
            : undefined;
          const story: DistrictStory = {
            id: `civicwatch-${item.id}`,
            title: item.title,
            author: typeof item.authorName === 'string' ? item.authorName : 'CivicWatch contributor',
            category: 'city-cams',
            sourceUrl: '/civicwatch',
            profileUrl: typeof item.authorId === 'string' ? `/profile/${encodeURIComponent(item.authorId)}` : undefined,
            authorId: typeof item.authorId === 'string' ? item.authorId : undefined,
            imageUrl,
            timestamp: typeof item.createdAt === 'number' ? item.createdAt : undefined,
            description: 'Verified, contributor-shared CivicWatch media'
          };
          community.push(story);
          cityCams.push(story);
        }
      } else {
        errors.push('CivicWatch submissions are unavailable.');
      }

      if (newsResult.status === 'fulfilled' && Array.isArray(newsResult.value.items)) {
        for (const item of newsResult.value.items) {
          if (typeof item?.id !== 'string' || typeof item.title !== 'string' || !isHttpUrl(item.sourceUrl)) continue;
          news.push({
            id: item.id,
            title: item.title,
            author: typeof item.author === 'string' ? item.author : 'Open news',
            category: 'news',
            sourceUrl: item.sourceUrl
          });
        }
      } else {
        errors.push('Live open news is unavailable.');
      }

      if (jobsResult.status === 'fulfilled' && Array.isArray(jobsResult.value)) {
        for (const job of jobsResult.value) {
          if (job?.category !== 'educational' || typeof job.title !== 'string') continue;
          education.push({
            id: `mission-${job.id}`,
            title: job.title,
            author: job.issuer || 'CivicWatch mission',
            category: 'education',
            sourceUrl: '/civicwatch',
            description: typeof job.description === 'string' ? job.description : undefined
          });
        }
      } else {
        errors.push('Education missions are unavailable.');
      }

      setFeeds({ community, cityCams, drone, entertainment, news, education });
      setFeedError(errors.join(' '));
      setLoading(false);
    };

    void loadFeeds();
    const interval = window.setInterval(() => void loadFeeds(), 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [refreshKey]);

  const visibleStories = useMemo(() => {
    if (activeTab === 'community') return feeds.community;
    if (activeTab === 'city-cams') return feeds.cityCams;
    if (activeTab === 'drone') return feeds.drone;
    if (activeTab === 'entertainment') return feeds.entertainment;
    if (activeTab === 'news') return feeds.news;
    if (activeTab === 'education') return feeds.education;
    return [];
  }, [activeTab, feeds]);

  const submitChat = (event: React.FormEvent) => {
    event.preventDefault();
    const message = chatText.trim();
    if (!message || !activeVideo) return;
    sendMessage(message, 'text-cyan-400', false, activeVideo.id);
    setChatText('');
  };

  const videoChatMessages = useMemo(
    () => activeVideo
      ? chatHistory.filter(message => !message.isSystem && message.channelId === activeVideo.id).slice(-5)
      : [],
    [activeVideo, chatHistory]
  );

  const sendDonation = async () => {
    setDonationError('');
    const amount = Number(donationAmount);
    if (!Number.isFinite(amount) || amount < 0.1) {
      setDonationError('Enter an amount of at least 0.1 CIVIC.');
      return;
    }
    if (user?.verificationLevel !== 2) {
      setDonationError('A verified CivicID is required to send a contribution.');
      return;
    }
    const processMicrotransaction = useGameStore.getState().processMicrotransaction;
    if (!processMicrotransaction) {
      setDonationError('Contributions are unavailable right now.');
      return;
    }
    setDonating(true);
    try {
      await processMicrotransaction(amount, 'CivicWatch Community', 'CivicWatch community contribution');
      setDonationMessage(`${amount.toFixed(2)} CIVIC in-app community contribution recorded.`);
      setDonationOpen(false);
    } catch (error) {
      setDonationError(error instanceof Error ? error.message : 'Contribution failed.');
    } finally {
      setDonating(false);
    }
  };

  const openStory = (story: DistrictStory) => {
    if (story.sourceUrl.startsWith('/')) {
      navigate(story.sourceUrl);
    } else if (isHttpUrl(story.sourceUrl)) {
      window.open(story.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="CivicWatch district hub">
      <header className="flex shrink-0 items-center justify-between border-b border-stainless-steel bg-stainless-steel px-3 py-2">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-400" />
          <h2 className="text-xs font-black uppercase tracking-wider">CivicWatch</h2>
          <span className="rounded border border-cyan-400/30 px-1.5 py-0.5 text-[8px] font-mono text-cyan-200">DISTRICT HUB</span>
        </div>
        <span className="text-[9px] font-mono text-emerald-300">{peerCount + 1} CITIZENS</span>
      </header>

      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-stainless-steel bg-[#101721] px-2 py-1.5" aria-label="CivicWatch content categories">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={selected}
              className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-[9px] font-bold transition-colors ${
                selected
                  ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-100'
                  : 'border-transparent text-gray-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col bg-[#0b111a]">
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white">
              {TABS.find(tab => tab.id === activeTab)?.label} feed
            </p>
            <p className="text-[9px] text-gray-500">
              {activeTab === 'city-cams' || activeTab === 'drone'
                    ? 'Publicly shared recordings only; no live camera or drone feed is claimed.'
                : 'Public community posts and open-source feeds'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey(value => value + 1)}
            aria-label="Refresh CivicWatch feeds"
            className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-cyan-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
          {loading && <p className="py-5 text-center text-[10px] text-gray-400">Loading district feeds…</p>}
          {!loading && feedError && (
            <p role="status" className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[9px] text-amber-200">{feedError}</p>
          )}
          {!loading && !visibleStories.length && !feedError && (
            <p className="rounded-lg border border-white/5 bg-white/[0.03] p-3 text-center text-[10px] text-gray-400">
              No {TABS.find(tab => tab.id === activeTab)?.label.toLowerCase()} submissions yet. Shared community content will appear here.
            </p>
          )}
          {visibleStories.map(story => (
            <article key={story.id} className="overflow-hidden rounded-lg border border-white/10 bg-[#121b28]">
              {story.imageUrl && (
                story.mediaMimeType?.startsWith('video/') ? (
                  <video
                    src={story.imageUrl}
                    controls
                    className="max-h-40 w-full bg-black/30"
                    preload="metadata"
                    onPlay={() => setActiveVideo(story)}
                    onPause={() => setActiveVideo(current => current?.id === story.id ? null : current)}
                    onEnded={() => setActiveVideo(current => current?.id === story.id ? null : current)}
                  />
                ) : story.mediaMimeType?.startsWith('audio/') ? (
                  <audio src={story.imageUrl} controls className="w-full px-2 pt-2" preload="metadata" />
                ) : (
                  <img src={story.imageUrl} alt="" className="h-28 w-full bg-black/30 object-cover" loading="lazy" />
                )
              )}
              <div className="p-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-[9px] font-bold uppercase tracking-wide text-cyan-300">{story.author}</span>
                  <time className="shrink-0 text-[8px] text-gray-500">{timestampLabel(story.timestamp)}</time>
                </div>
                <h3 className="line-clamp-3 text-[11px] font-semibold leading-snug text-gray-100">{story.title}</h3>
                {story.description && <p className="mt-1 line-clamp-2 text-[9px] text-gray-400">{story.description}</p>}
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => openStory(story)} className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-300 hover:text-white">
                    Open {story.sourceUrl.startsWith('/profile/') ? 'profile' : 'source'} <ExternalLink className="h-3 w-3" />
                  </button>
                  {story.profileUrl && (
                    <button type="button" onClick={() => navigate(story.profileUrl || '/')} className="text-[9px] font-bold text-gray-400 hover:text-white">
                      Profile
                    </button>
                  )}
                  {story.authorId && user?.civicId && story.authorId === user.civicId && (
                    <button type="button" onClick={() => navigate('/vault')} className="text-[9px] font-bold text-fuchsia-300 hover:text-white">
                      My Vault
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="shrink-0 border-t border-stainless-steel bg-[#111923] p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="min-w-0">
              <span className="block text-[9px] font-black uppercase tracking-wide text-gray-300">CivicWatch chat</span>
              <span className="block truncate text-[8px] text-gray-500">
                {activeVideo ? `Now discussing: ${activeVideo.title}` : 'Play a video to join its chat'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { setDonationMessage(''); setDonationError(''); setDonationOpen(true); }} className="inline-flex items-center gap-1 rounded border border-pink-400/30 px-1.5 py-1 text-[8px] font-bold text-pink-200">
                <Heart className="h-3 w-3" /> Donate
              </button>
            </div>
          </div>
          <div className="mb-1 max-h-10 space-y-0.5 overflow-y-auto">
            {videoChatMessages.map(message => (
              <p key={message.id} className="break-words text-[9px] leading-snug">
                <span className="font-bold text-cyan-300">{message.username}: </span>
                <span className="text-gray-200">{message.text}</span>
              </p>
            ))}
            {activeVideo && !videoChatMessages.length && <p className="text-[9px] text-gray-500">No messages for this video yet.</p>}
            {!activeVideo && <p className="text-[9px] text-gray-500">Video chat is separate from in-world proximity chat.</p>}
          </div>
          <form onSubmit={submitChat} className="flex gap-1">
            <input
              value={chatText}
              onChange={event => setChatText(event.target.value)}
              aria-label="CivicWatch video chat message"
              placeholder={activeVideo ? 'Message about this video…' : 'Play a video to chat…'}
              disabled={!activeVideo}
              maxLength={500}
              className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[10px] text-white placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none"
            />
            <button type="submit" disabled={!activeVideo} aria-label="Send chat message" className="rounded-md bg-cyan-500/15 px-2 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-40">
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          <div className="mt-1 flex items-center gap-0.5" aria-label="Quick-send emojis">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                disabled={!activeVideo}
                onClick={() => activeVideo && sendMessage(emoji, 'text-cyan-400', false, activeVideo.id)}
                aria-label={`Send ${emoji} to this video chat`}
                className="rounded px-1 text-xs hover:bg-cyan-400/15 disabled:opacity-40"
              >
                {emoji}
              </button>
            ))}
            <span className="ml-auto text-[8px] text-gray-500">Video chat</span>
          </div>
          {donationMessage && <p role="status" className="mt-1 text-[9px] text-emerald-300">{donationMessage}</p>}
        </div>
      </div>

      {donationOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="civicwatch-donation-title" className="w-full max-w-xs rounded-xl border border-pink-400/40 bg-[#0b121f] p-4 shadow-2xl">
            <h3 id="civicwatch-donation-title" className="text-sm font-black text-white">CivicWatch community contribution</h3>
            <p className="mt-1 text-[10px] text-gray-400">This in-app contribution updates your local wallet and broadcasts a lobby notice; it is not a direct creator transfer. Verified CivicID required. Balance: {wallet?.balance?.toFixed(2) ?? '0.00'} CIVIC.</p>
            <label htmlFor="civicwatch-donation-amount" className="mt-3 block text-[9px] font-bold uppercase text-gray-400">Amount (CIVIC)</label>
            <input
              id="civicwatch-donation-amount"
              type="number"
              min="0.1"
              step="0.1"
              value={donationAmount}
              onChange={event => setDonationAmount(event.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
            />
            {donationError && <p role="alert" className="mt-2 text-[10px] text-red-300">{donationError}</p>}
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={donating} onClick={() => void sendDonation()} className="flex-1 rounded-md bg-pink-500 px-3 py-2 text-[10px] font-black text-black disabled:opacity-50">
                {donating ? 'Sending…' : 'Confirm contribution'}
              </button>
              <button type="button" disabled={donating} onClick={() => setDonationOpen(false)} className="rounded-md border border-white/10 px-3 py-2 text-[10px] text-gray-300">Cancel</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
