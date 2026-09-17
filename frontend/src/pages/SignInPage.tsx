import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, AnimatedInput, NeonText, GradientOrb, LoadingSpinner } from '../components'

export default function SignInPage() {
  const nav = useNavigate()
  const login = useGameStore(state => state.login)
  const hasIdentity = useGameStore(state => state.hasIdentity)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUnlock = async () => {
    setError('')
    setLoading(true)
    try {
      console.debug('[SignInPage] attempting login call');
      await login('', password)
      console.debug('[SignInPage] login resolved, navigating to /vault');
      nav('/vault')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed. Check your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center p-4">
      <GradientOrb delay={0} size={300} />
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <NeonText size="4xl" gradient={true} className="block mb-2 uppercase tracking-tighter">
            🔓 Unlock Vault
          </NeonText>
          <p className="text-neon-cyan text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">
            Secure Local Session
          </p>
        </div>

        <AnimatedCard className="border-t-4 border-neon-cyan">
          {!hasIdentity ? (
            <div className="text-center space-y-6 py-4">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="text-lg font-bold text-neon-pink uppercase tracking-wider">
                No Identity Found
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed uppercase tracking-widest">
                No encrypted CivicID vault was detected on this device. Please create a new sovereign identity or restore from your 12-word recovery phrase.
              </p>

              <div className="space-y-3 pt-2">
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  className="w-full py-4 uppercase font-bold tracking-widest"
                  onClick={() => nav('/signup')}
                >
                  ✨ Create New CivicID
                </AnimatedButton>

                <AnimatedButton
                  variant="secondary"
                  size="md"
                  className="w-full py-3 uppercase font-bold tracking-wider"
                  onClick={() => nav('/signup', { state: { mode: 'restore' } })}
                >
                  🔑 Restore from Seed Phrase
                </AnimatedButton>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-xs text-center mb-8 uppercase tracking-widest leading-relaxed">
                Enter your vault password to decrypt your sovereign identity.
              </p>

              {error && (
                <div className="mb-6 p-3 bg-neon-pink/10 border border-neon-pink/40 rounded text-neon-pink text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
                  ⚠ {error}
                </div>
              )}

              <div className="space-y-6">
                <AnimatedInput
                  label="Vault Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />

                <AnimatedButton
                  variant="primary"
                  size="lg"
                  className="w-full py-4 uppercase font-bold tracking-[0.2em]"
                  onClick={handleUnlock}
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Decrypt & Enter'}
                </AnimatedButton>
                
                <div className="flex flex-col gap-2 pt-2 text-center">
                  <button 
                    onClick={() => nav('/signup')}
                    className="text-[10px] text-neon-cyan hover:underline uppercase tracking-widest transition-colors font-bold"
                  >
                    + Create a Different CivicID
                  </button>
                  <button 
                    onClick={() => nav('/signup', { state: { mode: 'restore' } })}
                    className="text-[10px] text-gray-400 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    🔑 Restore with 12-Word Phrase
                  </button>
                  <button 
                    onClick={() => nav('/welcome')}
                    className="text-[10px] text-gray-500 hover:text-neon-cyan uppercase tracking-widest transition-colors mt-2"
                  >
                    ← Back to Welcome
                  </button>
                </div>
              </div>
            </>
          )}
        </AnimatedCard>

        <div className="mt-8 text-center">
           <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] leading-relaxed">
             No Password? Use "Restore" with your 12-word recovery phrase.<br/>
             Decryption happens 100% locally on your device.
           </p>
        </div>
      </div>
    </div>
  )
}
