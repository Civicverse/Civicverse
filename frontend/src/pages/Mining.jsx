import React, {useEffect, useState} from 'react'

export default function Mining(){
  const [status,setStatus] = useState(null)
  const [pool,setPool] = useState(null)
  const [treasury,setTreasury] = useState(null)
  const [cpus,setCpus] = useState(1)
  const [algo,setAlgo] = useState('kaspa')

  async function load(){
    const s = await fetch('/api/miner/status').then(r=>r.json()).catch(()=>null)
    const p = await fetch('/api/miner/pool').then(r=>r.json()).catch(()=>null)
    const t = await fetch('/api/treasury').then(r=>r.json()).catch(()=>null)
    setStatus(s); setPool(p); setTreasury(t)
  }

  useEffect(()=>{ load(); const i=setInterval(load,4000); return ()=>clearInterval(i)},[])

  async function applyCpus(){
    await fetch('/api/miner/set',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cpus})})
    load()
  }

  async function registerDemoMiner(){
    await fetch('/api/miner/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:'peer-'+Math.floor(Math.random()*9999),hashRate: Math.floor(Math.random()*50)+5})})
    load()
  }

  async function creditTax(amount){
    await fetch('/api/treasury/credit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({amount})})
    load()
  }

  return (
    <div>
      <h3>Mining Dashboard (demo)</h3>
      <div style={{display:'flex',gap:12}}>
        <div style={{flex:1}} className="panel">
          <b>Miner Status</b>
          <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(status,null,2)}</pre>
          <div>
            <label>Algorithm: </label>
            <select value={algo} onChange={e=>setAlgo(e.target.value)}>
              <option value="kaspa">Kaspa (speed)</option>
              <option value="monero">Monero (privacy)</option>
            </select>
          </div>
          <div>
            <label>CPUs:</label>
            <input type="number" min={1} value={cpus} onChange={e=>setCpus(Number(e.target.value))} style={{width:80}}/>
            <button onClick={()=>{setCpus(1);applyCpus()}}>Set to 1 (lowest)</button>
            <button onClick={applyCpus}>Apply</button>
          </div>
          <div style={{marginTop:8}}>
            <button onClick={registerDemoMiner}>Register Demo Peer Miner</button>
          </div>
        </div>

        <div style={{flex:1}} className="panel">
          <b>Miner Pool</b>
          <p>Combined Hash:</p>
          <pre>{pool?pool.combinedHash:'—'}</pre>
          <ul>
            {pool && pool.miners.map(m=> <li key={m.id}>{m.id} — {m.hashRate} H/s</li>)}
          </ul>
        </div>

        <div style={{flex:1}} className="panel">
          <b>Treasury</b>
          <p>Multisig: {treasury?treasury.multisig:'—'}</p>
          <p>Balance: {treasury?treasury.balance+' '+treasury.currency:'—'}</p>
          <div>
            <button onClick={()=>creditTax(0.01)}>Credit 0.01 (simulate 1% tax)</button>
          </div>
        </div>
      </div>
      <div style={{marginTop:12}} className="panel">
        <b>Notes</b>
        <ul>
          <li>This demo miner auto-configures to 1 CPU by default. Swap wallet addresses in configs to use real addresses.</li>
          <li>Kaspa/Monero selection is a UI toggle in the demo — real miner integration requires external daemons and wallets.</li>
        </ul>
      </div>
    </div>
  )
}
