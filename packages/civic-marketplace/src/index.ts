import { CivicIdentity } from '@civicverse/civic-identity';

export interface Tip {
  id: string;
  fromPubKey: string;
  toPubKey: string;
  amount: number;
  taxAmount: number; // Simulated micro-tax for infrastructure
  timestamp: number;
}

export class CivicMarketplace {
  private tips: Tip[] = [];

  constructor(private identity: CivicIdentity) {}

  sendTip(toPubKey: string, amount: number): Tip {
    if (!this.identity.isVerified()) throw new Error("Verified status required to send tips");
    
    const profile = this.identity.getProfile()!;
    const microTax = amount * 0.01; // 1% tax
    const tip: Tip = {
      id: Math.random().toString(36).substr(2, 9),
      fromPubKey: profile.publicKey,
      toPubKey,
      amount,
      taxAmount: microTax,
      timestamp: Date.now()
    };

    this.tips.push(tip);
    return tip;
  }

  getTips(): Tip[] {
    return this.tips;
  }
}
