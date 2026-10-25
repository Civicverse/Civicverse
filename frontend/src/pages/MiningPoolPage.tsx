import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedButton, NeonText, GradientOrb } from '../components'
import { MiningRigDashboard } from '../components/MiningRigDashboard'

export default function MiningPoolPage() {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const TREASURY_WALLET = '438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp'

  const copyTreasuryAddress = () => {
    navigator.clipboard.writeText(TREASURY_WALLET)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-12 px-4">
      <GradientOrb delay={0} size={400} className="top-[-10%] right-[-10%] opacity-20" />
      <div className="absolute inset-0 grid-glow opacity-10" />

      <div className="relative z-10 container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 animate-slide-up">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/Civicverselogo.png" alt="CV" className="w-5 h-5 rounded-full object-cover shadow-[0_0_10px_rgba(255,107,0,0.5)] border border-orange-500/40" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-neon-orange font-bold block">Network Infrastructure // Proof-of-Work Crowdfund</span>
            </div>
            <NeonText size="5xl" gradient={true} className="block tracking-tighter uppercase font-black">
              Community Mining Pool
            </NeonText>
            <p className="text-gray-300 mt-2 max-w-2xl leading-relaxed text-sm md:text-base">
              We aren&apos;t mining for individual speculative profit—we are combining grassroots compute from all of our everyday machines. Whether it&apos;s an idle gaming PC, laptop, or home server, every hash is routed directly to the Civicverse Community Treasury to collectively fund real-world physical infrastructure.
            </p>
          </div>
          
          <AnimatedButton
            variant="secondary"
            size="md"
            onClick={() => navigate('/vault')}
          >
            ← Back to Vault
          </AnimatedButton>
        </div>

        {/* Radical Transparency & Economics Banner */}
        <div className="mb-8 p-5 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-xs md:text-sm text-gray-300 flex items-start gap-4 backdrop-blur-md animate-slide-up">
          <span className="text-2xl shrink-0">💡</span>
          <div className="space-y-1">
            <p className="font-bold text-neon-orange uppercase tracking-wide">
              Radical Transparency on Mining Economics
            </p>
            <p className="leading-relaxed text-gray-300">
              Mining solo on consumer hardware often runs at a slight personal deficit due to retail power rates. But running your gaming rig when idle costs only a few cents a day in electricity. Are you really going to miss the spare change of an idle PC when it&apos;s actively combining funds to build community-owned data centers, homeless shelters, and solarpunk cities? And once our first solar mining operations go live, that compute becomes 100% free.
            </p>
          </div>
        </div>

        {/* Interactive Rig Dashboard - Always configured to Treasury Address */}
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <MiningRigDashboard walletAddress={TREASURY_WALLET} />
        </div>

        {/* Direct Treasury Address Badge */}
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <span className="text-xl shrink-0">🔐</span>
            <div className="overflow-hidden">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">Civicverse Monero Treasury Address</div>
              <div className="text-xs text-neon-cyan font-mono truncate select-all">{TREASURY_WALLET}</div>
            </div>
          </div>
          <button
            onClick={copyTreasuryAddress}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95"
          >
            {copied ? '✓ Copied to Clipboard' : '📋 Copy Address'}
          </button>
        </div>

        {/* Strategy & Governance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
           <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="text-neon-orange font-black uppercase tracking-tight text-xl mb-4 italic">⛏️ Egalitarian Collective Strategy</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  Monero&apos;s RandomX algorithm was specifically engineered to resist ASIC monopolies and prioritize general-purpose consumer CPUs. It is not about max hash power or expensive hardware; it is about combined community volume from whatever hardware you have.
                </p>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-2">
                    <span className="text-gray-500">Destination</span>
                    <span className="text-neon-cyan">100% Direct Community Treasury</span>
                 </div>
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-2">
                    <span className="text-gray-500">Hardware Target</span>
                    <span className="text-neon-orange">Everyday CPUs / Gaming Rigs</span>
                 </div>
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-2">
                    <span className="text-gray-500">Pool Routing</span>
                    <span className="text-white">SupportXMR (Global Node Relay)</span>
                 </div>
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold pb-2">
                    <span className="text-gray-500">Long-term Energy Model</span>
                    <span className="text-emerald-400">Zero-Cost Solar Microgrids</span>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="text-4xl mb-3">🏛️</div>
                <h3 className="text-white font-black uppercase tracking-tight text-xl mb-2">Treasury Impact & Proposals</h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                   100% of mined Monero accumulates in the collective treasury. When we reach meaningful milestones, community members submit proposals and vote on allocations as detailed in the <span className="text-neon-orange font-bold">Ground Zero White Paper</span>:
                </p>
                <ul className="text-xs text-gray-400 space-y-2 mb-6 text-left pl-1">
                   <li className="flex items-center gap-2">
                      <span className="text-neon-orange">☀️</span>
                      <span><strong className="text-white">Solar Mining Operations:</strong> Building off-grid renewable rigs so future compute is 100% free</span>
                   </li>
                   <li className="flex items-center gap-2">
                      <span className="text-neon-cyan">🏢</span>
                      <span><strong className="text-white">Community Data Centers:</strong> Sovereign edge computing and local mesh servers</span>
                   </li>
                   <li className="flex items-center gap-2">
                      <span className="text-emerald-400">🏡</span>
                      <span><strong className="text-white">Homeless Shelters:</strong> Modular housing and real-world humanitarian mutual aid</span>
                   </li>
                   <li className="flex items-center gap-2">
                      <span className="text-neon-pink">🏜️</span>
                      <span><strong className="text-white">Ground Zero Settlements:</strong> Autonomous, resilient solarpunk desert cities</span>
                   </li>
                </ul>
              </div>
              <AnimatedButton variant="primary" onClick={() => navigate('/governance')}>
                 View Governance & Proposals
              </AnimatedButton>
           </div>
        </div>

        {/* SupportXMR Community Pool Dashboard */}
        <div className="mt-12 animate-slide-up" style={{ animationDelay: '300ms' }}>
           <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                 <div className="flex items-center gap-3">
                    <span className="text-xl">📊</span>
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neon-orange">Network Node Statistics</h3>
                 </div>
                 <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                    Connected_To: SupportXMR_Global
                 </div>
              </div>
              <iframe
                src={`https://supportxmr.com/#/dashboard?address=${TREASURY_WALLET}`}
                title="Support XMR Mining Pool Dashboard"
                className="w-full h-[800px] border-0 bg-[#0a0c10]"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-pointer-lock"
                allow="clipboard-read; clipboard-write"
              />
           </div>
        </div>
      </div>
    </div>
  )
}
