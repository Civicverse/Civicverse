import React from 'react'
import MiniMap from './MiniMap'

export default function FuturisticHUD({ hp=100, kills=0 }){
  return (
    <div className="fhud-root">
      <div className="fhud-left">
        <div className="fhud-player-card">
          <div className="pc-avatar">YOU</div>
          <div className="pc-stats">
            <div className="pc-row"><span className="pc-label">HP</span><span className="pc-val">{hp}</span></div>
            <div className="pc-row"><span className="pc-label">KILLS</span><span className="pc-val">{kills}</span></div>
          </div>
        </div>
        <MiniMap />
      </div>

      <div className="fhud-center">
        <div className="action-bar">
          <button className="action">Interact</button>
          <button className="action">Quest</button>
          <button className="action">Vote</button>
          <button className="action">Trade</button>
        </div>
      </div>

      <div className="fhud-right">
        <div className="fhud-quick">WASD • SPACE</div>
      </div>
    </div>
  )
}
