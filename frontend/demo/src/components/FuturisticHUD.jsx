import React, { useState, useEffect } from 'react'
import MiniMap from './MiniMap'

export default function FuturisticHUD({ hp=100, kills=0, avatarAppearance={}, setAvatarAppearance=()=>{} }){
  const outfits = ['Cyborg','Samurai','Rover']
  const hairs = ['Short','Long','Ponytail']
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [volume, setVolume] = useState(0.25)
  const [breathing, setBreathing] = useState(true)
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem('civic_user') || 'Guest' } catch (e) { return 'Guest' }
  })

  const changeOutfit = (idx) => {
    setAvatarAppearance(prev => ({ ...prev, outfit: idx }))
  }
  const changeHair = (idx) => {
    setAvatarAppearance(prev => ({ ...prev, hair: idx }))
  }

  useEffect(() => {
    const el = document.getElementById('synth-audio')
    let ctx, oscA, oscB, gain, lpf
    const startWebAudio = () => {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        gain = ctx.createGain(); gain.gain.value = volume * 0.12
        lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 1200
        oscA = ctx.createOscillator(); oscA.type = 'sine'; oscA.frequency.value = 220
        oscB = ctx.createOscillator(); oscB.type = 'sine'; oscB.frequency.value = 277
        oscA.connect(lpf); oscB.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination)
        oscA.start(); oscB.start();
      } catch (e) {
        console.warn('WebAudio start failed', e)
      }
    }

    const stopWebAudio = async () => {
      try {
        if (oscA) oscA.stop(); if (oscB) oscB.stop();
        if (ctx && ctx.close) await ctx.close()
      } catch (e) {}
      oscA = oscB = gain = lpf = ctx = null
    }

    if (el) {
      try { el.volume = volume } catch(e){}
      try { el.muted = !audioEnabled } catch(e){}
      if (audioEnabled) {
        // ensure unmuted and play
        try { el.muted = false; el.play().catch(() => startWebAudio()) } catch(e){ startWebAudio() }
      } else {
        try { el.pause(); el.currentTime = 0; el.muted = true } catch(e){}
        stopWebAudio()
      }
    } else {
      // no audio element — use WebAudio
      if (audioEnabled) startWebAudio(); else stopWebAudio()
    }

    // cleanup
    return () => { stopWebAudio() }
  }, [audioEnabled, volume])

  // small avatar micro-animations: breathing + occasional blink
  useEffect(() => {
    let blinkTimer
    function scheduleBlink(){
      blinkTimer = setTimeout(()=>{
        const el = document.querySelector('.avatar-preview')
        if (el){
          el.classList.add('blink')
          setTimeout(()=> el && el.classList.remove('blink'), 220)
        }
        scheduleBlink()
      }, 3000 + Math.random()*5000)
    }
    scheduleBlink()
    return ()=> clearTimeout(blinkTimer)
  }, [])

  return (
    <div className="fhud-root">
      <div className="fhud-left">
        <div className="fhud-player-card floating-panel">
          <div className="pc-avatar">
            <div style={{fontSize:12, color:'#001', fontWeight:900}}>{username}</div>
            <div className={`avatar-preview ${breathing? 'breath' : ''}`} style={{backgroundImage:`url(/assets/ui/avatar-placeholder.svg)`}} />
          </div>
          <div className="pc-stats">
            <div className="pc-row"><span className="pc-label">HP</span><span className="pc-val">{hp}</span></div>
            <div className="pc-row"><span className="pc-label">KILLS</span><span className="pc-val">{kills}</span></div>
          </div>
        </div>
        <MiniMap />
      </div>

      <div className="fhud-center">
        <div className="action-bar">
          <button className="action">Interact</button>
          <button className="action">Quest</button>
          <button className="action">Vote</button>
          <button className="action">Trade</button>
        </div>
        <div className="floating-panel audio-control">
          <button className={`action ${audioEnabled? 'active' : ''}`} onClick={()=>setAudioEnabled(s=>!s)}>{audioEnabled ? '🔊' : '🔈'}</button>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e=>setVolume(parseFloat(e.target.value))} />
        </div>
      </div>

      <div className="fhud-right">
        <div className="fhud-quick floating-panel">WASD • SPACE</div>
        <div className="appearance-controls floating-panel">
          <label>Outfit</label>
          <select className="select-field" value={avatarAppearance.outfit || 0} onChange={e=>changeOutfit(Number(e.target.value))}>
            {outfits.map((o,i)=> <option value={i} key={i}>{o}</option>)}
          </select>
          <label>Hair</label>
          <select className="select-field" value={avatarAppearance.hair || 0} onChange={e=>changeHair(Number(e.target.value))}>
            {hairs.map((h,i)=> <option value={i} key={i}>{h}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
