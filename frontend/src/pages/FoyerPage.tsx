import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'
import { BattleRoyaleGame } from '../components/BattleRoyaleGame'

export default function FoyerPage() {
  const nav = useNavigate()
  const [activeTab, setActiveTab] = React.useState<'overview' | 'marketplace' | 'governance' | 'community' | 'battle'>('overview')

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden">
      {/* Animated background orbs */}
      <GradientOrb delay={0} size={400} />
      <GradientOrb delay={2} size={300} />
      <GradientOrb delay={4} size={350} />

      {/* Grid background */}
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <NeonText size="5xl" gradient={true} className="block mb-2">
            ∞ CIVICVERSE HUB
          </NeonText>
          <p className="text-neon-cyan text-lg tracking-widest mb-4">
            THE DECENTRALIZED IDENTITY ECOSYSTEM
          </p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Welcome to the future of identity. A peer-to-peer network where individuals own their data, control their narrative, and participate in governance. No intermediaries. No extraction. Pure sovereignty.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {[
            { id: 'overview' as const, label: '🌐 Overview', icon: '🌐' },
            { id: 'marketplace' as const, label: '🏪 Marketplace', icon: '🏪' },
            { id: 'governance' as const, label: '🗳️ Governance', icon: '🗳️' },
            { id: 'community' as const, label: '👥 Community', icon: '👥' },
            { id: 'battle' as const, label: '⚔️ Battle Royale', icon: '⚔️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-neon-cyan text-dark-900 shadow-lg shadow-neon-cyan/50'
                  : 'bg-dark-800/40 border border-neon-cyan/30 text-neon-cyan hover:border-neon-cyan/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Battle Royale Game */}
        {activeTab === 'battle' && (
          <div className="w-full h-[600px] rounded-lg overflow-hidden border-2 border-neon-pink shadow-lg shadow-neon-pink/30 mb-8">
            <BattleRoyaleGame />
          </div>
        )}

        {/* Content Tabs */}
        {activeTab !== 'battle' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <AnimatedCard delay={200}>
                <h3 className="text-neon-cyan font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🔐</span> Zero-Custody Identity
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your Civic ID is generated locally and encrypted on your device. No platform holds your keys. No recovery codes. Pure sovereignty.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={250}>
                <h3 className="text-neon-pink font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🌍</span> Peer-to-Peer Network
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Connect directly with other citizens. No central authority. No surveillance. Communications encrypted end-to-end.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={300}>
                <h3 className="text-neon-purple font-bold mb-3 text-lg flex items-center gap-2">
                  <span>⚡</span> Offline-First Protocol
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Works without internet. Syncs when available. Your data stays local unless you explicitly share it.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={350}>
                <h3 className="text-neon-green font-bold mb-3 text-lg flex items-center gap-2">
                  <span>💎</span> Verified Credentials
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Earn cryptographic credentials. Shamir-split recovery. Reputation without tracking.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={400}>
                <h3 className="text-tropical-coral font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🎨</span> Human-Readable Identity
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your Civic ID is memorable. Your avatar is generative art. Your reputation is visible.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={450}>
                <h3 className="text-neon-cyan font-bold mb-3 text-lg flex items-center gap-2">
                  <span>⚙️</span> Open Standards
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Built on BIP-39, AES-256-GCM, and PBKDF2. No proprietary algorithms. Auditable cryptography.
                </p>
              </AnimatedCard>
            </>
          )}

          {/* Marketplace Tab */}
          {activeTab === 'marketplace' && (
            <>
              <AnimatedCard delay={200}>
                <h3 className="text-neon-orange font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🛍️</span> Peer Marketplace
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Buy and sell directly with other citizens. Services, goods, creative work. No platform fees.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={250}>
                <h3 className="text-neon-cyan font-bold mb-3 text-lg flex items-center gap-2">
                  <span>✅</span> Trust Ratings
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Transparent reputation system. Your history is your credential. Spam blocked automatically.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={300}>
                <h3 className="text-neon-pink font-bold mb-3 text-lg flex items-center gap-2">
                  <span>⚡</span> Instant Settlement
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Atomic swaps and escrow. No asset custody. No chargebacks or frozen accounts.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={350}>
                <h3 className="text-neon-purple font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🎯</span> Smart Listings
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your offers are cryptographically signed. Unique, transferable, and portable across platforms.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={400}>
                <h3 className="text-neon-green font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🗃️</span> Portfolio
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your work, your portfolio, your reputation. Portable to any platform. Truly yours.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={450}>
                <h3 className="text-tropical-teal font-bold mb-3 text-lg flex items-center gap-2">
                  <span>💰</span> Settlement Chains
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Plug in any blockchain. Civicverse is network-agnostic. Use Solana, Ethereum, Bitcoin, or custom chains.
                </p>
              </AnimatedCard>
            </>
          )}

          {/* Governance Tab */}
          {activeTab === 'governance' && (
            <>
              <AnimatedCard delay={200}>
                <h3 className="text-neon-cyan font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🗳️</span> Decentralized Governance
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  One citizen, one vote. Quadratic voting optional. Transparent on-chain proposal system.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={250}>
                <h3 className="text-neon-pink font-bold mb-3 text-lg flex items-center gap-2">
                  <span>📋</span> Proposals & Voting
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Submit governance proposals. Vote on protocol changes. Your voice matters equally.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={300}>
                <h3 className="text-neon-purple font-bold mb-3 text-lg flex items-center gap-2">
                  <span>⚖️</span> Treasury
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Community-controlled treasury. Allocate funds transparently. Fund ecosystem development.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={350}>
                <h3 className="text-neon-orange font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🎓</span> Reputation Delegation
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Delegate your vote based on expertise. Assign reputation weight to trusted validators.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={400}>
                <h3 className="text-neon-green font-bold mb-3 text-lg flex items-center gap-2">
                  <span>📊</span> Proposal Analytics
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Transparent voting metrics. See where citizens stand on issues. Instant analytics.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={450}>
                <h3 className="text-tropical-coral font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🔄</span> Protocol Evolution
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Citizens drive evolution. Hard forks require consensus. You choose which chain to follow.
                </p>
              </AnimatedCard>
            </>
          )}

          {/* Community Tab */}
          {activeTab === 'community' && (
            <>
              <AnimatedCard delay={200}>
                <h3 className="text-neon-cyan font-bold mb-3 text-lg flex items-center gap-2">
                  <span>👥</span> Direct P2P Messaging
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  End-to-end encrypted messaging. No central intermediary. Your conversations are private.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={250}>
                <h3 className="text-neon-pink font-bold mb-3 text-lg flex items-center gap-2">
                  <span>💬</span> Group Spaces
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Create communities. Invite members. Govern spaces collectively. Moderation by citizens.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={300}>
                <h3 className="text-neon-purple font-bold mb-3 text-lg flex items-center gap-2">
                  <span>⭐</span> Reputation System
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Earn trust through action. Your reputation is portable. Spam and abuse are filtered algorithmically.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={350}>
                <h3 className="text-neon-green font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🎭</span> Pseudonymity
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Choose your identity. Multiple personas supported. Privacy-first design throughout.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={400}>
                <h3 className="text-neon-orange font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🏆</span> Achievements
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Earn badges and credentials. Verifiable, transferable, and cryptographically signed.
                </p>
              </AnimatedCard>

              <AnimatedCard delay={450}>
                <h3 className="text-tropical-teal font-bold mb-3 text-lg flex items-center gap-2">
                  <span>🌱</span> Growth & Onboarding
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Invite friends without fees. Network effects drive growth. Bootstrapped by community.
                </p>
              </AnimatedCard>
            </>
          )}
        </div>
        )}

        {/* Vision Statement */}
        <AnimatedCard delay={500} className="mb-12 border-t-4 border-neon-cyan">
          <h2 className="text-2xl font-bold gradient-text mb-4">🚀 The Vision</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Civicverse is a protocol, not a platform. It enables the future of decentralized identity and peer-to-peer coordination at scale.
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            We believe identity should be:
          </p>
          <ul className="space-y-2 text-gray-300 list-none">
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">▸</span>
              <span><strong>Yours.</strong> Generated locally, encrypted, non-transferable, non-recoverable.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">▸</span>
              <span><strong>Portable.</strong> Take your identity and reputation anywhere. No platform lock-in.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">▸</span>
              <span><strong>Sovereign.</strong> You own your data. You control your narrative. No extraction.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">▸</span>
              <span><strong>Verifiable.</strong> Cryptographic proof. No platform intermediary required.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-neon-cyan font-bold">▸</span>
              <span><strong>Censorship-resistant.</strong> No authority can revoke your identity. No deplatforming.</span>
            </li>
          </ul>
        </AnimatedCard>

        {/* Call to Action */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <AnimatedButton
            variant="primary"
            size="lg"
            className="px-8 flex items-center gap-2"
            onClick={() => nav('/wallet')}
          >
            <span>← Back to Wallet</span>
          </AnimatedButton>

          <a
            href="/foyer-dist/index.html"
            target="_blank"
            rel="noreferrer"
            className="neon-btn-secondary px-8 py-3 font-semibold rounded-lg border-2 transition-all hover:scale-105"
          >
            <span>🌐 Launch 3D Foyer →</span>
          </a>
        </div>

        {/* Footer Message */}
        <div className="text-center text-gray-500 text-sm">
          <p>This is the MVP. The vision is much larger.</p>
          <p className="mt-2 text-xs">Civicverse: Protocol-level infrastructure for decentralized identity. Not a service.</p>
        </div>
      </div>
    </div>
  )
}
