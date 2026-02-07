import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { vault } from '../lib/vault'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'

export default function MnemonicPage() {
  const nav = useNavigate()
  const location = useLocation()
  const [copied, setCopied] = React.useState(false)
  const [understood, setUnderstood] = React.useState(false)
  const [showMnemonic, setShowMnemonic] = React.useState(false)

  const mnemonic = vault.getMnemonic()

  React.useEffect(() => {
    if (!mnemonic || !vault.isUnlocked()) {
      nav('/welcome')
    }
  }, [])

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

  if (!mnemonic) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden flex items-center justify-center">
        <GradientOrb delay={0} size={300} />
        <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />
        <div className="relative z-10 text-center">
          <NeonText size="3xl" gradient={true} className="block mb-4">
            Error
          </NeonText>
          <p className="text-gray-400">No vault data found. Starting over...</p>
          <AnimatedButton variant="primary" className="mt-6" onClick={() => nav('/welcome')}>
            Return Home
          </AnimatedButton>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden">
      <GradientOrb delay={0} size={300} />
      <GradientOrb delay={2} size={200} />
      <GradientOrb delay={4} size={250} />
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-3xl py-8 px-4 min-h-screen flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <NeonText size="4xl" gradient={true} className="block mb-2">
            🔐 Recovery Mnemonic
          </NeonText>
          <p className="text-neon-pink text-lg font-bold tracking-wider">CRITICAL — THIS IS YOUR ONLY BACKUP</p>
        </div>

        <AnimatedCard delay={100} className="border-l-4 border-neon-pink">
          {/* Warning */}
          <div className="bg-neon-pink/20 border border-neon-pink/50 rounded-lg p-4 mb-6 animate-pulse">
            <p className="text-neon-pink font-bold text-lg mb-2">⚠️ MOST IMPORTANT MESSAGE</p>
            <p className="text-white text-sm leadingrelaxed">
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
              <li className="flex gap-2">
                <span className="text-neon-pink font-bold">6.</span>
                <span><strong>Civicverse cannot help.</strong> We do not have your mnemonic. No one does but you.</span>
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
                  I understand: No password reset. No key recovery. No customer support. Civicverse cannot help me.
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
