import CivicIdentity from '../lib/civicIdentity';
import { CharacterConfig, CivicUser } from '../store/gameStore';

export type SocialTheme = 'nebula' | 'aurora' | 'sunset' | 'ocean' | 'synthwave' | 'forest';
export type SocialCursor = 'sparkle' | 'comet' | 'crosshair' | 'none';
export type SocialEffect = 'none' | 'stars' | 'aurora' | 'glow';

export interface SocialProfile {
  civicId: string;
  username: string;
  about: string;
  status: string;
  theme: SocialTheme;
  cursor: SocialCursor;
  effect: SocialEffect;
  backgroundColor: string;
  character: CharacterConfig | null;
  updatedAt: number;
}

export interface SocialPost {
  id: string;
  kind?: 'post' | 'status';
  authorId: string;
  authorName?: string;
  content: string;
  media: { name: string; mimeType: string; dataUrl?: string; url?: string } | null;
  createdAt: number;
  reactions: Record<string, 'like' | 'dislike'>;
}

export interface SocialGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: number;
}

export interface SocialFeed {
  posts: SocialPost[];
  groups: SocialGroup[];
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function signedRequest<T>(path: string, method: 'PUT' | 'POST', payload: Record<string, unknown>): Promise<T> {
  const password = sessionStorage.getItem('civicverse_session_pass') || localStorage.getItem('civicverse_saved_session');
  if (!password) throw new Error('Unlock your Civic identity to use social features.');
  const identity = await CivicIdentity.restore(password);
  if (!identity) throw new Error('Could not restore the Civic identity for signing.');
  const signedPayload = {
    ...payload,
    actorId: identity.did,
    timestamp: Date.now(),
    nonce: crypto.randomUUID()
  };
  const signature = await identity.signMessage(canonicalize(signedPayload));
  const response = await fetch(`/api/social${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: signedPayload, publicKey: identity.publicKey, signature })
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Social request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`/api/social${path}`);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Social request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export const socialService = {
  profile: (civicId: string) => get<{ profile: SocialProfile; posts: SocialPost[]; followerCount: number; followingCount: number }>(`/profiles/${encodeURIComponent(civicId)}`),
  search: (query: string) => get<SocialProfile[]>(`/search?q=${encodeURIComponent(query)}`),
  feed: (viewerId: string) => get<SocialFeed>(`/feed?viewerId=${encodeURIComponent(viewerId)}`),
  saveProfile: (user: CivicUser, profile: Pick<SocialProfile, 'about' | 'status' | 'theme' | 'cursor' | 'effect' | 'backgroundColor'>) =>
    signedRequest<SocialProfile>(`/profiles/${encodeURIComponent(user.civicId)}`, 'PUT', {
      type: 'profile',
      profile: { username: user.username, ...profile, character: user.character }
    }),
  follow: (targetId: string, relationshipType: 'follow' | 'friend', operation: 'request' | 'accept' | 'remove') =>
    signedRequest<{ saved: boolean }>('/relationships', 'POST', { relationshipType, operation, targetId }),
  post: (content: string, media: { name: string; mimeType: string; dataUrl: string } | null) =>
    signedRequest<SocialPost>('/posts', 'POST', { type: 'post', content, media }),
  react: (postId: string, reaction: 'like' | 'dislike' | 'remove') =>
    signedRequest<SocialPost>('/reactions', 'POST', { type: 'reaction', postId, reaction }),
  group: (operation: 'create' | 'join' | 'leave', details: { name?: string; description?: string; groupId?: string }) =>
    signedRequest<SocialGroup>('/groups', 'POST', { type: 'group', operation, ...details }),
  subscribe: (onUpdate: () => void) => {
    const stream = new EventSource('/api/social/stream');
    stream.addEventListener('feed_update', onUpdate);
    return () => stream.close();
  }
};
