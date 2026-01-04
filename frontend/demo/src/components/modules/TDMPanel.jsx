import React, { useState, useEffect } from 'react'

const apiBase = process.env.VITE_API_URL || ''

export default function TDMPanel(){
  const [matches, setMatches] = useState([])
  const [log, setLog] = useState([])
  const [creating, setCreating] = useState(false)

  async function load(){
    try{ const r = await fetch(`${apiBase.replace(/\/$/, '')}:4100/matches`); const j = await r.json(); setMatches(j)}catch(e){}
  }

  useEffect(()=>{ load() },[])

  async function create(){
    setCreating(true)
    try{
      const r = await fetch(`${apiBase.replace(/\/$/, '')}:4100/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: 'TDM Demo' }) })
      const j = await r.json()
      setLog(l=>[...l, 'Created '+j.name])
      load()
    }catch(e){ setLog(l=>[...l, 'Create failed']) }
    setCreating(false)
  }

  async function bet(matchId, amt){
    try{
      const payload = { matchId, player: 'demo_player', amount: amt }
      const r = await fetch(`${apiBase.replace(/\/$/, '')}:4100/bet`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const j = await r.json()
      setLog(l=>[...l, 'Bet placed: '+amt])
      load()
    }catch(e){ setLog(l=>[...l, 'Bet failed']) }
  }

  return (
    <div className="panel">
      <h3>ARENAS / TDM</h3>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <button className="action-btn" onClick={create} disabled={creating}>Create Arena</button>
        <button className="small-btn" onClick={load}>Refresh</button>
      </div>
      <div>
        {matches.map(m=> (
          <div key={m.id} style={{padding:8,marginBottom:6,background:'rgba(255,255,255,0.02)',borderRadius:8}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div>{m.name} • players: {m.players.length}/{m.maxPlayers}</div>
              <div>Pot: {m.pot}</div>
            </div>
            <div style={{marginTop:6,display:'flex',gap:8}}>
              <button className="small-btn" onClick={()=>bet(m.id, 10)}>Bet 10</button>
              <button className="small-btn" onClick={()=>bet(m.id, 50)}>Bet 50</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12}}>
        <div style={{fontWeight:700}}>Activity</div>
        <div style={{maxHeight:120,overflow:'auto',marginTop:6}}>{log.map((l,i)=><div key={i}>{l}</div>)}</div>
      </div>
    </div>
  )
}
