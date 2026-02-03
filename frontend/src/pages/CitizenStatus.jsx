import React, {useEffect, useState} from 'react'

export default function CitizenStatus(){
  const [citizen,setCitizen] = useState(null)
  const [msg,setMsg] = useState('')

  async function load(){
    const local = localStorage.getItem('civicverse_citizen')
    if(!local){ setCitizen(null); return }
    const c = JSON.parse(local)
    try{
      const fresh = await fetch('/api/citizens/'+c.id).then(r=>r.json())
      setCitizen(fresh)
      localStorage.setItem('civicverse_citizen', JSON.stringify(fresh))
    }catch(e){ setCitizen(c) }
  }

  useEffect(()=>{ load(); const i=setInterval(load,5000); return ()=>clearInterval(i) },[])

  if(!citizen) return <div style={{marginTop:8}}>No citizen stored in this session. Create one above.</div>
  return (
    <div style={{marginTop:8}}>
      <b>Citizen:</b> {citizen.name} ({citizen.id})
      <div>Balance: {citizen.balance || 0} CV</div>
      <div style={{marginTop:8}}>
        <input type="number" min="0" step="0.01" id="withdraw_amt" placeholder="Amount to withdraw" style={{width:120,marginRight:8}} />
        <button onClick={async()=>{
          const val = Number(document.getElementById('withdraw_amt').value||0)
          if(!val || val<=0){ setMsg('Enter positive amount'); return }
          setMsg('Processing...')
          const res = await fetch('/api/citizen/withdraw',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:citizen.id, amount: val})}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}))
          if(res.ok){ setMsg('Withdrawn: '+val+' CV'); await load() } else setMsg('Failed: '+(res.error||'unknown'))
        }}>Claim Funds</button>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </div>
  )
}
