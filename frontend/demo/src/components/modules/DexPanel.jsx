import React, { useState } from 'react'

export default function DexPanel() {
  const [kas, setKas] = useState(1000)
  const [xmr, setXmr] = useState(50)

  const swap = () => {
    setKas(k => k - 100)
    setXmr(x => x + 5)
  }

  return (
    <div className="panel">
      <h3>DEX</h3>
      <div className="stat-row">KAS: {kas}</div>
      <div className="stat-row">XMR: {xmr}</div>
      <button className="action-btn" onClick={swap}>Swap 100 KAS</button>
      <button className="action-btn">View pairs</button>
    </div>
  )
}
