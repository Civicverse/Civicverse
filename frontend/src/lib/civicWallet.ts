/**
 * Non-Custodial Wallet System
 * Combines Civic Identity with HD wallets for multi-chain support
 */

import CivicIdentity from './civicIdentity';
import { generateMnemonic, validateMnemonic } from './bip39';
import { generateWalletAddresses } from './bip32';
import { encryptWithPassword, decryptWithPassword } from './passwordUtils';

export interface WalletData {
  civicId: string;
  mnemonic: string; // Encrypted seed phrase
  publicKey: string;
  addresses: Record<string, {
    address: string;
    publicKey: string;
    privateKey: string;
    path: string;
    balance?: number;
  }>;
  createdAt: number;
}

/**
 * Non-custodial wallet bound to Civic Identity
 */
export class CivicWallet {
  public civicId: string;
  public mnemonic: string; // Only in memory, never logged
  public addresses: Record<string, any>;
  public createdAt: number;

  constructor(civicId: string, mnemonic: string, addresses: Record<string, any>) {
    this.civicId = civicId;
    this.mnemonic = mnemonic;
    this.addresses = addresses;
    this.createdAt = Date.now();
  }

  /**
   * Create new wallet for Civic Identity
   * Generates 12-word mnemonic and derives addresses for all supported chains
   */
  static async create(identity: CivicIdentity, password?: string): Promise<CivicWallet> {
    // Generate BIP-39 mnemonic (12 words for demo, 24 for production)
    const mnemonic = await generateMnemonic(12);
    
    if (!validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic generated');
    }
    
    // Derive addresses from mnemonic for all chains
    const addresses = generateWalletAddresses(mnemonic, 0);
    
    // Create wallet instance (mnemonic only in memory)
    const wallet = new CivicWallet(identity.did, mnemonic, addresses);
    
    // Store encrypted backup
    await wallet.storeBackup(password);
    
    return wallet;
  }

  /**
   * Store encrypted wallet backup
   */
  private async storeBackup(password?: string): Promise<void> {
    let encrypted: string;

    if (password) {
      // Encrypt mnemonic + metadata with password
      const toEncrypt = JSON.stringify({
        mnemonic: this.mnemonic,
        civicId: this.civicId,
      });
      encrypted = await encryptWithPassword(toEncrypt, password);
      localStorage.setItem('civicverse:wallet', `ENCRYPTED:${encrypted}`);
    } else {
      // Fall back to simple base64
      encrypted = btoa(this.mnemonic);
      const data: WalletData = {
        civicId: this.civicId,
        mnemonic: encrypted,
        publicKey: this.addresses.BTC.publicKey,
        addresses: this.addresses,
        createdAt: this.createdAt,
      };
      localStorage.setItem('civicverse:wallet', JSON.stringify(data));
    }
  }

  /**
   * Restore wallet from storage
   * If password-protected, requires correct password to decrypt
   */
  static async restore(civicId: string, password?: string): Promise<CivicWallet | null> {
    try {
      const stored = localStorage.getItem('civicverse:wallet');
      if (!stored) return null;

      let mnemonic: string;

      if (stored.startsWith('ENCRYPTED:')) {
        // Password-encrypted data
        if (!password) {
          throw new Error('Wallet is password-protected. Please provide password.');
        }

        const encryptedData = stored.substring('ENCRYPTED:'.length);
        const decrypted = await decryptWithPassword(encryptedData, password);
        const decryptedData = JSON.parse(decrypted);
        mnemonic = decryptedData.mnemonic;
      } else {
        // Legacy: base64-encoded data
        const data = JSON.parse(stored);
        mnemonic = atob(data.mnemonic || stored);
      }

      // Regenerate addresses from mnemonic
      const addresses = await generateWalletAddresses(mnemonic, 0);
      return new CivicWallet(civicId, mnemonic, addresses);
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      return null;
    }
  }

  /**
   * Get address for specific chain
   */
  getAddress(chain: 'BTC' | 'ETH' | 'KASPA' | 'MONERO'): string {
    return this.addresses[chain]?.address || '';
  }

  /**
   * Get all blockchain addresses
   */
  getAllAddresses(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, addr] of Object.entries(this.addresses)) {
      result[key] = (addr as any).address;
    }
    return result;
  }

  /**
   * Export wallet (with warning about storing mnemonic)
   */
  exportMnemonic(): string {
    console.warn('⚠️ BACKUP YOUR SEED PHRASE: This is your only recovery method');
    return this.mnemonic;
  }

  /**
   * Delete wallet permanently
   */
  static deleteWallet(): void {
    localStorage.removeItem('civicverse:wallet');
  }

  /**
   * Check if wallet exists
   */
  static exists(): boolean {
    return localStorage.getItem('civicverse:wallet') !== null;
  }
}

export default CivicWallet;
