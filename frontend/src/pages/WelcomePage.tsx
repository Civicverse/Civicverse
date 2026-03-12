import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'

export default function WelcomePage() {
  const nav = useNavigate()

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center">
      {/* Animated background orbs */}
      <GradientOrb delay={0} size={300} />
      <GradientOrb delay={2} size={250} />
      <GradientOrb delay={4} size={200} />

      {/* Grid background */}
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-2xl py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <NeonText size="5xl" gradient={true} className="block mb-4">
            ∞ CIVICVERSE
          </NeonText>
          <p className="text-l md:text-xl text-neon-cyan tracking-widest mb-2">
            DECENTRALIZED IDENTITY PROTOCOL
          </p>
          <p className="text-sm text-gray-400">
            Non-Custodial • Offline-First • Sovereign
          </p>
        </div>

        {/* Main content */}
        <AnimatedCard delay={100} className="mb-8">
          <h2 className="text-2xl font-bold mb-4 gradient-text">
            Welcome to the Future of Identity
          </h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Civicverse is a decentralized identity and wallet system that runs entirely on your device.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            CivicVerse provides <span className="text-neon-cyan font-bold">sovereign control</span> with optional recovery paths governed by the community.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-neon-cyan/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-neon-cyan mb-1">🔐</p>
              <p className="text-sm text-gray-400">AES-256 Encrypted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neon-pink mb-1">🌐</p>
              <p className="text-sm text-gray-400">Offline First</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neon-purple mb-1">⚡</p>
              <p className="text-sm text-gray-400">Local Only</p>
            </div>
          </div>
        </AnimatedCard>

        {/* Choice buttons */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <AnimatedButton
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => nav('/signup')}
          >
            <span className="text-xl">✨</span> Create New Identity
          </AnimatedButton>
          <AnimatedButton
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => nav('/signin')}
          >
            <span className="text-xl">🔑</span> Unlock Existing Wallet
          </AnimatedButton>
        </div>

        {/* Footer info */}
        <div className="mt-10 text-center text-xs text-gray-500 space-y-2">
          <p>Your password is your only key. Your Memetic Wallet Password is your recovery.</p>
          <p>Lose both? Your identity is gone forever. Choose wisely.</p>
        </div>
      </div>
    </div>
  )
}
