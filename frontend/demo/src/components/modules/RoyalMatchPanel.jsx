import React, { useEffect, useState } from 'react'

export default function RoyalMatchPanel(){
  const [playerId, setPlayerId] = useState(() => Number(localStorage.getItem('playerId')||0))
  const [balance, setBalance] = useState(0)
  const [match, setMatch] = useState(null)
  const [betAmount, setBetAmount] = useState(50)
  const [community, setCommunity] = useState(0)

  useEffect(()=>{
    const id = Number(localStorage.getItem('playerId')||0)
    setPlayerId(id)
    if(id) fetchBalance(id)
    fetchCommunity()
    const onUpdate = (e)=>{ setMatch(e.detail) }
    const onResult = (e)=>{ alert('Match result: '+JSON.stringify(e.detail)) ; fetchBalance(playerId); fetchCommunity(); }
    window.addEventListener('royal:match_update', onUpdate)
    window.addEventListener('royal:match_result', onResult)
    return ()=>{
      window.removeEventListener('royal:match_update', onUpdate)
      window.removeEventListener('royal:match_result', onResult)
    }
  },[])

  async function fetchBalance(pid){
    try{
      const r = await fetch(`/api/wallet/${pid}`)
      const j = await r.json()
      setBalance(j.balance||0)
    }catch(e){}
  }

  async function fetchCommunity(){
    try{ const r = await fetch('/api/community_wallet'); const j = await r.json(); setCommunity(j.community||0) }catch(e){}
  }

  async function createMatch(){
    const r = await fetch('/api/match/create',{method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ owner: playerId })})
    const j = await r.json();
    setMatch({ id: j.matchId, owner: playerId, participants: [], bets: [], status: 'open' })
  }

  async function joinMatch(){
    if(!match) return alert('No match selected')
    await fetch('/api/match/join',{method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ matchId: match.id, playerId })})
    loadMatch(match.id)
  }

  async function placeBet(){
    if(!match) return alert('No match')
    const r = await fetch('/api/match/place_bet',{method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ matchId: match.id, playerId, amount: betAmount })})
    const j = await r.json()
    if(j.error) return alert(j.error)
    setBalance(j.balance)
    loadMatch(match.id)
  }

  async function startMatch(){
    if(!match) return
    await fetch('/api/match/start',{method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ matchId: match.id })})
    loadMatch(match.id)
  }

  async function endMatch(){
    if(!match) return
    const r = await fetch('/api/match/end',{method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ matchId: match.id })})
    const j = await r.json(); alert('Resolved: '+JSON.stringify(j.result))
    loadMatch(match.id)
    fetchBalance(playerId); fetchCommunity()
  }

  async function loadMatch(id){
    try{ const r = await fetch('/api/match/'+id); const j = await r.json(); setMatch(j) }catch(e){}
  }

  return (
    <div className="panel">
      <h3>ROYAL DEATHMATCH</h3>
      <div className="stat-row">Wallet: {balance} CVT</div>
      <div className="stat-row">Community: {community} CVT</div>
      <div style={{marginTop:8}}>
        {!match && <button className="action-btn" onClick={createMatch}>Create Match</button>}
        {match && (
          <div>
            <div className="stat-row">Match: {match.id} — Status: {match.status}</div>
            <div className="stat-row">Participants: {(match.participants||[]).join(', ')}</div>
            <div className="stat-row">Pot: {(match.bets||[]).reduce((s,[,_])=>s+_,0)}</div>
            <div style={{marginTop:8}}>
              <input type="number" value={betAmount} onChange={e=>setBetAmount(Number(e.target.value))} className="input-field" />
              <button className="action-btn" onClick={placeBet}>Place Bet</button>
              <button className="action-btn" onClick={joinMatch}>Join Match</button>
              <button className="action-btn" onClick={startMatch}>Start Match</button>
              <button className="action-btn" onClick={endMatch}>Resolve Now</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
