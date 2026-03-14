import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'
import { CharacterViewer } from '../components/3d/CharacterViewer'

export default function WalletPage() {
  const nav = useNavigate()
  const { user, wallet, logout } = useGameStore()

  if (!user || !wallet) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center">
        <GradientOrb delay={0} size={300} />
        <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />
        <div className="relative z-10 text-center">
          <NeonText size="3xl" gradient={true} className="block mb-4">
            Error
          </NeonText>
          <p className="text-gray-400">Loading wallet data...</p>
        </div>
      </div>
    )
  }

  const civicId = user.civicId
  const avatar = user.avatar
  const balance = wallet.balance.toFixed(2) + ' ' + wallet.currency

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-black">
      {/* Live GIF Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen scale-110 blur-[1px]"
        style={{
          backgroundImage: 'url(/images/wallet-bg.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'hue-rotate(0deg) brightness(1.2) contrast(1.1)',
        }}
      />
      
      {/* Dark Overlay for readability */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-dark-900/40 via-transparent to-dark-900/60" />

      <div className="relative z-10 container mx-auto max-w-4xl py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-8 mb-12 animate-slide-up">
          <div className="flex-1">
            <NeonText size="5xl" gradient={true} className="block mb-2">
              💎 Wallet Dashboard
            </NeonText>
            <p className="text-neon-cyan text-lg">Non-Custodial • Offline-First • Encrypted</p>
          </div>
          
          <div className="w-48 h-64 md:w-64 md:h-80 rounded-2xl border-4 border-neon-purple/60 shadow-lg hover:shadow-2xl transition-all hover:border-neon-purple overflow-hidden bg-black relative group">
            {/* Character Backdrop Image */}
            <div 
              className="absolute inset-0 z-0 opacity-60 group-hover:opacity-80 transition-opacity"
              style={{
                backgroundImage: 'url(/images/avatar-bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            
            {/* The 3D Character (Larger Scale) */}
            <div className="relative z-10 w-full h-full">
              {user.character ? (
                <CharacterViewer 
                  config={user.character} 
                  className="w-full h-full" 
                  animate={true} 
                  scale={0.9} 
                />
              ) : (
                <img
                  src={avatar}
                  alt="civic identity"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <AnimatedCard delay={100}>
            <p className="text-gray-400 text-sm mb-2">Your Civic ID</p>
            <p className="font-mono text-neon-cyan text-xs break-all mb-3 bg-dark-900/40 p-3 rounded border border-neon-cyan/20">
              {civicId}
            </p>
            <p className="text-gray-500 text-xs">Non-recoverable decentralized identity</p>
          </AnimatedCard>

          <AnimatedCard delay={150}>
            <p className="text-gray-400 text-sm mb-2">Wallet Status</p>
            <div className="text-4xl font-bold text-neon-pink mb-3">
              {balance}
            </div>
            <p className="text-gray-500 text-xs">Secured & Encrypted Locally</p>
          </AnimatedCard>

          <AnimatedCard delay={200}>
            <p className="text-gray-400 text-sm mb-2">Display Name</p>
            <p className="text-lg font-bold text-neon-purple mb-3">{user.username}</p>
            <p className="text-gray-500 text-xs">Your public avatar identity</p>
          </AnimatedCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <AnimatedCard delay={250}>
            <h3 className="text-neon-cyan font-bold mb-4 text-lg">🔐 Wallet Address</h3>
            <div className="bg-dark-900/60 border border-neon-cyan/20 rounded-lg p-4 font-mono text-xs text-neon-cyan break-all mb-4 hover:bg-dark-900/80 transition-colors">
              {wallet.address}
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Your unique wallet address. Keep private to avoid tracking and doxing.
            </p>
          </AnimatedCard>

          <AnimatedCard delay={300}>
            <h3 className="text-neon-purple font-bold mb-4 text-lg">✨ Avatar</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs mb-1">Display Name</p>
                <p className="text-neon-purple font-semibold">{user.username}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-2">Trust Score</p>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-2 bg-dark-900 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-purple" style={{ width: `${user.trustScore}%` }} />
                  </div>
                  <span className="text-neon-purple font-bold">{user.trustScore}</span>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>

        <AnimatedCard delay={350} className="border-l-4 border-neon-green mb-8">
          <h3 className="text-neon-green font-bold mb-3 text-lg">🛡️ Security Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-neon-green font-bold">✓</p>
              <p className="text-gray-400 text-xs">Encrypted Locally</p>
            </div>
            <div>
              <p className="text-neon-green font-bold">✓</p>
              <p className="text-gray-400 text-xs">No Cloud Sync</p>
            </div>
            <div>
              <p className="text-neon-green font-bold">✓</p>
              <p className="text-gray-400 text-xs">Offline First</p>
            </div>
            <div>
              <p className="text-neon-green font-bold">✓</p>
              <p className="text-gray-400 text-xs">Non-Custodial</p>
            </div>
          </div>
        </AnimatedCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <AnimatedButton
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => nav('/wardrobe')}
          >
            <span>👕</span> Open Wardrobe
          </AnimatedButton>
          <AnimatedButton
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => nav('/foyer')}
          >
            <span>🌐</span> Enter Civicverse Hub
          </AnimatedButton>
          <AnimatedButton
            variant="danger"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              logout()
              nav('/welcome')
            }}
          >
            🔒 Lock & Logout
          </AnimatedButton>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-xs">
            All data encrypted and stored locally on your device. Never transmitted to servers.
          </p>
        </div>
      </div>
    </div>
  )
}
