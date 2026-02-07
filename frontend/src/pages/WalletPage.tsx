import React from 'react'
import { useNavigate } from 'react-router-dom'
import { vault } from '../lib/vault'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'

export default function WalletPage() {
  const nav = useNavigate()
  const [vaultData, setVaultData] = React.useState(vault.getData())

  React.useEffect(() => {
    if (!vault.isUnlocked()) {
      nav('/welcome')
    } else {
      setVaultData(vault.getData())
    }
  }, [])

  if (!vaultData) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center">
        <GradientOrb delay={0} size={300} />
        <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />
        <div className="relative z-10 text-center">
          <NeonText size="3xl" gradient={true} className="block mb-4">
            Error
          </NeonText>
          <p className="text-gray-400">Vault not unlocked. Returning...</p>
        </div>
      </div>
    )
  }

  const civicId = vaultData.civicId
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(civicId)}`
  const balance = '∞' // Infinity of possibility

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden">
      {/* Animated background orbs */}
      <GradientOrb delay={0} size={350} />
      <GradientOrb delay={2} size={250} />
      <GradientOrb delay={4} size={300} />

      {/* Grid background */}
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-4xl py-8 px-4">
        {/* Header with Avatar */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-8 mb-12 animate-slide-up">
          <div className="flex-1">
            <NeonText size="5xl" gradient={true} className="block mb-2">
              💎 Wallet Dashboard
            </NeonText>
            <p className="text-neon-cyan text-lg">Non-Custodial • Offline-First • Encrypted</p>
          </div>
          <img
            src={avatar}
            alt="civic identity"
            className="w-32 h-32 rounded-2xl border-4 border-neon-purple/60 shadow-lg hover:shadow-2xl transition-all hover:border-neon-purple animate-float"
          />
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Civic ID Card */}
          <AnimatedCard delay={100}>
            <p className="text-gray-400 text-sm mb-2">Your Civic ID</p>
            <p className="font-mono text-neon-cyan text-xs break-all mb-3 bg-dark-900/40 p-3 rounded border border-neon-cyan/20">
              {civicId}
            </p>
            <p className="text-gray-500 text-xs">Non-recoverable decentralized identity</p>
          </AnimatedCard>

          {/* Balance Card */}
          <AnimatedCard delay={150}>
            <p className="text-gray-400 text-sm mb-2">Wallet Status</p>
            <div className="text-4xl font-bold text-neon-pink mb-3">
              {balance}
            </div>
            <p className="text-gray-500 text-xs">Secured & Encrypted Locally</p>
          </AnimatedCard>

          {/* Username Card */}
          <AnimatedCard delay={200}>
            <p className="text-gray-400 text-sm mb-2">Display Name</p>
            <p className="text-lg font-bold text-neon-purple mb-3">{vaultData.avatar.name}</p>
            <p className="text-gray-500 text-xs">Your public avatar identity</p>
          </AnimatedCard>
        </div>

        {/* Detailed Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Wallet Address */}
          <AnimatedCard delay={250}>
            <h3 className="text-neon-cyan font-bold mb-4 text-lg">🔐 Wallet Address</h3>
            <div className="bg-dark-900/60 border border-neon-cyan/20 rounded-lg p-4 font-mono text-xs text-neon-cyan break-all mb-4 hover:bg-dark-900/80 transition-colors">
              {vaultData.walletAddress}
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Your unique wallet address. Keep private to avoid tracking and doxing.
            </p>
          </AnimatedCard>

          {/* Avatar Details */}
          <AnimatedCard delay={300}>
            <h3 className="text-neon-purple font-bold mb-4 text-lg">✨ Avatar</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs mb-1">Display Name</p>
                <p className="text-neon-purple font-semibold">{vaultData.avatar.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-2">Color Theme</p>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-neon-cyan/40 shadow-lg"
                    style={{ background: vaultData.avatar.color }}
                  />
                  <div className="flex-1">
                    <p className="font-mono text-xs text-gray-400">{vaultData.avatar.color}</p>
                    <p className="text-xs text-gray-500 mt-1">Your identity color</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Security Info */}
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

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <AnimatedButton
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => nav('/foyer')}
          >
            <span>🌐</span> Enter Civicverse Hub
          </AnimatedButton>
          <AnimatedButton
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
            disabled={true}
          >
            <span>🏪</span> Marketplace (Coming Soon)
          </AnimatedButton>
        </div>

        {/* Lock Button */}
        <div className="text-center">
          <AnimatedButton
            variant="danger"
            className="px-8"
            onClick={() => {
              vault.lock()
              nav('/welcome')
            }}
          >
            🔒 Lock & Logout
          </AnimatedButton>
          <p className="text-gray-500 text-xs mt-4">
            All data encrypted and stored locally on your device. Never transmitted to servers.
          </p>
        </div>
      </div>
    </div>
  )
}
