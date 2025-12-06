import React, { useState } from 'react'

export default function UBIPanel() {
  const [balance] = useState(250)
  const [claim] = useState(true)

  return (
    <div className="panel">
      <h3>UBI</h3>
      <p>Universal Basic Income</p>
      <div className="stat-row">Account: {balance} CVT</div>
      <div className="stat-row">Monthly: 50 KAS</div>
      {claim && (
        <button className="action-btn" style={{ background: '#00ff88' }}>
          ✓ Claim this month
        </button>
      )}
      {!claim && (
        <div className="stat-row">Next claim: in 5 days</div>
      )}
    </div>
  )
}
