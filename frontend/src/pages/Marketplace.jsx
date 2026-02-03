import React, {useState, useEffect} from 'react'

export default function Marketplace(){
  const [items,setItems] = useState([])
  const [msg,setMsg] = useState('')
  const [title,setTitle] = useState('')
  const [price,setPrice] = useState(1)
  useEffect(()=>{
    // fetch from backend mock
    fetch('/api/market').then(r=>r.json()).then(setItems).catch(()=>{
      setItems([{id:1,title:'Neon Jacket',price:3.5},{id:2,title:'Pixel Car',price:12}])
    })
  },[])
  return (
    <div>
      <h3>Marketplace</h3>
      <p>Create listings, browse, buy (demo uses mock payments).</p>
      <div className="panel">
        <h4>Create Listing</h4>
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} />
        <button onClick={async()=>{
          setMsg('creating...')
          const r = await fetch('/api/market/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title,price, sellerId: (JSON.parse(localStorage.getItem('civicverse_citizen')||'null')||{}).id})}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}))
          if(r.ok){ setMsg('Created listing'); setItems(prev=>[...prev,r.item]) } else setMsg('Failed: '+(r.error||''))
        }}>Create</button>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
      <ul>
        {items.map(it=> <li key={it.id}>{it.title} — {it.price} CV$ <button onClick={async()=>{
          setMsg('processing...')
          const r = await fetch('/api/purchase',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({itemId:it.id})}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}))
          if(r.ok){ setMsg('Purchase complete — tax credited to treasury');
            // play purchase SFX if available
            try{ window.playSfx && window.playSfx() }catch(e){}
          } else setMsg('Purchase failed: '+(r.error||'unknown'))
        }}>Buy</button></li>)}
      </ul>
      {msg && <div style={{marginTop:8, padding:8, background:'#071016', borderRadius:6}}>{msg}</div>}
    </div>
  )
}
