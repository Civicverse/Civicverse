import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, AnimatedInput, NeonText, GradientOrb, LoadingSpinner } from '../components'

export default function SignupPage() {
  const nav = useNavigate()
  const signup = useGameStore(state => state.signup)
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function createAccount() {
    setError('')

    if (username.length < 3) {
      setError('Username must be 3+ characters')
      return
    }
    if (password.length < 8) {
      setError('Password must be 8+ characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Use the global signup method which handles vault creation and authentication state
      await signup(username, `did:civic:${Math.random().toString(36).substring(2, 15)}`, password)
      
      setLoading(false)
      // Navigate to mnemonic display page
      nav('/mnemonic', { state: { isNewUser: true } })
    } catch (e) {
      setError('Failed to create account: ' + (e instanceof Error ? e.message : String(e)))
      setLoading(false)
      console.error('signup error', e)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden">
      {/* Animated background orbs */}
      <GradientOrb delay={0} size={300} />
      <GradientOrb delay={2} size={200} />

      {/* Grid background */}
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-2xl py-8 px-4 min-h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <NeonText size="4xl" gradient={true} className="block mb-2">
            ✨ Create Your Identity
          </NeonText>
          <p className="text-neon-cyan text-lg">Generate Your Civic ID</p>
        </div>

        {/* Form Card */}
        <AnimatedCard delay={100}>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Your Civic ID is generated locally with cryptographic keys. <span className="text-neon-cyan font-bold">Civicverse never sees your private keys.</span>
          </p>

          {error && (
            <div className="mb-6 p-4 bg-neon-pink/10 border border-neon-pink/50 rounded-lg animate-pulse">
              <p className="text-neon-pink font-semibold text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mb-6 p-6 text-center">
              <LoadingSpinner size="md" />
              <p className="text-neon-cyan mt-4 font-semibold">Generating your identity...</p>
            </div>
          )}

          {!loading && (
            <div className="space-y-4">
              <AnimatedInput
                label="Username"
                placeholder="Choose a display name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
              />

              <AnimatedInput
                label="Password"
                type="password"
                placeholder="8+ characters, never transmitted"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />

              <AnimatedInput
                label="Confirm Password"
                type="password"
                placeholder="Must match"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={loading}
              />

              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full mt-6"
                onClick={createAccount}
                disabled={loading}
              >
                ⚡ Generate Civic ID
              </AnimatedButton>

              <div className="pt-4 border-t border-neon-cyan/20 mt-6">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your Civic ID is generated from entropy (randomness) and encrypted with your password.
                </p>
                <p className="text-xs text-neon-pink font-bold mt-2">
                  Next: You'll see your Memetic Wallet Password. Back it up securely — there is NO recovery without it.
                </p>
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  )
}
