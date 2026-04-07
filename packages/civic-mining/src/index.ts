import { CivicIdentity } from '@civicverse/civic-identity';

export interface MiningStats {
  hashrate: number;
  totalMined: number;
  contributionReputation: number;
  activeNodes: number;
}

export class CivicMining {
  private stats: Map<string, MiningStats> = new Map();

  constructor(private identity: CivicIdentity) {}

  updateStats(hashrate: number, mined: number): void {
    const profile = this.identity.getProfile();
    if (!profile) throw new Error("Identity required");

    const current = this.stats.get(profile.publicKey) || {
      hashrate: 0,
      totalMined: 0,
      contributionReputation: 0,
      activeNodes: 1
    };

    current.hashrate = hashrate;
    current.totalMined += mined;
    // Contribution to community repo = mined amount * multiplier
    current.contributionReputation += mined * 0.1;
    
    this.stats.set(profile.publicKey, current);
  }

  getStats(): MiningStats | null {
    const profile = this.identity.getProfile();
    if (!profile) return null;
    return this.stats.get(profile.publicKey) || null;
  }
}
