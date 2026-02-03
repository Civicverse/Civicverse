import React, {useEffect, useState} from 'react'

export default function Quests(){
  const [quests,setQuests] = useState([])
  const [msg,setMsg] = useState('')
  useEffect(()=>{ fetch('/api/quests').then(r=>r.json()).then(setQuests).catch(()=>setQuests([])) },[])

  async function claim(q){
    setMsg('Claiming...')
    const local = localStorage.getItem('civicverse_citizen')
    const citizen = local? JSON.parse(local) : null
    const citizenId = citizen? citizen.id : null
    const r = await fetch('/api/quests/claim',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({questId:q.id,citizenId})}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}))
    if(r.ok){ setMsg('Claimed!'); setQuests(prev=>prev.map(p=>p.id===q.id?{...p,claimed:true}:p)); try{ window.playSfx && window.playSfx() }catch(e){} } else setMsg('Failed: '+(r.error||''))
  }
  
  // play sfx on successful claim
  useEffect(()=>{
    const original = window.playSfx
    return ()=>{
      // nothing to cleanup
    }
  },[])

  return (
    <div>
      <h3>Quests</h3>
      {quests.map(q=> <div key={q.id} style={{padding:8,margin:6,background:'#070615',borderRadius:6}}>
        <b>{q.title}</b>
        <p>Reward: {q.reward} CV</p>
        <p>Status: {q.claimed? 'claimed' : 'open'}</p>
        {!q.claimed && <button onClick={()=>claim(q)}>Claim</button>}
      </div>)}
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  )
}
