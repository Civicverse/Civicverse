import React from 'react'

export default function RightPanel(){
  return (
    <aside className="right-panel">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontWeight:700}}>Notifications</div>
        <div className="muted">3 new</div>
      </div>
      <ul style={{marginTop:10}} aria-live="polite">
        <li><button style={{background:'transparent',border:'none',color:'var(--panel-text)'}}>Friend X logged in</button></li>
        <li><button style={{background:'transparent',border:'none',color:'var(--panel-text)'}}>Quest reward available</button></li>
        <li><button style={{background:'transparent',border:'none',color:'var(--panel-text)'}}>Guild invite</button></li>
      </ul>

      <hr style={{margin:'12px 0',opacity:0.08}} />
      <div>
        <div style={{fontWeight:700}}>Events</div>
        <div className="muted">Space Market • Live</div>
      </div>
    </aside>
  )
}
