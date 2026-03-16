import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { civicWatchApi, Job } from '../services/civicwatch';
import { governanceApi, Proposal } from '../services/governance';
import CivicIdentity from '../lib/civicIdentity';
import { useGameStore } from '../store/gameStore';
import { 
  Info, 
  ShoppingBag, 
  Users as UsersIcon, 
  Landmark, 
  ArrowRight, 
  Shield, 
  Zap,
  Briefcase,
  Plus,
  Video,
  CheckCircle,
  MapPin,
  ExternalLink,
  ChevronRight,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Vote,
  Award,
  AlertTriangle,
  Fingerprint,
  TrendingUp,
  FileText,
  DollarSign
} from 'lucide-react';
import { AnimatedCard, NeonText, GradientOrb } from '../components';
import { motion, AnimatePresence } from 'framer-motion';

export default function FoyerPage() {
  const nav = useNavigate();
  const { user, updateUser, wallet } = useGameStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'marketplace' | 'community' | 'governance'>('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [did, setDid] = useState<string | null>(null);
  
  // Job Board State
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    reward: 50,
    category: 'civic',
    location: { address: 'Remote / Global', lat: 0, lng: 0 },
    instructionalVideo: '',
    requirements: ['']
  });

  // Governance State
  const [votingProcessing, setVotingProcessing] = useState<string | null>(null);
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'parameter_change' as 'parameter_change' | 'treasury_allocation',
    value: 0,
    category: 'civic'
  });
  const [selectedProposalForVote, setSelectedProposalForVote] = useState<Proposal | null>(null);
  const [voteWeight, setVoteWeight] = useState(1);

  // Identity Verification State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyModalStep] = useState<'intro' | 'liveness' | 'attestation' | 'complete'>('intro');

  useEffect(() => {
    const storedDid = CivicIdentity.getStoredDID();
    setDid(storedDid);
  }, []);

  useEffect(() => {
    if (activeTab === 'community') {
      fetchJobs();
    } else if (activeTab === 'governance') {
      fetchProposals();
      fetchGovernanceStatus();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await civicWatchApi.getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await governanceApi.getProposals();
      setProposals(data);
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGovernanceStatus = async () => {
    try {
      const status = await governanceApi.getStatus();
      setTreasuryBalance(status.treasuryBalance);
    } catch (err) {
      console.error('Failed to fetch governance status:', err);
    }
  };

  // --- Job Handlers ---

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!did) return alert('Please connect your identity first.');
    
    try {
      const jobData = {
        ...newJob,
        issuer: did,
        type: 'paid' as const,
        requirements: newJob.requirements.filter(r => r.trim() !== '')
      };
      await civicWatchApi.createJob(jobData);
      setShowCreateJob(false);
      fetchJobs();
      setNewJob({
        title: '',
        description: '',
        reward: 50,
        category: 'civic',
        location: { address: 'Remote / Global', lat: 0, lng: 0 },
        instructionalVideo: '',
        requirements: ['']
      });
    } catch (err) {
      alert('Failed to create job: ' + (err as any).message);
    }
  };

  const addRequirementField = () => {
    setNewJob({ ...newJob, requirements: [...newJob.requirements, ''] });
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...newJob.requirements];
    updated[index] = value;
    setNewJob({ ...newJob, requirements: updated });
  };

  // --- Governance Handlers ---

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!did) return alert('Please connect identity first.');
    if (user?.verificationLevel !== 2) return alert('Verification Level 2 (Blue Check) required to create proposals.');

    try {
      await governanceApi.createProposal({
        ...newProposal,
        proposer: did
      });
      setShowCreateProposal(false);
      fetchProposals();
      setNewProposal({ title: '', description: '', type: 'parameter_change', value: 0, category: 'civic' });
    } catch (err) {
      alert('Failed to create proposal: ' + (err as any).message);
    }
  };

  const handleVote = async (choice: 'yes' | 'no') => {
    if (!did || !selectedProposalForVote) return;
    setVotingProcessing(selectedProposalForVote.id);
    try {
      await governanceApi.vote(
        selectedProposalForVote.id, 
        choice, 
        did, 
        voteWeight, 
        user?.verificationLevel || 1
      );
      setSelectedProposalForVote(null);
      setVoteWeight(1);
      fetchProposals();
    } catch (err) {
      alert('Voting failed: ' + (err as any).message);
    } finally {
      setVotingProcessing(null);
    }
  };

  // --- Identity Level Simulation ---

  const simulateVerification = () => {
    setVerifyModalStep('liveness');
    setTimeout(() => {
      setVerifyModalStep('attestation');
      setTimeout(() => {
        setVerifyModalStep('complete');
        updateUser({ verificationLevel: 2 });
      }, 2000);
    }, 2000);
  };

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
            {user && (
              <div className="flex items-center gap-3 mt-4 bg-gray-900/50 border border-gray-800 px-4 py-2 rounded-full">
                <div className="flex items-center gap-2">
                  <Fingerprint className={`w-4 h-4 ${user.verificationLevel === 2 ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    ID_LEVEL: {user.verificationLevel}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-800"></div>
                {user.verificationLevel === 2 ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-blue-400 fill-blue-400/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Verified Citizen</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowVerifyModal(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-yellow-500 hover:text-yellow-400 transition-colors"
                  >
                    Get Blue Check (PoP)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center mb-12">
          {[
            { id: 'overview' as const, label: 'Overview', icon: <Info className="w-5 h-5" /> },
            { id: 'community' as const, label: 'Missions', icon: <Briefcase className="w-5 h-5" /> }, 
            { id: 'governance' as const, label: 'Governance', icon: <Landmark className="w-5 h-5" /> },
            { id: 'marketplace' as const, label: 'Marketplace', icon: <ShoppingBag className="w-5 h-5" /> },
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
          
          {/* --- JOB BOARD (COMMUNITY TAB) --- */}
          {activeTab === 'community' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex justify-between items-center bg-[#161b22] p-6 rounded-3xl border border-gray-800 shadow-xl">
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">CivicWatch Board</h2>
                  <p className="text-gray-500 text-sm">Post and accept smart contract-backed missions.</p>
                </div>
                <button 
                  onClick={() => setShowCreateJob(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-900/20"
                >
                  <Plus className="w-5 h-5" />
                  CREATE MISSION
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-500 font-mono">FETCHING_CONTRACT_STATE...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map(job => (
                    <motion.div 
                      key={job.id}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedJob(job)}
                      className="bg-[#161b22] border border-gray-800 rounded-3xl p-6 cursor-pointer hover:border-blue-500/50 transition-colors group relative overflow-hidden shadow-lg"
                    >
                      <div className="absolute top-0 right-0 p-4">
                        <div className="bg-blue-600/10 text-blue-400 text-[10px] font-black px-2 py-1 rounded uppercase border border-blue-500/20 shadow-glow-blue">
                          {job.reward} CVT
                        </div>
                      </div>
                      <h3 className="text-xl font-black italic uppercase text-white mb-2 group-hover:text-blue-400 transition-colors pr-12">{job.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-3 mb-4">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                          <MapPin className="w-3 h-3" />
                          {job.location.address}
                        </div>
                        {job.instructionalVideo && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/20">
                            <Video className="w-3 h-3" />
                            VIDEO_GUIDE
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                        <span className="text-[10px] text-gray-600 font-mono">ID: {job.id.slice(0,8)}</span>
                        <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- GOVERNANCE TAB --- */}
          {activeTab === 'governance' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Treasury & User Status Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign className="w-12 h-12 text-blue-500" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Community Treasury</h4>
                  <div className="text-3xl font-black text-white italic tracking-tighter">
                    {treasuryBalance.toLocaleString()} <span className="text-blue-500 text-sm">CVT</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-green-500 font-bold uppercase">
                    <TrendingUp className="w-3 h-3" />
                    Audited by Craig AI
                  </div>
                </div>

                <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Vote className="w-12 h-12 text-purple-500" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Governance Credits</h4>
                  <div className="text-3xl font-black text-white italic tracking-tighter">
                    {wallet?.balance.toFixed(0) || '0'} <span className="text-purple-500 text-sm">CREDITS</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                    Quadratic Voting Protocol Active
                  </div>
                </div>

                <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Verification Status</h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-black italic uppercase ${user?.verificationLevel === 2 ? 'text-blue-400' : 'text-yellow-500'}`}>
                        LEVEL {user?.verificationLevel}
                      </span>
                      {user?.verificationLevel === 2 && <CheckCircle className="w-5 h-5 text-blue-400 fill-blue-400/20" />}
                    </div>
                  </div>
                  <button 
                    onClick={() => user?.verificationLevel === 2 ? setShowCreateProposal(true) : setShowVerifyModal(true)}
                    className={`mt-4 w-full py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                      user?.verificationLevel === 2 
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20' 
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20'
                    }`}
                  >
                    {user?.verificationLevel === 2 ? 'CREATE PROPOSAL' : 'UPGRADE TO VOTE'}
                  </button>
                </div>
              </div>

              <div className="bg-[#161b22] border border-gray-800 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                         <Landmark className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Active Proposals</h2>
                        <p className="text-blue-400 font-mono text-xs mt-1">PROTOCOL_VERSION: v0.9.2-NIGHTLY</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-gray-800">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">AI Watchdog Online</span>
                    </div>
                 </div>

                 {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8"/></div>
                 ) : (
                    <div className="space-y-6">
                      {proposals.map(prop => (
                        <div key={prop.id} className="bg-black/40 border border-gray-800 rounded-3xl p-8 hover:border-gray-600 transition-colors shadow-inner">
                          <div className="flex flex-col lg:flex-row justify-between gap-8 mb-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                  prop.status === 'passed' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                                  prop.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
                                  'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                }`}>{prop.status}</span>
                                <span className="text-gray-600 text-[10px] font-mono">HASH: {prop.id.slice(-8).toUpperCase()}</span>
                                <div className="h-4 w-px bg-gray-800"></div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{prop.type.replace('_', ' ')}</span>
                              </div>
                              <h3 className="text-2xl font-black text-white italic tracking-tighter mb-3 uppercase">{prop.title}</h3>
                              <p className="text-gray-400 text-sm leading-relaxed mb-6">{prop.description}</p>
                              
                              <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800">
                                  <UsersIcon className="w-3 h-3" />
                                  Proposer: {prop.proposer.slice(0, 15)}...
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800">
                                  <Clock className="w-3 h-3" />
                                  Ends: {new Date(prop.endTime).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4 min-w-[240px]">
                              <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-xl">
                                 <div className="flex justify-between items-end mb-4">
                                    <div className="text-center">
                                       <div className="text-[10px] text-gray-500 font-black uppercase mb-1">SUPPORT</div>
                                       <div className="text-2xl font-black text-green-500 italic tracking-tighter">{prop.votesFor.toLocaleString()}</div>
                                    </div>
                                    <div className="h-10 w-px bg-gray-800 mx-4"></div>
                                    <div className="text-center">
                                       <div className="text-[10px] text-gray-500 font-black uppercase mb-1">OPPOSE</div>
                                       <div className="text-2xl font-black text-red-500 italic tracking-tighter">{prop.votesAgainst.toLocaleString()}</div>
                                    </div>
                                 </div>
                                 <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-green-500 shadow-glow-green" style={{ width: `${(prop.votesFor / (prop.votesFor + prop.votesAgainst + 1)) * 100}%` }}></div>
                                    <div className="h-full bg-red-500 shadow-glow-red" style={{ width: `${(prop.votesAgainst / (prop.votesFor + prop.votesAgainst + 1)) * 100}%` }}></div>
                                 </div>
                              </div>
                              
                              {prop.status === 'voting' && (
                                <button 
                                  onClick={() => setSelectedProposalForVote(prop)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-900/20 uppercase italic tracking-tighter"
                                >
                                  <Vote className="w-5 h-5" />
                                  COMMIT CREDITS
                                </button>
                              )}
                            </div>
                          </div>

                          {/* AI Watchdog & Audit Log Section */}
                          <div className="border-t border-gray-800 mt-6 pt-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                                <Shield className="w-3 h-3 text-blue-500" />
                                AI_WATCHDOG_PROTOCOL
                              </h4>
                              <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                                prop.aiWatchdogStatus === 'compliant' ? 'text-green-500' : 'text-yellow-500'
                              }`}>
                                <Zap className="w-3 h-3" />
                                STATUS: {prop.aiWatchdogStatus}
                              </div>
                            </div>
                            <div className="bg-black/60 rounded-2xl p-4 border border-gray-800/50 font-mono text-[10px] text-blue-400/80 leading-relaxed max-h-24 overflow-y-auto no-scrollbar">
                              <div className="flex gap-2 mb-1">
                                <span className="text-gray-600">$</span>
                                <span>AUDIT_LOG_INITIALIZED...</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-gray-600">$</span>
                                <span>{prop.aiAuditLog || "No logs available for this transaction."}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {proposals.length === 0 && (
                        <div className="text-center py-20 bg-black/20 rounded-[3rem] border border-dashed border-gray-800">
                          <AlertTriangle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <div className="text-gray-500 italic font-medium">No active proposals found in the current governance cycle.</div>
                        </div>
                      )}
                    </div>
                 )}
              </div>
            </motion.div>
          )}

          {/* --- OVERVIEW TAB --- */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
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
            </div>
          )}

          {/* --- MARKETPLACE TAB (Placeholder) --- */}
          {activeTab === 'marketplace' && (
            <div className="bg-[#161b22] border border-gray-800 rounded-[3rem] p-20 flex flex-col items-center text-center shadow-2xl">
               <div className="w-24 h-24 bg-gray-800/50 rounded-3xl flex items-center justify-center mb-8 border border-gray-700">
                  <ShoppingBag className="w-12 h-12 text-gray-600" />
               </div>
               <h2 className="text-4xl font-black italic uppercase text-gray-600 mb-4 tracking-tighter">Marketplace Pending</h2>
               <p className="text-gray-500 max-w-md leading-relaxed font-medium">This module is currently being synchronized with the global ledger. Check back shortly for peer-to-peer commerce.</p>
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

      {/* --- MODALS --- */}

      {/* Proof-of-Personhood (PoP) Verification Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVerifyModal(false)}
              className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <Award className={`w-12 h-12 ${verifyStep === 'complete' ? 'text-blue-400' : 'text-gray-800'}`} />
              </div>

              {verifyStep === 'intro' && (
                <div className="text-center py-6">
                  <h2 className="text-3xl font-black italic uppercase text-white mb-4 tracking-tighter">Proof of Personhood</h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    To participate in parameter-level governance, you must verify your unique human identity. 
                    This requires a liveness check and 3 peer attestations.
                  </p>
                  <button 
                    onClick={simulateVerification}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-lg italic uppercase tracking-tighter transition-all"
                  >
                    Start Verification
                  </button>
                </div>
              )}

              {(verifyStep === 'liveness' || verifyStep === 'attestation') && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                  <h2 className="text-2xl font-black italic uppercase text-white mb-2 tracking-tighter">
                    {verifyStep === 'liveness' ? 'Executing Liveness Check' : 'Collecting Peer Attestations'}
                  </h2>
                  <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                    {verifyStep === 'liveness' ? 'Analyzing behavioral patterns...' : 'Contacting verified neighbors in local sector...'}
                  </p>
                </div>
              )}

              {verifyStep === 'complete' && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                    <CheckCircle className="w-10 h-10 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-black italic uppercase text-white mb-2 tracking-tighter">Identity Verified</h2>
                  <p className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] mb-8">Level 2 Secured • Blue Check Minted</p>
                  <button 
                    onClick={() => setShowVerifyModal(false)}
                    className="w-full bg-gray-100 hover:bg-white text-gray-900 font-black py-4 rounded-2xl text-lg italic uppercase tracking-tighter transition-all"
                  >
                    Enter Governance
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quadratic Voting Selection Modal */}
      <AnimatePresence>
        {selectedProposalForVote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProposalForVote(null)}
              className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h2 className="text-2xl font-black italic uppercase text-white mb-2 tracking-tighter">Commit Governance Credits</h2>
              <p className="text-gray-500 text-xs mb-8 uppercase tracking-widest font-bold">{selectedProposalForVote.title}</p>
              
              <div className="bg-black/40 rounded-3xl p-8 mb-8 border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Vote Weight</span>
                  <span className="text-3xl font-black italic text-white">{voteWeight}</span>
                </div>
                
                <input 
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={voteWeight}
                  onChange={(e) => setVoteWeight(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-8"
                />
                
                <div className="flex justify-between items-center pt-6 border-t border-gray-800">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1">Credit Cost</div>
                    <div className="text-2xl font-black italic text-white">{voteWeight * voteWeight} <span className="text-purple-500 text-xs">CREDITS</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Cost Formula</div>
                    <div className="text-sm font-mono text-gray-400">Weight²</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleVote('yes')}
                  disabled={!!votingProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-900/20 uppercase italic tracking-tighter"
                >
                  {votingProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <ThumbsUp className="w-5 h-5" />}
                  VOTE YES
                </button>
                <button 
                  onClick={() => handleVote('no')}
                  disabled={!!votingProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-red-900/20 uppercase italic tracking-tighter"
                >
                  {votingProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
                  VOTE NO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Proposal Modal */}
      <AnimatePresence>
        {showCreateProposal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateProposal(false)}
              className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-3xl font-black italic uppercase text-white mb-8 tracking-tighter">Draft Governance Proposal</h2>
              
              <form onSubmit={handleCreateProposal} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Proposal Title</label>
                  <input 
                    required
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors font-bold uppercase italic"
                    placeholder="e.g. Expand Sector 4 Energy Grid"
                    value={newProposal.title}
                    onChange={e => setNewProposal({...newProposal, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Description & Rationale</label>
                  <textarea 
                    required
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors h-24 text-sm leading-relaxed"
                    placeholder="Explain the protocol impact..."
                    value={newProposal.description}
                    onChange={e => setNewProposal({...newProposal, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Proposal Type</label>
                    <select 
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors font-bold uppercase"
                      value={newProposal.type}
                      onChange={e => setNewProposal({...newProposal, type: e.target.value as any})}
                    >
                      <option value="parameter_change">Protocol Parameter</option>
                      <option value="treasury_allocation">Treasury Allocation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Target Value / Amount</label>
                    <input 
                      type="number"
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors font-bold"
                      value={newProposal.value}
                      onChange={e => setNewProposal({...newProposal, value: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateProposal(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-xl transition-colors uppercase italic tracking-tighter"
                  >
                    DISCARD DRAFT
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-xl transition-colors shadow-lg shadow-blue-900/20 uppercase italic tracking-tighter"
                  >
                    DEPLOY TO MEMPOOL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Job Modal */}
      <AnimatePresence>
        {showCreateJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateJob(false)}
              className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-3xl font-black italic uppercase text-white mb-8">Create Smart Mission</h2>
              
              <form onSubmit={handleCreateJob} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Mission Title</label>
                  <input 
                    required
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors font-bold uppercase italic"
                    placeholder="e.g. Tree Planting Verification"
                    value={newJob.title}
                    onChange={e => setNewJob({...newJob, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Description</label>
                  <textarea 
                    required
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors h-24 text-sm leading-relaxed"
                    placeholder="Describe the impact and what needs to be done..."
                    value={newJob.description}
                    onChange={e => setNewJob({...newJob, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Reward (CVT)</label>
                    <input 
                      type="number"
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors font-bold"
                      value={newJob.reward}
                      onChange={e => setNewJob({...newJob, reward: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Instructional Video (YT/URL)</label>
                    <input 
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                      placeholder="https://..."
                      value={newJob.instructionalVideo}
                      onChange={e => setNewJob({...newJob, instructionalVideo: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Verification Requirements</label>
                  <div className="space-y-3">
                    {newJob.requirements.map((req, idx) => (
                      <input 
                        key={idx}
                        className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                        placeholder={`Requirement #${idx + 1}`}
                        value={req}
                        onChange={e => updateRequirement(idx, e.target.value)}
                      />
                    ))}
                    <button 
                      type="button"
                      onClick={addRequirementField}
                      className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-blue-400 font-bold"
                    >
                      <Plus className="w-3 h-3" /> ADD REQUIREMENT
                    </button>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowCreateJob(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-xl transition-colors uppercase italic tracking-tighter"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-xl transition-colors shadow-lg shadow-blue-900/20 uppercase italic tracking-tighter"
                  >
                    DEPLOY TO BOARD
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl bg-[#161b22] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-black italic uppercase text-white mb-2 tracking-tighter">{selectedJob.title}</h2>
                    <div className="flex items-center gap-2 text-blue-500 font-mono text-xs">
                      <span>CONTRACT_ID: {selectedJob.id}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="text-gray-500 hover:text-white transition">
                    <Zap className="w-8 h-8" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Description</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedJob.description}</p>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Verification Requirements</h4>
                      <div className="space-y-2">
                        {selectedJob.requirements.map((req, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedJob.instructionalVideo ? (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Instructional Video</h4>
                        <div className="aspect-video rounded-2xl bg-black border border-gray-800 overflow-hidden relative group">
                          {selectedJob.instructionalVideo.includes('youtube.com') ? (
                            <iframe 
                              className="w-full h-full"
                              src={selectedJob.instructionalVideo}
                              title="Video Guide"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                               <Video className="w-10 h-10 text-blue-500 mb-2" />
                               <a href={selectedJob.instructionalVideo} target="_blank" rel="noreferrer" className="text-blue-400 text-xs font-bold hover:underline font-bold uppercase tracking-widest">
                                  OPEN EXTERNAL VIDEO <ExternalLink className="w-3 h-3 inline" />
                                </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-2xl bg-gray-900 border border-gray-800 border-dashed flex flex-col items-center justify-center text-gray-600 text-xs italic">
                        No video guide provided for this mission.
                      </div>
                    )}

                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex justify-between items-center">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Contract Payout</div>
                        <div className="text-3xl font-black italic text-white tracking-tighter">{selectedJob.reward} <span className="text-blue-500 text-sm">CVT</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Location</div>
                        <div className="text-sm font-bold text-gray-300 uppercase">{selectedJob.location.address}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      nav('/civicwatch');
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-xl italic uppercase tracking-tighter transition-all shadow-xl shadow-blue-900/30 active:scale-95"
                  >
                    ACCEPT DISPATCH
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
