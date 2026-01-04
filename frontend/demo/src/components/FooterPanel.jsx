import React from 'react'

export default function FooterPanel(){
  return (
    <div className="footer-panel">
      <div className="muted">Players online: 3287 • Events: Space Market</div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <button className="muted">Shortcuts</button>
        <button className="muted">Mini-games</button>
      </div>
    </div>
  )
}
