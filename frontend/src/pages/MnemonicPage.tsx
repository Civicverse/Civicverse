import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'

export default function MnemonicPage() {
  const nav = useNavigate()
  
  // Use individual selectors to avoid unnecessary re-renders and potential object issues
  const tempMnemonic = useGameStore(state => state.tempMnemonic)
  const isAuthenticated = useGameStore(state => state.isAuthenticated)

  const [copied, setCopied] = React.useState(false)
  const [understood, setUnderstood] = React.useState(false)
  const [showMnemonic, setShowMnemonic] = React.useState(false)

  // Use a string default to prevent split() crashes
  const mnemonic = typeof tempMnemonic === 'string' ? tempMnemonic : ''

  const copyToClip = () => {
    if (mnemonic) {
      navigator.clipboard.writeText(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const proceed = () => {
    if (understood && showMnemonic) {
      nav('/wallet')
    }
  }

  // Handle case where mnemonic is lost (e.g. on refresh)
  if (!mnemonic) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center p-4">
        <GradientOrb delay={0} size={300} />
        <div className="relative z-10 text-center max-w-md">
          <NeonText size="3xl" gradient={true} className="block mb-4">
            Security Check
          </NeonText>
          <p className="text-gray-400 mb-8 leading-relaxed">
            For your protection, the recovery phrase is only shown during the identity creation session.
            If you have already backed it up, you can proceed to your wallet.
          </p>
          <div className="space-y-4">
            <AnimatedButton variant="primary" className="w-full" onClick={() => nav('/wallet')}>
              Continue to Wallet
            </AnimatedButton>
            {!isAuthenticated && (
              <AnimatedButton variant="secondary" className="w-full" onClick={() => nav('/welcome')}>
                Back to Welcome
              </AnimatedButton>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden py-8 px-4 flex flex-col justify-center">
      <GradientOrb delay={0} size={300} />
      <GradientOrb delay={2} size={200} />
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <NeonText size="4xl" gradient={true} className="block mb-2">
            🔐 Recovery Mnemonic
          </NeonText>
          <p className="text-neon-pink text-lg font-bold tracking-wider">CRITICAL — THIS IS YOUR ONLY BACKUP</p>
        </div>

        <AnimatedCard delay={100} className="border-l-4 border-neon-pink">
          {/* Warning */}
          <div className="bg-neon-pink/20 border border-neon-pink/50 rounded-lg p-4 mb-6">
            <p className="text-neon-pink font-bold text-lg mb-2">⚠️ MOST IMPORTANT MESSAGE</p>
            <p className="text-white text-sm leading-relaxed">
              This is your <span className="font-bold">ONLY way</span> to recover your wallet if your device is lost, corrupted, or stolen.
            </p>
          </div>

          {/* Mnemonic Display */}
          <div className="mb-6">
            <p className="text-gray-300 mb-4 font-semibold">Your 12-Word Recovery Phrase:</p>
            <div className={`relative rounded-lg border-2 transition-all duration-300 p-6 min-h-[200px] flex items-center justify-center ${
              showMnemonic 
                ? 'border-neon-cyan/60 bg-dark-800/80 scanlines' 
                : 'border-neon-cyan/20 bg-dark-800/40'
            }`}>
              {showMnemonic ? (
                <div className="w-full">
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 font-mono text-sm">
                    {mnemonic.split(' ').map((word, i) => (
                      <div
                        key={i}
                        className="bg-dark-900/40 border border-neon-cyan/30 rounded p-2 text-center hover:border-neon-cyan/60 transition-all"
                      >
                        <div className="text-gray-500 text-xs mb-1">{i + 1}</div>
                        <div className="text-neon-cyan font-semibold">{word}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={copyToClip}
                    className="mt-4 w-full py-2 text-sm font-semibold bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan rounded hover:bg-neon-cyan/40 transition-all"
                  >
                    {copied ? '✓ Copied to Clipboard' : '📋 Copy All 12 Words'}
                  </button>
                </div>
              ) : (
                <AnimatedButton
                  variant="primary"
                  size="lg"
                  onClick={() => setShowMnemonic(true)}
                >
                  Click to Reveal Your Mnemonic
                </AnimatedButton>
              )}
            </div>
          </div>

          {/* Critical rules */}
          <div className="bg-dark-800/60 border border-neon-purple/30 rounded-lg p-4 mb-6">
            <p className="text-neon-purple font-bold mb-3 text-lg">🚨 CRITICAL RULES</p>
            <ul className="space-y-2 text-sm text-gray-300 list-none">
              <li className="flex gap-2">
                <span className="text-neon-pink font-bold">1.</span>
                <span><strong>Write it down.</strong> Use pen and paper in a safe location.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neon-pink font-bold">2.</span>
                <span><strong>Store offline.</strong> Safe deposit box, vault, or trusted location.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neon-pink font-bold">3.</span>
                <span><strong>Never screenshot.</strong> Screenshots can be recovered from your device.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neon-pink font-bold">4.</span>
                <span><strong>Never share.</strong> Never email, text, or digitally send this phrase.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neon-pink font-bold">5.</span>
                <span><strong>Lose it? Gone forever.</strong> No recovery. No exceptions. No refunds.</span>
              </li>
            </ul>
          </div>

          {/* Confirmation */}
          {showMnemonic && (
            <div className="mb-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-start gap-3 cursor-pointer hover:bg-neon-green/20"
              onClick={() => setUnderstood(!understood)}>
              <input
                type="checkbox"
                id="understood"
                checked={understood}
                onChange={e => setUnderstood(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-neon-green cursor-pointer"
              />
              <label htmlFor="understood" className="cursor-pointer flex-1 text-sm">
                <p className="font-bold text-neon-green">
                  ✓ I have securely backed up my recovery mnemonic
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  I understand: No password reset. No key recovery. Civicverse cannot help me.
                </p>
              </label>
            </div>
          )}

          {/* Continue button */}
          <AnimatedButton
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!understood || !showMnemonic}
            onClick={proceed}
          >
            {understood && showMnemonic ? '✓ Continue to Wallet' : '⏳ Backup Your Mnemonic First'}
          </AnimatedButton>
        </AnimatedCard>
      </div>
    </div>
  )
}
