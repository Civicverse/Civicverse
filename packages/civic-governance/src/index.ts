import { CivicIdentity } from '@civicverse/civic-identity';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  votes: Map<string, number>; // publicKey -> voteWeight
  status: 'Draft' | 'Active' | 'Executed' | 'Failed';
  creatorPubKey: string;
  treasuryAction?: any;
}

export class CivicGovernance {
  private proposals: Proposal[] = [];

  constructor(private identity: CivicIdentity) {}

  createProposal(title: string, description: string): string {
    if (!this.identity.isVerified()) throw new Error("Verified status required to create proposals");
    
    const propId = Math.random().toString(36).substr(2, 9);
    const proposal: Proposal = {
      id: propId,
      title,
      description,
      votes: new Map(),
      status: 'Active',
      creatorPubKey: this.identity.getProfile()!.publicKey
    };

    this.proposals.push(proposal);
    return propId;
  }

  // Quadratic voting implementation
  vote(proposalId: string, choice: 'Yes' | 'No', tokens: number): void {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error("Proposal not found");
    if (!this.identity.isVerified()) throw new Error("Verified status required to vote");

    const profile = this.identity.getProfile()!;
    // Weight = sqrt(tokens) * guildMultiplier (simulated)
    const weight = Math.sqrt(tokens) * (profile.guilds.length > 0 ? 1.5 : 1);
    
    proposal.votes.set(profile.publicKey, choice === 'Yes' ? weight : -weight);
  }

  getProposals(): Proposal[] {
    return this.proposals;
  }
}
