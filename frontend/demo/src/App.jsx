import React, { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import CityScene from './components/CityScene'
import HUD from './components/HUD'
import ModuleRouter from './components/ModuleRouter'

export default function App(){
  const [activeModule, setActiveModule] = useState('dashboard')
  const [kills, setKills] = useState(0)
  const [hp, setHp] = useState(100)

  return (
    <div className="app-root">
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
          <ModuleRouter module={activeModule} />
        </div>
      </div>

      <div className="main-view">
        <div className="canvas-container">
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
        </div>
      </div>
    </div>
  )
}
