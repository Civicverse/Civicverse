import React from 'react'

export default function HUD({ hp = 100, kills = 0 }) {
  return (
    <div className="hud">
      <div className="hud-item">HP: <span className="hud-val">{hp}</span></div>
      <div className="hud-item">KILLS: <span className="hud-val">{kills}</span></div>
    </div>
  )
}
