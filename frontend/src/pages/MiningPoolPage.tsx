import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedButton, NeonText, GradientOrb } from '../components'
import { MiningRigDashboard } from '../components/MiningRigDashboard'
import { useGameStore } from '../store/gameStore'

export default function MiningPoolPage() {
  const navigate = useNavigate()
  const { wallet } = useGameStore()

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-12 px-4">
      <GradientOrb delay={0} size={400} className="top-[-10%] right-[-10%] opacity-20" />
      <div className="absolute inset-0 grid-glow opacity-10" />

      <div className="relative z-10 container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 animate-slide-up">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-neon-orange font-bold mb-2 block">Network Infrastructure</span>
            <NeonText size="5xl" gradient={true} className="block tracking-tighter uppercase font-black">
              Community Mining Pool
            </NeonText>
            <p className="text-gray-400 mt-2 max-w-xl">
              Contribute your local compute power to secure the XMR network and earn community rewards. 1% of all mining proceeds go to the Civicverse Treasury.
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

        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          {wallet && <MiningRigDashboard walletAddress={wallet.address} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
           <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
              <h3 className="text-neon-orange font-black uppercase tracking-tight text-xl mb-4 italic">⛏️ Pool Strategy</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Our pool focuses on low-power, high-efficiency hashing. By joining, you help decentralize the network and fund public works through the automated treasury tax.
              </p>
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-2">
                    <span className="text-gray-500">Pool Fee</span>
                    <span className="text-neon-orange">0%</span>
                 </div>
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-2">
                    <span className="text-gray-500">Treasury Tax</span>
                    <span className="text-neon-cyan">1%</span>
                 </div>
                 <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold pb-2">
                    <span className="text-gray-500">Payout Threshold</span>
                    <span className="text-white">0.01 XMR</span>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md flex flex-col justify-center text-center">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-white font-black uppercase tracking-tight text-xl mb-2">Treasury Impact</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                 Your contributions have helped fund 12 local missions this month.
              </p>
              <AnimatedButton variant="primary" onClick={() => navigate('/governance')}>
                 View Treasury
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
                src="https://supportxmr.com/#/dashboard?address=438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp"
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
