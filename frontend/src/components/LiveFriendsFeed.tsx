import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { SocialPost, socialService } from '../services/social';

export default function LiveFriendsFeed() {
  const navigate = useNavigate();
  const user = useGameStore(state => state.user);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [error, setError] = useState('');
  const [activeReaction, setActiveReaction] = useState('');
  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const feed = await socialService.feed(user.civicId);
      setPosts(feed.posts.slice(0, 12));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your friends feed.');
    }
  }, [user]);

  const react = async (postId: string, reaction: 'like' | 'dislike') => {
    if (!user || activeReaction) return;
    const post = posts.find(item => item.id === postId);
    if (!post) return;
    const operation = post.reactions?.[user.civicId] === reaction ? 'remove' : reaction;
    setActiveReaction(postId);
    setError('');
    try {
      await socialService.react(postId, operation);
      await refresh();
    } catch (reactionError) {
      setError(reactionError instanceof Error ? reactionError.message : 'Could not react to this post.');
    } finally {
      setActiveReaction('');
    }
  };

  useEffect(() => {
    if (!user) return;
    void refresh();
    return socialService.subscribe(() => { void refresh(); });
  }, [refresh, user]);

  return (
    <section className="text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-cyan-300">Following · Live updates</h2>
        <button onClick={() => navigate('/vault')} className="text-[10px] font-bold text-slate-400 hover:text-white">Open Vault</button>
      </header>
      <div className="space-y-2 p-2">
        {!user && <p className="p-3 text-xs text-slate-400">Sign in to see updates from friends and people you follow.</p>}
        {error && <p role="alert" className="p-2 text-xs text-rose-300">{error}</p>}
        {user && !error && posts.length === 0 && <p className="p-3 text-xs text-slate-400">Follow citizens to see their updates here.</p>}
        {posts.map(post => (
          <article key={post.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <button onClick={() => navigate(`/profile/${encodeURIComponent(post.authorId)}`)} className="text-left text-[11px] font-bold text-cyan-200 hover:underline">
              {post.authorName || post.authorId}
            </button>
            {post.kind === 'status' && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-fuchsia-300">Status</span>}
            <time className="ml-2 text-[9px] text-slate-500">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
            {post.content && <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-4 text-slate-200">{post.content}</p>}
            {post.media?.mimeType.startsWith('image/') && <img src={post.media.url || post.media.dataUrl} alt={post.media.name} className="mt-2 max-h-32 w-full rounded object-cover" />}
            {post.media?.mimeType.startsWith('video/') && <video src={post.media.url || post.media.dataUrl} controls className="mt-2 max-h-32 w-full rounded" />}
            {post.media?.mimeType.startsWith('audio/') && <audio src={post.media.url || post.media.dataUrl} controls className="mt-2 w-full" />}
            {user && (
              <div className="mt-2 flex gap-2">
                {(['like', 'dislike'] as const).map(reaction => {
                  const reactionCount = Object.values(post.reactions || {}).filter(value => value === reaction).length;
                  const selected = post.reactions?.[user.civicId] === reaction;
                  return (
                    <button key={reaction} type="button" disabled={!!activeReaction}
                      onClick={() => void react(post.id, reaction)}
                      className={`rounded-md px-2 py-1 text-[10px] font-bold disabled:opacity-50 ${selected ? reaction === 'like' ? 'bg-cyan-400/20 text-cyan-200' : 'bg-rose-400/20 text-rose-200' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                      {reaction === 'like' ? 'Like' : 'Dislike'} · {reactionCount}
                    </button>
                  );
                })}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
