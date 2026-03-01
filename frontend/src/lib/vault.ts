/**
 * Civicverse Encrypted Vault (Browser-Compatible)
 * AES-256-GCM with PBKDF2 key derivation
 * All sensitive data encrypted at rest
 */

export interface VaultData {
  civicId: string
  username: string
  seed: Uint8Array
  mnemonic: string
  publicKey: string
  walletAddress: string
  avatar: {
    name: string
    color: string
  }
}

export class Vault {
  private data: VaultData | null = null
  private encryptionKey: CryptoKey | null = null

  /**
   * Derive encryption key from password using PBKDF2 (browser compatible)
   */
  async deriveKey(password: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    const useSalt = salt || crypto.getRandomValues(new Uint8Array(16))

    // Import password as key
    const passwordKey = await globalThis.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )

    // Derive 256-bit key using PBKDF2
    const derivedBits = await globalThis.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: useSalt,
        iterations: 100000
      },
      passwordKey,
      256
    )

    // Import derived bits as AES key
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      derivedBits,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    )

    return { key, salt: useSalt }
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  async encrypt(data: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string; tag: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    )

    // AES-GCM includes auth tag in the ciphertext
    // We need to extract it (last 16 bytes)
    const cipherBuf = new Uint8Array(encrypted)
    const ciphertext = cipherBuf.slice(0, -16)
    const tag = cipherBuf.slice(-16)

    return {
      ciphertext: Array.from(ciphertext).map(b => b.toString(16).padStart(2, '0')).join(''),
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      tag: Array.from(tag).map(b => b.toString(16).padStart(2, '0')).join('')
    }
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  async decrypt(ciphertext: string, iv: string, tag: string, key: CryptoKey): Promise<string> {
    const cipherBuf = new Uint8Array(ciphertext.match(/..?/g)!.map(x => parseInt(x, 16)))
    const ivBuf = new Uint8Array(iv.match(/..?/g)!.map(x => parseInt(x, 16)))
    const tagBuf = new Uint8Array(tag.match(/..?/g)!.map(x => parseInt(x, 16)))

    // Combine ciphertext + tag for decryption
    const combined = new Uint8Array([...cipherBuf, ...tagBuf])

    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuf },
      key,
      combined
    )

    return new TextDecoder().decode(decrypted)
  }

  /**
   * Create a new vault (user creates account)
   */
  async create(
    username: string,
    password: string,
    civicId: string,
    seed: Uint8Array,
    mnemonic: string,
    publicKey: string,
    walletAddress: string
  ): Promise<{ encryptedVault: string; salt: string }> {
    const { key, salt } = await this.deriveKey(password)
    this.encryptionKey = key

    this.data = {
      civicId,
      username,
      seed,
      mnemonic,
      publicKey,
      walletAddress,
      avatar: {
        name: `Citizen ${civicId.slice(0, 8)}`,
        color: this.randomColor(),
      },
    }

    const vaultJson = JSON.stringify({
      civicId: this.data.civicId,
      username: this.data.username,
      seed: Array.from(this.data.seed),
      mnemonic: this.data.mnemonic,
      publicKey: this.data.publicKey,
      walletAddress: this.data.walletAddress,
      avatar: this.data.avatar,
    })

    const encrypted = await this.encrypt(vaultJson, key)
    return {
      encryptedVault: JSON.stringify(encrypted),
      salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
    }
  }

  /**
   * Unlock existing vault
   */
  async unlock(password: string, encryptedVault: string, saltHex: string): Promise<boolean> {
    try {
      const salt = new Uint8Array(saltHex.match(/..?/g)!.map(x => parseInt(x, 16)))
      const { key } = await this.deriveKey(password, salt)
      this.encryptionKey = key

      const encrypted = JSON.parse(encryptedVault)
      const vaultJson = await this.decrypt(encrypted.ciphertext, encrypted.iv, encrypted.tag, key)
      const vaultObj = JSON.parse(vaultJson)

      this.data = {
        civicId: vaultObj.civicId,
        username: vaultObj.username,
        seed: new Uint8Array(vaultObj.seed),
        mnemonic: vaultObj.mnemonic,
        publicKey: vaultObj.publicKey,
        walletAddress: vaultObj.walletAddress,
        avatar: vaultObj.avatar,
      }

      return true
    } catch (e) {
      console.error('Vault unlock failed:', e)
      return false
    }
  }

  /**
   * Get unencrypted data (only when unlocked)
   */
  getData(): VaultData | null {
    return this.data
  }

  /**
   * Check if vault is unlocked
   */
  isUnlocked(): boolean {
    return !!this.data && !!this.encryptionKey
  }

  /**
   * Wipe vault from memory
   */
  lock(): void {
    this.data = null
    this.encryptionKey = null
  }

  /**
   * Get Civic ID (safe to expose)
   */
  getCivicId(): string | null {
    return this.data?.civicId || null
  }

  /**
   * Get wallet address (safe to expose)
   */
  getWalletAddress(): string | null {
    return this.data?.walletAddress || null
  }

  /**
   * Get mnemonic (only when unlocked - WARNING: sensitive)
   */
  getMnemonic(): string | null {
    return this.data?.mnemonic || null
  }

  /**
   * Get avatar (safe to expose)
   */
  getAvatar(): { name: string; color: string } | null {
    return this.data?.avatar || null
  }

  private randomColor(): string {
    const colors = ['#61dafb', '#42b883', '#ff6b6b', '#4ecdc4', '#ffd93d', '#a8e6cf']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

export const vault = new Vault()
