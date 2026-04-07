import { CivicIdentity } from '@civicverse/civic-identity';

export interface FeedPost {
  id: string;
  authorPubKey: string;
  content: string;
  timestamp: number;
  tags: string[];
}

export class CivicFoyer {
  private posts: FeedPost[] = [];

  constructor(private identity: CivicIdentity) {}

  postToFeed(content: string, tags: string[] = []): string {
    const profile = this.identity.getProfile();
    if (!profile) throw new Error("Identity required");

    const postId = Math.random().toString(36).substr(2, 9);
    const post: FeedPost = {
      id: postId,
      authorPubKey: profile.publicKey,
      content,
      timestamp: Date.now(),
      tags
    };

    this.posts.push(post);
    return postId;
  }

  getFeed(): FeedPost[] {
    return this.posts;
  }

  getAvatarData(): any {
    const profile = this.identity.getProfile();
    if (!profile) return null;

    // Derived 3D avatar progression state
    return {
      did: profile.did,
      level: profile.tier,
      guilds: profile.guilds,
      isVerified: profile.isVerified
    };
  }
}
