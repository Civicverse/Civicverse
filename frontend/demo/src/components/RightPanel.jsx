import React from 'react'

export default function RightPanel(){
  return (
    <aside className="right-panel">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontWeight:700}}>Notifications</div>
        <div className="muted">3 new</div>
      </div>
      <ul style={{marginTop:10}}>
        <li>Friend X logged in</li>
        <li>Quest reward available</li>
        <li>Guild invite</li>
      </ul>

      <hr style={{margin:'12px 0',opacity:0.08}} />
      <div>
        <div style={{fontWeight:700}}>Events</div>
        <div className="muted">Space Market • Live</div>
      </div>
    </aside>
  )
}
