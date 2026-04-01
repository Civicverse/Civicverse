import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Clock, Plus, X, Shield, Landmark, Settings, Zap, CheckCircle } from 'lucide-react';
import { governanceApi, Proposal } from '../services/governance';
import { useGameStore } from '../store/gameStore';
import CivicIdentity from '../lib/civicIdentity';

export function GovernancePage() {
  const { user, wallet, updateWallet } = useGameStore();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', type: 'parameter_change', value: 0 });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voteWeights, setVoteWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const data = await governanceApi.getProposals();
      setProposals(data);
    } catch (err) {
      console.error('Failed to fetch proposals', err);
    } finally {
      setLoading(false);
    }
  };

  const getVoteWeight = (id: string) => voteWeights[id] || 1;

  const calculateCost = (proposal: Proposal, additionalWeight: number) => {
    // This client-side calculation should match the backend logic
    const voterRecord = (proposal as any).voters?.[user?.civicId || ''] || { weight: 0 };
    const currentWeight = voterRecord.weight;
    const newTotal = currentWeight + additionalWeight;
    return (newTotal * newTotal) - (currentWeight * currentWeight);
  };

  const handleVote = async (proposalId: string, choice: 'yes' | 'no') => {
    if (!user?.civicId) return alert('Connect identity to vote');
    if (user.verificationLevel !== 2) {
      return alert('ACCESS DENIED: Governance participation requires a Verified CivicID (Purple Check). Please complete your peer verification in the Civic Vault.');
    }
    
    const weight = getVoteWeight(proposalId);
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const cost = calculateCost(proposal, weight);
    if ((wallet?.balance || 0) < cost) {
        return alert(`Insufficient CVT. This vote costs ${cost} CVT, but you only have ${wallet?.balance.toFixed(2)} CVT.`);
    }

    setVotingId(proposalId);
    try {
      // 1. Restore identity to sign the vote
      const password = prompt(`Confirm vote cost: ${cost} CVT for ${weight} additional vote weight. Enter password to sign:`);
      if (!password) { setVotingId(null); return; }
      
      const identity = await CivicIdentity.restore(password);
      if (!identity) throw new Error('Invalid password');

      // 2. Submit to API (Signature validation is simulated in this nightly build)
      const res = await governanceApi.vote(
        proposalId, 
        choice, 
        user.civicId, 
        weight, 
        user.verificationLevel || 1
      );
      
      // Update local wallet balance
      if (res.cost) {
          updateWallet({ balance: (wallet?.balance || 0) - res.cost });
      }

      fetchProposals();
    } catch (err: any) {
      alert('Vote failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setVotingId(null);
    }
  };

  const handleExecute = async (proposalId: string) => {
    try {
      await governanceApi.executeProposal(proposalId);
      fetchProposals();
      alert('Proposal executed successfully!');
    } catch (err: any) {
      alert('Execution failed: ' + err.message);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;
    if (!user?.civicId) return alert('Connect identity to propose');
    if (user.verificationLevel !== 2) {
      return alert('ACCESS DENIED: Broadcasting proposals requires a Verified CivicID (Purple Check). Please complete your peer verification in the Civic Vault.');
    }

    try {
      await governanceApi.createProposal({
        ...formData,
        proposer: user.civicId,
        type: formData.type as any
      });
      setFormData({ title: '', description: '', type: 'parameter_change', value: 0 });
      setShowProposalForm(false);
      fetchProposals();
    } catch (err) {
      alert('Failed to create proposal');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'voting': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'passed': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'executed': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <Shield className="text-blue-500 w-5 h-5" />
               <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Decentralized Autonomous Organization</span>
            </div>
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">Governance</h1>
            <p className="text-gray-400 mt-2 font-medium">Protocol parameters and treasury allocation controlled by <span className="text-blue-400">Civic IDs</span>.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProposalForm(!showProposalForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl shadow-xl shadow-blue-900/20 transition flex items-center gap-3 uppercase tracking-tight italic"
          >
            <Plus className="w-6 h-6" />
            New Proposal
          </motion.button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <Landmark className="w-16 h-16" />
             </div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Community Treasury</p>
             <h3 className="text-3xl font-black text-white">425,850 <span className="text-blue-500 text-sm italic">CVT</span></h3>
             <div className="mt-4 flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase">
                <TrendingUp className="w-3 h-3" /> 12% growth this epoch
             </div>
          </div>
          <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <Shield className="w-16 h-16" />
             </div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Voting Power</p>
             <h3 className="text-3xl font-black text-white">{Math.floor(wallet?.balance || 0)} <span className="text-blue-500 text-sm italic">WEIGHT</span></h3>
             <div className="mt-4 flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase">
                Linked to {user?.civicId.slice(0, 12)}...
             </div>
          </div>
          <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <Zap className="w-16 h-16" />
             </div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Active Proposals</p>
             <h3 className="text-3xl font-black text-white">{proposals.filter(p => p.status === 'voting').length} <span className="text-blue-500 text-sm italic">LIVE</span></h3>
             <div className="mt-4 flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase">
                Quorum reached in 80%
             </div>
          </div>
        </div>

        {/* Proposal Form Modal */}
        <AnimatePresence>
          {showProposalForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProposalForm(false)} className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-[#161b22] border border-gray-800 rounded-3xl p-8 w-full max-w-xl shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Submit Proposal</h2>
                  <button onClick={() => setShowProposalForm(false)} className="p-2 hover:bg-gray-800 rounded-xl transition text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitProposal} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Proposal Type</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'parameter_change'})}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition ${formData.type === 'parameter_change' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                       >
                          <Settings className="w-4 h-4" />
                          <span className="text-xs font-bold">Protocol Params</span>
                       </button>
                       <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'treasury_allocation'})}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition ${formData.type === 'treasury_allocation' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'}`}
                       >
                          <Landmark className="w-4 h-4" />
                          <span className="text-xs font-bold">Treasury Alloc</span>
                       </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Increase Environmental Mission Multiplier"
                      className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Value ({formData.type === 'parameter_change' ? 'Multiplier' : 'CVT Amount'})</label>
                    <input
                      type="number"
                      step={formData.type === 'parameter_change' ? "0.1" : "1"}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Explain the impact of this change..."
                      rows={4}
                      className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-none resize-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transform active:scale-95 transition uppercase tracking-tight italic"
                  >
                    Broadcast Proposal
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Proposals List */}
        <div className="space-y-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing with Governance Node...</p>
             </div>
          ) : (
            proposals.map((proposal, index) => {
              const totalVotes = proposal.votesFor + proposal.votesAgainst;
              const yesPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
              const noPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
              const timeLeft = Math.max(0, proposal.endTime - Date.now());
              const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

              return (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#161b22] border border-gray-800 rounded-3xl overflow-hidden hover:border-gray-700 transition group"
                >
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(proposal.status)}`}>
                             {proposal.status}
                           </span>
                           <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                             {proposal.type.replace('_', ' ')}
                           </span>
                        </div>
                        <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition">{proposal.title}</h3>
                        <p className="text-gray-400 mt-2 leading-relaxed">{proposal.description}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Ends In</div>
                         <div className="flex items-center gap-1 text-sm font-bold text-blue-400">
                           <Clock className="w-4 h-4" />
                           {daysLeft > 0 ? `${daysLeft}d` : 'Expired'}
                         </div>
                      </div>
                    </div>

                    {/* Impact Box */}
                    <div className="bg-[#0a0c10] border border-gray-800 rounded-2xl p-4 mb-8 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                             {proposal.type === 'parameter_change' ? <Settings className="text-blue-400" /> : <Landmark className="text-green-400" />}
                          </div>
                          <div>
                             <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Target Value</div>
                             <div className="text-lg font-black text-white">
                               {proposal.type === 'parameter_change' ? `${proposal.value}x` : `${proposal.value} CVT`}
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Proposer</div>
                          <div className="text-[10px] font-mono text-blue-500">{proposal.proposer.slice(0, 16)}...</div>
                       </div>
                    </div>

                    {/* Voting Results */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Tally</span>
                        <span className="text-xs font-bold text-white">{totalVotes.toLocaleString()} Weight</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden bg-gray-900 gap-1.5 p-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${yesPercent}%` }}
                          className="bg-green-500 rounded-full h-full"
                        ></motion.div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${noPercent}%` }}
                          className="bg-red-500 rounded-full h-full"
                        ></motion.div>
                      </div>
                      <div className="flex justify-between mt-3">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                           <span className="text-xs font-bold text-green-400 uppercase">Yes: {yesPercent.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                           <span className="text-xs font-bold text-red-400 uppercase">No: {noPercent.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                      {proposal.status === 'voting' && (
                        <div className="bg-[#0a0c10] border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                           <div className="flex-1">
                              <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Additional Votes</label>
                              <div className="flex items-center gap-2">
                                 <input 
                                    type="number" 
                                    min="1" 
                                    value={getVoteWeight(proposal.id)}
                                    onChange={(e) => setVoteWeights({...voteWeights, [proposal.id]: Math.max(1, parseInt(e.target.value) || 1)})}
                                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1 text-sm font-bold text-white w-20 outline-none focus:border-blue-500 transition"
                                 />
                                 <span className="text-[10px] font-bold text-blue-400 uppercase italic">
                                    Cost: {calculateCost(proposal, getVoteWeight(proposal.id))} CVT
                                 </span>
                              </div>
                           </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        {proposal.status === 'voting' ? (
                          <>
                            <button
                              onClick={() => handleVote(proposal.id, 'yes')}
                              disabled={votingId === proposal.id}
                              className="flex-1 py-4 bg-green-500/10 hover:bg-green-500 border border-green-500/20 hover:text-white text-green-400 font-black rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-tight italic disabled:opacity-50"
                            >
                              <ThumbsUp className="w-5 h-5" /> {votingId === proposal.id ? 'Signing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleVote(proposal.id, 'no')}
                              disabled={votingId === proposal.id}
                              className="flex-1 py-4 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:text-white text-red-400 font-black rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-tight italic disabled:opacity-50"
                            >
                              <ThumbsDown className="w-5 h-5" /> Disapprove
                            </button>
                          </>
                        ) : proposal.status === 'passed' ? (
                          <button
                            onClick={() => handleExecute(proposal.id)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition flex items-center justify-center gap-2 uppercase tracking-tight italic"
                          >
                            <Zap className="w-5 h-5" /> Execute Protocol Change
                          </button>
                        ) : (
                          <div className="w-full py-4 bg-gray-900 border border-gray-800 text-gray-500 font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-tight italic">
                             {proposal.status === 'executed' ? <CheckCircle className="w-5 h-5" /> : null}
                             {proposal.status === 'executed' ? 'Effect Complete' : 'Proposal Terminated'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
