import React from 'react'
import { useNavigate } from 'react-router-dom'
import { vault } from '../lib/vault'
import { AnimatedButton, AnimatedCard, AnimatedInput, NeonText, GradientOrb, LoadingSpinner } from '../components'

export default function SignInPage() {
  const nav = useNavigate()
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const vaultExists = !!localStorage.getItem('civicverse:vault:encrypted')
  const civicId = localStorage.getItem('civicverse:civicId')

  async function unlock() {
    if (!password) {
      setError('Enter your password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const encryptedVault = localStorage.getItem('civicverse:vault:encrypted')
      const salt = localStorage.getItem('civicverse:vault:salt')

      if (!encryptedVault || !salt) {
        setError('No vault found. You may need to create a new account.')
        setLoading(false)
        return
      }

      const unlocked = await vault.unlock(password, encryptedVault, salt)

      if (unlocked) {
        setLoading(false)
        nav('/wallet')
      } else {
        setError('Incorrect password. Civicverse cannot recover access.')
        setLoading(false)
      }
    } catch (e) {
      setError('Unlock failed: ' + (e instanceof Error ? e.message : String(e)))
      setLoading(false)
    }
  }

  if (!vaultExists) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center">
        <GradientOrb delay={0} size={300} />
        <GradientOrb delay={2} size={200} />
        <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

        <div className="relative z-10 container mx-auto max-w-2xl px-4">
          <AnimatedCard>
            <NeonText size="3xl" gradient={true} className="block mb-4">
              No Vault Found
            </NeonText>
            <p className="text-gray-300 mb-4">There is no existing vault on this device.</p>
            <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300 mb-2">You can either:</p>
              <ul className="text-sm text-gray-300 list-none space-y-1">
                <li className="flex gap-2">
                  <span className="text-neon-purple">→</span>
                  <span>Create a new Civic ID on this device</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-purple">→</span>
                  <span>Restore using your recovery mnemonic (if created elsewhere)</span>
                </li>
              </ul>
            </div>
            <AnimatedButton variant="primary" className="w-full" onClick={() => nav('/signup')}>
              Create New Account
            </AnimatedButton>
          </AnimatedCard>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden">
      <GradientOrb delay={0} size={300} />
      <GradientOrb delay={2} size={200} />
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-2xl py-8 px-4 min-h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <NeonText size="4xl" gradient={true} className="block mb-2">
            🔑 Unlock Vault
          </NeonText>
          <p className="text-neon-cyan text-lg">Enter your password</p>
        </div>

        {/* Form Card */}
        <AnimatedCard delay={100}>
          {civicId && (
            <div className="mb-6 p-4 bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Your Civic ID:</p>
              <p className="text-neon-cyan font-mono text-sm break-all">{civicId}</p>
            </div>
          )}

          <p className="text-gray-300 mb-6">
            Enter your password to unlock your local encrypted vault and access your identity.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-neon-pink/10 border border-neon-pink/50 rounded-lg animate-pulse">
              <p className="text-neon-pink font-semibold text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mb-6 p-6 text-center">
              <LoadingSpinner size="md" />
              <p className="text-neon-cyan mt-4 font-semibold">Decrypting vault...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-4">
              <AnimatedInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && unlock()}
              />

              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={unlock}
                disabled={loading}
              >
                ⚡ Unlock Vault
              </AnimatedButton>

              <div className="pt-4 border-t border-neon-cyan/20 mt-6">
                <p className="text-xs text-neon-pink font-bold">
                  ⚠️ Forget your password? Your identity is permanently lost. There is no recovery.
                </p>
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}
