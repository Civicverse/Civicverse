import React, { Suspense, useState, lazy } from 'react'
const ThreeContainer = lazy(() => import('./components/ThreeContainer'))
const ModuleRouter = lazy(() => import('./components/ModuleRouter'))
import FuturisticHUD from './components/FuturisticHUD'
import './theme/anime-theme.css'
import TopNav from './components/TopNav'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import Hub from './components/Hub'
import FAB from './components/FAB'
import FooterPanel from './components/FooterPanel'
import NotificationCenter, { notify } from './components/NotificationCenter'
import SocialOverlay from './components/SocialOverlay'
import { useEffect } from 'react'

export default function App(){
  const [activeModule, setActiveModule] = useState('dashboard')
  const [kills, setKills] = useState(0)
  const [hp, setHp] = useState(100)

  useEffect(()=>{
    notify(`Module: ${activeModule}`)
  },[activeModule])

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
            <button
              key={m}
              className={`mod-btn ${activeModule===m?'active':''}`}
              onClick={()=>setActiveModule(m)}
            >
              {m.toUpperCase()}
            </button>
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
          <Hub />
          <Suspense fallback={null}>
            <ThreeContainer kills={kills} activeModule={activeModule} />
          </Suspense>
          <FuturisticHUD hp={hp} kills={kills} setActiveModule={setActiveModule} />
          <div style={{display:'none'}}>
            <Suspense fallback={<div/>}>
              <ModuleRouter module={'dashboard'} />
            </Suspense>
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
