/**
 * BIP-32 Hierarchical Deterministic Wallet
 * Derives the same keys every time from a seed, supporting multiple cryptocurrencies
 */

import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import * as secp from '@noble/secp256k1';

interface ExtendedKey {
  privateKey: string;
  publicKey: string;
  chainCode: string;
  depth: number;
  index: number;
  fingerprint: string;
}

interface DerivedAddress {
  address: string;
  publicKey: string;
  privateKey: string;
  path: string;
  chainType: string;
}

/**
 * PBKDF2 derivation for seed from mnemonic
 * Standard: HMAC-SHA512 with "Bitcoin seed"
 */
export async function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const mnemonicNorm = mnemonic.normalize('NFKD');
  const salt = 'mnemonic' + passphrase.normalize('NFKD');

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(mnemonicNorm),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-512',
      salt: encoder.encode(salt),
      iterations: 2048,
    },
    keyMaterial,
    512
  );

  return new Uint8Array(derived);
}

/**
 * Generate extended master key from seed
 */
export function generateMasterKey(seedBytes: Uint8Array): ExtendedKey {
  const key = new TextEncoder().encode('Bitcoin seed');
  const I_full = hmac(sha512, key, seedBytes);
  const IL = I_full.slice(0, 32);
  const IR = I_full.slice(32);

  const privateKeyHex = bytesToHex(IL);
  const publicKey = secp.getPublicKey(privateKeyHex, true);

  return {
    privateKey: privateKeyHex,
    publicKey: bytesToHex(publicKey),
    chainCode: bytesToHex(IR),
    depth: 0,
    index: 0,
    fingerprint: '00000000',
  };
}

/**
 * Derive address for specific crypto + account
 * BIP-44 path: m/44'/coin_type'/account'/change/index
 */
export function deriveAddress(
  master: ExtendedKey,
  coinType: 'BTC' | 'ETH' | 'KASPA' | 'MONERO',
  accountIndex: number = 0,
  changeIndex: number = 0,
  addressIndex: number = 0
): DerivedAddress {
  const coin = getCoinType(coinType);
  const path = `m/44'/${coin}'/${accountIndex}'/${changeIndex}/${addressIndex}`;
  const child = derivePath(master, path);

  const priv = child.privateKey;
  const pub = child.publicKey;

  let address = '';
  if (coinType === 'ETH') {
    // Simplified Ethereum address derivation for prototype
    const ethAddr = bytesToHex(sha256(hexToBytes(pub))).slice(-40);
    address = '0x' + ethAddr;
  } else if (coinType === 'BTC') {
    address = '1' + bytesToHex(sha256(hexToBytes(pub))).slice(0, 33);
  } else {
    address = `${coinType.toLowerCase()}:${bytesToHex(sha256(hexToBytes(pub))).slice(0, 30)}`;
  }

  return {
    address,
    publicKey: pub,
    privateKey: priv,
    path,
    chainType: coinType,
  };
}

export function derivePath(master: ExtendedKey, path: string): ExtendedKey {
  const segments = path.split('/').slice(1);
  let key = { ...master };

  for (const seg of segments) {
    const hardened = seg.endsWith("'");
    const idx = parseInt(hardened ? seg.slice(0, -1) : seg, 10);
    const childIndex = hardened ? (0x80000000 + idx) >>> 0 : idx >>> 0;
    key = deriveChild(key, childIndex);
  }

  return key;
}

function deriveChild(parent: ExtendedKey, index: number): ExtendedKey {
  const indexBytes = new Uint8Array(4);
  const dv = new DataView(indexBytes.buffer);
  dv.setUint32(0, index);

  let data: Uint8Array;
  if (index >= 0x80000000) {
    data = new Uint8Array([0, ...hexToBytes(parent.privateKey), ...indexBytes]);
  } else {
    data = new Uint8Array([...hexToBytes(parent.publicKey), ...indexBytes]);
  }

  const I = hmac(sha512, hexToBytes(parent.chainCode), data);
  const IL = I.slice(0, 32);
  const IR = I.slice(32);

  const ILbn = BigInt('0x' + bytesToHex(IL));
  const kpar = BigInt('0x' + parent.privateKey);
  const n = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
  const childKeyNum = (ILbn + kpar) % n;
  const childKeyHex = childKeyNum.toString(16).padStart(64, '0');

  const childPub = bytesToHex(secp.getPublicKey(childKeyHex, true));
  const fp = bytesToHex(sha256(hexToBytes(parent.publicKey))).slice(0, 8);

  return {
    privateKey: childKeyHex,
    publicKey: childPub,
    chainCode: bytesToHex(IR),
    depth: parent.depth + 1,
    index: index,
    fingerprint: fp,
  };
}

export async function generateWalletAddresses(
  mnemonic: string,
  accountIndex: number = 0
): Promise<Record<string, DerivedAddress>> {
  const coins: ('BTC' | 'ETH' | 'KASPA' | 'MONERO')[] = ['BTC', 'ETH', 'KASPA', 'MONERO'];
  const addresses: Record<string, DerivedAddress> = {};

  const seed = await mnemonicToSeed(mnemonic);
  const master = generateMasterKey(seed);

  for (const coin of coins) {
    const addr = deriveAddress(master, coin, accountIndex, 0, 0);
    addresses[coin] = addr;
  }

  return addresses;
}

function getCoinType(coin: 'BTC' | 'ETH' | 'KASPA' | 'MONERO'): number {
  const coinTypes: Record<string, number> = {
    BTC: 0,
    ETH: 60,
    KASPA: 111,
    MONERO: 128,
  };
  return coinTypes[coin] || 0;
}

export default {
  mnemonicToSeed,
  generateMasterKey,
  deriveAddress,
  generateWalletAddresses,
  derivePath,
};
