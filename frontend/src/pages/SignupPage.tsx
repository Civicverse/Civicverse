import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, AnimatedInput, NeonText, GradientOrb, LoadingSpinner } from '../components'

export default function SignupPage() {
  const nav = useNavigate()
  const location = useLocation()
  const signup = useGameStore(state => state.signup)
  const setAuthenticated = useGameStore(state => state.setAuthenticated)
  
  const mode = location.state?.mode || 'create' // 'create' or 'restore'
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mnemonicInput, setMnemonicInput] = useState('')
  
  const [step, setStep] = useState(1) // 1: Setup, 2: Seed Display/Verify
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [generatedMnemonic, setGeneratedMnemonic] = useState('')
  const [seedCheckWords, setSeedCheckWords] = useState<{ index: number, word: string }[]>([])
  const [userCheckInputs, setUserCheckInputs] = useState<string[]>(['', '', ''])
  const [hasWrittenSeed, setHasWrittenSeed] = useState(false)

  const handleInitialSetup = async () => {
    setError('')
    if (username.length < 3) return setError('Username must be 3+ characters')
    if (password.length < 8) return setError('Password must be 8+ characters')
    if (password !== confirm) return setError('Passwords do not match')
    
    if (mode === 'restore') {
      const words = mnemonicInput.trim().split(/\s+/)
      if (words.length !== 12 && words.length !== 24) {
        return setError('Mnemonic must be 12 or 24 words')
      }
      
      setLoading(true)
      try {
        await signup(username, '', password, mnemonicInput.trim())
        setAuthenticated(true)
        nav('/vault')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Restore failed')
      } finally {
        setLoading(false)
      }
    } else {
      // Create mode - move to seed display
      setLoading(true)
      try {
        // We call signup to generate the keys and mnemonic
        await signup(username, '', password)
        const mnemonic = useGameStore.getState().tempMnemonic
        if (mnemonic) {
          setGeneratedMnemonic(mnemonic)
          
          // Pick 3 random words for verification
          const words = mnemonic.split(' ')
          const indices = [0, 0, 0].map(() => Math.floor(Math.random() * words.length))
          // Ensure unique indices
          const uniqueIndices = Array.from(new Set(indices))
          while(uniqueIndices.length < 3) {
            uniqueIndices.push(Math.floor(Math.random() * words.length))
          }
          
          setSeedCheckWords(uniqueIndices.sort((a, b) => a - b).map(idx => ({ index: idx, word: words[idx] })))
          setStep(2)
        } else {
          setError('Failed to generate identity')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Identity generation failed')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleVerifySeed = () => {
    setError('')
    const isCorrect = userCheckInputs.every((input, i) => input.trim().toLowerCase() === seedCheckWords[i].word.toLowerCase())
    
    if (!isCorrect) {
      setError('Incorrect words. Please check your written seed phrase.')
      return
    }
    
    if (!hasWrittenSeed) {
      setError('Please confirm you have written down your seed phrase.')
      return
    }

    // Success - Confirm authentication
    setAuthenticated(true)
    nav('/vault')
  }

  if (step === 1) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden py-12 px-4 flex flex-col items-center justify-center">
        <GradientOrb delay={0} size={300} />
        <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-lg">
          <div className="text-center mb-8">
            <NeonText size="4xl" gradient={true} className="block mb-2 uppercase tracking-tighter">
              {mode === 'create' ? '✨ Create CivicID' : '🔑 Restore CivicID'}
            </NeonText>
            <p className="text-neon-cyan text-sm uppercase tracking-widest opacity-80 font-bold">
              Protocol Onboarding
            </p>
          </div>

          <AnimatedCard>
            {error && (
              <div className="mb-6 p-3 bg-neon-pink/10 border border-neon-pink/40 rounded text-neon-pink text-xs font-bold animate-pulse">
                ⚠ {error}
              </div>
            )}

            <div className="space-y-5">
              <AnimatedInput
                label="Public Username"
                placeholder="How others see you..."
                value={username}
                onChange={e => setUsername(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <AnimatedInput
                  label="Vault Password"
                  type="password"
                  placeholder="8+ chars"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <AnimatedInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Must match"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>

              {mode === 'restore' && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Seed Phrase (12 or 24 words)</label>
                  <textarea
                    className="w-full h-24 bg-dark-900/60 border border-neon-cyan/20 rounded-lg p-3 text-sm font-mono text-neon-cyan focus:border-neon-cyan/60 outline-none transition-all"
                    placeholder="Enter your memetic recovery phrase here..."
                    value={mnemonicInput}
                    onChange={e => setMnemonicInput(e.target.value)}
                  />
                </div>
              )}

              <div className="pt-4">
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  className="w-full py-4 uppercase font-bold tracking-widest"
                  onClick={handleInitialSetup}
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : (mode === 'create' ? 'Generate Identity' : 'Restore Identity')}
                </AnimatedButton>
              </div>

              <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest leading-relaxed">
                Identity is generated locally on your device.<br/>
                Civicverse has no access to your keys.
              </p>
            </div>
          </AnimatedCard>
        </div>
      </div>
    )
  }

  // Step 2: Seed Phrase Display & Verification
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden py-12 px-4 flex flex-col items-center">
      <GradientOrb delay={0} size={300} />
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <NeonText size="4xl" gradient={true} className="block mb-2 uppercase tracking-tighter">
            🧬 Master Recovery Seed
          </NeonText>
          <div className="inline-block px-3 py-1 bg-neon-pink/20 border border-neon-pink/40 rounded text-neon-pink text-[10px] font-bold uppercase tracking-[0.2em]">
            Physical Backup Required
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedCard className="border-l-4 border-neon-pink">
            <h3 className="text-neon-pink font-bold text-sm uppercase tracking-widest mb-4">Your Seed Phrase</h3>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              {generatedMnemonic.split(' ').map((word, i) => (
                <div key={i} className="bg-dark-900/60 border border-neon-cyan/20 rounded p-2 flex gap-2">
                  <span className="opacity-30">{i + 1}</span>
                  <span className="text-neon-cyan font-bold">{word}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-3 bg-dark-900/40 border border-white/5 rounded text-[10px] text-gray-400 leading-relaxed italic">
              "Write these words down on paper and store them in a secure, offline location. This is the only way to recover your CivicID."
            </div>
          </AnimatedCard>

          <div className="space-y-6">
            <AnimatedCard className="border-l-4 border-neon-cyan">
              <h3 className="text-neon-cyan font-bold text-sm uppercase tracking-widest mb-4">Verify Backup</h3>
              
              <div className="space-y-4">
                {seedCheckWords.map((check, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-500">Word #{check.index + 1}</label>
                    <input
                      className="w-full bg-dark-900/60 border border-neon-cyan/20 rounded p-2 text-sm font-mono focus:border-neon-cyan/60 outline-none"
                      type="text"
                      autoComplete="off"
                      value={userCheckInputs[i]}
                      onChange={e => {
                        const newInputs = [...userCheckInputs]
                        newInputs[i] = e.target.value
                        setUserCheckInputs(newInputs)
                      }}
                    />
                  </div>
                ))}
              </div>

              {error && <p className="text-neon-pink text-[10px] mt-4 font-bold uppercase animate-pulse">{error}</p>}

              <div className="mt-6 pt-6 border-t border-white/5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 accent-neon-pink"
                    checked={hasWrittenSeed}
                    onChange={e => setHasWrittenSeed(e.target.checked)}
                  />
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                    I have securely written down my seed phrase and understand it cannot be recovered.
                  </span>
                </label>
              </div>
            </AnimatedCard>

            <AnimatedButton
              variant="primary"
              size="lg"
              className="w-full py-4 uppercase font-bold tracking-widest"
              onClick={handleVerifySeed}
            >
              Confirm & Enter Vault
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  )
}
