import CivicIdentity from '../lib/civicIdentity';
import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
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

export type StorefrontSignStyle = 'neon' | 'marquee' | 'scanline' | 'rainbow' | 'glitch';
export interface StorefrontSign {
  civicId: string;
  banner: string;
  style: StorefrontSignStyle;
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

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: number;
  expiresAt: number;
}

interface EncryptedDirectMessage extends Omit<DirectMessage, 'content'> {
  envelope: { ciphertext: string; iv: string; senderPublicKey: JsonWebKey };
}

const encodeBase64Url = (bytes: Uint8Array) => btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
};

async function directMessageKey(remoteJwk: JsonWebKey, pair: CryptoKeyPair) {
  const remoteKey = await crypto.subtle.importKey('jwk', remoteJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  return crypto.subtle.deriveKey({ name: 'ECDH', public: remoteKey }, pair.privateKey,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function verifiedFriendKey(peerId: string, localId: string): Promise<JsonWebKey> {
  const response = await signedRequest<{ publicKey: JsonWebKey; identityPublicKey: string; signature: string; signedPayload: Record<string, unknown> }>(
    '/messages/key/poll', 'POST', { type: 'direct_message_key_poll', peerId }
  );
  const identityKey = hexToBytes(response.identityPublicKey);
  const did = `did:civic:${bytesToHex(sha256(new TextEncoder().encode(response.identityPublicKey))).slice(0, 32)}`;
  const signed = await ed25519.verifyAsync(
    hexToBytes(response.signature),
    new TextEncoder().encode(canonicalize(response.signedPayload)),
    identityKey
  );
  if (!signed || did !== peerId || response.signedPayload.actorId !== peerId || response.signedPayload.peerId !== localId ||
      response.signedPayload.type !== 'direct_message_key' || canonicalize(response.signedPayload.publicKey) !== canonicalize(response.publicKey)) {
    throw new Error('The friend’s private-message key could not be verified.');
  }
  return response.publicKey;
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
    actorUsername: identity.username || 'Citizen',
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
  storefront: (civicId: string) => get<StorefrontSign | null>(`/storefront/${encodeURIComponent(civicId)}`),
  saveStorefront: (user: CivicUser, banner: string, style: StorefrontSignStyle) =>
    signedRequest<StorefrontSign>(`/storefront/${encodeURIComponent(user.civicId)}`, 'PUT', { type: 'storefront', banner, style }),
  search: (query: string) => get<SocialProfile[]>(`/search?q=${encodeURIComponent(query)}`),
  feed: (viewerId: string) => get<SocialFeed>(`/feed?viewerId=${encodeURIComponent(viewerId)}`),
  saveProfile: (user: CivicUser, profile: Pick<SocialProfile, 'about' | 'status' | 'theme' | 'cursor' | 'effect' | 'backgroundColor'>) =>
    signedRequest<SocialProfile>(`/profiles/${encodeURIComponent(user.civicId)}`, 'PUT', {
      type: 'profile',
      profile: { username: user.username, ...profile, character: user.character }
    }),
  follow: (targetId: string, relationshipType: 'follow' | 'friend', operation: 'request' | 'accept' | 'remove') =>
    signedRequest<{ saved: boolean }>('/relationships', 'POST', { relationshipType, operation, targetId }),
  publishDirectMessageKey: (peerId: string, publicKey: JsonWebKey) =>
    signedRequest<{ published: boolean; expiresInMs: number }>('/messages/key', 'POST', { type: 'direct_message_key', peerId, publicKey }),
  sendDirectMessage: async (recipientId: string, content: string, pair: CryptoKeyPair, localId: string) => {
    const remotePublicKey = await verifiedFriendKey(recipientId, localId);
    const key = await directMessageKey(remotePublicKey, pair);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(content));
    const senderPublicKey = await crypto.subtle.exportKey('jwk', pair.publicKey);
    return signedRequest<{ queued: boolean; expiresInMs: number }>('/messages/send', 'POST', {
      type: 'direct_message', recipientId,
      envelope: { ciphertext: encodeBase64Url(new Uint8Array(ciphertext)), iv: encodeBase64Url(iv), senderPublicKey }
    });
  },
  pollDirectMessages: async (senderId: string, pair: CryptoKeyPair, localId: string) => {
    const result = await signedRequest<{ messages: EncryptedDirectMessage[] }>('/messages/poll', 'POST', { type: 'direct_message_poll', senderId });
    if (!result.messages.length) return { messages: [] as DirectMessage[] };
    const senderPublicKey = await verifiedFriendKey(senderId, localId);
    const messages = await Promise.all(result.messages.map(async message => {
      if (canonicalize(message.envelope.senderPublicKey) !== canonicalize(senderPublicKey)) {
        throw new Error('A private message did not match the friend’s signed session key.');
      }
      const key = await directMessageKey(message.envelope.senderPublicKey, pair);
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decodeBase64Url(message.envelope.iv) }, key, decodeBase64Url(message.envelope.ciphertext));
      return { id: message.id, senderId: message.senderId, senderName: message.senderName,
        content: new TextDecoder().decode(plaintext), createdAt: message.createdAt, expiresAt: message.expiresAt };
    }));
    return { messages };
  },
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
