import React from 'react'

export default function LeftPanel(){
  return (
    <aside className="left-sidebar" aria-hidden="false">
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:56,height:56,borderRadius:12,background:'linear-gradient(135deg,var(--neon-blue),var(--neon-magenta))'}} />
        <div>
          <div style={{fontWeight:700}}>PlayerName</div>
          <div className="muted">Level 7 • Guardian</div>
        </div>
      </div>

      <hr style={{margin:'12px 0',opacity:0.08}} />
      <div>
        <div style={{marginBottom:8}}>Energy</div>
        <div style={{height:10,background:'rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden'}}>
          <div style={{width:'68%',height:'100%',background:'linear-gradient(90deg,var(--neon-blue),var(--neon-magenta))'}} />
        </div>
      </div>

      <div style={{marginTop:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className="muted">Karma</div>
          <div>+120</div>
        </div>
        <div style={{height:8,background:'rgba(255,255,255,0.04)',borderRadius:6,overflow:'hidden'}}>
          <div style={{width:'45%',height:'100%',background:'linear-gradient(90deg,var(--neon-green),var(--electric-purple))'}} />
        </div>
      </div>

      <div style={{marginTop:18}}>
        <div style={{fontWeight:700}}>Active Quests</div>
        <ul style={{paddingLeft:16}}>
          <li>Deliver Package • 2/5</li>
          <li>Assist Neighbor • 0/3</li>
        </ul>
      </div>
    </aside>
  )
}
