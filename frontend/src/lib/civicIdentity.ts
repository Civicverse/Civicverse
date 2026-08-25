/**
 * Simplified Civic Identity for browser
 * Minimal implementation to demonstrate non-custodial identity
 * TODO: Replace with @civicverse/civic-id once library is built
 */

import { secureStorage } from './secureStorage';
import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { hashPassword, verifyPassword, encryptWithPassword, decryptWithPassword } from './passwordUtils';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

interface StorageData {
  civicId: string;
  publicKey: string;
  privateKey: string;
  did: string;
  createdAt: number;
  username?: string;
  characterConfig?: any;
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
  public username?: string;
  public characterConfig?: any;

  constructor(
    did: string,
    publicKey: string,
    privateKey: string,
    createdAt: number = Date.now(),
    username?: string,
    characterConfig?: any
  ) {
    this.did = did;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.createdAt = createdAt;
    this.username = username;
    this.characterConfig = characterConfig;
  }

  /**
   * Create new identity (generates keypair client-side)
   * Enforces password protection.
   */
  static async create(username: string, password?: string): Promise<{ identity: CivicIdentity, mnemonic: string }> {
    if (!password) {
      throw new Error("SECURITY ERROR: Password is required to create a sovereign identity.");
    }

    // Generate Standard BIP-39 Mnemonic
    const mnemonic = bip39.generateMnemonic(wordlist);
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const privateKey = seed.slice(0, 32); // Simplified Ed25519 seed derivation
    
    const publicKey = await ed25519.getPublicKeyAsync(privateKey);
    
    // Generate DID from public key
    const publicKeyHex = bytesToHex(publicKey);
    const didHash = bytesToHex(sha256(new TextEncoder().encode(publicKeyHex))).slice(0, 32);
    const did = `did:civic:${didHash}`;
    
    const defaultCharacter = {
      skinColor: '#e0ac69',
      hairColor: '#4a3b2a',
      shirtColor: '#00d9ff',
      pantsColor: '#1a1a2e',
      shoesColor: '#333333',
      hairStyle: 'short',
      accessory: 'none',
      bodyType: 'athletic'
    };

    // Create identity
    const identity = new CivicIdentity(
      did,
      publicKeyHex,
      bytesToHex(privateKey),
      Date.now(),
      username,
      defaultCharacter
    );

    // Hash password
    const passwordHash = await hashPassword(password);

    const storageData = {
      civicId: did,
      publicKey: publicKeyHex,
      privateKey: bytesToHex(privateKey),
      did,
      createdAt: identity.createdAt,
      username,
      characterConfig: defaultCharacter,
      passwordHash,
    };

    // Encrypt sensitive data with password
    const encrypted = await encryptWithPassword(JSON.stringify(storageData), password);
    await secureStorage.setItem('civicverse:identity', `ENCRYPTED:${encrypted}`);
    
    await secureStorage.setItem('civicverse:did', did);

    return { identity, mnemonic };
  }

  /**
   * Restore identity from storage
   * If password-protected, requires correct password to decrypt
   */
  static async restore(password?: string): Promise<CivicIdentity | null> {
    try {
      console.debug('[CivicIdentity] Attempting to restore identity...');
      const encrypted = await secureStorage.getItem('civicverse:identity');
      if (!encrypted) {
        console.warn('[CivicIdentity] No identity found in storage.');
        return null;
      }
      // Log safe metadata only
      // eslint-disable-next-line no-console
      console.debug('[CivicIdentity] encrypted identity present len=', encrypted.length, 'startsWithENCRYPTED=', encrypted.startsWith && encrypted.startsWith('ENCRYPTED:'));
      
      let data: StorageData;

      if (encrypted.startsWith('ENCRYPTED:')) {
        if (!password) {
          throw new Error('Identity is password-protected. Please provide password.');
        }

        const encryptedData = encrypted.substring('ENCRYPTED:'.length);
        // eslint-disable-next-line no-console
        console.debug('[CivicIdentity] Decrypting identity data (encrypted length=', encryptedData.length, ')...');
        const decrypted = await decryptWithPassword(encryptedData, password);

        // Do not log sensitive decrypted contents; only log length for tracing
        // eslint-disable-next-line no-console
        console.debug('[CivicIdentity] Decryption succeeded, decrypted length=', decrypted ? decrypted.length : 0);
        try {
          data = JSON.parse(decrypted) as StorageData;
        } catch (e) {
          console.error('[CivicIdentity] Failed to parse decrypted identity JSON:', e);
          throw new Error('Identity data is corrupted or invalid.');
        }

        // eslint-disable-next-line no-console
        console.debug('[CivicIdentity] Identity parsed ok, did=', data.did ? data.did.slice(0, 20) : 'unknown');
      } else {
        // Legacy: base64-encoded data (no password)
        console.debug('[CivicIdentity] Restoring legacy base64 identity...');
        data = JSON.parse(atob(encrypted)) as StorageData;
      }

      return new CivicIdentity(
        data.did, 
        data.publicKey, 
        data.privateKey, 
        data.createdAt, 
        data.username, 
        data.characterConfig
      );
    } catch (error) {
      console.error('[CivicIdentity] Failed to restore identity:', error);
      throw error; // Propagate the error instead of returning null
    }
  }

  /**
   * Update identity data (e.g., save character changes)
   */
  static async updateIdentity(password: string, updates: { username?: string, characterConfig?: any }): Promise<void> {
    try {
      const encrypted = await secureStorage.getItem('civicverse:identity');
      if (!encrypted) throw new Error('No identity found');

      let data: StorageData;
      const encryptedData = encrypted.substring('ENCRYPTED:'.length);
      const decrypted = await decryptWithPassword(encryptedData, password);
      data = JSON.parse(decrypted);

      // Apply updates
      if (updates.username) data.username = updates.username;
      if (updates.characterConfig) data.characterConfig = updates.characterConfig;

      // Re-encrypt
      const newEncrypted = await encryptWithPassword(JSON.stringify(data), password);
      await secureStorage.setItem('civicverse:identity', `ENCRYPTED:${newEncrypted}`);
    } catch (e) {
      console.error('[CivicIdentity] Failed to update identity:', e);
      throw e;
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
  static async deleteIdentity(): Promise<void> {
    await secureStorage.removeItem('civicverse:identity');
    await secureStorage.removeItem('civicverse:did');
  }

  /**
   * Check if identity exists
   */
  static async exists(): Promise<boolean> {
    const did = await secureStorage.getItem('civicverse:did');
    return did !== null;
  }

  /**
   * Get stored DID
   */
  static async getStoredDID(): Promise<string | null> {
    return secureStorage.getItem('civicverse:did');
  }
}

export default CivicIdentity;