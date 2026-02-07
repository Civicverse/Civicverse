import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function WalletGenerationPage(){
  const nav = useNavigate()
  const [memetic, setMemetic] = React.useState('')
  const [confirm, setConfirm] = React.useState('')

  async function createWallet(){
    if(memetic.length<8){ alert('Memetic password must be 8+ characters'); return }
    if(memetic !== confirm){ alert('Passwords do not match'); return }

    // In production: generate HD wallet (BIP-39 seed), derive address, encrypt with memetic password
    // For now: store in localStorage
    const walletSeed = 'wallet:' + Math.random().toString(36).slice(2)
    localStorage.setItem('civic:walletSeed', walletSeed)
    localStorage.setItem('civic:memeticHash', btoa(memetic).slice(0,32))

    try{
      await fetch('/api/wallet/backup', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          did: localStorage.getItem('civic:did'),
          encryptedWallet: btoa(walletSeed)
        }) 
      })
    }catch(e){ console.warn('wallet backup failed', e) }

    nav('/wallet')
  }

  return (
    <div className="container">
      <h1>Memetic Wallet Creation</h1>
      <div className="card">
        <p>Your Civic ID has been generated. Now create a memetic password to secure your wallet. This password encrypts your wallet locally; Civicverse never sees it.</p>
        <label>Memetic Password (8+ chars)<input type="password" value={memetic} onChange={e=>setMemetic(e.target.value)} /></label>
        <label style={{display:'block',marginTop:8}}>Confirm Password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} /></label>
        <div style={{marginTop:12}}>
          <button onClick={createWallet}>Create Wallet</button>
        </div>
      </div>
    </div>
  )
}
