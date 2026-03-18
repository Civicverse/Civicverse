import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GamingRigAvatar } from '../components'
import { AnimatedButton } from '../components'

export default function GamingRigPage() {
  const navigate = useNavigate()

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* The gaming rig avatar takes full screen */}
      <GamingRigAvatar className="w-full h-full" />

      {/* Navigation button */}
      <div className="fixed top-8 left-8 z-40">
        <AnimatedButton
          variant="secondary"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          ← Back
        </AnimatedButton>
      </div>

      {/* Title */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan mb-2">
            🖥️ Custom Gaming Rig Avatar
          </h1>
          <p className="text-neon-cyan/80">ARGB • Waifu Theme • Interactive Controls</p>
        </div>
      </div>
    </div>
  )
}
