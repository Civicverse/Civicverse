import React, { useState, useEffect } from 'react'
import demoConfig from '../../demo-config.json'

export default function Treasury() {
  const [balance, setBalance] = useState(demoConfig.treasury.balance)
  useEffect(() => {
    // demo: simple periodic income simulation
    const id = setInterval(() => setBalance(b => (b + Math.random() * 5).toFixed(2)), 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <h2>Treasury</h2>
      <p>Address: <code>{demoConfig.treasury.address}</code></p>
      <p>Balance: <strong>{balance} CVT</strong></p>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setBalance((parseFloat(balance) + 100).toFixed(2))}>Inject 100 CVT (demo)</button>
        <button style={{ marginLeft: 8 }} onClick={() => setBalance((parseFloat(balance) - 10).toFixed(2))}>Spend 10 CVT (demo)</button>
      </div>
    </div>
  )
}
