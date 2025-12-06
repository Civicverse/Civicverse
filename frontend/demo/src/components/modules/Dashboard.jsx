import React, { useState } from 'react'

export default function Dashboard() {
  const [status] = useState({
    players: 12,
    voted: 87,
    treasuryCVT: 524.3,
    onlineNow: 5
  })

  return (
    <div className="panel">
      <h3>DASHBOARD</h3>
      <div className="stat-row">Online: {status.onlineNow}</div>
      <div className="stat-row">Players: {status.players}</div>
      <div className="stat-row">Voted: {status.voted}%</div>
      <div className="stat-row">Treasury: {status.treasuryCVT} CVT</div>
      <button className="action-btn">Sync status</button>
    </div>
  )
}
