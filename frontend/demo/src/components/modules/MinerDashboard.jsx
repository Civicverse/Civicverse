import React, { useState } from 'react'

export default function MinerDashboard() {
  const [mining] = useState(true)
  const [hashrate] = useState(45.2)
  const [earned] = useState(0.037)

  return (
    <div className="panel">
      <h3>MINER</h3>
      <div className="stat-row">Status: {mining ? '🟢 Mining' : '⚫ Idle'}</div>
      <div className="stat-row">Hashrate: {hashrate} MH/s</div>
      <div className="stat-row">Earned: {earned} CVT</div>
      <button className="action-btn">{mining ? 'Stop' : 'Start'}</button>
    </div>
  )
}
