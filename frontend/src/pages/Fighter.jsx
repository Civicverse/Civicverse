import React, {useEffect, useRef} from 'react'

export default function Fighter(){
  const ref = useRef()
  useEffect(()=>{
    // simple two-player local fighter using keyboard events
    const el = ref.current
    let p1x=100,p1y=200,p2x=600,p2y=200
    const draw = ()=>{
      if(!el) return
      const ctx = el.getContext('2d')
      ctx.fillStyle='#05050a';ctx.fillRect(0,0,800,360)
      ctx.fillStyle='#ff0055';ctx.fillRect(p1x,p1y,40,60)
      ctx.fillStyle='#00d1ff';ctx.fillRect(p2x,p2y,40,60)
    }
    const onKey = (e)=>{
      if(e.key==='a') p1x-=10
      if(e.key==='d') p1x+=10
      if(e.key==='ArrowLeft') p2x-=10
      if(e.key==='ArrowRight') p2x+=10
      draw()
    }
    window.addEventListener('keydown', onKey)
    draw()
    return ()=> window.removeEventListener('keydown', onKey)
  },[])
  return <div>
    <h3>2-Player Fighter (local)</h3>
    <canvas ref={ref} width={800} height={360} style={{border:'1px solid #222'}}/>
    <p>Controls: Player1 A/D, Player2 ArrowLeft/ArrowRight</p>
  </div>
}
