import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'
import { CharacterViewer } from '../components/3d/CharacterViewer'

export default function CivicVaultPage() {
  const nav = useNavigate()
  const { user, wallet, logout, tempMnemonic } = useGameStore()
  const [showSeed, setShowSeed] = useState(false)

  if (!user || !wallet) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = [
    { label: 'Sovereign Balance', value: `${wallet.balance.toFixed(2)} XMR`, color: 'text-neon-pink' },
    { label: 'Civic Reputation', value: `${user.trustScore}/100`, color: 'text-neon-cyan' },
    { label: 'Citizen Level', value: `LVL ${user.level}`, color: 'text-neon-purple' },
    { label: 'Badges Earned', value: '0', color: 'text-neon-green' },
  ]

  const portals = [
    { title: 'Gathering Grounds', desc: 'Main Community Hub', icon: '🌐', path: '/foyer', color: 'border-neon-cyan' },
    { title: 'CivicWatch', desc: 'Missions & Jobs', icon: '📋', path: '/civicwatch', color: 'border-neon-pink' },
    { title: 'Governance', desc: 'Quadratic Voting', icon: '🏛️', path: '/governance', color: 'border-neon-purple' },
    { title: 'Mining Pool', desc: 'Community Rewards', icon: '⛏️', path: '/mining-pool', color: 'border-neon-orange' },
  ]

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Live GIF Background Restored */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-30 mix-blend-screen scale-110 blur-[1px]"
        style={{
          backgroundImage: 'url(/images/wallet-bg.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'hue-rotate(0deg) brightness(1.2) contrast(1.1)',
        }}
      />
      
      {/* Dark Overlay for readability */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-black via-transparent to-black opacity-80" />

      <div className="relative z-10 container mx-auto max-w-5xl pt-4 pb-20 px-4">
        
        {/* Floating Avatar Section (Center Top) */}
        <div className="flex flex-col items-center justify-center mb-8 animate-slide-up">
          <div className="w-80 h-96 relative cursor-pointer group">
            {/* NO BOX: Character floats in space */}
            <CharacterViewer config={user.character} animate={true} scale={1.4} />
            
            {/* Subtle glow effect beneath feet area */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-8 bg-neon-cyan/20 blur-2xl rounded-full" />
            
            {/* Status floating tag */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 border border-neon-cyan/50 backdrop-blur-md p-2 rounded-xl shadow-xl whitespace-nowrap">
               <div className="text-[10px] uppercase tracking-widest text-neon-cyan font-bold">
                 CITIZEN_LVL_{user.level}
               </div>
            </div>
          </div>

          <div className="text-center -mt-6">
            <span className="text-[10px] uppercase tracking-[0.4em] text-neon-cyan font-bold mb-1 block opacity-80">Sovereign CivicID</span>
            <NeonText size="6xl" gradient={true} className="block tracking-tighter uppercase font-black mb-2">
              {user.username}
            </NeonText>
            <div className="flex items-center justify-center gap-3">
              <code className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-400 font-mono">
                {user.civicId}
              </code>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-slide-up" style={{ animationDelay: '150ms' }}>
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm p-4 rounded-2xl text-center hover:bg-white/10 transition-all">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">{stat.label}</p>
              <p className={`text-xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Portals / Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 animate-slide-up" style={{ animationDelay: '250ms' }}>
          {portals.map((portal, i) => (
            <button 
              key={i} 
              onClick={() => nav(portal.path)}
              className={`group relative text-left p-6 bg-white/5 border ${portal.color}/20 rounded-2xl hover:bg-white/10 hover:${portal.color}/50 backdrop-blur-md transition-all duration-300 overflow-hidden`}
            >
              <div className="relative z-10">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{portal.icon}</div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-1 group-hover:text-white transition-colors">{portal.title}</h3>
                <p className="text-xs text-gray-500 font-medium">{portal.desc}</p>
              </div>
              <div className={`absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <span className="text-neon-cyan">→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Management Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
           <AnimatedCard className="lg:col-span-2 border-l-4 border-neon-cyan backdrop-blur-lg bg-black/40">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neon-cyan">Vault Security</h3>
                <div className="flex gap-2">
                   <AnimatedButton variant="secondary" size="sm" onClick={() => alert('Exporting encrypted JSON...')}>
                      Export
                   </AnimatedButton>
                   <AnimatedButton variant="secondary" size="sm" onClick={() => setShowSeed(!showSeed)}>
                      {showSeed ? 'Hide Seed' : 'Seed Phrase'}
                   </AnimatedButton>
                </div>
              </div>

              {showSeed ? (
                <div className="bg-black/60 rounded-xl p-6 border border-neon-pink/30 animate-fade-in">
                   <p className="text-neon-pink text-[10px] font-bold uppercase tracking-widest mb-4">Master Recovery Phrase</p>
                   <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {(tempMnemonic || 'SECRET_PHRASE_HIDDEN').split(' ').map((w, i) => (
                        <div key={i} className="flex gap-2 text-[10px] font-mono p-2 bg-black/40 rounded border border-white/5">
                           <span className="opacity-30">{i+1}</span>
                           <span className="text-neon-cyan">{w}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="h-8 w-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green border border-neon-green/20">✓</div>
                         <p className="text-[10px] uppercase tracking-widest text-gray-300">End-to-End Encrypted</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="h-8 w-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green border border-neon-green/20">✓</div>
                         <p className="text-[10px] uppercase tracking-widest text-gray-300">Local Identity Vault</p>
                      </div>
                   </div>
                   <div className="bg-white/5 rounded-xl p-4 flex flex-col justify-center border border-white/5">
                      <p className="text-[9px] text-gray-500 uppercase font-bold mb-2">Vault Integrity</p>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                         <div className="h-full bg-neon-cyan w-[94%]" />
                      </div>
                      <p className="text-[10px] font-bold text-neon-cyan mt-2 uppercase">SECURE_ACTIVE</p>
                   </div>
                </div>
              )}
           </AnimatedCard>

           <div className="space-y-4">
              <AnimatedButton
                variant="secondary"
                size="lg"
                className="w-full flex items-center justify-between px-6 py-5 bg-white/5 backdrop-blur-md"
                onClick={() => nav('/wardrobe')}
              >
                <span className="font-bold uppercase text-xs tracking-widest">👕 Customize Avatar</span>
                <span>→</span>
              </AnimatedButton>
              
              <AnimatedButton
                variant="danger"
                size="lg"
                className="w-full flex items-center justify-between px-6 py-5 opacity-80 hover:opacity-100"
                onClick={() => { logout(); nav('/welcome'); }}
              >
                <span className="font-bold uppercase text-xs tracking-widest">🔒 Lock Vault</span>
                <span>✕</span>
              </AnimatedButton>
           </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8'
  return (
    <div className={`${s} border-2 border-neon-cyan border-t-transparent rounded-full animate-spin`} />
  )
}
