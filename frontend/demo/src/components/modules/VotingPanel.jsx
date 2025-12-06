import React, { useState } from 'react'

export default function VotingPanel() {
  const [votes, setVotes] = useState(0)

  const cast = () => {
    setVotes(v => v + 1)
    localStorage.setItem('votes', (Number(localStorage.getItem('votes') || 0) + 1).toString())
  }

  return (
    <div className="panel">
      <h3>VOTING</h3>
      <p>Quadratic voting (demo)</p>
      <div className="stat-row">Votes: {votes}</div>
      <button className="action-btn" onClick={cast}>+Vote</button>
      <button className="action-btn">View proposals</button>
    </div>
  )
}
