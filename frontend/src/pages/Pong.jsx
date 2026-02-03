import React, {useEffect, useRef} from 'react'

export default function Pong(){
  const ref = useRef()
  useEffect(()=>{
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let px=20,py=150,ox=760,oy=150,ballx=400,bally=180,bdx=3,bdy=2
    function loop(){
      ctx.fillStyle='#04040a';ctx.fillRect(0,0,800,360)
      ctx.fillStyle='#fff';ctx.fillRect(px,py,10,80);ctx.fillRect(ox,oy,10,80)
      ctx.fillRect(ballx,bally,10,10)
      // move ball
      ballx += bdx; bally += bdy
      if(bally<=0||bally>=350) bdy*=-1
      if(ballx<0||ballx>800){ballx=400;bally=180}
      requestAnimationFrame(loop)
    }
    loop()
    const onKey=(e)=>{
      if(e.key==='w') py-=20
      if(e.key==='s') py+=20
      if(e.key==='ArrowUp') oy-=20
      if(e.key==='ArrowDown') oy+=20
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[])
  return <div>
    <h3>Pong</h3>
    <canvas ref={ref} width={800} height={360} style={{border:'1px solid #222'}}/>
    <p>Controls: Left W/S, Right ArrowUp/Down</p>
  </div>
}
