import React from 'react'

export default function HUD({ hp = 100, kills = 0, setActiveModule = ()=>{} }) {
  return (
    <div className="hud">
      <div className="hud-item">HP: <span className="hud-val">{hp}</span></div>
      <div className="hud-item">KILLS: <span className="hud-val">{kills}</span></div>
      <div className="hud-actions">
        <button className="small-btn" onClick={()=>setActiveModule('dashboard')}>Dashboard</button>
        <button className="small-btn" onClick={()=>setActiveModule('marketplace')}>Market</button>
        <button className="small-btn" onClick={()=>setActiveModule('dex')}>DEX</button>
        <button className="small-btn" onClick={()=>setActiveModule('treasury')}>Treasury</button>
        <button className="small-btn" onClick={()=>setActiveModule('craig')}>Craig</button>
      </div>
    </div>
  )
}
