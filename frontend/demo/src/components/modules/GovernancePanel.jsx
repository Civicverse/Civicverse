import React, { useState } from 'react'

export default function GovernancePanel() {
  const [proposals] = useState([
    { id: 1, title: 'Increase treasury', yes: 234, no: 45 },
    { id: 2, title: 'New module proposal', yes: 156, no: 78 }
  ])

  return (
    <div className="panel">
      <h3>GOVERNANCE</h3>
      {proposals.map(p => (
        <div key={p.id} className="prop-row">
          <div className="prop-title">{p.title}</div>
          <div className="stat-row">YES: {p.yes} | NO: {p.no}</div>
          <button className="small-btn">Vote</button>
        </div>
      ))}
    </div>
  )
}
