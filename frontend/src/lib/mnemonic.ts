/**
 * BIP-39 Mnemonic Generator (Browser-compatible)
 * Generates 12-word mnemonics from entropy
 */

const BIP39_WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'access',
  'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action',
  'actor', 'actress', 'actual', 'acute', 'ad', 'adapt', 'add', 'addict', 'address', 'adjust',
  'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age',
  'agent', 'agony', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already',
  'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor',
  'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer',
  'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
  'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around',
  'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect',
  'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude',
  'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
  'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor',
  'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar',
  'barely', 'bargain', 'barrel', 'barrier', 'base', 'basic', 'basket', 'battle', 'beach', 'beam',
  'bean', 'beast', 'beauty', 'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind',
  'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond',
  'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade',
  'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue',
  'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book',
  'boost', 'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket',
  'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'bright', 'bring', 'brisk', 'broccoli',
  'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo',
  'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus',
  'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage',
  'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon',
  'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'caption', 'car', 'carbon', 'card',
  'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat',
  'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery',
  'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos',
  'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest',
  'chicken', 'chief', 'child', 'chimney', 'china', 'chloe', 'chocolate', 'choice', 'choose', 'chronic',
  'chuckle', 'chunk', 'churn', 'cigar', 'cinema', 'circle', 'citizen', 'city', 'civil', 'claim',
  'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff',
  'climb', 'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club',
  'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin',
  'collect', 'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'compass',
  'compel', 'confirm', 'confront', 'confuse', 'consign', 'consist', 'conspire', 'constant', 'consult', 'consume',
  'contempt', 'content', 'contest', 'continue', 'control', 'convey', 'convince', 'cook', 'cool', 'copper',
  'copy', 'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple',
  'course', 'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash',
  'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp',
  'critic', 'crocodile', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate', 'rough', 'round',
  'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway', 'rural', 'sad',
  'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same',
  'sample', 'sand', 'satisfy', 'saturn', 'sauce', 'sausage', 'save', 'say', 'scale', 'scan',
  'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout', 'scrap',
  'screen', 'script', 'scrub', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'section',
  'security', 'seed', 'seek', 'seem', 'segment', 'select', 'sell', 'seminar', 'senior', 'sense',
  'sentence', 'series', 'service', 'session', 'settle', 'setup', 'seven', 'shadow', 'shaft', 'shallow',
  'share', 'shark', 'sharp', 'shelf', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship',
  'shiver', 'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp', 'shrine',
  'shrink', 'shrub', 'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight',
  'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since', 'sing', 'siren',
  'sister', 'situate', 'six', 'size', 'skate', 'sketch', 'ski', 'skill', 'skin', 'skirt',
  'skull', 'slab', 'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim', 'slogan',
  'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake',
  'snap', 'sniff', 'snow', 'soap', 'soccer', 'social', 'soft', 'solar', 'soldier', 'solid',
  'solve', 'some', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source',
  'south', 'space', 'span', 'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell',
  'spend', 'sphere', 'spice', 'spider', 'spike', 'spin', 'spirit', 'split', 'spoil', 'sponsor',
  'spoon', 'sport', 'spot', 'spray', 'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel',
  'stable', 'stadium', 'staff', 'stage', 'stair', 'stamp', 'stand', 'start', 'state', 'stay',
  'steak', 'steel', 'stem', 'step', 'stereo', 'steward', 'stick', 'still', 'sting', 'stock',
  'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike', 'strong', 'struggle',
  'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway', 'success', 'such', 'sudden',
  'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset', 'super', 'supply',
  'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect', 'sustain', 'swallow',
  'swamp', 'swap', 'swarm', 'swear', 'sweat', 'sweep', 'sweet', 'swift', 'swim', 'swing',
  'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail',
  'talent', 'talk', 'tank', 'tape', 'target', 'task', 'taste', 'tattoo', 'taxi', 'teach',
  'team', 'tell', 'ten', 'tenant', 'tennis', 'tent', 'term', 'test', 'text', 'thank',
  'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this', 'thought', 'three',
  'thrive', 'throat', 'through', 'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt',
  'timber', 'time', 'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today',
  'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight',
  'tool', 'tooth', 'top', 'topic', 'topple', 'torch', 'tornado', 'tortoise', 'toss', 'total',
  'tourist', 'toward', 'tower', 'town', 'toy', 'track', 'trade', 'traffic', 'tragic', 'train',
  'transfer', 'trap', 'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe',
  'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true', 'truly', 'trumpet',
  'trust', 'truth', 'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey', 'turn',
  'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly',
  'umbrella', 'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy',
  'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update',
  'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban', 'urge', 'usage', 'use', 'used',
  'useful', 'useless', 'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve',
  'van', 'vanish', 'vapor', 'various', 'vast', 'vault', 'vector', 'vegetable', 'vehicle', 'velvet',
  'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'very', 'vessel', 'veteran', 'viable',
  'vibrant', 'vicious', 'victory', 'video', 'view', 'village', 'vintage', 'violin', 'virtual', 'virus',
  'visa', 'visit', 'visual', 'vital', 'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume',
  'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want', 'warfare',
  'warm', 'warrior', 'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon',
  'wear', 'weasel', 'weather', 'web', 'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet',
  'whale', 'what', 'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width',
  'wife', 'wild', 'will', 'win', 'window', 'wine', 'wing', 'wink', 'winner', 'winter',
  'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'wool',
  'word', 'work', 'world', 'worry', 'worth', 'wrap', 'wreck', 'wrestle', 'wrist', 'write',
  'wrong', 'yard', 'year', 'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo'
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
      words.push(BIP39_WORDLIST[index % 2048])
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
      if (!BIP39_WORDLIST.includes(word.toLowerCase())) return false
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
