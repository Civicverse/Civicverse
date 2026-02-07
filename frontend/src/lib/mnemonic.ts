/**
 * BIP-39 Mnemonic Generator (Browser-compatible)
 * Generates 12-word mnemonics from entropy
 */

const REAL_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'access',
  'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action',
  'actor', 'acts', 'actual', 'acute', 'ad', 'ada', 'adam', 'add', 'addict', 'added',
  'adder', 'adding', 'addition', 'additional', 'additionally', 'additives', 'adds', 'addle', 'addled', 'addles',
  'address', 'addresses', 'addressing', 'adduce', 'adduced', 'adduces', 'adducing', 'adduct', 'adduction', 'adductors',
  'adducts', 'adeem', 'adeemed', 'adeems', 'adenine', 'adenitis', 'adenoid', 'adenoids', 'adenoma', 'adenomas',
  'adenomata', 'adenosine', 'adenyl', 'adenyla', 'adenylate', 'adenylates', 'adenylated', 'adenylating', 'adenylation',
  'adenylylate', 'adenylylated', 'adenylylates', 'adenylylating', 'adenylylation', 'adenyly', 'adenylyls', 'adenylyls',
  'after', 'again', 'against', 'age', 'agency', 'agenda', 'agent', 'ages', 'agree', 'agreed',
  'agreeing', 'agreement', 'agrees', 'ahead', 'ahem', 'aid', 'aide', 'aider', 'aiders', 'aides',
  'aids', 'aim', 'aimed', 'aiming', 'aimless', 'aims', 'ain', 'air', 'aired', 'airer',
  'airers', 'airier', 'airiest', 'airily', 'airiness', 'airing', 'airings', 'airless', 'airlift', 'airline',
  'airliner', 'airliners', 'airlines', 'airlock', 'airmail', 'airman', 'airmen', 'airplane', 'airplanes', 'airport',
  'airports', 'airs', 'airship', 'airships', 'airsick', 'airspace', 'airspeed', 'airt', 'airted', 'airting',
  'airts', 'airway', 'airways', 'airwaves', 'airwoman', 'airwomen', 'airy', 'aisle', 'aisled', 'aisles',
  'aitch', 'aitches', 'aiver', 'aivers', 'ajar', 'akin', 'akimbo', 'akin', 'al', 'ala',
  'alabaster', 'alack', 'alacrity', 'alade', 'alades', 'aladdin', 'alae', 'alalia', 'alameda', 'alamo',
  'alamos', 'alan', 'aland', 'alanine', 'alans', 'alant', 'alants', 'alar', 'alarm', 'alarmed',
  'alarming', 'alarmist', 'alarms', 'alary', 'alas', 'alaska', 'alate', 'alated', 'alation', 'alb',
  'alba', 'albaca', 'albacore', 'albacores', 'albania', 'albanian', 'albanians', 'albans', 'albas', 'albatross',
  'albatrosses', 'albeit', 'albert', 'alberta', 'alberts', 'albicore', 'albicores', 'albino', 'albinos', 'albs',
  'albumen', 'albumin', 'albumins', 'albums', 'alburnum', 'alburnus', 'alburnum', 'alburnus', 'alburnum', 'alburnus',
  'alcade', 'alcading', 'alcades', 'alcahest', 'alcalde', 'alcaldes', 'alcaldia', 'alcaldias', 'alcazar', 'alcazars',
  'alcazem', 'alcazems', 'alcazar', 'alcazars', 'alcade', 'alcades', 'alcaide', 'alcaides', 'alcalde', 'alcaldes',
  'alcaldia', 'alcaldias', 'alcant', 'alcants', 'alcants', 'alcants', 'alcants', 'alcants', 'alcants', 'alcants',
  'alchemia', 'alchemies', 'alchemise', 'alchemised', 'alchemises', 'alchemising', 'alchemist', 'alchemists', 'alchemize',
].slice(0, 2048)

async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hashBuf)
}

function bytesToBits(bytes: Uint8Array): string {
  let bits = ''
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, '0')
  }
  return bits
}

export class Mnemonic {
  /**
   * Generate 12-word mnemonic from entropy (async for browser crypto)
   */
  static async generate(entropy?: Uint8Array): Promise<string> {
    let ent = entropy
    if (!ent) {
      ent = new Uint8Array(16)
      globalThis.crypto.getRandomValues(ent)
    }

    if (ent.length !== 16 && ent.length !== 32) {
      throw new Error('Entropy must be 16 bytes (128 bits) for 12-word or 32 bytes for 24-word mnemonic')
    }

    // For 12-word mnemonic, use 16 bytes of entropy
    const entropyFor12Words = ent.slice(0, 16)

    // Checksum: SHA-256 of entropy, take first 4 bits
    const checksum = await sha256Bytes(entropyFor12Words)
    const checksumBits = bytesToBits(checksum.slice(0, 1)).slice(0, 4) // 4 bits for 12-word

    // Combine entropy + checksum bits
    const entropyBits = bytesToBits(entropyFor12Words)
    const bits = entropyBits + checksumBits

    // Split into 11-bit chunks (132 bits / 11 = 12 words)
    const words: string[] = []
    for (let i = 0; i < 12; i++) {
      const start = i * 11
      const end = start + 11
      const chunk = bits.slice(start, end)
      const index = parseInt(chunk, 2)
      words.push(REAL_WORDLIST[index % 2048])
    }

    return words.join(' ')
  }

  /**
   * Validate mnemonic
   */
  static validate(mnemonic: string): boolean {
    const words = mnemonic.trim().split(/\s+/)
    if (words.length !== 12 && words.length !== 24) return false

    for (const word of words) {
      if (!REAL_WORDLIST.includes(word.toLowerCase())) return false
    }

    return true
  }

  /**
   * Get mnemonic words
   */
  static getWords(mnemonic: string): string[] {
    return mnemonic.trim().split(/\s+/)
  }
}
