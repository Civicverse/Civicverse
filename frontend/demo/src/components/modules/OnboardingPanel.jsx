import React, { useState, useEffect } from 'react'

export default function OnboardingPanel() {
  const [step, setStep] = useState(1)
  const [ath, setAth] = useState(null)
  const [pub, setPub] = useState(null)
  const [priv, setPriv] = useState(null)
  const [aph, setAph] = useState(null)
  const [summary, setSummary] = useState(null)
  const [rewards, setRewards] = useState(null)
  const apiBase = process.env.VITE_API_URL || ''

  useEffect(() => {
    // load existing account from localStorage
    const stored = localStorage.getItem('civic_ath')
    if (stored) {
      const obj = JSON.parse(stored)
      setAth(obj.ath); setPub(obj.publicKey); setPriv(obj.privateKey)
    }
  }, [])

  async function createAccount() {
    // Generate client-side ECDSA P-256 keypair and send public key to backend
    const keyPair = await window.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
    const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    const pubB64 = btoa(String.fromCharCode(...new Uint8Array(spki)))
    const privB64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)))
    const pubPem = `-----BEGIN PUBLIC KEY-----\n${pubB64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----\n`
    const privPem = `-----BEGIN PRIVATE KEY-----\n${privB64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`

    const resp = await fetch(`${apiBase}/api/genesis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicKey: pubPem }) })
    const json = await resp.json()
    setAth(json.ath); setPub(pubPem); setPriv(pkcs8)
    // store private key bytes (pkcs8 base64) locally for demo signing
    localStorage.setItem('civic_ath', JSON.stringify({ ath: json.ath, publicKey: pubPem, privateKeyB64: privB64 }))
    setStep(2)
  }

  async function submitDemoAction() {
    if (!ath) return
    const payload = { ath, actionType: 'onboarding_step', sessionNonce: Math.random().toString(36).slice(2), timestamp: Date.now(), outcome: 'success' }

    // Load private key from localStorage and import
    const stored = JSON.parse(localStorage.getItem('civic_ath') || '{}')
    if (!stored.privateKeyB64) return alert('Missing private key; regenerate account')
    const privBytes = Uint8Array.from(atob(stored.privateKeyB64), c => c.charCodeAt(0))
    const privKey = await window.crypto.subtle.importKey('pkcs8', privBytes.buffer, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
    const data = JSON.stringify(payload)
    const sigBuf = await window.crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, new TextEncoder().encode(data))
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))

    const resp = await fetch(`${apiBase}/api/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, signature: sigB64 }) })
    const json = await resp.json()
    if (json.error) return alert('Action failed: ' + JSON.stringify(json))
    setAph(json.aph)
    setStep(4)
  }

  async function fetchSummary() {
    if (!ath) return
    const resp = await fetch(`${apiBase}/api/account/${ath}`)
    const json = await resp.json()
    setSummary(json)
    setStep(5)
  }

  async function fetchRewards() {
    if (!ath) return
    const resp = await fetch(`${apiBase}/api/rewards/${ath}`)
    const json = await resp.json()
    setRewards(json)
  }

  return (
    <div className="panel">
      <h3>ONBOARDING</h3>
      <div className="stat-row">Step {step}/5</div>
      <p>SHA-256 citizen attestation — trust without KYC</p>

      {step === 1 && (
        <>
          <div className="stat-row">Create an account (no KYC)</div>
          <button className="action-btn" onClick={createAccount}>Create Account</button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="stat-row">ATH: {ath}</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>Public Key:\n{pub}</div>
          <button className="action-btn" onClick={() => setStep(3)}>Next: Submit demo action</button>
        </>
      )}

      {step === 3 && (
        <>
          <div className="stat-row">Submit an Action Proof (APH)</div>
          <button className="action-btn" onClick={submitDemoAction}>Submit Action</button>
        </>
      )}

      {step === 4 && (
        <>
          <div className="stat-row">APH: {aph}</div>
          <button className="action-btn" onClick={fetchSummary}>Next: Fetch account summary</button>
        </>
      )}

      {step === 5 && (
        <>
          <div className="stat-row">Account Summary</div>
          <pre style={{ fontSize: 12 }}>{JSON.stringify(summary, null, 2)}</pre>
          <button className="action-btn" onClick={fetchRewards}>Fetch Rewards</button>
          {rewards && (<div className="stat-row">Rewards: {rewards.credits} credits (band: {rewards.karmaBand})</div>)}
        </>
      )}

    </div>
  )
}
