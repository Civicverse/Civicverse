const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const express = require('express')

const router = express.Router()
const storePath = process.env.CIVICVERSE_SOCIAL_STORE || path.join(__dirname, '..', '..', 'data', 'social.json')
const mediaDirectory = path.join(path.dirname(storePath), 'social-media')
const streams = new Set()
const usedNonces = new Map()
const DID_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')
const mediaExtensions = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/mp4': 'm4a'
}

function readStore() {
  if (!fs.existsSync(storePath)) return { profiles: {}, posts: [], relationships: [], groups: [] }
  const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'))
  return {
    profiles: parsed.profiles || {},
    posts: Array.isArray(parsed.posts) ? parsed.posts : [],
    relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
    groups: Array.isArray(parsed.groups) ? parsed.groups : []
  }
}

let store = readStore()

function saveStore() {
  fs.mkdirSync(path.dirname(storePath), { recursive: true })
  const temporaryPath = `${storePath}.tmp`
  fs.writeFileSync(temporaryPath, JSON.stringify(store), 'utf8')
  fs.renameSync(temporaryPath, storePath)
  if (!fs.existsSync(mediaDirectory)) return
  const retainedMedia = new Set(store.posts.map(post => {
    const match = post.media && /^\/api\/social\/media\/([0-9a-f-]{36})$/i.exec(post.media.url)
    return match && mediaExtensions[post.media.mimeType] ? `${match[1]}.${mediaExtensions[post.media.mimeType]}` : ''
  }).filter(Boolean))
  for (const filename of fs.readdirSync(mediaDirectory)) {
    if (/^[0-9a-f-]{36}\.(png|jpg|gif|webp|mp4|mp3|ogg|wav|m4a)$/i.test(filename) && !retainedMedia.has(filename)) {
      fs.unlinkSync(path.join(mediaDirectory, filename))
    }
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function verifySignedAction(req, res, next) {
  try {
    const { payload, publicKey, signature } = req.body || {}
    if (!payload || !publicKey || !signature || typeof payload.actorId !== 'string') {
      return res.status(400).json({ error: 'signed_action_required' })
    }

    const publicKeyBytes = Buffer.from(publicKey, 'hex')
    const signatureBytes = Buffer.from(signature, 'hex')
    if (publicKeyBytes.length !== 32 || signatureBytes.length !== 64) {
      return res.status(400).json({ error: 'invalid_signature_format' })
    }

    const didHash = crypto.createHash('sha256').update(publicKey, 'utf8').digest('hex').slice(0, 32)
    if (payload.actorId !== `did:civic:${didHash}`) {
      return res.status(403).json({ error: 'identity_key_mismatch' })
    }

    const timestamp = Number(payload.timestamp)
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'action_expired' })
    }

    const key = crypto.createPublicKey({
      key: Buffer.concat([DID_PREFIX, publicKeyBytes]),
      format: 'der',
      type: 'spki'
    })
    if (!crypto.verify(null, Buffer.from(canonicalize(payload)), key, signatureBytes)) {
      return res.status(403).json({ error: 'invalid_signature' })
    }
    if (typeof payload.nonce !== 'string' || payload.nonce.length > 128 || usedNonces.has(payload.nonce)) {
      return res.status(409).json({ error: 'action_replayed' })
    }
    for (const [nonce, createdAt] of usedNonces) {
      if (Date.now() - createdAt > 5 * 60 * 1000) usedNonces.delete(nonce)
    }
    usedNonces.set(payload.nonce, Date.now())

    req.socialAction = payload
    next()
  } catch (error) {
    next(error)
  }
}

function publishUpdate() {
  const update = `event: feed_update\ndata: ${Date.now()}\n\n`
  for (const response of streams) {
    if (response.destroyed || response.writableEnded) {
      streams.delete(response)
      continue
    }
    response.write(update)
  }
}

function publicProfile(profile) {
  return profile ? { effect: 'none', ...profile } : null
}

router.get('/media/:mediaId', (req, res, next) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.mediaId)) return res.status(400).json({ error: 'invalid_media_id' })
  const media = store.posts.map(post => post.media).find(item => item && item.url === `/api/social/media/${req.params.mediaId}`)
  if (!media || !mediaExtensions[media.mimeType]) return res.status(404).json({ error: 'media_not_found' })
  const mediaPath = path.join(mediaDirectory, `${req.params.mediaId}.${mediaExtensions[media.mimeType]}`)
  res.type(media.mimeType)
  res.set('Cache-Control', 'public, max-age=31536000, immutable')
  res.sendFile(mediaPath, error => {
    if (error && !res.headersSent) {
      if (error.code === 'ENOENT') return res.status(404).json({ error: 'media_not_found' })
      next(error)
    }
  })
})

router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  res.flushHeaders()
  res.write('event: ready\ndata: connected\n\n')
  streams.add(res)
  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000)
  req.on('close', () => {
    clearInterval(heartbeat)
    streams.delete(res)
  })
})

router.get('/search', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase()
  if (query.length < 2) return res.json([])
  const results = Object.values(store.profiles)
    .filter(profile => profile.username.toLowerCase().includes(query) || profile.civicId.toLowerCase().includes(query))
    .slice(0, 20)
    .map(publicProfile)
  res.json(results)
})

router.get('/profiles/:civicId', (req, res) => {
  const profile = store.profiles[req.params.civicId]
  if (!profile) return res.status(404).json({ error: 'profile_not_found' })
  const relationships = store.relationships
  const posts = store.posts.filter(post => post.authorId === profile.civicId).slice(-50).reverse()
  res.json({
    profile: publicProfile(profile),
    posts,
    followerCount: relationships.filter(row => row.type === 'follow' && row.targetId === profile.civicId).length,
    followingCount: relationships.filter(row => row.type === 'follow' && row.actorId === profile.civicId).length
  })
})

router.put('/profiles/:civicId', verifySignedAction, (req, res) => {
  const action = req.socialAction
  if (action.actorId !== req.params.civicId || action.type !== 'profile') {
    return res.status(403).json({ error: 'profile_owner_required' })
  }
  const { username, about, status, theme, cursor, character } = action.profile || {}
  const backgroundColor = action.profile?.backgroundColor ?? '#080b18'
  const effect = action.profile?.effect || 'none'
  if (typeof username !== 'string' || username.trim().length < 1 || username.trim().length > 32) {
    return res.status(400).json({ error: 'invalid_username' })
  }
  if (typeof about !== 'string' || about.length > 500 || typeof status !== 'string' || status.length > 160) {
    return res.status(400).json({ error: 'invalid_profile_text' })
  }
  if (!['nebula', 'aurora', 'sunset', 'ocean', 'synthwave', 'forest'].includes(theme) ||
      !['sparkle', 'comet', 'crosshair', 'none'].includes(cursor) ||
      !['none', 'stars', 'aurora', 'glow'].includes(effect) ||
      typeof backgroundColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(backgroundColor)) {
    return res.status(400).json({ error: 'invalid_profile_style' })
  }
  const previousStatus = store.profiles[action.actorId]?.status || ''
  const nextStatus = status.trim()
  const updatedAt = Date.now()
  store.profiles[action.actorId] = {
    civicId: action.actorId,
    username: username.trim(),
    about: about.trim(),
    status: nextStatus,
    theme,
    cursor,
    effect,
    backgroundColor,
    character: character && typeof character === 'object' ? character : null,
    updatedAt
  }
  if (previousStatus !== nextStatus && nextStatus) {
    store.posts.push({
      id: crypto.randomUUID(),
      kind: 'status',
      authorId: action.actorId,
      authorName: username.trim(),
      content: nextStatus,
      media: null,
      createdAt: updatedAt,
      reactions: {}
    })
    store.posts = store.posts.slice(-1000)
  }
  saveStore()
  publishUpdate()
  res.json(publicProfile(store.profiles[action.actorId]))
})

router.get('/relationships', (req, res) => {
  const viewerId = String(req.query.viewerId || '')
  res.json(store.relationships.filter(row => row.actorId === viewerId || row.targetId === viewerId))
})

router.get('/groups', (req, res) => {
  res.json(store.groups.slice(-50).reverse())
})

router.get('/feed', (req, res) => {
  const viewerId = String(req.query.viewerId || '')
  const networkIds = new Set([viewerId])
  store.relationships.forEach(row => {
    if (row.type === 'follow' && row.actorId === viewerId) networkIds.add(row.targetId)
    if (row.type === 'friend' && row.status === 'accepted' && (row.actorId === viewerId || row.targetId === viewerId)) {
      networkIds.add(row.actorId === viewerId ? row.targetId : row.actorId)
    }
  })

  res.json({
    posts: store.posts.filter(post => networkIds.has(post.authorId)).slice(-100).reverse(),
    groups: store.groups.filter(group => group.memberIds.includes(viewerId))
  })
})

router.get('/explore', (req, res) => {
  const requestedLimit = Number.parseInt(String(req.query.limit || '30'), 10)
  const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 30
  const posts = store.posts.slice(-limit).reverse().map(post => ({
    id: post.id,
    authorId: post.authorId,
    authorName: store.profiles[post.authorId]?.username || post.authorName || post.authorId,
    content: typeof post.content === 'string' ? post.content.slice(0, 500) : '',
    createdAt: post.createdAt,
    media: post.media && typeof post.media.url === 'string' ? {
      url: post.media.url,
      mimeType: post.media.mimeType,
      name: post.media.name
    } : undefined
  }))
  res.json({ posts })
})

router.post('/relationships', verifySignedAction, (req, res) => {
  const action = req.socialAction
  const targetId = typeof action.targetId === 'string' ? action.targetId.trim() : ''
  if (!targetId || targetId.length > 128 || targetId === action.actorId) {
    return res.status(400).json({ error: 'invalid_relationship_target' })
  }
  if (!['follow', 'friend'].includes(action.relationshipType) ||
      !['request', 'accept', 'remove'].includes(action.operation)) {
    return res.status(400).json({ error: 'invalid_relationship_action' })
  }

  const existing = store.relationships.find(row =>
    row.type === action.relationshipType && row.actorId === action.actorId && row.targetId === targetId
  )

  if (action.relationshipType === 'follow') {
    if (action.operation === 'remove') store.relationships = store.relationships.filter(row => row !== existing)
    else if (!existing) store.relationships.push({ type: 'follow', actorId: action.actorId, targetId, status: 'accepted' })
  } else if (action.operation === 'request') {
    if (!existing) store.relationships.push({ type: 'friend', actorId: action.actorId, targetId, status: 'pending' })
  } else if (action.operation === 'accept') {
    const request = store.relationships.find(row =>
      row.type === 'friend' && row.actorId === targetId && row.targetId === action.actorId && row.status === 'pending'
    )
    if (!request) return res.status(404).json({ error: 'friend_request_not_found' })
    request.status = 'accepted'
  } else {
    store.relationships = store.relationships.filter(row =>
      !(row.type === 'friend' && ((row.actorId === action.actorId && row.targetId === targetId) ||
        (row.actorId === targetId && row.targetId === action.actorId)))
    )
  }
  saveStore()
  publishUpdate()
  res.json({ saved: true })
})

router.post('/posts', verifySignedAction, (req, res) => {
  const action = req.socialAction
  if (action.type !== 'post' || typeof action.content !== 'string' || action.content.trim().length > 2000) {
    return res.status(400).json({ error: 'invalid_post' })
  }
  let media = null
  let mediaPath = null
  if (action.media) {
    const source = action.media.dataUrl
    const match = typeof source === 'string' && /^data:([^;,]+);base64,([a-z0-9+/]+={0,2})$/i.exec(source)
    if (!match || !mediaExtensions[match[1]] || typeof action.media.name !== 'string') {
      return res.status(400).json({ error: 'invalid_media' })
    }
    const bytes = Buffer.from(match[2], 'base64')
    if (!bytes.length || bytes.length > 6 * 1024 * 1024 || bytes.toString('base64') !== match[2]) {
      return res.status(400).json({ error: 'invalid_media_size_or_encoding' })
    }
    fs.mkdirSync(mediaDirectory, { recursive: true })
    const usedBytes = fs.readdirSync(mediaDirectory).reduce((total, filename) =>
      total + fs.statSync(path.join(mediaDirectory, filename)).size, 0)
    if (usedBytes + bytes.length > 100 * 1024 * 1024) return res.status(413).json({ error: 'media_storage_limit_reached' })
    const mediaId = crypto.randomUUID()
    mediaPath = path.join(mediaDirectory, `${mediaId}.${mediaExtensions[match[1]]}`)
    fs.writeFileSync(mediaPath, bytes, { flag: 'wx' })
    media = {
      name: path.basename(action.media.name).slice(0, 120),
      mimeType: match[1],
      url: `/api/social/media/${mediaId}`
    }
  }
  if (!action.content.trim() && !media) return res.status(400).json({ error: 'empty_post' })
  const post = {
    id: crypto.randomUUID(),
    authorId: action.actorId,
    authorName: store.profiles[action.actorId]?.username || action.actorId,
    content: action.content.trim(),
    media,
    createdAt: Date.now(),
    reactions: {}
  }
  store.posts.push(post)
  store.posts = store.posts.slice(-1000)
  try {
    saveStore()
  } catch (error) {
    if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath)
    throw error
  }
  publishUpdate()
  res.status(201).json(post)
})

router.post('/reactions', verifySignedAction, (req, res) => {
  const action = req.socialAction
  const post = store.posts.find(item => item.id === action.postId)
  if (action.type !== 'reaction' || !post || !['like', 'dislike', 'remove'].includes(action.reaction)) {
    return res.status(400).json({ error: 'invalid_reaction' })
  }
  if (action.reaction === 'remove') delete post.reactions[action.actorId]
  else post.reactions[action.actorId] = action.reaction
  saveStore()
  publishUpdate()
  res.json(post)
})

router.post('/groups', verifySignedAction, (req, res) => {
  const action = req.socialAction
  if (action.type !== 'group' || !['create', 'join', 'leave'].includes(action.operation)) {
    return res.status(400).json({ error: 'invalid_group_action' })
  }
  let group
  if (action.operation === 'create') {
    const name = typeof action.name === 'string' ? action.name.trim() : ''
    if (name.length < 2 || name.length > 48 || typeof action.description !== 'string' || action.description.length > 280) {
      return res.status(400).json({ error: 'invalid_group_details' })
    }
    group = { id: crypto.randomUUID(), name, description: action.description.trim(), ownerId: action.actorId, memberIds: [action.actorId], createdAt: Date.now() }
    store.groups.push(group)
  } else {
    group = store.groups.find(item => item.id === action.groupId)
    if (!group) return res.status(404).json({ error: 'group_not_found' })
    if (action.operation === 'join' && !group.memberIds.includes(action.actorId)) group.memberIds.push(action.actorId)
    if (action.operation === 'leave') group.memberIds = group.memberIds.filter(id => id !== action.actorId)
  }
  saveStore()
  publishUpdate()
  res.json(group)
})

module.exports = router
