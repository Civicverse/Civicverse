import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, AnimatedInput, NeonText, GradientOrb, LoadingSpinner } from '../components'
import { Shield, Sparkles, Key, Zap, Globe, ArrowRight } from 'lucide-react'

export default function SignInPage() {
  const nav = useNavigate()
  const login = useGameStore(state => state.login)
  const signup = useGameStore(state => state.signup)
  const hasIdentity = useGameStore(state => state.hasIdentity)
  const user = useGameStore(state => state.user)
  
  const [activeTab, setActiveTab] = useState<'signin' | 'guest' | 'restore'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mnemonic, setMnemonic] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Regular Unlock / Sign In
  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your vault password.')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (!hasIdentity) {
        // Auto-provision identity with this password if none exists yet
        const uname = username.trim() || `Citizen_${Math.floor(1000 + Math.random() * 9000)}`
        await signup(uname, '', password)
        nav('/foyer')
        return
      }

      await login('', password)
      if (rememberDevice) {
        try {
          localStorage.setItem('civicverse_saved_session', password);
        } catch (e) {}
      }
      nav('/foyer')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed. Check your password.')
    } finally {
      setLoading(false)
    }
  }

  // 1-Click Instant Guest Sign In
  const handleInstantGuest = async () => {
    setError('')
    setLoading(true)
    try {
      const guestName = username.trim() || `Citizen_${Math.floor(1000 + Math.random() * 9000)}`
      const guestPass = 'Civicverse2026!'
      await signup(guestName, '', guestPass)
      nav('/foyer')
    } catch (e) {
      // If error or already created, go to foyer directly
      nav('/foyer')
    } finally {
      setLoading(false)
    }
  }

  // Restore with 12-Word Mnemonic
  const handleRestore = async () => {
    if (!mnemonic.trim()) {
      setError('Please enter your 12-word seed phrase.')
      return
    }
    if (!password || password.length < 8) {
      setError('Please set a vault password (8+ characters).')
      return
    }
    setError('')
    setLoading(true)
    try {
      const uname = username.trim() || `Citizen_${Math.floor(1000 + Math.random() * 9000)}`
      await signup(uname, '', password, mnemonic.trim())
      nav('/foyer')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore vault.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center p-4">
      <GradientOrb delay={0} size={300} />
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <NeonText size="4xl" gradient={true} className="block mb-2 uppercase tracking-tighter">
            🔓 Unlock Vault
          </NeonText>
          <p className="text-neon-cyan text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">
            Secure Local Session & Metaverse Access
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0b101a] border border-gray-800 rounded-lg p-1 mb-4 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('signin'); setError(''); }}
            className={`flex-1 py-1.5 rounded transition-all text-center ${
              activeTab === 'signin' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In / Unlock
          </button>
          <button
            onClick={() => { setActiveTab('guest'); setError(''); }}
            className={`flex-1 py-1.5 rounded transition-all text-center flex items-center justify-center gap-1 ${
              activeTab === 'guest' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Instant Guest</span>
          </button>
          <button
            onClick={() => { setActiveTab('restore'); setError(''); }}
            className={`flex-1 py-1.5 rounded transition-all text-center ${
              activeTab === 'restore' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Restore Seed
          </button>
        </div>

        <AnimatedCard className="border-t-4 border-neon-cyan">
          {error && (
            <div className="mb-4 p-3 bg-neon-pink/10 border border-neon-pink/40 rounded text-neon-pink text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
              ⚠ {error}
            </div>
          )}

          {/* TAB 1: REGULAR SIGN IN / UNLOCK */}
          {activeTab === 'signin' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-gray-300 text-xs uppercase tracking-wider font-semibold">
                  {hasIdentity ? `Welcome back, ${user?.username || 'Citizen'}` : 'Enter Password to Decrypt Vault'}
                </p>
                {!hasIdentity && (
                  <p className="text-[10px] text-cyan-400 mt-1">
                    First time on this device? Enter a password to instantly create your local vault, or use Instant Guest below.
                  </p>
                )}
              </div>

              {!hasIdentity && (
                <AnimatedInput
                  label="Citizen Username (Optional)"
                  type="text"
                  placeholder="e.g. NeoCitizen"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                />
              )}

              <AnimatedInput
                label="Vault Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
                <span>Remember session on this device</span>
              </label>

              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full py-3.5 uppercase font-bold tracking-[0.2em]"
                onClick={handleUnlock}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : '🔓 Decrypt & Enter Vault'}
              </AnimatedButton>
            </div>
          )}

          {/* TAB 2: INSTANT GUEST PASS */}
          {activeTab === 'guest' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  One-Click Instant Access
                </h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Generate a disposable local sovereign identity and enter the Civicverse Foyer Hub immediately.
                </p>
              </div>

              <AnimatedInput
                label="Guest Call-Sign (Optional)"
                type="text"
                placeholder="e.g. CyberRunner_99"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
              />

              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full py-4 uppercase font-extrabold tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                onClick={handleInstantGuest}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : '⚡ Enter Foyer As Guest'}
              </AnimatedButton>
            </div>
          )}

          {/* TAB 3: RESTORE FROM SEED */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-gray-300 text-xs uppercase tracking-wider font-semibold">
                  Restore Sovereign Vault
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Enter your 12 or 24 word mnemonic seed phrase.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-bold uppercase tracking-wider">
                  12-Word Recovery Phrase
                </label>
                <textarea
                  rows={3}
                  value={mnemonic}
                  onChange={e => setMnemonic(e.target.value)}
                  placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                  className="w-full bg-[#111726] border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
                  disabled={loading}
                />
              </div>

              <AnimatedInput
                label="New Vault Password (8+ chars)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />

              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full py-3.5 uppercase font-bold tracking-wider"
                onClick={handleRestore}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : '🔑 Decrypt from Seed'}
              </AnimatedButton>
            </div>
          )}

          {/* Direct Link to Foyer Hub */}
          <div className="pt-4 border-t border-gray-800/80 mt-5 space-y-2.5">
            <button
              onClick={() => nav('/foyer')}
              className="w-full bg-[#121a2c] hover:bg-[#18233a] border border-cyan-500/30 hover:border-cyan-400/60 rounded-lg py-2.5 px-3 flex items-center justify-between text-xs text-cyan-300 font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>🌐 Enter Foyer Hub Directly</span>
              </span>
              <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded uppercase font-mono">
                NO LOGIN ➔
              </span>
            </button>

            <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-1">
              <button 
                onClick={() => nav('/signup')}
                className="hover:text-cyan-400 transition-colors uppercase font-bold"
              >
                + Create Full CivicID
              </button>
              <button 
                onClick={() => nav('/vault')}
                className="hover:text-cyan-400 transition-colors uppercase font-bold"
              >
                Civic Vault ➔
              </button>
            </div>
          </div>
        </AnimatedCard>

        {/* Footer Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
            Non-custodial protocol. Decryption happens 100% locally in your browser sandbox.
          </p>
        </div>
      </div>
    </div>
  )
}
