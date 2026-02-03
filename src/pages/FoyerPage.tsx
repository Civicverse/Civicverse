import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Newspaper, BookOpen, ShoppingBag, Users, Radio, Award, MapPin, Zap, Video, Crosshair } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface FoyerZone {
  id: string;
  name: string;
  description: string;
  icon: string;
  details: string;
}

export function FoyerPage() {
  const navigate = useNavigate();
  const { user, wallet, marketplaceBuy, payoutGambling, treasuryBalance, marketplaceHistory, sellers, createProposal, voteProposal, proposals, distributeUBI, miningFacilities, totalCryptoMined, miningActive, startMining, stopMining, totalMiningHashRate, totalTreasuryFromMining, jobs, selectedJob, currentJobStatus, selectJob, acceptJob, verifyJobCompletion, completeJob, currentJobProgress } = useGameStore();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState(0);
  const [showJobVideo, setShowJobVideo] = useState(false);

  const zones: FoyerZone[] = [
    {
      id: 'commerce',
      name: 'Marketplace',
      description: '🛍️ Real Commerce, Real Ownership',
      icon: '🛒',
      details: 'Trade digital wearables, merch, and resellables. NFT stat cards and rep-based unlockables. 1% microtax on all transactions = UBI + mission rewards',
    },
    {
      id: 'schoolhouse',
      name: 'Schoolhouse',
      description: '📚 Crypto-Paid Education',
      icon: '🎓',
      details: 'Learn from real educators earning real crypto. Students earn credentials + DAO power. Interactive civics courses and governance training.',
    },
    {
      id: 'newsstand',
      name: 'Newsstand',
      description: '📰 Live CivicWatch Reports',
      icon: '📑',
      details: 'Stream verified, decentralized civic journalism. Real-time mission reports and community updates. UI feeds push shortform updates based on your rep.',
    },
    {
      id: 'social',
      name: 'Social Arena',
      description: '💬 Community Connection',
      icon: '👥',
      details: 'VOIP-enabled squad formation, chat, and emotes. Spectate live operations. Tip players, support missions, or join causes directly in-game.',
    },
    {
      id: 'universe',
      name: 'Universe Portal',
      description: '🌌 Indie Developer Worlds',
      icon: '🌀',
      details: 'Hub for indie game developers to publish immersive worlds. Portal to community-built mini-games, quests, and experiences. Protocol-aligned experiences only.',
    },
    {
      id: 'avatar',
      name: 'Avatar Customization',
      description: '👕 NFT Wearables',
      icon: '👗',
      details: 'Equip wearables earned via missions. Attach banners, DAO tags, skill badge layers. Real-world merch syncs with in-game gear. Your look = your rep.',
    },
  ];

  const marketplaceItems = [
    { id: 'item1', name: 'Neon Jacket (Real Brand)', price: 150.0, seller: '0xSellerA', description: 'Limited edition neon jacket from Brand X.' },
    { id: 'item2', name: 'AR Glasses', price: 299.99, seller: '0xSellerB', description: 'Augmented reality glasses with HUD.' },
    { id: 'item3', name: 'Concert Ticket - Synthwave Night', price: 45.0, seller: '0xSellerC', description: 'IRL concert ticket redeemable via voucher.' },
  ];

  const [chatMessages, setChatMessages] = useState<{ author: string; text: string; color?: string }[]>([
    { author: 'SYSTEM', text: 'Marketplace live — 1% microtax funds the community treasury.', color: '#00ffcc' },
  ]);

  // Local CreateProposal form component
  function CreateProposalForm({ onCreate }: { onCreate: (title: string, amount: number) => void }) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState<number>(50);
    return (
      <div className="mt-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proposal title" className="w-full mb-2 p-2 rounded bg-dark-600 text-white text-sm" />
        <input value={String(amount)} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" type="number" className="w-full mb-2 p-2 rounded bg-dark-600 text-white text-sm" />
        <button onClick={() => { if (title.trim()) { onCreate(title, amount); setTitle(''); } }} className="w-full px-3 py-2 bg-civic-500 text-white rounded">Create Proposal</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-dark-800/50 border-b border-dark-700 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏛️</span>
              <div>
                <h1 className="text-3xl font-bold text-white">The Foyer</h1>
                <p className="text-dark-300">CivicVerse Lobby City — Where Real Action Meets Digital Identity</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 3D Experience Bubble - Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-civic-600 via-civic-700 to-civic-900 border-2 border-civic-400/50 p-12 shadow-2xl hover:shadow-civic-500/50 transition-shadow"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(14,165,233,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(14,165,233,0.1) 0%, transparent 50%)',
            }}
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-civic-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-civic-400/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center">
              <div className="inline-block mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="text-6xl"
                >
                  🌐
                </motion.div>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">
                Enter 3D Foyer Demo Experience
              </h2>

              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
                Step into an immersive 3D multiplayer city. Avatar carryover • Real-time interactions • Decentralized governance
              </p>

              <motion.button
                onClick={() => navigate('/mmorpg')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-white text-civic-700 font-black text-lg px-12 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
              >
                <span>🚀 Launch 3D Foyer</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="group-hover:translate-x-2 transition-transform"
                >
                  →
                </motion.span>
              </motion.button>

              <motion.button
                onClick={() => navigate('/fpsgame')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-lg px-12 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer group ml-4"
              >
                <span>⚔️ DUNGEON ARENA - P2P BETTING</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="group-hover:translate-x-2 transition-transform"
                >
                  →
                </motion.span>
              </motion.button>

              <p className="text-white/70 text-sm mt-6">
                Unreal Engine 5 • Full Avatar Sync • Live Trading • DAO Governance • FPS Dungeon Combat Arena
              </p>
            </div>
          </div>
        </motion.div>
      
        {/* Treasury & Marketplace History */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-12">
          <h3 className="text-xl font-bold text-white mb-3">Community Treasury</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-dark-300">Treasury Balance</div>
            <div className="text-yellow-400 font-mono text-lg">{(treasuryBalance || 0).toFixed(2)} CIVIC</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-700 p-4 rounded">
              <div className="text-sm text-white font-semibold mb-2">Proposals</div>
              <div className="space-y-2 max-h-52 overflow-auto">
                {(proposals || []).map((p) => (
                  <div key={p.id} className="p-2 border border-dark-600 rounded flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white font-bold">{p.title}</div>
                      <div className="text-xs text-dark-300">Amount: {p.amount.toFixed(2)} CIVIC</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-dark-300">For: {p.votesFor} • Against: {p.votesAgainst}</div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => voteProposal && voteProposal(p.id, true)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Vote For</button>
                        <button onClick={() => voteProposal && voteProposal(p.id, false)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Vote Against</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <CreateProposalForm onCreate={(title, amount) => createProposal && createProposal(title, amount)} />
              </div>
            </div>

            <div className="bg-dark-700 p-4 rounded">
              <div className="text-sm text-white font-semibold mb-2">Marketplace History</div>
              <div className="max-h-52 overflow-auto space-y-2 text-sm text-dark-300">
                {(marketplaceHistory || []).slice().reverse().map((h: any) => (
                  <div key={h.id} className="border border-dark-600 p-2 rounded">
                    <div><span className="text-white font-mono">{h.buyer || 'anon'}</span> bought from <span className="text-white font-mono">{h.seller}</span></div>
                    <div className="text-xs">{h.price.toFixed(2)} CIVIC • {new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="text-xs text-dark-300 mb-2">Distribute UBI from treasury</div>
                <div className="flex gap-2">
                  <button onClick={() => distributeUBI && distributeUBI(50)} className="px-3 py-2 bg-civic-500 text-white rounded">Distribute 50</button>
                  <button onClick={() => distributeUBI && distributeUBI(100)} className="px-3 py-2 bg-civic-500 text-white rounded">Distribute 100</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mining Simulator Section - Enhanced Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-800 border border-dark-700 rounded-xl p-8 mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                ⛏️ Solar Mining Network
              </h2>
              <p className="text-dark-300 mt-2">5 facilities × 5 cryptos • Real-time hash rate & treasury contribution</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startMining && startMining()}
                disabled={miningActive}
                className={`px-4 py-2 rounded font-semibold transition ${
                  miningActive ? 'bg-green-600 text-white' : 'bg-civic-500 hover:bg-civic-600 text-white'
                }`}
              >
                {miningActive ? '⚡ Mining Active' : 'Start Mining'}
              </button>
              <button
                onClick={() => stopMining && stopMining()}
                disabled={!miningActive}
                className={`px-4 py-2 rounded font-semibold transition ${
                  !miningActive ? 'bg-dark-600 text-dark-400' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Stop Mining
              </button>
            </div>
          </div>

          {/* Real-Time Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
              <div className="text-sm text-dark-400 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Total Hash Rate
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono">
                {((totalMiningHashRate || 0) / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-dark-500 mt-1">hashes/sec</div>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
              <div className="text-sm text-dark-400 mb-2">Treasury from Mining</div>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                {(totalTreasuryFromMining || 0).toFixed(2)}
              </div>
              <div className="text-xs text-dark-500 mt-1">CIVIC accumulated</div>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
              <div className="text-sm text-dark-400 mb-2">Total Community Treasury</div>
              <div className="text-2xl font-bold text-yellow-400 font-mono">
                {(treasuryBalance || 0).toFixed(2)}
              </div>
              <div className="text-xs text-dark-500 mt-1">CIVIC</div>
            </div>
          </div>

          {/* Crypto Mining Progress - 100 units per facility */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Crypto Accumulation (100 units max per facility)</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {['BTC', 'ETH', 'Monero', 'Kaspa', 'CIVIC'].map((crypto) => (
                <div key={crypto} className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                  <div className="text-sm text-dark-400 mb-2 font-semibold">{crypto}</div>
                  <div className="text-2xl font-bold text-civic-400 font-mono">
                    {((totalCryptoMined?.[crypto] as number) || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-dark-500 mt-1">/ 100 units</div>
                  <div className="mt-3 w-full bg-dark-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-civic-500 to-civic-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((totalCryptoMined?.[crypto] as number) || 0))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mining Facilities Detail Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">⚙️ Active Mining Facilities</h3>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {(miningFacilities || []).map((facility) => (
                <div key={facility.id} className="bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-civic-500/50 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-white font-semibold text-sm">{facility.name}</div>
                      <div className="text-xs text-dark-400 mt-1">📍 {facility.location}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${facility.active ? 'bg-green-900/50 text-green-300' : 'bg-dark-600 text-dark-400'}`}>
                      {facility.active ? '✓' : '○'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-dark-400">Crypto:</span>
                      <span className="text-civic-400 font-semibold">{facility.cryptoType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Solar:</span>
                      <span className="text-yellow-400">{facility.solarPower}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Hash/sec:</span>
                      <span className="text-green-400 font-mono">{((facility.hashRate || 0) / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-400">Mined:</span>
                      <span className="text-cyan-400 font-mono">{facility.totalMined.toFixed(2)}/100</span>
                    </div>
                  </div>

                  <div className="mt-3 w-full bg-dark-600 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-cyan-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, facility.totalMined)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-civic-900/30 border border-civic-500/30 rounded-lg">
            <p className="text-civic-300 text-sm">
              💡 Real-time mining: 100 units per crypto per facility. Hash rate generates treasury contributions that auto-feed community pool.
            </p>
          </div>
        </motion.div>

        {/* Job Board Section */}
        {!selectedJob ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-8 mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  📋 Job LoadBoard
                </h2>
                <p className="text-dark-300 mt-2">Select a job, watch instructions, complete verification, earn CIVIC with 1% microtax</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(jobs || []).map((job) => (
                <motion.div
                  key={job.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => selectJob && selectJob(job.id)}
                  className="bg-dark-700 rounded-lg p-5 border border-dark-600 hover:border-civic-500/70 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{job.title}</h3>
                      <p className="text-dark-300 text-sm mt-1">{job.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                      job.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                      job.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {job.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-dark-400 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    <span>⏱️ {job.estimatedTime} min</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-dark-400">Reward</div>
                      <div className="text-lg font-bold text-yellow-400">{job.reward} CIVIC</div>
                    </div>
                    <button
                      onClick={() => selectJob && selectJob(job.id)}
                      className="px-4 py-2 bg-civic-500 hover:bg-civic-600 text-white rounded font-semibold text-sm transition"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Job Detail & Dispatch View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-8 mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">{selectedJob?.title}</h2>
              <button
                onClick={() => selectJob && selectJob(null as any)}
                className="text-dark-400 hover:text-white transition text-2xl"
              >
                ✕
              </button>
            </div>

            {currentJobStatus === 'accepting' && (
              <div className="space-y-6">
                {/* Video Instruction Section */}
                {!showJobVideo && (
                  <div className="bg-dark-700 rounded-lg p-6 border border-dark-600 text-center">
                    <Video className="w-16 h-16 mx-auto text-civic-400 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Watch Job Instructions</h3>
                    <p className="text-dark-300 mb-6">Learn how to complete this job correctly and earn your reward</p>
                    <button
                      onClick={() => setShowJobVideo(true)}
                      className="px-6 py-3 bg-civic-500 hover:bg-civic-600 text-white rounded-lg font-semibold transition"
                    >
                      ▶️ Play Video (1:30)
                    </button>
                  </div>
                )}

                {showJobVideo && (
                  <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
                    <div className="bg-black/50 rounded-lg aspect-video mb-4 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-civic-500/20 to-cyan-500/20 animate-pulse"></div>
                      <div className="relative text-center">
                        <div className="text-6xl mb-4">🎬</div>
                        <p className="text-white/80">Job Instruction Video Playing</p>
                        <p className="text-dark-300 text-sm mt-2">Duration: 1:30</p>
                      </div>
                    </div>
                    <p className="text-dark-300 text-sm">
                      Instructions: {selectedJob?.verificationTasks?.join(' → ') || 'Complete job tasks'}
                    </p>
                  </div>
                )}

                {/* Job Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                    <div className="text-xs text-dark-400 mb-2">Location</div>
                    <div className="text-white font-semibold">{selectedJob?.location}</div>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                    <div className="text-xs text-dark-400 mb-2">Duration</div>
                    <div className="text-white font-semibold">{selectedJob?.estimatedTime} min</div>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                    <div className="text-xs text-dark-400 mb-2">Difficulty</div>
                    <div className="text-white font-semibold capitalize">{selectedJob?.difficulty}</div>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                    <div className="text-xs text-dark-400 mb-2">Gross Reward</div>
                    <div className="text-yellow-400 font-semibold">{selectedJob?.reward} CIVIC</div>
                  </div>
                </div>

                {/* Accept Job Button */}
                <button
                  onClick={() => acceptJob && acceptJob(selectedJob?.id || '')}
                  className="w-full px-6 py-4 bg-gradient-to-r from-civic-600 to-civic-500 hover:from-civic-700 hover:to-civic-600 text-white rounded-lg font-bold text-lg transition"
                >
                  🎯 Accept Job & Get Dispatched
                </button>
              </div>
            )}

            {currentJobStatus === 'dispatched' && (
              <div className="space-y-6">
                {/* Pokemon Go Style Dispatch View */}
                <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
                  <h3 className="text-xl font-semibold text-white mb-4">📍 Job Location</h3>
                  <div className="bg-black/50 rounded-lg h-64 mb-4 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-civic-500/10"></div>
                    <div className="relative text-center">
                      <div className="text-6xl mb-4">🗺️</div>
                      <p className="text-white/80">{selectedJob?.location}</p>
                      <p className="text-dark-300 text-sm mt-2">Navigate to destination • ~{selectedJob?.estimatedTime} min away</p>
                    </div>
                  </div>
                  <div className="bg-dark-600 rounded-lg p-4 text-center">
                    <p className="text-dark-300 text-sm mb-4">Progress to job site</p>
                    <div className="w-full bg-dark-500 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 8 }}
                        className="bg-gradient-to-r from-civic-500 to-cyan-500 h-full"
                      ></motion.div>
                    </div>
                  </div>
                </div>

                {/* Verification Tasks */}
                <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Crosshair className="w-5 h-5" /> Verification Tasks
                  </h3>
                  <div className="space-y-3">
                    {selectedJob?.verificationTasks?.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-dark-600 rounded-lg">
                        <input type="checkbox" className="w-5 h-5 rounded" disabled />
                        <span className="text-dark-300">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini-Game Verification */}
                <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
                  <h3 className="text-lg font-semibold text-white mb-4">🎮 Pok\u00e9Stop Spin Verification</h3>
                  <p className="text-dark-300 mb-4">Tap the circle when it appears to verify job completion</p>
                  <button
                    onClick={() => {
                      setVerificationStep(1);
                      setTimeout(() => verifyJobCompletion && verifyJobCompletion(selectedJob?.id || '', Math.random() > 0.3), 2000);
                    }}
                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition"
                  >
                    {verificationStep === 0 ? '🎯 Start Verification' : verificationStep === 1 ? '⏳ Verifying...' : '✓ Complete'}
                  </button>
                </div>
              </div>
            )}

            {currentJobStatus === 'completed' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-900/50 to-cyan-900/50 rounded-lg p-8 border border-green-500/50 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Job Completed!</h3>
                  <p className="text-dark-200 mb-6">Congratulations on completing this mission</p>
                  
                  <div className="bg-dark-700/50 rounded-lg p-4 mb-6">
                    <div className="text-sm text-dark-400 mb-2">Gross Reward</div>
                    <div className="text-3xl font-bold text-yellow-400 mb-3">{selectedJob?.reward} CIVIC</div>
                    <div className="flex items-center justify-around text-sm text-dark-300">
                      <span>Microtax (1%): {(((selectedJob?.reward || 0) * 0.01).toFixed(2))} CIVIC</span>
                      <span className="text-civic-400 font-semibold">Net: {(((selectedJob?.reward || 0) * 0.99).toFixed(2))} CIVIC</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      completeJob && completeJob(selectedJob?.id || '');
                      setShowJobVideo(false);
                      setVerificationStep(0);
                    }}
                    className="w-full px-6 py-3 bg-civic-500 hover:bg-civic-600 text-white rounded-lg font-semibold transition"
                  >
                    Claim Reward & Return to Board
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-civic-900/40 via-civic-800/30 to-civic-900/40 border border-civic-500/40 rounded-xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to The Foyer</h2>
          <p className="text-dark-200 mb-4">
            Think <span className="font-semibold">Conton City from Xenoverse 2</span> meets <span className="font-semibold">GTA Online</span>, but real.
          </p>
          <p className="text-dark-300">
            The Foyer is a persistent, multiplayer lobby city where real-world civic actions shape your digital reputation, and your digital identity unlocks real-world power. 
            Your avatar carries over from CivicWatch with full progression, stat cards, and earned NFTs.
          </p>
          <div className="mt-4 p-4 bg-black/20 rounded-lg border border-civic-500/30">
            <p className="text-civic-300 text-sm">
              🎮 Full avatar carryover from CivicWatch • 🌍 Living ecosystem • 🔗 Decentralized identity = real power
            </p>
          </div>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-800 border border-dark-700 rounded-xl p-6 mb-12"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user?.avatar && (
                <img src={user.avatar} alt={user.username} className="w-16 h-16 rounded-full border-2 border-civic-500" />
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{user?.username}</h3>
                <p className="text-dark-300 text-sm">Level {user?.level} • Trust Score: {user?.trustScore}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-civic-400">{wallet?.balance.toFixed(2)} CIVIC</p>
              <p className="text-dark-300 text-sm">Available</p>
              <div className="mt-2 text-xs text-dark-300">
                Community Treasury: <span className="font-mono text-yellow-400">{(treasuryBalance || 0).toFixed(2)} CIVIC</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Zones Grid */}
        <h2 className="text-2xl font-bold text-white mb-6">Explore The Foyer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {zones.map((zone, index) => (
            <motion.button
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedZone(zone.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-left group"
            >
              <div className="bg-dark-800 border border-dark-700 hover:border-civic-500/50 rounded-xl p-6 h-full transition relative overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-civic-500/5 to-civic-600/5 group-hover:from-civic-500/10 group-hover:to-civic-600/10 transition"></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{zone.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-1">{zone.name}</h3>
                  <p className="text-dark-300 text-sm">{zone.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Zone Detail Modal */}
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedZone(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-800 border border-dark-700 rounded-xl p-8 max-w-2xl w-full"
            >
              {(() => {
                const zone = zones.find((z) => z.id === selectedZone);
                if (!zone) return null;

                return (
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <span className="text-5xl">{zone.icon}</span>
                        <div>
                          <h2 className="text-3xl font-bold text-white">{zone.name}</h2>
                          <p className="text-dark-300">{zone.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedZone(null)}
                        className="text-dark-400 hover:text-white transition text-2xl"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-dark-200 mb-6 leading-relaxed">{zone.details}</p>

                    {/* Zone-Specific Details */}
                    {zone.id === 'commerce' && (
                      <div className="bg-dark-700 rounded-lg p-4 mb-6 space-y-3">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-civic-400" /> Marketplace
                        </p>

                        <div className="mb-3 text-sm text-dark-300">Community Treasury: <span className="font-mono text-yellow-400">{(treasuryBalance || 0).toFixed(2)} CIVIC</span> (1% microtax applied on purchases)</div>

                        <div className="space-y-3">
                          {marketplaceItems.map((it) => (
                            <div key={it.id} className="flex items-center justify-between bg-dark-600 p-3 rounded">
                              <div>
                                <div className="text-white font-semibold">{it.name}</div>
                                <div className="text-dark-300 text-xs">{it.description}</div>
                                <div className="text-dark-400 text-xs mt-1">Seller: {it.seller}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-yellow-400 font-mono">{it.price.toFixed(2)} CIVIC</div>
                                <button
                                  onClick={async () => {
                                    try {
                                      await marketplaceBuy(it.seller, it.price);
                                      setChatMessages((m) => [{ author: 'MARKET', text: `You bought ${it.name} for ${it.price.toFixed(2)} CIVIC (1% microtax applied)`, color: '#00ffcc' }, ...m]);
                                    } catch (err) {
                                      setChatMessages((m) => [{ author: 'MARKET', text: `Purchase failed: ${err}`, color: '#ff4444' }, ...m]);
                                    }
                                  }}
                                  className="mt-2 bg-civic-500 hover:bg-civic-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Buy
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {zone.id === 'schoolhouse' && (
                      <div className="bg-dark-700 rounded-lg p-4 mb-6 space-y-3">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-green-400" /> Featured Courses
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-dark-600 p-2 rounded text-dark-200">• Governance 101 (3 weeks)</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">• Local Policy Making (4 weeks)</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">• Civic Participation (2 weeks)</div>
                        </div>
                      </div>
                    )}

                    {zone.id === 'newsstand' && (
                      <div className="bg-dark-700 rounded-lg p-4 mb-6 space-y-3">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <Newspaper className="w-5 h-5 text-blue-400" /> Trending Now
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-dark-600 p-2 rounded text-dark-200">↑ Environmental Initiative Approved</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">↑ New Park Opening Downtown</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">↑ Community Survey Results In</div>
                        </div>
                      </div>
                    )}

                    {zone.id === 'social' && (
                      <div className="bg-dark-700 rounded-lg p-4 mb-6 space-y-3">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <Users className="w-5 h-5 text-orange-400" /> Active Groups
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Park Cleanup Initiative (156 members)</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Neighborhood Watch (342 members)</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Civic Book Club (87 members)</div>
                        </div>
                      </div>
                    )}

                    {zone.id === 'universe' && (
                      <div className="bg-dark-700 rounded-lg p-4 mb-6 space-y-3">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-purple-400" /> Available Worlds
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-dark-600 p-2 rounded text-dark-200">The Civic Arena (PvP Missions)</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Education Valley (Learning Quests)</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Commerce District (Trading Hub)</div>
                        </div>
                      </div>
                    )}

                    {zone.id === 'avatar' && (
                      <div className="bg-dark-700 rounded-lg p-4 mb-6 space-y-3">
                        <p className="text-white font-semibold flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-400" /> Your Progress
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Wearables Owned: 8</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Badges Earned: 5</div>
                          <div className="bg-dark-600 p-2 rounded text-dark-200">Reputation Score: {user?.trustScore}</div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedZone(null)}
                      className="w-full bg-civic-500 hover:bg-civic-600 text-white font-bold py-3 px-4 rounded-lg transition"
                    >
                      Close
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}

        {/* AI Assistant Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-dark-800 border border-dark-700 rounded-xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span>🧠</span> Craig — Your Civic AI Guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-dark-200 mb-4">
                Craig is your always-on AI assistant, suggesting nearby missions, faction goals, educators, and portals.
              </p>
              <ul className="space-y-2 text-dark-300 text-sm">
                <li>✓ Interprets DAO proposals and status</li>
                <li>✓ Routes you to relevant opportunities</li>
                <li>✓ Built with protocol-aligned ethics</li>
                <li>✓ Passes #FryboyTest certification</li>
              </ul>
            </div>
            <div className="bg-dark-700 p-4 rounded-lg border border-dark-600">
              <p className="text-civic-400 font-semibold mb-2">Coming Soon:</p>
              <p className="text-dark-300 text-sm">
                Voice chat integration, context-aware guidance, real-time mission routing, and full Unreal Engine 5 implementation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tech Stack Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-dark-800 border border-dark-700 rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">⚙️ The Foyer Tech Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-civic-400 font-semibold mb-2">Core Infrastructure</p>
              <ul className="space-y-1 text-dark-300">
                <li>• Game Engine: Unreal Engine 5 (Nanite, Lumen)</li>
                <li>• UI: React.js HUD + UE5 native interface</li>
                <li>• Backend: Node.js, FastAPI, Ceramic</li>
                <li>• Identity: Soulbound NFTs, DIDs</li>
              </ul>
            </div>
            <div>
              <p className="text-civic-400 font-semibold mb-2">Blockchain & Connectivity</p>
              <ul className="space-y-1 text-dark-300">
                <li>• Privacy Mining: Monero integration</li>
                <li>• Speed Layer: Kaspa blockchain</li>
                <li>• NFTs: Ethereum-based wearables</li>
                <li>• Offline: LoRaWAN, Bluetooth Mesh</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
