const trust = require('../lib/trust')
const crypto = require('crypto')

describe('trust helpers', () => {
  test('ATH deterministic', () => {
    const pub = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----\n'
    const a1 = trust.computeATH({ publicKeyPem: pub, timestamp: 12345, clientEntropy: 'e1', protocolSalt: 's' })
    const a2 = trust.computeATH({ publicKeyPem: pub, timestamp: 12345, clientEntropy: 'e1', protocolSalt: 's' })
    expect(a1).toBe(a2)
  })

  test('APH deterministic', () => {
    const a1 = trust.computeAPH({ ath: 'a', actionType: 't', sessionNonce: 'n', timestamp: 1, outcome: 'ok' })
    const a2 = trust.computeAPH({ ath: 'a', actionType: 't', sessionNonce: 'n', timestamp: 1, outcome: 'ok' })
    expect(a1).toBe(a2)
  })

  test('ECDSA signature verify roundtrip', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const pubPem = publicKey.export({ type: 'spki', format: 'pem' })
    const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' })
    const data = JSON.stringify({ test: 1 })
    const sign = crypto.createSign('SHA256')
    sign.update(data)
    sign.end()
    const sig = sign.sign(privPem)
    const ok = trust.verifySignatureECDSA(pubPem, data, sig.toString('base64'))
    expect(ok).toBe(true)
  })
})
