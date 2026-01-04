import React, { Suspense, useState, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
const CityScene = lazy(() => import('./components/CityScene'))
const ModuleRouter = lazy(() => import('./components/ModuleRouter'))
import HUD from './components/HUD'
import './theme/anime-theme.css'
import TopNav from './components/TopNav'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import Hub from './components/Hub'
import FAB from './components/FAB'
import FooterPanel from './components/FooterPanel'

export default function App(){
  const [activeModule, setActiveModule] = useState('dashboard')
  const [kills, setKills] = useState(0)
  const [hp, setHp] = useState(100)

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
          <Canvas 
            camera={{ position: [0, 3, 12], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10,15,8]} intensity={1.2} />
            <pointLight position={[-5,5,-5]} intensity={0.6} color="#ff006f" />
            <Suspense fallback={null}>
              <CityScene kills={kills} />
            </Suspense>
            <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
          </Canvas>
          <HUD hp={hp} kills={kills} setActiveModule={setActiveModule} />
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
    </div>
  )
}
