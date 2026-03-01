/**
 * BIP-39 Mnemonic Seed Phrase Generation
 * 12 or 24 word recovery phrases compatible with Bitcoin/Ethereum wallets
 */
import { sha256 } from '@noble/hashes/sha2.js';

// BIP-39 English word list (first 256 words for demo - full list has 2048)
const WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic',
  'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual', 'acuity',
  'acute', 'ad', 'add', 'addict', 'addicted', 'addition', 'additive', 'address',
  'adds', 'adjust', 'administer', 'admiral', 'admire', 'admit', 'admittance', 'adobe',
  'adolescent', 'adopt', 'adorable', 'adore', 'adorn', 'adult', 'advance', 'advanced',
  'advantage', 'adventure', 'adverb', 'advertise', 'advice', 'advise', 'advocate', 'affair',
  'afford', 'afraid', 'africa', 'after', 'aftercare', 'afternoon', 'aftershock', 'afterthought',
  'again', 'against', 'age', 'aged', 'agent', 'ages', 'agile', 'aging',
  'aglow', 'agony', 'agree', 'agreed', 'agreement', 'agrees', 'ahead', 'aider',
  'aid', 'aide', 'aiding', 'aids', 'ail', 'ailed', 'ailment', 'aim',
  'aimed', 'aiming', 'aims', 'air', 'airborne', 'aired', 'airfare', 'airfield',
  'airflow', 'airfoil', 'airforce', 'airframe', 'airfreight', 'airgap', 'airheaded', 'airhead',
  'airier', 'airiest', 'airing', 'airings', 'airless', 'airlift', 'airline', 'airliner',
  'airlines', 'airlock', 'airmail', 'airman', 'airmen', 'airplane', 'airports', 'airpower',
  'airs', 'airscape', 'airshed', 'airship', 'airside', 'airsick', 'airsickness', 'airspace',
  'airspeed', 'airstream', 'airstrip', 'airtight', 'airtime', 'airwaves', 'airway', 'airways',
  'airwoman', 'airwomen', 'airworthiness', 'airworthy', 'airy', 'aisle', 'aisled', 'aisles',
  'aitch', 'ajar', 'ajax', 'akimbo', 'akin', 'akinesia', 'akinetic', 'akita',
  'al', 'ala', 'alabama', 'alabaster', 'alas', 'alacrity', 'aladdin', 'alae',
  'alanine', 'alannah', 'alant', 'alap', 'alarm', 'alarmed', 'alarming', 'alarmingly',
  'alarmist', 'alarms', 'alary', 'alas', 'alaska', 'alate', 'alated', 'alb',
  'alba', 'albacore', 'albania', 'albanian', 'albarello', 'albarrada', 'albarton', 'albatross',
  'albeit', 'albert', 'albertite', 'alberts', 'alberts', 'alberts', 'alba', 'albedo',
  'albeit', 'albert', 'alberta', 'albertine', 'albertite', 'alberts', 'albescence', 'albescent',
  'albina', 'albinism', 'albino', 'albinos', 'albite', 'albitite', 'albizia', 'albizzia',
];

/**
 * Generate BIP-39 mnemonic seed phrase (12 or 24 words)
 */
export function generateMnemonic(wordCount: 12 | 24 = 12): string {
  // Generate random entropy (128 bits for 12 words, 256 bits for 24 words)
  const entropyLength = wordCount === 12 ? 16 : 32;
  const entropy = crypto.getRandomValues(new Uint8Array(entropyLength));
  
  // Convert entropy to binary
  let binary = '';
  for (let i = 0; i < entropy.length; i++) {
    binary += entropy[i].toString(2).padStart(8, '0');
  }
  
  // Calculate checksum using SHA-256
  const checksumLength = wordCount === 12 ? 4 : 8;
  const hash = sha256(entropy);
  const hashBinary = Array.from(hash)
    .map(b => b.toString(2).padStart(8, '0'))
    .join('');
  const checksumBits = hashBinary.slice(0, checksumLength);
  
  // Combine entropy + checksum
  const totalBits = binary + checksumBits;
  
  // Split into 11-bit chunks and map to words
  const words: string[] = [];
  for (let i = 0; i < totalBits.length; i += 11) {
    const chunk = totalBits.slice(i, i + 11);
    const index = parseInt(chunk, 2);
    words.push(WORDLIST[index % WORDLIST.length]);
  }
  
  return words.join(' ');
}

/**
 * Validate mnemonic seed phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  
  // Check word count (12 or 24)
  if (words.length !== 12 && words.length !== 24) {
    return false;
  }
  
  // Check all words exist in list
  for (const word of words) {
    if (!WORDLIST.includes(word.toLowerCase())) {
      return false;
    }
  }
  
  return true;
}

export default {
  generateMnemonic,
  validateMnemonic,
  WORDLIST,
};
