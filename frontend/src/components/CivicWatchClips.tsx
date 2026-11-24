import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RefreshCw, UserRound } from 'lucide-react';
import { getUserBroadcastVideos } from '../services/mediaService';

interface Clip {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  url?: string;
  mimeType?: string;
  image?: string;
}

export const CivicWatchClips: React.FC = () => {
  const navigate = useNavigate();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [socialResponse, watchResponse] = await Promise.all([
          fetch('/api/social/explore?limit=50'),
          fetch('/api/civicwatch/media?limit=20')
        ]);
        const [socialData, watchData] = await Promise.all([
          socialResponse.ok ? socialResponse.json() : Promise.resolve({ posts: [] }),
          watchResponse.ok ? watchResponse.json() : Promise.resolve({ items: [] })
        ]);
        const socialClips: Clip[] = (Array.isArray(socialData.posts) ? socialData.posts : [])
          .filter((post: any) => post?.media && typeof post.media.url === 'string' && /^(video|image)\//.test(post.media.mimeType || ''))
          .map((post: any) => ({
            id: `post-${post.id}`,
            title: post.content || post.media.name || 'Community video',
            author: post.authorName || 'Civicverse member',
            authorId: post.authorId,
            url: post.media.url,
            mimeType: post.media.mimeType
          }));
        const watchClips: Clip[] = (Array.isArray(watchData.items) ? watchData.items : [])
          .filter((item: any) => typeof item?.image === 'string')
          .map((item: any) => ({
            id: `watch-${item.id}`,
            title: item.title || item.description || 'CivicWatch field report',
            author: item.authorName || 'CivicWatch contributor',
            authorId: item.authorId,
            image: item.image,
            mimeType: 'image/jpeg'
          }));

        // Load local citizen videos broadcasted from the Vault
        const userBroadcasts = getUserBroadcastVideos()
          .filter(v => v.shareToCivicWatch && v.url)
          .map(v => ({
            id: `user-broadcast-${v.id}`,
            title: v.title || 'Citizen Community Report',
            author: v.creatorUsername || 'Citizen Creator',
            authorId: v.creatorCivicId,
            url: v.url,
            mimeType: 'video/mp4'
          }));

        if (!cancelled) {
          setClips([...userBroadcasts, ...socialClips, ...watchClips]);
          setError('');
        }
      } catch {
        if (!cancelled) setError('CivicWatch media could not be reached.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();

    const handleBroadcastUpdate = () => void load();
    window.addEventListener('civicwatch_broadcast_changed', handleBroadcastUpdate);
    window.addEventListener('civicverse_videos_changed', handleBroadcastUpdate);
    window.addEventListener('civicverse_sharing_changed', handleBroadcastUpdate);

    const timer = window.setInterval(() => void load(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('civicwatch_broadcast_changed', handleBroadcastUpdate);
      window.removeEventListener('civicverse_videos_changed', handleBroadcastUpdate);
      window.removeEventListener('civicverse_sharing_changed', handleBroadcastUpdate);
    };
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center text-cyan-300"><RefreshCw className="h-5 w-5 animate-spin" /></div>;
  if (error) return <div className="flex h-full items-center justify-center p-5 text-center text-xs text-rose-300">{error}</div>;
  if (!clips.length) return <div className="flex h-full flex-col items-center justify-center gap-2 p-5 text-center text-xs text-slate-400"><Play className="h-6 w-6 text-cyan-300" />No community videos yet. Upload a video from your Vault profile to share it here.</div>;

  return (
    <div className="h-full snap-y snap-mandatory overflow-y-auto bg-black scrollbar-thin">
      {clips.map(clip => (
        <article key={clip.id} className="relative flex h-full min-h-full snap-start flex-col items-center justify-center overflow-hidden bg-black">
          {clip.url && clip.mimeType?.startsWith('video/') ? (
            <video src={clip.url} className="absolute inset-0 h-full w-full object-contain" controls muted loop playsInline autoPlay preload="metadata" />
          ) : clip.image ? (
            <img src={clip.image} alt={clip.title} className="absolute inset-0 h-full w-full object-contain" />
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-4 pt-14 text-white">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-cyan-300">CivicWatch · Community</p>
            <p className="mt-1 line-clamp-3 text-xs font-bold">{clip.title}</p>
            <button type="button" onClick={() => clip.authorId && navigate(`/profile/${encodeURIComponent(clip.authorId)}`)} className="pointer-events-auto mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-200 hover:text-cyan-200" disabled={!clip.authorId}>
              <UserRound className="h-3 w-3" /> {clip.author}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};
