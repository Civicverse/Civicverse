const crypto = require('crypto')
const fs = require('fs')

function stableStringify(obj) {
  if (obj === null || obj === undefined) return ''
  if (typeof obj !== 'object') return String(obj)
  const keys = Object.keys(obj).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

function computeATH({ publicKeyPem, timestamp, clientEntropy, protocolSalt }) {
  const input = { publicKey: publicKeyPem, timestamp, clientEntropy, protocolSalt }
  return crypto.createHash('sha256').update(stableStringify(input)).digest('hex')
}

function computeAPH({ ath, actionType, sessionNonce, timestamp, outcome }) {
  const input = { ath, actionType, sessionNonce, timestamp, outcome }
  return crypto.createHash('sha256').update(stableStringify(input)).digest('hex')
}

function computeKarmaAndLevelFromActions(linesRaw, acctCreatedAt) {
  const now = Date.now()
  const lines = (linesRaw || []).map(l => typeof l === 'string' ? JSON.parse(l) : l)
  const count = lines.length
  const types = new Set(lines.map(l => l.actionType))
  const diversity = types.size
  const recent = lines.filter(l => (now - l.ts) < (1000 * 60 * 60 * 24 * 30)).length
  const score = count * 1 + diversity * 5 + Math.min(recent, 100) * 0.5

  let karmaBand = 'bronze'
  if (score < 5) karmaBand = 'none'
  else if (score < 20) karmaBand = 'bronze'
  else if (score < 60) karmaBand = 'silver'
  else if (score < 200) karmaBand = 'gold'
  else karmaBand = 'platinum'

  const ageDays = Math.max(0, Math.floor((now - (acctCreatedAt || now)) / (1000 * 60 * 60 * 24)))
  const bandBase = { none: 1, bronze: 10, silver: 30, gold: 60, platinum: 80 }[karmaBand]
  const level = Math.min(100, Math.max(1, Math.floor(bandBase + Math.min(ageDays / 7, 20) + diversity * 2)))

  // Simple sybil score heuristic: reward diversity and regularity, penalize bursts
  const perMinute = (windowMs = 60 * 1000) => lines.filter(l => (now - l.ts) < windowMs).length
  const burst = perMinute(60 * 1000)
  let sybilScore = 1.0
  if (burst > 30) sybilScore = 0.1
  else if (burst > 10) sybilScore = 0.5
  else if (burst > 5) sybilScore = 0.8

  return { karmaBand, level, karmaScore: Math.round(score), sybilScore }
}

function verifySignatureECDSA(publicKeyPem, dataString, signatureBase64) {
  const verify = crypto.createVerify('SHA256')
  verify.update(dataString)
  verify.end()
  const sig = Buffer.from(signatureBase64, 'base64')
  try {
    return verify.verify(publicKeyPem, sig)
  } catch (e) {
    return false
  }
}

module.exports = { stableStringify, computeATH, computeAPH, computeKarmaAndLevelFromActions, verifySignatureECDSA }
