import React, {useState} from 'react'

export default function CitizenCreate({onCreated}){
  const [name,setName] = useState('')
  const [msg,setMsg] = useState('')
  async function create(){
    setMsg('Creating...')
    const r = await fetch('/api/citizen',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name})}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}))
    if(r.ok){ setMsg('Citizen created: '+r.citizen.id); onCreated && onCreated(r.citizen) } else setMsg('Failed: '+(r.error||''))
  }
  return (
    <div className="panel">
      <h4>Create Citizen</h4>
      <input placeholder="Citizen name" value={name} onChange={e=>setName(e.target.value)} />
      <button onClick={async()=>{
        await create()
        // save created citizen id locally for session
        try{ const res = await fetch('/api/citizens').then(r=>r.json()); const last = res[res.length-1]; if(last) localStorage.setItem('civicverse_citizen', JSON.stringify(last)) }catch(e){}
      }}>Create</button>
      {msg && <div style={{marginTop:8}}>{msg}</div>}
    </div>
  )
}
