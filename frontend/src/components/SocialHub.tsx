import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CharacterViewer } from './3d/CharacterViewer';
import { useGameStore } from '../store/gameStore';
import { SocialCursor, SocialEffect, SocialGroup, SocialPost, SocialProfile, SocialTheme, socialService } from '../services/social';

interface SocialHubProps {
  profileId?: string;
}

const emptyProfile = (civicId: string, username: string, character: SocialProfile['character']): SocialProfile => ({
  civicId,
  username,
  about: '',
  status: '',
  theme: 'nebula',
  cursor: 'sparkle',
  effect: 'none',
  backgroundColor: '#080b18',
  character,
  updatedAt: Date.now()
});

const themeOptions: Array<{ id: SocialTheme; label: string; className: string; backgroundColor: string }> = [
  { id: 'nebula', label: 'Nebula', className: 'from-indigo-950 via-purple-950 to-slate-950 border-fuchsia-400/30', backgroundColor: '#312e81' },
  { id: 'aurora', label: 'Aurora', className: 'from-emerald-950 via-cyan-950 to-slate-950 border-cyan-400/30', backgroundColor: '#047857' },
  { id: 'sunset', label: 'Sunset', className: 'from-rose-950 via-orange-950 to-slate-950 border-orange-400/30', backgroundColor: '#be123c' },
  { id: 'ocean', label: 'Deep ocean', className: 'from-blue-950 via-sky-950 to-slate-950 border-sky-400/30', backgroundColor: '#0369a1' },
  { id: 'synthwave', label: 'Synthwave', className: 'from-fuchsia-950 via-violet-950 to-slate-950 border-violet-400/30', backgroundColor: '#c026d3' },
  { id: 'forest', label: 'Forest', className: 'from-green-950 via-teal-950 to-slate-950 border-emerald-400/30', backgroundColor: '#15803d' }
];
const themeClasses = Object.fromEntries(themeOptions.map(option => [option.id, option.className])) as Record<SocialTheme, string>;
const effectOptions: Array<{ id: SocialEffect; label: string }> = [
  { id: 'none', label: 'No effect' },
  { id: 'stars', label: 'Starfield' },
  { id: 'aurora', label: 'Aurora shimmer' },
  { id: 'glow', label: 'Neon glow' }
];
const cursorOptions: Array<{ id: SocialCursor; label: string }> = [
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'comet', label: 'Comet' },
  { id: 'crosshair', label: 'Crosshair' },
  { id: 'none', label: 'Default' }
];
const defaultCharacter: NonNullable<SocialProfile['character']> = {
  skinColor: '#e0ac69',
  hairColor: '#4a3b2a',
  shirtColor: '#00d9ff',
  pantsColor: '#1a1a2e',
  shoesColor: '#333333',
  hairStyle: 'short',
  accessory: 'none',
  bodyType: 'athletic'
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SocialHub({ profileId }: SocialHubProps) {
  const navigate = useNavigate();
  const user = useGameStore(state => state.user);
  const targetId = profileId || user?.civicId || '';
  const isOwner = !!user && user.civicId === targetId;
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [relationships, setRelationships] = useState<Array<{ type: string; actorId: string; targetId: string; status: string }>>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [about, setAbout] = useState('');
  const [status, setStatus] = useState('');
  const [theme, setTheme] = useState<SocialTheme>('nebula');
  const [cursor, setCursor] = useState<SocialCursor>('sparkle');
  const [effect, setEffect] = useState<SocialEffect>('none');
  const [backgroundColor, setBackgroundColor] = useState('#080b18');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<SocialPost['media']>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SocialProfile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetId) return;
    setError('');
    try {
      try {
        const result = await socialService.profile(targetId);
        setProfile(result.profile);
        setPosts(result.posts);
        setFollowerCount(result.followerCount);
        setFollowingCount(result.followingCount);
        setAbout(result.profile.about);
        setStatus(result.profile.status);
        setTheme(result.profile.theme);
        setCursor(result.profile.cursor);
        setEffect(result.profile.effect || 'none');
        setBackgroundColor(result.profile.backgroundColor || '#080b18');
      } catch (profileError) {
        if (!isOwner || !(profileError instanceof Error) || !profileError.message.includes('profile_not_found')) throw profileError;
        const initial = emptyProfile(targetId, user.username, user.character);
        setProfile(initial);
        setAbout(initial.about);
        setStatus(initial.status);
        setTheme(initial.theme);
        setCursor(initial.cursor);
        setEffect(initial.effect);
        setBackgroundColor(initial.backgroundColor);
      }

      if (user) {
        const [feed, allGroups, currentRelationships] = await Promise.all([
          socialService.feed(user.civicId),
          fetch('/api/social/groups').then(async response => {
            if (!response.ok) throw new Error('Could not load groups.');
            return response.json() as Promise<SocialGroup[]>;
          }),
          fetch(`/api/social/relationships?viewerId=${encodeURIComponent(user.civicId)}`).then(async response => {
            if (!response.ok) throw new Error('Could not load connections.');
            return response.json() as Promise<typeof relationships>;
          })
        ]);
        if (targetId === user.civicId) setPosts(feed.posts);
        setGroups(allGroups);
        setRelationships(currentRelationships);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this social profile.');
    }
  }, [isOwner, targetId, user]);

  useEffect(() => {
    void refresh();
    return socialService.subscribe(() => { void refresh(); });
  }, [refresh]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      socialService.search(search.trim()).then(setSearchResults).catch(searchError => {
        setError(searchError instanceof Error ? searchError.message : 'Search failed.');
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const profileStyle = useMemo(() => profile ? `bg-gradient-to-br ${themeClasses[profile.theme]}` : '', [profile]);
  const viewerCharacter = profile ? profile.character || (isOwner ? user?.character : defaultCharacter) : user?.character;
  const incomingRequests = relationships.filter(row => row.type === 'friend' && row.targetId === user?.civicId && row.status === 'pending');
  const outgoingRequest = relationships.some(row => row.type === 'friend' && row.actorId === user?.civicId && row.targetId === targetId);
  const incomingTargetRequest = relationships.some(row => row.type === 'friend' && row.actorId === targetId && row.targetId === user?.civicId && row.status === 'pending');
  const isFriend = relationships.some(row => row.type === 'friend' && row.status === 'accepted' &&
    ((row.actorId === user?.civicId && row.targetId === targetId) || (row.actorId === targetId && row.targetId === user?.civicId)));
  const isFollowing = relationships.some(row => row.type === 'follow' && row.actorId === user?.civicId && row.targetId === targetId);

  const runAction = async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The social action failed.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = () => user && runAction(() => socialService.saveProfile(user, { about, status, theme, cursor, effect, backgroundColor }));

  const addMedia = async (file?: File) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError('Media must be smaller than 6 MB.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read media.'));
      reader.onerror = () => reject(new Error('Could not read media.'));
      reader.readAsDataURL(file);
    });
    setMedia({ name: file.name, mimeType: file.type, dataUrl });
    setError('');
  };

  const postUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() && !media) return;
    if (await runAction(() => socialService.post(content, media))) {
      setContent('');
      setMedia(null);
    }
  };

  return (
    <section style={{ backgroundImage: profile ? `linear-gradient(135deg, ${profile.backgroundColor || '#080b18'}dd, #020617)` : undefined, cursor: profile?.cursor === 'sparkle' ? 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23a5f3fc%27 d=%27M12 0l2.4 8.6L23 12l-8.6 2.4L12 23l-2.4-8.6L1 12l8.6-3.4z%27/%3E%3C/svg%3E") 12 12, auto' : profile?.cursor === 'comet' ? 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724%27 height=%2724%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23f0abfc%27 d=%27M18 2a7 7 0 0 0-7 7c0 1 .2 2 .6 2.8L3 20l1 1 8.2-8.6c.8.4 1.8.6 2.8.6a7 7 0 0 0 7-7c0-1.6-.5-3-1.4-4.2l-3.8 3.8-2.8-2.8L17.8 1A7 7 0 0 0 18 2z%27/%3E%3C/svg%3E") 12 12, auto' : undefined }}
      className={`relative mt-10 overflow-hidden rounded-3xl border p-5 md:p-8 text-white shadow-2xl ${profileStyle || 'border-cyan-400/20 bg-slate-950'} ${profile?.cursor === 'crosshair' ? 'cursor-crosshair' : ''}`}>
      {profile?.effect === 'stars' && <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(1px 1px at 20px 30px, white 99%, transparent), radial-gradient(1px 1px at 70px 80px, white 99%, transparent), radial-gradient(1px 1px at 130px 40px, white 99%, transparent)', backgroundSize: '160px 120px' }} />}
      {profile?.effect === 'aurora' && <div aria-hidden className="pointer-events-none absolute -right-10 -top-20 h-56 w-3/4 rounded-full bg-cyan-300/10 blur-3xl animate-pulse" />}
      {profile?.effect === 'glow' && <div aria-hidden className="pointer-events-none absolute inset-0 bg-cyan-300/[0.04]" />}
      <div className="relative z-10">
      <header className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="h-52 w-40 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-black/40">
          {viewerCharacter && <CharacterViewer config={viewerCharacter} className="h-full w-full" animate />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Citizen profile · {followerCount} followers · {followingCount} following</div>
          <h2 className="mt-2 break-all text-3xl font-black">{profile?.username || user?.username || 'Citizen'}</h2>
          <code className="mt-1 block break-all text-xs text-slate-400">{targetId || 'Sign in to publish your profile'}</code>
          {profile?.status && <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-cyan-100">{profile.status}</p>}
          {profile?.about && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200">{profile.about}</p>}
          {user && !isOwner && targetId && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => void runAction(() => socialService.follow(targetId, 'follow', isFollowing ? 'remove' : 'request'))}
                className="rounded-lg border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 disabled:opacity-50">
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
              <button disabled={busy} onClick={() => void runAction(() => socialService.follow(
                targetId,
                'friend',
                isFriend || outgoingRequest ? 'remove' : incomingTargetRequest ? 'accept' : 'request'
              ))}
                className="rounded-lg border border-fuchsia-300/40 bg-fuchsia-500/15 px-4 py-2 text-sm font-bold text-fuchsia-100 disabled:opacity-50">
                {isFriend ? 'Remove friend' : outgoingRequest ? 'Cancel friend request' : incomingTargetRequest ? 'Accept friend request' : 'Add friend'}
              </button>
            </div>
          )}
        </div>
      </header>

      {error && <div role="alert" className="mt-5 rounded-xl border border-rose-400/40 bg-rose-950/60 p-3 text-sm text-rose-100">{error}</div>}

      {isOwner && user && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={event => { event.preventDefault(); void saveProfile(); }} className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-5">
            <h3 className="text-lg font-black">Your space</h3>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Status
              <input maxLength={160} value={status} onChange={event => setStatus(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 p-3 text-sm text-white" placeholder="What's happening?" />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              About me
              <textarea maxLength={500} rows={4} value={about} onChange={event => setAbout(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 p-3 text-sm text-white" placeholder="Tell people a little about yourself" />
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Custom background color
                <input type="color" value={backgroundColor} onChange={event => setBackgroundColor(event.target.value)}
                  aria-label="Custom profile background color" className="h-9 w-14 cursor-pointer rounded border border-white/20 bg-transparent p-1" />
              </label>
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-slate-400">Profile background</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {themeOptions.map(option => <button key={option.id} type="button" aria-pressed={theme === option.id} onClick={() => { setTheme(option.id); setBackgroundColor(option.backgroundColor); }}
                    className={`rounded-lg border bg-gradient-to-br p-3 text-left text-xs font-bold text-white transition ${option.className} ${theme === option.id ? 'ring-2 ring-cyan-300' : 'opacity-75 hover:opacity-100'}`}>
                    {option.label}
                  </button>)}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Cursor
                <select value={cursor} onChange={event => setCursor(event.target.value as SocialCursor)} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 p-3 text-white">
                  <option value="sparkle">Sparkle</option><option value="comet">Comet</option><option value="crosshair">Crosshair</option><option value="none">Default</option>
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Effect
                <select value={effect} onChange={event => setEffect(event.target.value as SocialEffect)} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 p-3 text-white">
                  {effectOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              </div>
            </div>
            <button disabled={busy} className="rounded-lg bg-cyan-300 px-4 py-2 font-black text-slate-950 disabled:opacity-50">Save profile</button>
            <p className="text-xs text-slate-400">Changes are signed with your local Civic identity; your private key is never sent.</p>
          </form>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-5">
            <h3 className="text-lg font-black">Find people</h3>
            <input value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-lg border border-white/15 bg-slate-950 p-3 text-sm text-white" placeholder="Search username or Civic ID" />
            <div className="max-h-44 space-y-2 overflow-auto">
              {searchResults.map(result => (
                <button key={result.civicId} onClick={() => navigate(`/profile/${encodeURIComponent(result.civicId)}`)} className="flex w-full items-center justify-between rounded-lg bg-white/5 p-3 text-left hover:bg-white/10">
                  <span className="font-bold">{result.username}</span><span className="max-w-[55%] truncate text-xs text-slate-400">{result.civicId}</span>
                </button>
              ))}
              {!searchResults.length && /^did:civic:[a-f0-9]{32}$/i.test(search.trim()) && (
                <button onClick={() => navigate(`/profile/${encodeURIComponent(search.trim())}`)} className="w-full rounded-lg bg-white/5 p-3 text-left text-sm font-bold text-cyan-200 hover:bg-white/10">
                  Open Civic ID profile
                </button>
              )}
              {search.trim().length >= 2 && !searchResults.length && <p className="text-sm text-slate-400">No matching citizens yet.</p>}
            </div>
            {incomingRequests.length > 0 && <div className="space-y-2 border-t border-white/10 pt-3">
              <h4 className="text-sm font-bold">Friend requests</h4>
              {incomingRequests.map(request => <div key={request.actorId} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">{request.actorId}</span>
                <button disabled={busy} onClick={() => void runAction(() => socialService.follow(request.actorId, 'friend', 'accept'))} className="rounded bg-cyan-300 px-3 py-1 font-bold text-black">Accept</button>
              </div>)}
            </div>}
          </div>
        </div>
      )}

      {user && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            <h3 className="text-xl font-black">{isOwner ? 'Friends & following feed' : 'Citizen posts'}</h3>
            {isOwner && <form onSubmit={event => void postUpdate(event)} className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
              <textarea maxLength={2000} value={content} onChange={event => setContent(event.target.value)} rows={3} className="w-full rounded-lg border border-white/15 bg-slate-950 p-3 text-sm text-white" placeholder="Share an update, photo, video, or music..." />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/10">
                  Add media
                  <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,audio/mpeg,audio/ogg,audio/wav,audio/mp4" className="sr-only" onChange={event => void addMedia(event.target.files?.[0]).catch(fileError => setError(fileError.message))} />
                </label>
                <button disabled={busy || (!content.trim() && !media)} className="rounded-lg bg-fuchsia-400 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50">Post</button>
              </div>
              {media && <div className="flex items-center justify-between text-xs text-slate-300"><span>{media.name}</span><button type="button" onClick={() => setMedia(null)} className="text-rose-300">Remove</button></div>}
            </form>}
            {posts.map(post => {
              const reaction = post.reactions?.[user.civicId];
              const likes = Object.values(post.reactions || {}).filter(value => value === 'like').length;
              const dislikes = Object.values(post.reactions || {}).filter(value => value === 'dislike').length;
              return <article key={post.id} className="rounded-2xl border border-white/10 bg-slate-950/75 p-4">
                <button onClick={() => navigate(`/profile/${encodeURIComponent(post.authorId)}`)} className="text-xs font-bold text-cyan-300 hover:underline">{post.authorId === user.civicId ? user.username : post.authorName || post.authorId}</button>
                {post.kind === 'status' && <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-fuchsia-300">Status</span>}
                <time className="ml-3 text-[10px] text-slate-500">{formatTime(post.createdAt)}</time>
                {post.content && <p className="my-3 whitespace-pre-wrap text-sm leading-6">{post.content}</p>}
                {post.media?.mimeType.startsWith('image/') && <img src={post.media.url || post.media.dataUrl} alt={post.media.name} className="max-h-96 w-full rounded-xl object-contain" />}
                {post.media?.mimeType.startsWith('video/') && <video src={post.media.url || post.media.dataUrl} controls className="max-h-96 w-full rounded-xl" />}
                {post.media?.mimeType.startsWith('audio/') && <audio src={post.media.url || post.media.dataUrl} controls className="w-full" />}
                <div className="mt-3 flex gap-2 text-xs">
                  <button disabled={busy} onClick={() => void runAction(() => socialService.react(post.id, reaction === 'like' ? 'remove' : 'like'))} className={`rounded-lg px-3 py-1.5 ${reaction === 'like' ? 'bg-cyan-400/25 text-cyan-200' : 'bg-white/5 text-slate-300'}`}>Like · {likes}</button>
                  <button disabled={busy} onClick={() => void runAction(() => socialService.react(post.id, reaction === 'dislike' ? 'remove' : 'dislike'))} className={`rounded-lg px-3 py-1.5 ${reaction === 'dislike' ? 'bg-rose-400/25 text-rose-200' : 'bg-white/5 text-slate-300'}`}>Dislike · {dislikes}</button>
                </div>
              </article>;
            })}
            {!posts.length && <p className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-slate-400">No posts yet. Follow citizens or make the first post from your Vault.</p>}
          </div>

          {isOwner && <aside className="space-y-4">
            <h3 className="text-xl font-black">Groups</h3>
            <form onSubmit={event => { event.preventDefault(); void runAction(() => socialService.group('create', { name: groupName, description: groupDescription })).then(saved => { if (saved) { setGroupName(''); setGroupDescription(''); } }); }} className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-4">
              <input required minLength={2} maxLength={48} value={groupName} onChange={event => setGroupName(event.target.value)} className="w-full rounded-lg border border-white/15 bg-slate-950 p-2 text-sm" placeholder="New group name" />
              <input maxLength={280} value={groupDescription} onChange={event => setGroupDescription(event.target.value)} className="w-full rounded-lg border border-white/15 bg-slate-950 p-2 text-sm" placeholder="What brings the group together?" />
              <button disabled={busy} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">Create group</button>
            </form>
            {groups.map(group => {
              const member = group.memberIds.includes(user.civicId);
              return <div key={group.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-2"><h4 className="font-bold">{group.name}</h4>
                  <button disabled={busy} onClick={() => void runAction(() => socialService.group(member ? 'leave' : 'join', { groupId: group.id }))} className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold">{member ? 'Joined' : 'Join'}</button>
                </div>
                <p className="mt-2 text-xs text-slate-400">{group.description || 'A Civicverse community.'}</p>
                <p className="mt-2 text-[10px] text-slate-500">{group.memberIds.length} members</p>
              </div>;
            })}
          </aside>}
        </div>
      )}
      </div>
    </section>
  );
}
