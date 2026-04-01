import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CivicIdentity from '../lib/civicIdentity';
import { 
  Shield, 
  Zap
} from 'lucide-react';
import { AnimatedCard, NeonText, GradientOrb, GodotFoyer } from '../components';
import { motion } from 'framer-motion';

export default function FoyerPage() {
  const nav = useNavigate();
  const [did, setDid] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDid = async () => {
      const storedDid = await CivicIdentity.getStoredDID();
      setDid(storedDid);
    };
    fetchDid();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0c10] text-white overflow-hidden pb-24">
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
          
          <div className="flex flex-col items-center gap-2 mb-8">
            <p className="text-blue-500 text-xl tracking-[0.25em] font-bold uppercase">
              The Decentralized Coordination Layer
            </p>
          </div>
        </div>

        {/* Content Area - Centrally the Foyer Game */}
        <div className="min-h-[600px] mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[80vh] min-h-[600px] rounded-[3rem] overflow-hidden border border-gray-800 shadow-2xl shadow-blue-900/20"
          >
            <GodotFoyer onExit={() => nav('/vault')} />
          </motion.div>
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
             onClick={() => nav('/vault')}
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
  );
}
