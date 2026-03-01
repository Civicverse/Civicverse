import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'
import { Info, ShoppingBag, Users as UsersIcon, Landmark, ArrowRight, Shield, Zap } from 'lucide-react'

export default function FoyerPage() {
  const nav = useNavigate()
  const [activeTab, setActiveTab] = React.useState<'overview' | 'marketplace' | 'community' | 'governance'>('overview')

  return (
    <div className="relative min-h-screen bg-[#0a0c10] text-white overflow-hidden">
      {/* Animated background orbs */}
      <GradientOrb delay={0} size={400} />
      <GradientOrb delay={2} size={300} />
      <GradientOrb delay={4} size={350} />

      {/* Grid background */}
      <div className="absolute inset-0 grid-glow opacity-20 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-6xl py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="text-blue-500 w-8 h-8" />
            <div className="h-px w-12 bg-gray-800"></div>
            <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">Identity Sovereign</span>
            <div className="h-px w-12 bg-gray-800"></div>
            <Zap className="text-blue-500 w-8 h-8" />
          </div>
          
          <NeonText size="6xl" gradient={true} className="block mb-4 italic tracking-tighter uppercase font-black">
            ∞ CIVICVERSE HUB
          </NeonText>
          
          <p className="text-blue-500 text-xl tracking-[0.25em] mb-8 font-bold uppercase">
            The Decentralized Coordination Layer
          </p>
          
          <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed font-medium">
            A peer-to-peer ecosystem where individuals own their data, control their narrative, 
            and coordinate through transparent, decentralized governance. No extraction. Pure sovereignty.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center mb-12">
          {[
            { id: 'overview' as const, label: 'Overview', icon: <Info className="w-5 h-5" /> },
            { id: 'marketplace' as const, label: 'Marketplace', icon: <ShoppingBag className="w-5 h-5" /> },
            { id: 'community' as const, label: 'Community', icon: <UsersIcon className="w-5 h-5" /> },
            { id: 'governance' as const, label: 'Governance', icon: <Landmark className="w-5 h-5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3.5 rounded-2xl font-black uppercase tracking-tight italic transition-all duration-300 border flex items-center gap-3 ${
                activeTab === tab.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-900/40 scale-105'
                  : 'bg-[#161b22] border-gray-800 text-gray-500 hover:border-gray-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[450px] mb-12">
          {/* Governance Tab */}
          {activeTab === 'governance' && (
            <div className="animate-slide-up">
               <div className="bg-[#161b22] border border-gray-800 rounded-[3rem] p-12 md:p-20 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                  
                  <div className="w-24 h-24 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/30">
                     <Landmark className="w-12 h-12 text-blue-500" />
                  </div>
                  
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-6 text-white">Decentralized Governance</h2>
                  
                  <p className="text-gray-400 max-w-2xl mb-10 text-lg leading-relaxed font-medium">
                    Participate in the evolution of CivicVerse. Vote on protocol parameters, 
                    treasury allocations, and community initiatives using your cryptographically 
                    secured Civic Identity.
                  </p>
                  
                  <button 
                    onClick={() => nav('/governance')}
                    className="group bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-12 rounded-2xl shadow-2xl shadow-blue-900/30 transition-all flex items-center gap-4 uppercase italic tracking-tight text-xl active:scale-95"
                  >
                    Launch Governance Portal
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </div>
          )}

          {/* Overview, Marketplace, Community Tabs */}
          {(activeTab === 'overview' || activeTab === 'marketplace' || activeTab === 'community') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
              {activeTab === 'overview' && (
                <>
                  <AnimatedCard delay={100} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-blue-500/50 transition-colors">
                    <h3 className="text-blue-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>🔐</span> Zero-Custody
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Your Civic ID is generated locally and encrypted on your device. No platform holds your keys. Pure sovereignty.
                    </p>
                  </AnimatedCard>
                  <AnimatedCard delay={200} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-purple-500/50 transition-colors">
                    <h3 className="text-purple-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>🌍</span> Peer-to-Peer
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Connect directly with other citizens. No central authority. Communications encrypted end-to-end.
                    </p>
                  </AnimatedCard>
                  <AnimatedCard delay={300} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-blue-500/50 transition-colors">
                    <h3 className="text-blue-500 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>⚡</span> Offline-First
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Works without internet. Syncs when available. Your data stays local unless you explicitly share it.
                    </p>
                  </AnimatedCard>
                </>
              )}

              {activeTab === 'marketplace' && (
                <>
                  <AnimatedCard delay={100} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-orange-500/50 transition-colors">
                    <h3 className="text-orange-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>🏪</span> Marketplace
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Buy and sell directly with other citizens. Services, goods, creative work. No platform fees.
                    </p>
                  </AnimatedCard>
                  <AnimatedCard delay={200} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-green-500/50 transition-colors">
                    <h3 className="text-green-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>✅</span> Trust Ratings
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Transparent reputation system. Your history is your credential. Spam blocked automatically.
                    </p>
                  </AnimatedCard>
                  <AnimatedCard delay={300} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-blue-500/50 transition-colors">
                    <h3 className="text-blue-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>⚡</span> Settlement
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Atomic swaps and escrow. No asset custody. No chargebacks or frozen accounts.
                    </p>
                  </AnimatedCard>
                </>
              )}

              {activeTab === 'community' && (
                <>
                  <AnimatedCard delay={100} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-blue-500/50 transition-colors">
                    <h3 className="text-blue-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>👥</span> Messaging
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      End-to-end encrypted messaging. No central intermediary. Your conversations are private.
                    </p>
                  </AnimatedCard>
                  <AnimatedCard delay={200} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-purple-500/50 transition-colors">
                    <h3 className="text-purple-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>💬</span> Group Spaces
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Create communities. Invite members. Govern spaces collectively. Moderation by citizens.
                    </p>
                  </AnimatedCard>
                  <AnimatedCard delay={300} className="bg-[#161b22] border-gray-800 rounded-3xl p-10 shadow-xl group hover:border-green-500/50 transition-colors">
                    <h3 className="text-green-400 font-black mb-4 text-xl uppercase italic tracking-tight flex items-center gap-3">
                      <span>⭐</span> Reputation
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      Earn trust through action. Portable reputation. Spam filtered algorithmically.
                    </p>
                  </AnimatedCard>
                </>
              )}
            </div>
          )}
        </div>

        {/* Vision Statement */}
        <AnimatedCard delay={400} className="mb-16 border border-gray-800 bg-[#161b22] rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-10 text-center">🚀 The Vision</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
             {[
               { num: '01', title: 'Yours', desc: 'Generated locally, encrypted, non-custodial.' },
               { num: '02', title: 'Portable', desc: 'Take your reputation across any platform.' },
               { num: '03', title: 'Sovereign', desc: 'You own your data. You control your narrative.' },
               { num: '04', title: 'Resistant', desc: 'Censorship-proof and fully peer-to-peer.' }
             ].map((item, i) => (
               <div key={i} className="text-center group">
                  <div className="text-blue-500 font-black text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.num}</div>
                  <h4 className="text-white font-bold uppercase mb-3 tracking-tight text-lg">{item.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{item.desc}</p>
               </div>
             ))}
          </div>
        </AnimatedCard>

        {/* Action Button */}
        <div className="flex justify-center pb-12">
           <button 
             onClick={() => nav('/wallet')}
             className="bg-blue-600 hover:bg-blue-700 text-white font-black py-6 px-16 rounded-[2rem] shadow-2xl shadow-blue-900/40 transition-all hover:scale-105 uppercase italic tracking-tighter text-2xl flex items-center gap-4 active:scale-95"
           >
             <Shield className="w-8 h-8" />
             Access Identity Vault
           </button>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-800 pt-10">
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            Civicverse: Infrastructure for Decentralized Humanity
          </p>
          <div className="flex justify-center gap-4 mt-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
             <div className="h-6 w-px bg-gray-700"></div>
             <span className="text-[10px] font-mono text-blue-400">V0.9.2-NIGHTLY</span>
             <div className="h-6 w-px bg-gray-700"></div>
             <span className="text-[10px] font-mono text-white">EST. 2026</span>
             <div className="h-6 w-px bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
