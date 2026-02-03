import React, {useEffect, useState} from 'react'

export default function UBI(){
  const [ubi,setUbi] = useState(null)
  const [msg,setMsg] = useState('')

  async function load(){
    const r = await fetch('/api/ubi').then(r=>r.json()).catch(()=>null)
    setUbi(r)
  }
  useEffect(()=>{ load(); const i=setInterval(load,4000); return ()=>clearInterval(i) },[])

  async function distribute(){
    setMsg('Distributing...')
    const r = await fetch('/api/ubi/distribute',{method:'POST'}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}))
    if(r.ok){ setMsg('Distributed'); setUbi(r.ubi) } else setMsg('Failed: '+(r.error||''))
  }

  return (
    <div>
      <h3>UBI Dashboard</h3>
      <div className="panel">
        <p>Pool: {ubi?ubi.pool+' '+ubi.currency:'—'}</p>
        <p>Last distribution: {ubi && ubi.lastDistributed ? new Date(ubi.lastDistributed.time).toLocaleString() : '—'}</p>
        <button onClick={distribute}>Distribute UBI Equally to All Citizens</button>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </div>
  )
}
