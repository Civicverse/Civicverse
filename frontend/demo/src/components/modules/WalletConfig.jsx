import React, { useState } from 'react'

export default function WalletConfig() {
  const [wallet, setWallet] = useState('demo_wallet')

  return (
    <div className="panel">
      <h3>WALLET</h3>
      <input
        type="text"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        className="input-field"
        placeholder="Wallet address"
      />
      <div className="stat-row">Balance: 1500 CVT</div>
      <button className="action-btn">Connect</button>
      <button className="action-btn">Verify</button>
    </div>
  )
}
