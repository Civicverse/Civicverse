import React, { Suspense, lazy } from 'react'

const Canvas = lazy(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })))
const OrbitControls = lazy(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })))
const CityScene = lazy(() => import('./CityScene'))

export default function ThreeContainer({ kills, activeModule, avatarAppearance }){
  return (
    <Suspense fallback={null}>
      <Canvas
        camera={{ position: [0, 3, 12], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10,15,8]} intensity={1.2} />
        <pointLight position={[-5,5,-5]} intensity={0.6} color="#ff006f" />
        <Suspense fallback={null}>
          <CityScene kills={kills} activeModule={activeModule} avatarAppearance={avatarAppearance} />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
      </Canvas>
    </Suspense>
  )
}
