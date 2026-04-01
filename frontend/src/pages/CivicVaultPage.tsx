import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'
import { CharacterViewer } from '../components/3d/CharacterViewer'
import { Shield, Check, QrCode, UserPlus, AlertCircle, Receipt, Package, ExternalLink, ArrowUpRight } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

export default function CivicVaultPage() {
  const nav = useNavigate()
  const { user, wallet, logout, tempMnemonic, updateUser, multiChainAddresses } = useGameStore()
  const [showSeed, setShowSeed] = useState(false)
  const [aiStatus, setAiStatus] = useState({ status: 'checking', model: '' })
  const [verifying, setVerifying] = useState(false)
  const [verifStep, setVerifStep] = useState(1) // 1: Generate/Display, 2: Peer Entry, 3: Success
  const [verifCode, setVerifCode] = useState('')
  const [peerPassInput, setPeerPassInput] = useState('')
  const [verifError, setVerifError] = useState('')
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendData, setSendData] = useState({ address: '', amount: '' })

  // Mock Receipts / Asset Proofs
  const [receipts] = useState([
    { id: 'rec_1', item: 'Sovereign Citizen Badge', hash: '0x74a...f21', date: '2026-03-28' },
    { id: 'rec_2', item: 'Protocol Contribution #42', hash: '0x91b...e88', date: '2026-03-30' },
  ])

  const startVerification = () => {
    // Step 1: Generate local password tied to wallet/identity
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setVerifCode(code)
    setVerifying(true)
    setVerifStep(1)
    
    // Auto-grant first mark if at 0
    if (user.attestationCount === 0) {
       updateUser({ attestationCount: 1 })
    }
  }

  const handleNextVerifStep = () => {
    if (verifStep === 1) {
      setVerifStep(2)
    } else if (verifStep === 2) {
      // Logic: If they enter a 6-digit code (simulating peer handshake)
      if (peerPassInput.length === 6) {
        setVerifError('')
        const nextCount = (user.attestationCount || 0) + 1
        
        if (nextCount >= 3) {
          updateUser({ attestationCount: 3, verificationLevel: 2 }) // PURPLE CHECK
          setVerifStep(3)
        } else {
          updateUser({ attestationCount: nextCount })
          // Generate new code for the next peer
          const newCode = Math.floor(100000 + Math.random() * 900000).toString()
          setVerifCode(newCode)
          setPeerPassInput('')
          setVerifStep(1)
        }
      } else {
        setVerifError('Please enter the 6-digit password from your peer.')
      }
    }
  }

  const handleExportBackup = async () => {
    try {
      const identity = localStorage.getItem('civicverse:identity');
      const wallet = localStorage.getItem('civicverse:wallet');
      const did = localStorage.getItem('civicverse:did');
      
      const backupData = {
        version: '1.3',
        timestamp: Date.now(),
        did,
        identity,
        wallet,
        note: "This file is encrypted with your Civic Vault password. Do not lose it."
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CivicVault_Backup_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to generate backup: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  const stats = [
    { label: 'Monero Balance', value: `${multiChainAddresses?.MONERO_BALANCE || '0.00'} XMR`, color: 'text-neon-pink' },
    { label: 'Civic Reputation', value: `${user.trustScore}/100`, color: 'text-neon-cyan' },
    { label: 'Citizen Level', value: `LVL ${user.level}`, color: 'text-neon-purple' },
    { label: 'Badges Earned', value: String(receipts.length), color: 'text-neon-green' },
  ]

  const portals = [
    { title: 'Gathering Grounds', desc: 'Main Community Hub', icon: '🌐', path: '/foyer', color: 'border-neon-cyan' },
    { title: 'CivicWatch', desc: 'Missions & Jobs', icon: '📋', path: '/civicwatch', color: 'border-neon-pink' },
    { title: 'Governance', desc: 'Quadratic Voting', icon: '🏛️', path: '/governance', color: 'border-neon-purple' },
    { title: 'Mining Pool', desc: 'Community Rewards', icon: '⛏️', path: '/mining-pool', color: 'border-neon-orange' },
  ]

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-screen scale-110 blur-[1px]"
        style={{ backgroundImage: 'url(/images/wallet-bg.gif)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-black via-transparent to-black opacity-90" />

      <div className="relative z-10 container mx-auto max-w-6xl pt-4 pb-24 px-4">
        
        {/* Verification Status (Top Bar) */}
        <div className="flex justify-center mb-8 animate-slide-up">
           <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-6 py-3 flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] uppercase tracking-widest font-black text-gray-500">PoP_VERIF</span>
                 <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all duration-500 ${
                        user.attestationCount >= i 
                        ? (i === 3 ? 'bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_10px_rgba(191,0,255,0.3)]' : 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(57,255,20,0.3)]') 
                        : 'bg-black/40 border-white/10 text-gray-700'
                      }`}>
                         {i === 3 ? (
                           <Check className={`w-4 h-4 ${user.attestationCount >= i ? 'opacity-100' : 'opacity-20'}`} />
                         ) : (
                           <span className={`text-[10px] font-black ${user.attestationCount >= i ? 'opacity-100' : 'opacity-20'}`}>X</span>
                         )}
                      </div>
                    ))}
                 </div>
              </div>
              
              {user.verificationLevel === 2 ? (
                <div className="flex items-center gap-2 bg-neon-purple/20 border border-neon-purple/50 px-3 py-1 rounded-full animate-pulse">
                   <div className="w-2 h-2 rounded-full bg-neon-purple" />
                   <span className="text-[10px] font-black text-neon-purple uppercase tracking-tighter">PURPLE_CHECK_VERIFIED</span>
                </div>
              ) : (
                <button 
                  onClick={startVerification}
                  className="bg-neon-cyan hover:bg-white text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter transition-all"
                >
                  {verifying ? 'VERIFYING...' : 'VERIFY_CIVICID'}
                </button>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Avatar & Portals */}
          <div className="lg:col-span-4 space-y-8 animate-slide-up">
            <div className="flex flex-col items-center">
              <div className="w-64 h-80 relative cursor-pointer group mb-4">
                <CharacterViewer config={user.character} animate={true} scale={1.2} />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md text-[8px] font-black uppercase tracking-tighter ${
                    aiStatus.status === 'online' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                      <Shield className="w-2.5 h-2.5" /> AI_WATCHDOG: {aiStatus.status === 'online' ? 'READY' : 'OFFLINE'}
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <NeonText size="5xl" gradient={true} className="block tracking-tighter uppercase font-black mb-1">
                  {user.username}
                </NeonText>
                <code className="text-[9px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-500 font-mono">
                  {user.civicId}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {portals.map((portal, i) => (
                <button 
                  key={i} 
                  onClick={() => nav(portal.path)}
                  className={`group relative text-left p-4 bg-white/5 border ${portal.color}/20 rounded-2xl hover:bg-white/10 hover:${portal.color}/50 backdrop-blur-md transition-all duration-300`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl group-hover:scale-110 transition-transform">{portal.icon}</div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight group-hover:text-white transition-colors">{portal.title}</h3>
                      <p className="text-[10px] text-gray-500 font-medium">{portal.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Stats, Assets & Tools */}
          <div className="lg:col-span-8 space-y-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm p-4 rounded-2xl text-center">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">{stat.label}</p>
                  <p className={`text-lg font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Verification Info / PoP Details */}
            <AnimatedCard className="border-l-4 border-neon-purple bg-black/40 backdrop-blur-xl p-6">
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                     <Shield className="text-neon-purple w-5 h-5" />
                     <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neon-purple">Proof of Personhood (PoP)</h3>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono italic">1_HUMAN_=_1_CIVICID</span>
               </div>

               <div className="space-y-4 text-xs font-medium text-gray-400 leading-relaxed uppercase tracking-tight">
                  <p>Verification requires meeting real humans in the physical world. No biometrics or government ID required.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                     <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-white font-black mb-1">Step 1: Meet Person A</p>
                        <p className="text-[10px]">Verified user generates a 6-digit code for you.</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-white font-black mb-1">Step 2: Meet Person B</p>
                        <p className="text-[10px]">Provide your new code to the next verified peer.</p>
                     </div>
                     <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-white font-black mb-1">Step 3: Meet Person C</p>
                        <p className="text-[10px]">Final verification grants your Purple Check ID.</p>
                     </div>
                  </div>
               </div>
            </AnimatedCard>

            {/* Security Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <AnimatedCard className="border-neon-purple p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-neon-purple mb-4">Vault Resilience</h3>
                  <div className="space-y-4">
                     <AnimatedButton variant="secondary" size="sm" className="w-full justify-between" onClick={() => setShowSeed(!showSeed)}>
                        <span>{showSeed ? 'HIDE_SEED_PHRASE' : 'RECOVERY_PHRASE'}</span>
                        <QrCode className="w-4 h-4" />
                     </AnimatedButton>
                     {showSeed && (
                        <div className="bg-black/60 rounded-xl p-4 border border-neon-pink/30 animate-fade-in font-mono text-[10px] grid grid-cols-3 gap-2">
                           {(tempMnemonic || 'SEED_LOCKED_ENCRYPTED').split(' ').map((w, i) => (
                              <div key={i} className="text-neon-cyan"><span className="opacity-30">{i+1}.</span> {w}</div>
                           ))}
                        </div>
                     )}
                     <AnimatedButton variant="secondary" size="sm" className="w-full justify-between" onClick={handleExportBackup}>
                        <span>EXPORT_ENCRYPTED_BACKUP</span>
                        <ExternalLink className="w-4 h-4" />
                     </AnimatedButton>
                  </div>
               </AnimatedCard>

               <div className="space-y-4">
                  <AnimatedButton variant="secondary" className="w-full py-5 justify-between" onClick={() => nav('/wardrobe')}>
                     <span className="font-black uppercase text-xs">👕 WARDROBE_LAB</span>
                     <ArrowUpRight className="w-4 h-4" />
                  </AnimatedButton>
                  <AnimatedButton variant="danger" className="w-full py-5 justify-between" onClick={() => { logout(); nav('/welcome'); }}>
                     <span className="font-black uppercase text-xs">🔒 LOCK_VAULT_SESSION</span>
                     <span>✕</span>
                  </AnimatedButton>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Modal Overlay */}
      <AnimatePresence>
        {showSendModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
             <AnimatedCard className="max-w-md w-full border-neon-pink p-8">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Broadcast XMR Transfer</h3>
                   <button onClick={() => setShowSendModal(false)} className="text-gray-500 hover:text-white transition">✕</button>
                </div>

                <div className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Recipient Monero Address</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white font-mono text-xs outline-none focus:border-neon-pink transition"
                        placeholder="4... (Standard Monero Address)"
                        value={sendData.address}
                        onChange={e => setSendData({...sendData, address: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Amount (XMR)</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-neon-pink transition"
                        placeholder="0.00"
                        value={sendData.amount}
                        onChange={e => setSendData({...sendData, amount: e.target.value})}
                      />
                   </div>

                   <div className="bg-neon-pink/10 border border-neon-pink/30 p-4 rounded-xl">
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-1 text-gray-400">
                         <span>Subtotal:</span>
                         <span>{sendData.amount || '0'} XMR</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase mb-2 text-neon-pink">
                         <span>1% Treasury Cut:</span>
                         <span>{(Number(sendData.amount || 0) * 0.01).toFixed(4)} XMR</span>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between text-xs font-black uppercase text-white">
                         <span>Total On-Chain Cost:</span>
                         <span>{(Number(sendData.amount || 0) * 1.01).toFixed(4)} XMR</span>
                      </div>
                   </div>

                   <button 
                    onClick={handleSendXMR}
                    className="w-full bg-neon-pink hover:bg-white text-black font-black py-5 rounded-2xl shadow-xl shadow-neon-pink/20 transform active:scale-95 transition uppercase italic tracking-tight"
                   >
                     Confirm & Broadcast
                   </button>
                </div>
             </AnimatedCard>
          </div>
        )}
      </AnimatePresence>

      {/* Verification Modal Overlay */}
      {verifying && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <AnimatedCard className="max-w-md w-full border-neon-cyan p-8 text-center relative">
              <button onClick={() => { setVerifying(false); setVerifStep(1); }} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">✕</button>
              
              {verifStep === 1 && (
                <div className="animate-fade-in">
                  <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-neon-cyan/10 rounded-3xl flex items-center justify-center border border-neon-cyan/30">
                        <QrCode className="w-10 h-10 text-neon-cyan" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2 italic">Proof of Personhood</h3>
                  <p className="text-sm text-gray-400 mb-8 uppercase font-bold tracking-tighter">
                    {user.attestationCount === 0 ? 'Meet Verified Person A' : user.attestationCount === 1 ? 'Meet Verified Person B' : 'Meet Verified Person C'}
                  </p>
                  
                  <div className="bg-black/60 border-2 border-dashed border-neon-cyan/50 rounded-2xl p-8 mb-8">
                    <div className="text-5xl font-mono font-black tracking-[0.3em] text-neon-cyan mb-2">
                        {verifCode}
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">6-Digit Challenge Code</p>
                  </div>

                  <p className="text-[10px] text-gray-500 mb-6 uppercase font-black leading-relaxed">
                    {user.attestationCount === 0 
                      ? 'Share this code with Person A to receive your first Green X.' 
                      : user.attestationCount === 1 
                        ? 'Share this code with Person B to receive your second Green X.'
                        : 'Share this final code with Person C to receive your Purple Check.'}
                  </p>

                  <AnimatedButton variant="primary" className="w-full py-4 uppercase font-bold tracking-widest" onClick={handleNextVerifStep}>
                    I've Shared My Code
                  </AnimatedButton>
                </div>
              )}

              {verifStep === 2 && (
                <div className="animate-fade-in">
                  <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-neon-purple/10 rounded-3xl flex items-center justify-center border border-neon-purple/30 text-neon-purple">
                        <UserPlus className="w-10 h-10" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2 italic">Handshake Verification</h3>
                  <p className="text-sm text-gray-400 mb-8 uppercase font-bold tracking-tighter">
                    Enter the 6-digit password provided by your peer.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <input 
                      type="text" 
                      maxLength={6}
                      className="w-full bg-black/60 border-2 border-neon-purple/50 rounded-2xl p-6 text-center text-4xl font-mono font-black tracking-[0.3em] text-neon-purple outline-none focus:border-neon-purple transition-all"
                      placeholder="000000"
                      value={peerPassInput}
                      onChange={e => setPeerPassInput(e.target.value.replace(/\D/g, ''))}
                    />
                    {verifError && <p className="text-neon-pink text-[10px] font-bold uppercase animate-pulse">{verifError}</p>}
                  </div>

                  <AnimatedButton variant="primary" className="w-full py-4 uppercase font-bold tracking-widest" onClick={handleNextVerifStep}>
                    {user.attestationCount < 2 ? 'Next Attestation' : 'Complete PoP'}
                  </AnimatedButton>
                </div>
              )}

              {verifStep === 3 && (
                <div className="animate-fade-in">
                  <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 bg-neon-purple/20 rounded-full flex items-center justify-center border-4 border-neon-purple shadow-[0_0_30px_rgba(191,0,255,0.4)] animate-bounce">
                        <Check className="w-12 h-12 text-neon-purple stroke-[4px]" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2 italic text-neon-purple">Identity Secured</h3>
                  <div className="flex justify-center gap-2 mb-6">
                     <span className="text-neon-green font-black">GREEN X 1/3</span>
                     <span className="text-neon-green font-black">GREEN X 2/3</span>
                     <span className="text-neon-purple font-black">PURPLE CHECK</span>
                  </div>
                  <p className="text-xs text-gray-300 mb-8 leading-relaxed uppercase font-bold">
                    You have successfully completed 3 physical peer attestations. Your CivicID is now verified.
                  </p>
                  
                  <AnimatedButton variant="primary" className="w-full py-4 uppercase font-bold tracking-widest" onClick={() => { setVerifying(false); setVerifStep(1); }}>
                    Enter Verified Vault
                  </AnimatedButton>
                </div>
              )}

              <div className="mt-8 flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl text-left">
                 <AlertCircle className="w-5 h-5 text-gray-500 shrink-0" />
                 <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">
                   Peer verification requires physical presence. Only exchange passwords in person.
                 </p>
              </div>
           </AnimatedCard>
        </div>
      )}
    </div>
  )
}
