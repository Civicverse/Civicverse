const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const express = require('express')
const { after, before, test } = require('node:test')

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'civicverse-social-'))
process.env.CIVICVERSE_SOCIAL_STORE = path.join(testDirectory, 'social.json')
const socialRouter = require('../services/social-service')
const app = express()
app.use(express.json({ limit: '10mb' }))
app.use('/api/social', socialRouter)

let server
let baseUrl

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function makeIdentity() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
  const publicKeyHex = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex')
  const civicId = `did:civic:${crypto.createHash('sha256').update(publicKeyHex, 'utf8').digest('hex').slice(0, 32)}`
  return { privateKey, publicKeyHex, civicId }
}

function sign(identity, value) {
  const payload = { ...value, actorId: identity.civicId, timestamp: Date.now(), nonce: crypto.randomUUID() }
  return {
    payload,
    publicKey: identity.publicKeyHex,
    signature: crypto.sign(null, Buffer.from(canonicalize(payload)), identity.privateKey).toString('hex')
  }
}

async function request(route, method = 'GET', body) {
  return fetch(`${baseUrl}/api/social${route}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  })
}

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  fs.rmSync(testDirectory, { recursive: true, force: true })
})

test('signed profiles, feed, media, reactions, groups, and replay checks work end to end', async () => {
  const alice = makeIdentity()
  const bob = makeIdentity()
  const profile = name => ({
    username: name, about: 'Hello, Civicverse.', status: '', theme: 'nebula', cursor: 'sparkle', effect: 'none', backgroundColor: '#21304a', character: null
  })

  const aliceProfileAction = sign(alice, { type: 'profile', profile: profile('Alice') })
  const aliceProfileResponse = await request(`/profiles/${encodeURIComponent(alice.civicId)}`, 'PUT', aliceProfileAction)
  assert.equal(aliceProfileResponse.status, 200)
  const aliceProfile = await aliceProfileResponse.json()
  assert.equal(aliceProfile.username, 'Alice')
  assert.equal(aliceProfile.backgroundColor, '#21304a')
  const invalidStyleResponse = await request(
    `/profiles/${encodeURIComponent(alice.civicId)}`,
    'PUT',
    sign(alice, { type: 'profile', profile: { ...profile('Alice'), backgroundColor: 'not-a-color' } })
  )
  assert.equal(invalidStyleResponse.status, 400)

  const bobProfileResponse = await request(`/profiles/${encodeURIComponent(bob.civicId)}`, 'PUT', sign(bob, { type: 'profile', profile: profile('Bob') }))
  assert.equal(bobProfileResponse.status, 200)
  const searchResponse = await request('/search?q=ali')
  assert.equal((await searchResponse.json())[0].civicId, alice.civicId)
  assert.deepEqual(await (await request(`/relationships?viewerId=${encodeURIComponent(bob.civicId)}`)).json(), [])
  assert.deepEqual(await (await request('/groups')).json(), [])

  const postResponse = await request('/posts', 'POST', sign(alice, {
    type: 'post',
    content: 'Hello from the plaza',
    media: {
      name: 'pixel.png',
      mimeType: 'image/png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/rZ8AAAAASUVORK5CYII='
    }
  }))
  assert.equal(postResponse.status, 201)
  const post = await postResponse.json()
  assert.equal(post.authorName, 'Alice')
  assert.equal(post.media.mimeType, 'image/png')
  const mediaResponse = await request(post.media.url.replace('/api/social', ''))
  assert.equal(mediaResponse.status, 200)
  assert.match(mediaResponse.headers.get('content-type'), /image\/png/)

  const emptyFeed = await (await request(`/feed?viewerId=${encodeURIComponent(bob.civicId)}`)).json()
  assert.equal(emptyFeed.posts.length, 0)

  const exploreFeed = await (await request('/explore?limit=1')).json()
  assert.equal(exploreFeed.posts.length, 1)
  assert.equal(exploreFeed.posts[0].id, post.id)
  assert.equal(exploreFeed.posts[0].authorName, 'Alice')
  assert.equal('reactions' in exploreFeed.posts[0], false)

  const followResponse = await request('/relationships', 'POST', sign(bob, {
    relationshipType: 'follow', operation: 'request', targetId: alice.civicId
  }))
  assert.equal(followResponse.status, 200)
  const bobFeed = await (await request(`/feed?viewerId=${encodeURIComponent(bob.civicId)}`)).json()
  assert.equal(bobFeed.posts[0].id, post.id)

  const statusResponse = await request(`/profiles/${encodeURIComponent(alice.civicId)}`, 'PUT', sign(alice, {
    type: 'profile', profile: { ...profile('Alice'), status: 'Back at the plaza', theme: 'synthwave', cursor: 'crosshair', effect: 'stars' }
  }))
  assert.equal(statusResponse.status, 200)
  assert.equal((await statusResponse.json()).effect, 'stars')
  const updatedBobFeed = await (await request(`/feed?viewerId=${encodeURIComponent(bob.civicId)}`)).json()
  const statusPost = updatedBobFeed.posts.find(item => item.kind === 'status')
  assert.equal(statusPost.content, 'Back at the plaza')

  const reactionResponse = await request('/reactions', 'POST', sign(bob, { type: 'reaction', postId: post.id, reaction: 'like' }))
  assert.equal(reactionResponse.status, 200)
  assert.equal((await reactionResponse.json()).reactions[bob.civicId], 'like')

  const groupAction = sign(alice, { type: 'group', operation: 'create', name: 'Plaza Friends', description: 'Meet and share.' })
  const groupResponse = await request('/groups', 'POST', groupAction)
  assert.equal(groupResponse.status, 200)
  const group = await groupResponse.json()
  assert.equal(group.memberIds[0], alice.civicId)
  assert.equal((await (await request('/groups')).json()).length, 1)

  const replayResponse = await request('/groups', 'POST', groupAction)
  assert.equal(replayResponse.status, 409)

  const badSignature = sign(alice, { type: 'profile', profile: profile('Spoofed') })
  badSignature.signature = '00'.repeat(64)
  const forbiddenResponse = await request(`/profiles/${encodeURIComponent(alice.civicId)}`, 'PUT', badSignature)
  assert.equal(forbiddenResponse.status, 403)
})
