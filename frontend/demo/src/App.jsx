import React, { Suspense, useState, lazy, useEffect } from 'react'
const PhaserGame = lazy(() => import('./components/PhaserGame'))
const ModuleRouter = lazy(() => import('./components/ModuleRouter'))
import FuturisticHUD from './components/FuturisticHUD'
import OverlayPortal from './components/OverlayPortal'
import './theme/anime-theme.css'
import TopNav from './components/TopNav'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import Hub from './components/Hub'
import FAB from './components/FAB'
import FooterPanel from './components/FooterPanel'
import NotificationCenter, { notify } from './components/NotificationCenter'
import SocialOverlay from './components/SocialOverlay'

export default function App(){
  const [activeModule, setActiveModule] = useState('dashboard')
  const [inWorld, setInWorld] = useState(false)
  const [kills, setKills] = useState(0)
  const [hp, setHp] = useState(100)
  const [avatarAppearance, setAvatarAppearance] = useState(() => {
    try { return JSON.parse(localStorage.getItem('avatarAppearance')) || { outfit: 0, hair: 0, colors: {} } } catch (e) { return { outfit: 0, hair: 0, colors: {} } }
  })

  // persist appearance
  useEffect(() => {
    try { localStorage.setItem('avatarAppearance', JSON.stringify(avatarAppearance)) } catch (e) {}
  }, [avatarAppearance])

  // Keep overlay-visible class until user enters
  useEffect(() => {
    try {
      if (inWorld) document.body.classList.remove('overlay-visible')
      else document.body.classList.add('overlay-visible')
    } catch (e) {}
  }, [inWorld])

  useEffect(()=>{ notify(`Module: ${activeModule}`) },[activeModule])

  const enterWorld = () => {
    try{ localStorage.setItem('civic_user', 'Demo') }catch(e){}
    try{ window.__civic_unlock && window.__civic_unlock() }catch(e){}
    setInWorld(true)
  }

  return (
    <div className="app-root">
      <TopNav />
      <div className="left-sidebar">
        <h1>CIVICVERSE</h1>
        <div className="controls-info">
          <div className="control-label">WASD / Arrows</div>
          <div className="control-hint">Move around city</div>
        </div>
        <div className="module-menu">
          {['dashboard','voting','dex','marketplace','social','onboarding','zk','character','wallet','miner','governance','ubi','news','education','royal'].map(m=>(
            <button key={m} className={`mod-btn ${activeModule===m?'active':''}`} onClick={()=>setActiveModule(m)}>{m.toUpperCase()}</button>
          ))}
        </div>
        <div className="sidebar-content">
          <Suspense fallback={<div className="panel">Loading…</div>}>
            <ModuleRouter module={activeModule} />
          </Suspense>
        </div>
      </div>

      <div className="main-view">
        <div className="canvas-container">
          <div className="animated-city" style={{backgroundImage:"url('/assets/bg/animated-city.gif')"}} />
          <Hub />
          <Suspense fallback={null}>{inWorld ? <PhaserGame avatarAppearance={avatarAppearance} /> : null}</Suspense>
          <FuturisticHUD hp={hp} kills={kills} setActiveModule={setActiveModule} avatarAppearance={avatarAppearance} setAvatarAppearance={setAvatarAppearance} />

          {!inWorld && (
            <OverlayPortal>
              <div className="enter-overlay">
                <div className="enter-card">
                  <h2>Welcome to Civicverse</h2>
                  <p>Press Enter World to join the demo. Your HUD and social feed remain visible.</p>
                  <div className="enter-actions">
                    <button className="enter-btn" onClick={enterWorld}>Enter World</button>
                    <button className="enter-continue" onClick={() => { setActiveModule('onboarding'); enterWorld() }}>Quick Start</button>
                  </div>
                </div>
              </div>
            </OverlayPortal>
          )}

          <div style={{display:'none'}}>
            <Suspense fallback={<div/>}><ModuleRouter module={'dashboard'} /></Suspense>
          </div>
          <FAB />
          <RightPanel />
        </div>
      </div>
      <FooterPanel />
      <NotificationCenter />
      <SocialOverlay />
    </div>
  )
}
