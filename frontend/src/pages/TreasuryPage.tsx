import { CIVICVERSE_LOGO } from '../assets/logo';
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { AnimatedButton, AnimatedCard, NeonText, GradientOrb } from '../components'
import { ExternalLink, Copy, Check, Shield, ArrowLeft, Cpu, Vote, RefreshCw } from 'lucide-react'

export default function TreasuryPage() {
  const nav = useNavigate()
  const [copiedTreasury, setCopiedTreasury] = useState(false)
  const [microTxMessage, setMicroTxMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const TREASURY_WALLET = '438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp'

  const [treasuryStats, setTreasuryStats] = useState({
    pendingXmr: 0.001615,
    paidXmr: 0,
    totalHashes: 1609912860,
    validShares: 7528,
    activeWorkers: 1,
    loading: true,
    lastUpdated: ''
  })

  const fetchTreasuryStats = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`https://www.supportxmr.com/api/miner/${TREASURY_WALLET}/stats`)
      if (res.ok) {
        const data = await res.json()
        setTreasuryStats({
          pendingXmr: (data.amtDue || 0) / 1e12,
          paidXmr: (data.amtPaid || 0) / 1e12,
          totalHashes: data.totalHashes || 0,
          validShares: data.validShares || 0,
          activeWorkers: data.hash > 0 ? 1 : 0,
          loading: false,
          lastUpdated: new Date().toLocaleTimeString()
        })
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTreasuryStats()
    const interval = setInterval(fetchTreasuryStats, 15000)
    return () => clearInterval(interval)
  }, [])

  const copyAddress = () => {
    navigator.clipboard.writeText(TREASURY_WALLET)
    setCopiedTreasury(true)
    setTimeout(() => setCopiedTreasury(false), 2000)
  }

  const handleMicroTx = async () => {
    try {
      const processMicrotransaction = useGameStore.getState().processMicrotransaction
      if (processMicrotransaction) {
        await processMicrotransaction(5, 'Community Treasury', 'Civic UBI Contribution')
        setMicroTxMessage('âœ“ Contributed 5.0 CIVIC! 0.05 CIVIC routed to Sovereign UBI Pool.')
        setTimeout(() => setMicroTxMessage(''), 5000)
      } else {
        setMicroTxMessage('âœ“ Direct Contribution Recorded.')
        setTimeout(() => setMicroTxMessage(''), 5000)
      }
    } catch (e: any) {
      alert(e.message || 'Microtransaction failed')
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
      {/* Background Ambience */}
      <GradientOrb delay={0} size={500} className="top-[-10%] right-[-10%] opacity-20" />
      <GradientOrb delay={2} size={400} className="bottom-[-10%] left-[-10%] opacity-15" />
      <div className="absolute inset-0 grid-glow opacity-10 pointer-events-none" />

      <div className="relative z-10 container mx-auto max-w-6xl space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-slide-up border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img 
                src={CIVICVERSE_LOGO} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "./Civicverselogo.png"; }} 
                alt="CV" 
                className="w-6 h-6 rounded-full object-cover shadow-[0_0_12px_rgba(255,107,0,0.6)] border border-orange-500/50" 
              />
              <span className="text-[10px] uppercase tracking-[0.4em] text-neon-orange font-bold">
                Network Infrastructure // Sovereign Treasury Reserve
              </span>
              <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold uppercase tracking-widest animate-pulse ml-2">
                Live Synced
              </span>
            </div>
            
            <NeonText size="5xl" gradient={true} className="block tracking-tighter uppercase font-black">
              Community Treasury
            </NeonText>
            
            <p className="text-gray-300 mt-2 max-w-2xl leading-relaxed text-sm md:text-base">
              Autonomous on-chain reserve funded by collective CPU mining and community micro-contributions to finance physical Ground Zero off-grid solar infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <AnimatedButton
              variant="secondary"
              size="md"
              onClick={() => nav('/vault')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Vault</span>
            </AnimatedButton>

            <AnimatedButton
              variant="primary"
              size="md"
              onClick={() => nav('/mining-pool')}
              className="flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Mine to Treasury</span>
            </AnimatedButton>
          </div>
        </div>

        {/* Real-time Status Card */}
        <div className="bg-white/5 border border-neon-orange/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-[0_0_40px_rgba(255,107,0,0.15)] animate-slide-up">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(255,107,0,0.3)] shrink-0">
                ðŸ›ï¸
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">Monero Reserve & Mining Accumulator</h2>
                <p className="text-xs text-gray-400">
                  Direct on-chain ledger synced with SupportXMR mining pool
                  {treasuryStats.lastUpdated && ` (Updated at ${treasuryStats.lastUpdated})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchTreasuryStats}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-gray-300 flex items-center gap-1.5 transition-all"
                title="Refresh Live Pool Stats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-neon-orange' : ''}`} />
                <span>Sync Now</span>
              </button>

              <button
                onClick={handleMicroTx}
                className="px-4 py-2 rounded-xl bg-neon-pink/20 hover:bg-neon-pink/30 border border-neon-pink/50 text-neon-pink text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,0,128,0.25)] flex items-center gap-1.5"
              >
                <span>ðŸ’¸</span>
                <span>1% UBI Contribution</span>
              </button>
            </div>
          </div>

          {microTxMessage && (
            <div className="mb-6 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono text-xs font-bold animate-bounce text-center">
              {microTxMessage}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-dark-800/60 border border-white/10 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Accumulated Monero Balance</p>
              <p className="text-3xl font-black text-neon-orange font-mono">
                {(treasuryStats.pendingXmr + treasuryStats.paidXmr).toFixed(6)} <span className="text-xs text-gray-400">XMR</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-2">
                Pending Pool Settlement: <span className="text-white font-mono font-semibold">{treasuryStats.pendingXmr.toFixed(6)} XMR</span>
              </p>
            </div>

            <div className="bg-dark-800/60 border border-white/10 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Community Hashes</p>
              <p className="text-3xl font-black text-neon-cyan font-mono">
                {(treasuryStats.totalHashes / 1e9).toFixed(2)} <span className="text-xs text-gray-400">GH</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-2">
                <span className="text-neon-cyan font-semibold">{treasuryStats.validShares.toLocaleString()}</span> Valid PoW Shares
              </p>
            </div>

            <div className="bg-dark-800/60 border border-white/10 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Next GUI Wallet Payout</p>
              <p className="text-3xl font-black text-white font-mono">
                0.0100 <span className="text-xs text-gray-400">XMR</span>
              </p>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-neon-orange transition-all duration-500"
                  style={{ width: `${Math.min(100, (treasuryStats.pendingXmr / 0.01) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                {((treasuryStats.pendingXmr / 0.01) * 100).toFixed(1)}% to on-chain payout
              </p>
            </div>

            <div className="bg-dark-800/60 border border-white/10 p-5 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Primary Allocation Target</p>
              <p className="text-lg font-black text-emerald-400 mt-1">Ground Zero Node 01</p>
              <p className="text-xs text-gray-300 mt-1 font-medium">Off-Grid Solar Mining & Shelters</p>
              <p className="text-[10px] text-emerald-400/80 mt-2">â— Active Milestone Phase</p>
            </div>
          </div>

          {/* Public Monero Treasury Address Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 overflow-hidden w-full">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-neon-cyan shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">Public Monero Treasury Address</div>
                <div className="text-xs text-neon-cyan font-mono truncate select-all">{TREASURY_WALLET}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                onClick={copyAddress}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 flex items-center gap-1.5"
              >
                {copiedTreasury ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTreasury ? 'Copied' : 'Copy Address'}</span>
              </button>
              <a
                href={`https://www.supportxmr.com/?addr=${TREASURY_WALLET}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-neon-orange transition-all flex items-center gap-1.5"
              >
                <span>Pool Ledger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Monero GUI Wallet Sync Explanation */}
          <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-xs text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">â„¹ï¸</span>
              <div className="space-y-2">
                <p className="font-bold text-neon-purple uppercase tracking-wider text-sm">
                  How Monero GUI Wallet Syncs With This Treasury
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <p className="font-semibold text-white mb-1">1. Real-Time Mining Stream</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      All hashes from community rigs pool on SupportXMR. Real-time yield (<code className="text-neon-cyan font-bold">{treasuryStats.pendingXmr.toFixed(6)} XMR</code>) updates automatically every 15 seconds.
                    </p>
                  </div>
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <p className="font-semibold text-white mb-1">2. Automated On-Chain Settlement</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      When pending balance reaches the 0.01 XMR payout threshold, SupportXMR automatically broadcasts an on-chain transaction directly to our desktop Monero GUI Wallet.
                    </p>
                  </div>
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <p className="font-semibold text-white mb-1">3. Auditable View-Only Key</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Because Monero keeps balances private, our community audits reserves using our wallet&apos;s read-only <span className="text-white font-semibold">Public View Key</span> (Settings â†’ Keys in Monero GUI) without exposing the spend key.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy & Whitepaper Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">ðŸ—ï¸</span>
                <h3 className="text-white font-black uppercase tracking-tight text-xl">
                  Treasury Allocation Targets
                </h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                100% of accumulated Monero is earmarked for tangible, real-world mutual aid and decentralized physical infrastructure under the <span className="text-neon-orange font-bold">Ground Zero White Paper</span>:
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-neon-orange text-lg shrink-0">â˜€ï¸</span>
                  <div>
                    <p className="text-xs font-bold text-white">Solar Mining Operations</p>
                    <p className="text-[11px] text-gray-400">Off-grid renewable arrays so future compute & hashing is 100% free.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-neon-cyan text-lg shrink-0">ðŸ¢</span>
                  <div>
                    <p className="text-xs font-bold text-white">Community Data Centers</p>
                    <p className="text-[11px] text-gray-400">Sovereign edge computing, local mesh nodes, and encrypted storage.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-emerald-400 text-lg shrink-0">ðŸ¡</span>
                  <div>
                    <p className="text-xs font-bold text-white">Modular Housing & Homeless Shelters</p>
                    <p className="text-[11px] text-gray-400">Direct physical construction and mutual aid for sovereign living.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-neon-pink text-lg shrink-0">ðŸœï¸</span>
                  <div>
                    <p className="text-xs font-bold text-white">Ground Zero Desert Settlements</p>
                    <p className="text-[11px] text-gray-400">Autonomous, self-sustaining solarpunk community settlements.</p>
                  </div>
                </div>
              </div>
            </div>

            <AnimatedButton
              variant="primary"
              size="md"
              onClick={() => nav('/governance')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Vote className="w-4 h-4" />
              <span>Vote On Treasury Proposals</span>
            </AnimatedButton>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">â›ï¸</span>
                <h3 className="text-neon-orange font-black uppercase tracking-tight text-xl">
                  Community Compute Inflow
                </h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Monero&apos;s RandomX protocol prevents ASIC centralization by design, empowering every desktop, laptop, and idle CPU to act as an egalitarian funder of the treasury.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400">Destination</span>
                  <span className="text-neon-cyan font-bold font-mono">100% Public Treasury</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400">Target Devices</span>
                  <span className="text-neon-orange font-bold font-mono">Gaming PCs, Laptops, Servers</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400">Mining Pool Relay</span>
                  <span className="text-white font-bold font-mono">SupportXMR Global</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-gray-400">Payout Minimum</span>
                  <span className="text-emerald-400 font-bold font-mono">0.0100 XMR On-Chain</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1">
                  <span className="text-gray-400">Auditability</span>
                  <span className="text-purple-400 font-bold font-mono">Public View Key / Open Ledger</span>
                </div>
              </div>
            </div>

            <AnimatedButton
              variant="secondary"
              size="md"
              onClick={() => nav('/mining-pool')}
              className="w-full flex items-center justify-center gap-2 border-neon-orange/40 text-neon-orange hover:bg-neon-orange/10"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Mining Dashboard</span>
            </AnimatedButton>
          </div>
        </div>

        {/* Live SupportXMR Community Pool Ledger Embed */}
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <span className="text-xl">ðŸ“Š</span>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neon-orange">
                  Live Pool Ledger & Worker Telemetry
                </h3>
              </div>
              <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                SupportXMR // Auditable Public Stream
              </div>
            </div>
            <iframe
              src={`https://www.supportxmr.com/?addr=${TREASURY_WALLET}`}
              title="SupportXMR Community Treasury Pool Ledger"
              className="w-full h-[750px] border-0 bg-[#0a0c10]"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-popups-to-escape-sandbox allow-pointer-lock"
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
