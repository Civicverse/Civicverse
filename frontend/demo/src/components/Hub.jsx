import React from 'react'
import RewardBurst from './RewardBurst'

function Card({title,children}){
  return (
    <div className="holo-card" style={{margin:10,maxWidth:420}}>
      <div style={{fontWeight:700,marginBottom:6}}>{title}</div>
      <div>{children}</div>
    </div>
  )
}

export default function Hub(){
  return (
    <div className="hub-shell">
      <div style={{display:'flex',gap:14,flexWrap:'wrap',pointerEvents:'none'}}>
        <div style={{pointerEvents:'auto'}}><Card title="Daily Quest">Collect 10 samples • <span className="muted">2/10</span></Card></div>
        <div style={{pointerEvents:'auto'}}><Card title="Recent Post">Welcome to the Civicverse demo — share your story!</Card></div>
        <div style={{pointerEvents:'auto'}}><Card title="Rewards">You earned <strong>50 CVT</strong> <span style={{marginLeft:8,verticalAlign:'middle'}}><RewardBurst size={28} /></span></Card></div>
      </div>
    </div>
  )
}
