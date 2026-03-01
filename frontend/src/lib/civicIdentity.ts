/**
 * Simplified Civic Identity for browser
 * Minimal implementation to demonstrate non-custodial identity
 * TODO: Replace with @civicverse/civic-id once library is built
 */

import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { hashPassword, verifyPassword, encryptWithPassword, decryptWithPassword } from './passwordUtils';

interface StorageData {
  civicId: string;
  publicKey: string;
  privateKey: string;
  did: string;
  createdAt: number;
  passwordHash?: string; // PBKDF2 hash of password
}

/**
 * Simplified browser-only Civic Identity
 */
export class CivicIdentity {
  public did: string;
  public publicKey: string;
  private privateKey: string;
  public createdAt: number;

  constructor(
    did: string,
    publicKey: string,
    privateKey: string,
    createdAt: number = Date.now()
  ) {
    this.did = did;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.createdAt = createdAt;
  }

  /**
   * Create new identity (generates keypair client-side)
   * Optionally password-protect with PBKDF2 hash
   */
  static async create(password?: string): Promise<CivicIdentity> {
    // Generate Ed25519 keypair
    const randomSeed = crypto.getRandomValues(new Uint8Array(32));
    const privateKey = randomSeed;
    const publicKey = await ed25519.getPublicKeyAsync(privateKey);
    
    // Generate DID from public key
    const publicKeyHex = bytesToHex(publicKey);
    const didHash = bytesToHex(sha256(new TextEncoder().encode(publicKeyHex))).slice(0, 32);
    const did = `did:civic:${didHash}`;
    
    // Create identity
    const identity = new CivicIdentity(
      did,
      publicKeyHex,
      bytesToHex(privateKey),
      Date.now()
    );

    // Hash password if provided
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    // Encrypt with password if provided, otherwise just base64
    let encrypted: string;
    const storageData = {
      civicId: did,
      publicKey: publicKeyHex,
      privateKey: bytesToHex(privateKey),
      did,
      createdAt: identity.createdAt,
      passwordHash,
    };

    if (password) {
      // Encrypt sensitive data with password
      encrypted = await encryptWithPassword(JSON.stringify(storageData), password);
      localStorage.setItem('civicverse:identity', `ENCRYPTED:${encrypted}`);
    } else {
      // Fall back to simple base64 for demo
      encrypted = btoa(JSON.stringify(storageData));
      localStorage.setItem('civicverse:identity', encrypted);
    }
    
    localStorage.setItem('civicverse:did', did);

    return identity;
  }

  /**
   * Restore identity from storage
   * If password-protected, requires correct password to decrypt
   */
  static async restore(password?: string): Promise<CivicIdentity | null> {
    try {
      const encrypted = localStorage.getItem('civicverse:identity');
      if (!encrypted) return null;
      
      let data: StorageData;

      if (encrypted.startsWith('ENCRYPTED:')) {
        // Password-encrypted data
        if (!password) {
          throw new Error('Identity is password-protected. Please provide password.');
        }

        const encryptedData = encrypted.substring('ENCRYPTED:'.length);
        const decrypted = await decryptWithPassword(encryptedData, password);
        data = JSON.parse(decrypted) as StorageData;

        // Verify password hash matches
        if (data.passwordHash) {
          const isValid = await verifyPassword(password, data.passwordHash);
          if (!isValid) {
            throw new Error('Invalid password.');
          }
        }
      } else {
        // Legacy: base64-encoded data (no password)
        data = JSON.parse(atob(encrypted)) as StorageData;
      }

      return new CivicIdentity(data.did, data.publicKey, data.privateKey, data.createdAt);
    } catch (error) {
      console.error('Failed to restore identity:', error);
      return null;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    const messageBytes = new TextEncoder().encode(message);
    const privateKeyBytes = hexToBytes(this.privateKey);
    const signature = await ed25519.signAsync(messageBytes, privateKeyBytes);
    return bytesToHex(signature);
  }

  /**
   * Delete identity permanently
   */
  static deleteIdentity(): void {
    localStorage.removeItem('civicverse:identity');
    localStorage.removeItem('civicverse:did');
  }

  /**
   * Check if identity exists
   */
  static exists(): boolean {
    return localStorage.getItem('civicverse:did') !== null;
  }

  /**
   * Get stored DID
   */
  static getStoredDID(): string | null {
    return localStorage.getItem('civicverse:did');
  }
}

export default CivicIdentity;
