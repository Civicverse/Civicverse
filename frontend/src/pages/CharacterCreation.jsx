import React, {useState} from 'react'

const CLASSES = [
  {id:'ranger',label:'Ranger',desc:'Quick, ranged attacks'},
  {id:'bruiser',label:'Bruiser',desc:'Powerful melee'},
  {id:'tech',label:'Techie',desc:'Hacking & devices'}
]

export default function CharacterCreation({onCreated}){
  const [name,setName] = useState('')
  const [cls,setCls] = useState(CLASSES[0].id)
  const [msg,setMsg] = useState('')

  async function create(){
    setMsg('Creating citizen...')
    const r = await fetch('/api/citizen',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name})}).then(r=>r.json()).catch(e=>({ok:false,error:String(e)}))
    if(r.ok){
      // update citizen with class
      await fetch('/api/citizen/update',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:r.citizen.id, cls})}).catch(()=>{})
      const created = Object.assign({}, r.citizen, {class: cls})
      localStorage.setItem('civicverse_citizen', JSON.stringify(created))
      setMsg('Citizen '+created.id+' created')
      onCreated && onCreated(created)
    } else setMsg('Failed: '+(r.error||''))
  }

  return (
    <div className="panel">
      <h4>Create Character</h4>
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <div style={{display:'flex',gap:8,marginTop:8}}>
        {CLASSES.map(c=> <label key={c.id} style={{display:'block'}}>
          <input type="radio" name="class" value={c.id} checked={cls===c.id} onChange={()=>setCls(c.id)} /> {c.label} <div style={{fontSize:11}}>{c.desc}</div>
        </label>)}
      </div>
      <div style={{marginTop:8}}>
        <button onClick={create}>Create Character</button>
        {msg && <div style={{marginTop:8}}>{msg}</div>}
      </div>
    </div>
  )
}
