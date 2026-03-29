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
          <p className="text-l md:text-xl text-neon-cyan tracking-widest mb-2 uppercase">
            Sovereign Identity Protocol
          </p>
          <p className="text-sm text-gray-400">
            Non-Custodial • Human-First • Decentralized
          </p>
        </div>

        {/* Main content */}
        <AnimatedCard delay={100} className="mb-8">
          <h2 className="text-2xl font-bold mb-4 gradient-text text-center">
            Your Gateway to Digital Sovereignty
          </h2>
          <p className="text-gray-300 mb-4 leading-relaxed text-center">
            In the Civicverse, your identity is yours alone. No central authority, no data harvesting, no permission required.
          </p>
          
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-neon-cyan/20">
            <div className="text-center">
              <div className="text-2xl mb-1">🛡️</div>
              <p className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Encrypted</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🧬</div>
              <p className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Portable</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-[10px] uppercase tracking-tighter text-gray-400 font-bold">Sovereign</p>
            </div>
          </div>
        </AnimatedCard>

        {/* Choice buttons */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <AnimatedButton
            variant="primary"
            size="lg"
            className="w-full py-6 flex flex-col items-center justify-center gap-1 group"
            onClick={() => nav('/signup')}
          >
            <div className="flex items-center gap-2">
               <span className="text-2xl group-hover:scale-110 transition-transform">✨</span> 
               <span className="text-xl font-bold uppercase tracking-wider">Create New CivicID</span>
            </div>
            <span className="text-[10px] text-white/60 font-mono tracking-widest">GENERATE_LOCAL_VAULT</span>
          </AnimatedButton>
          
          <div className="grid grid-cols-2 gap-3">
             <AnimatedButton
                variant="secondary"
                size="md"
                className="w-full flex items-center justify-center gap-2 py-4"
                onClick={() => nav('/signup', { state: { mode: 'restore' } })}
              >
                <span className="text-lg">🔑</span> 
                <span className="text-sm font-bold uppercase">Restore</span>
              </AnimatedButton>

              <AnimatedButton
                variant="secondary"
                size="md"
                className="w-full flex items-center justify-center gap-2 py-4"
                onClick={() => nav('/signin')}
              >
                <span className="text-lg">🔓</span> 
                <span className="text-sm font-bold uppercase">Unlock</span>
              </AnimatedButton>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-[10px] text-gray-500 space-y-2 uppercase tracking-[0.2em] opacity-60">
          <p>Local-Only Storage • BIP-39 Standard • Ed25519</p>
          <p>© 2026 Civicverse Protocol Foundation</p>
        </div>
      </div>
    </div>
  )
}
