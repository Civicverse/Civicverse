import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'

export default function TOSPage() {
  const nav = useNavigate()
  const [agreed, setAgreed] = React.useState(false)

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden">
      {/* Animated background orbs */}
      <GradientOrb delay={0} size={300} />
      <GradientOrb delay={2} size={200} />
      <GradientOrb delay={4} size={250} />

      {/* Grid background */}
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-3xl py-8 px-4 flex flex-col min-h-screen">
        {/* Header */}
        <div className="mb-8 text-center animate-slide-up">
          <NeonText size="4xl" gradient={true} className="block mb-2">
            ∞ CIVICVERSE
          </NeonText>
          <p className="text-neon-cyan text-lg tracking-wider">Non-Custodial Identity Protocol</p>
        </div>

        {/* Terms Card */}
        <AnimatedCard delay={100} className="flex-1 mb-8 max-h-[60vh] overflow-y-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 gradient-text">
            Terms of Service
          </h2>

          <div className="space-y-4 text-sm md:text-base leading-relaxed">
            <div>
              <h3 className="text-neon-pink font-bold mb-2 text-lg">
                ⚡ Non-Custodial Decentralized Identity & Wallet
              </h3>
              <p className="text-gray-300">
                You are about to create a local, encrypted identity and wallet that runs entirely on your device.
              </p>
            </div>

            <div>
              <h3 className="text-neon-pink font-bold mb-3 text-lg">🚨 CRITICAL WARNINGS</h3>
              <ul className="space-y-2 text-gray-300 list-none">
                <li className="flex gap-2">
                  <span className="text-neon-cyan">→</span>
                  <span>
                    <strong>Civicverse does NOT custody your keys, wallet, or data.</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">→</span>
                  <span>
                    <strong>You alone control your Civic ID and wallet private key.</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">→</span>
                  <span>
                    <strong>NO password reset.</strong> Losing password = losing access forever.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">→</span>
                  <span>
                    <strong>NO key recovery.</strong> Losing mnemonic = losing wallet forever.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-cyan">→</span>
                  <span>
                    <strong>NO customer support</strong> for key management.
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-neon-purple font-bold mb-2 text-lg">🔐 What This Means</h3>
              <ul className="space-y-1 text-gray-300 list-none">
                <li className="flex gap-2">
                  <span className="text-neon-purple">▸</span>
                  <span>Your Civic ID is generated locally, never registered.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-purple">▸</span>
                  <span>Wallet private key encrypted and stored locally only.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-purple">▸</span>
                  <span>You must backup password and recovery mnemonic.</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-neon-green font-bold mb-2 text-lg">🏗️ Protocol-Level Infrastructure</h3>
              <p className="text-gray-300">
                Civicverse is not a service. We do not hold keys, authenticate users, provide recovery, or maintain user accounts.
              </p>
            </div>

            <div>
              <h3 className="text-neon-cyan font-bold mb-2 text-lg">⚙️ Technical Details</h3>
              <ul className="space-y-1 text-gray-400 text-xs md:text-sm list-none font-mono">
                <li>• Encryption: AES-256-GCM + PBKDF2 (100k iterations)</li>
                <li>• Key Derivation: PBKDF2-SHA256</li>
                <li>• Password: Never leaves device</li>
                <li>• Civic ID: Derived from entropy, not registered</li>
                <li>• Mnemonic: BIP-39 standard (12 words)</li>
                <li>• Storage: Local encrypted vault</li>
                <li>• Network: Offline-first, full functionality without internet</li>
              </ul>
            </div>
          </div>
        </AnimatedCard>

        {/* Checkbox & Buttons */}
        <div className="mt-auto space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="neon-box p-4 flex items-start gap-3 cursor-pointer hover:bg-dark-800/60 transition-colors"
            onClick={() => setAgreed(!agreed)}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-6 h-6 mt-1 cursor-pointer accent-neon-cyan"
            />
            <label className="cursor-pointer flex-1">
              <p className="text-sm md:text-base">
                I understand <span className="text-neon-cyan font-bold">this is non-custodial software</span>. I accept <span className="text-neon-pink font-bold">full responsibility</span> for my keys and data.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                No account recovery. No customer support. Only me, my password, my mnemonic.
              </p>
            </label>
          </div>

          <div className="flex gap-3">
            <AnimatedButton
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={!agreed}
              onClick={() => nav('/welcome')}
            >
              ✓ I Accept & Continue
            </AnimatedButton>
            <AnimatedButton
              variant="secondary"
              size="lg"
              onClick={() => {
                try {
                  window.close()
                } catch {
                  alert('You must accept the terms to proceed.')
                }
              }}
            >
              ✕ Exit
            </AnimatedButton>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Use at your own risk. Civicverse is experimental decentralized software.
          </p>
        </div>
      </div>
    </div>
  )
}
