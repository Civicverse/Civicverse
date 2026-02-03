import React, {useState, useRef} from 'react'
import GameCanvas from './game/GameCanvas'
import Marketplace from './pages/Marketplace'
import NewsFeed from './pages/NewsFeed'
import School from './pages/School'
import Fighter from './pages/Fighter'
import Pong from './pages/Pong'
import CitizenCreate from './pages/CitizenCreate'
import CitizenStatus from './pages/CitizenStatus'
import CharacterCreation from './pages/CharacterCreation'
import Quests from './pages/Quests'
import UBI from './pages/UBI'

export default function App(){
  const [route,setRoute] = useState('home')
  const musicRef = useRef(null)
  const sfxRef = useRef(null)
  const [musicPlaying,setMusicPlaying] = useState(false)

  function toggleMusic(){
    if(!musicRef.current) return
    if(musicPlaying){ musicRef.current.pause(); setMusicPlaying(false) }
    else { musicRef.current.play().catch(()=>{}); setMusicPlaying(true) }
  }
  function playSfx(){ if(sfxRef.current){ sfxRef.current.currentTime = 0; sfxRef.current.play().catch(()=>{}) } }
  return (
    <div className="app-shell">
      <nav className="left-nav">
        <h2>Civicverse Demo</h2>
        <div style={{marginTop:12}}>
          <button onClick={()=>setRoute('home')}>Home</button>
          <button onClick={()=>setRoute('market')}>Market</button>
          <button onClick={()=>setRoute('news')}>News</button>
          <button onClick={()=>setRoute('quests')}>Quests</button>
          <button onClick={()=>setRoute('ubi')}>UBI</button>
          <button onClick={()=>setRoute('mining')}>Mining</button>
          <button onClick={()=>setRoute('school')}>School</button>
          <button onClick={()=>setRoute('fighter')}>2P Fighter</button>
          <button onClick={()=>setRoute('pong')}>Pong</button>
        </div>
      </nav>
      <main className="content">
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button onClick={toggleMusic}>{musicPlaying? 'Pause Music' : 'Play Music'}</button>
          <label style={{alignSelf:'center',fontSize:12}}>Synthwave</label>
        </div>
        <audio ref={musicRef} src="/assets/synthwave.mp3" loop preload="auto" />
        <audio ref={sfxRef} src="/assets/sfx_purchase.wav" preload="auto" />
        {route==='home' && <div>
          <div className="panel"><h3>Mode7 16-bit City</h3><GameCanvas/></div>
          <div className="panel"><h4>Onboarding</h4><p>Quick start: connect wallet (demo), create citizen, start quests.</p>
            <CharacterCreation onCreated={()=>{}}/>
            <CitizenCreate/>
            <CitizenStatus/>
          </div>
        </div>}
        {route==='market' && <Marketplace/>}
        {route==='news' && <NewsFeed/>}
        {route==='mining' && <React.Suspense fallback={<div>Loading...</div>}><Mining/></React.Suspense>}
        {route==='quests' && <Quests/>}
        {route==='ubi' && <UBI/>}
        {route==='school' && <School/>}
        {route==='fighter' && <Fighter/>}
        {route==='pong' && <Pong/>}
      </main>
    </div>
  )
}

// lazy load Mining to avoid adding it to initial bundle
const Mining = React.lazy(()=>import('./pages/Mining'))
