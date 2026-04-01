import React, { useEffect, useState } from 'react';
import { civicWatchApi, Job } from '../services/civicwatch';
import CivicIdentity from '../lib/civicIdentity';
import { useGameStore } from '../store/gameStore';
import { JobMapView } from '../components/JobMapView';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Camera, 
  Zap,
  ChevronRight,
  TrendingUp,
  Award,
  List,
  Map as MapIcon,
  Navigation,
  Plus,
  Radio,
  Video,
  VideoOff,
  DollarSign,
  Briefcase,
  ExternalLink,
  Cpu,
  Play,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CivicWatchPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [did, setDid] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [verificationFile, setVerificationFile] = useState<string | null>(null);
  const [proofDescription, setProofDescription] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [status, setStatus] = useState<'browsing' | 'dispatching' | 'verifying' | 'completed'>('browsing');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [gpsLocked, setGpsLocked] = useState<boolean>(false);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [appMode, setAppMode] = useState<'operator' | 'employer'>('operator');
  const [showCreateJob, setShowCreateJob] = useState(false);
  
  // Dispatch Steps
  const [dispatchStep, setDispatchStep] = useState<'briefing' | 'training' | 'ppe' | 'execution'>('briefing');
  const [ppeConfirmed, setPpeConfirmed] = useState(false);
  const [trainingWatched, setTrainingWatched] = useState(false);

  const [newJobData, setNewJobData] = useState({
    title: '',
    description: '',
    reward: 10,
    type: 'volunteer' as 'volunteer' | 'paid',
    location: 'Current Sector',
    category: 'civic'
  });

  const { user, updateUser, wallet, updateWallet, multiChainAddresses } = useGameStore();

  useEffect(() => {
    const storedDid = CivicIdentity.getStoredDID();
    setDid(storedDid);
    fetchJobs();
  }, [did]);

  useEffect(() => {
    let result = jobs;
    if (activeCategory !== 'all') {
      result = result.filter(j => j.category === activeCategory);
    }
    if (searchQuery) {
      result = result.filter(j => 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        j.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredJobs(result);
  }, [jobs, searchQuery, activeCategory]);

  // GPS Tracking Effect
  useEffect(() => {
    if (status === 'dispatching' || status === 'verifying') {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLocked(true);
        },
        (err) => {
          console.error("GPS Error:", err);
          setGpsLocked(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setGpsLocked(false);
      setCurrentGps(null);
    }
  }, [status]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await civicWatchApi.getJobs();
      setJobs(data);
      const myActiveJob = data.find(j => j.assignee === did && (j.status === 'in_progress' || j.status === 'verifying'));
      if (myActiveJob) {
        setActiveJob(myActiveJob);
        setStatus(myActiveJob.status === 'verifying' ? 'verifying' : 'dispatching');
        // If resuming, start at execution
        setDispatchStep('execution');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    if (!did) return alert('Please create an identity first');
    
    const targetJob = jobs.find(j => j.id === jobId);
    if (targetJob?.type === 'paid' && user?.verificationLevel !== 2) {
      alert('ACCESS DENIED: Monetary payout missions require a Verified CivicID (Purple Check). Basic unverified wallets cannot handle money within the system. Please complete your 3-peer in-person verification in the Civic Vault.');
      return;
    }

    try {
      const res = await civicWatchApi.acceptJob(jobId, did);
      setActiveJob(res.job);
      setStatus('dispatching');
      setDispatchStep('briefing');
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      alert('Failed to accept job: ' + err.message);
    }
  };

  const handleToggleStream = async () => {
    if (!activeJob || !did) return;
    try {
      const newState = !activeJob.isStreaming;
      await civicWatchApi.toggleStreaming(activeJob.id, did, newState);
      setActiveJob({ ...activeJob, isStreaming: newState });
    } catch (err) {
      alert('Failed to toggle stream');
    }
  };

  const handleSendTip = (amount: number) => {
    if (user?.verificationLevel !== 2) {
       return alert('Verification required to send on-chain tips.');
    }
    alert(`BROADCASTING ON-CHAIN TRANSACTION: Sending ${amount} XMR tip via Ethereum L2 Smart Contract directly to Operator's wallet. [Off-Platform Interaction]`);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.verificationLevel !== 2 && newJobData.type === 'paid') {
      return alert('Employers must have a Verified CivicID (Purple Check) to deploy paid smart contract jobs.');
    }
    
    try {
      alert('DEPLOYING SMART CONTRACT TO LEDGER: Initializing on-chain escrow with ' + newJobData.reward + ' CVT/XMR value.');
      
      await civicWatchApi.createJob({
        ...newJobData,
        issuer: did || 'unknown',
        location: { lat: 34.0522, lng: -118.2437, address: newJobData.location }
      });
      setShowCreateJob(false);
      fetchJobs();
    } catch (err) {
      alert('Deployment failed');
    }
  };

  const handleVerify = async () => {
    if (!activeJob || !did) return;
    if (!verificationFile && !proofDescription) {
      alert('Please provide at least a photo or a description as proof.');
      return;
    }

    setStatus('verifying');
    setAiAnalysis("Craig AI Node: Analyzing proof against job requirements...");
    
    try {
      const res = await civicWatchApi.verifyJob(
        activeJob.id, 
        did, 
        proofDescription || 'No text proof provided',
        verificationFile || null,
        currentGps || undefined
      );
      
      if (res.status === 'verified') {
        setAiAnalysis(`✓ Craig AI: ${res.aiReasoning || "Proof Verified. Impact recorded in Global Ledger."}`);
        
        setTimeout(() => {
          if (res.payoutDetails) {
            const jobStats = activeJob.stats || {};
            const newUserStats = { ...(user?.stats || {}) } as any;
            
            Object.entries(jobStats).forEach(([stat, value]) => {
              newUserStats[stat] = (newUserStats[stat] || 0) + value;
            });
            
            updateUser({ stats: newUserStats, trustScore: (user?.trustScore || 50) + 2 });
            
            if (wallet) {
              updateWallet({ balance: wallet.balance + res.payoutDetails.payout });
            }
          }
          
          setStatus('completed');
          fetchJobs();
        }, 2500);
      } else {
        setAiAnalysis(`⚠ Craig AI Rejected: ${res.aiReasoning || "Inconsistent proof."}`);
        setTimeout(() => {
          setStatus('dispatching');
        }, 3000);
      }

    } catch (err) {
      setStatus('dispatching');
      setAiAnalysis(`⚠ Node Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = ['all', 'environmental', 'civic', 'social', 'logistics', 'educational'];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0c10]/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight italic">CivicWatch <span className="text-blue-500 text-xs font-mono ml-1">v1.3-SOVEREIGN</span></h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Sovereign Dispatch System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
               <button 
                onClick={() => setAppMode('operator')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${appMode === 'operator' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 <Navigation className="w-3.5 h-3.5" /> OPERATOR
               </button>
               <button 
                onClick={() => setAppMode('employer')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${appMode === 'employer' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-500 hover:text-gray-300'}`}
               >
                 <Briefcase className="w-3.5 h-3.5" /> EMPLOYER
               </button>
            </div>

            {gpsLocked && (
              <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                <Navigation className="w-3 h-3 text-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase">GPS Locked</span>
              </div>
            )}
            
            {user?.verificationLevel === 2 && (
              <div className="bg-neon-purple/20 border border-neon-purple/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                 <CheckCircle className="w-3.5 h-3.5 text-neon-purple" />
                 <span className="text-[9px] font-black text-neon-purple uppercase tracking-tighter">VERIFIED</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {appMode === 'employer' ? (
            <motion.div 
              key="employer"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-12 flex flex-col items-center"
            >
               <div className="bg-purple-600/10 border border-purple-500/30 rounded-3xl p-12 text-center max-w-2xl">
                  <Briefcase className="w-16 h-16 text-purple-500 mx-auto mb-6" />
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Deploy Mission Contracts</h2>
                  <p className="text-gray-400 mb-8 font-medium">Create and fund your own smart contract jobs on the global overworld map. Payouts are handled automatically by on-chain escrow nodes.</p>
                  
                  <button 
                    onClick={() => setShowCreateJob(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-purple-900/20 transform active:scale-95 transition uppercase italic tracking-tight"
                  >
                    + Deploy New Job Contract
                  </button>
               </div>
            </motion.div>
          ) : status === 'browsing' ? (
            <motion.div 
              key="browsing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Search missions (e.g. 'park', 'delivery', 'audit')..."
                    className="w-full bg-[#161b22] border border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setViewMode('map')}
                      className={`p-2 rounded-lg transition ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <MapIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                          activeCategory === cat 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Job Display */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 font-medium">Scanning local sector for missions...</p>
                </div>
              ) : (
                <>
                  {viewMode === 'map' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <JobMapView 
                        jobs={filteredJobs} 
                        onSelectJob={(job) => setSelectedJob(job)} 
                      />
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredJobs.length > 0 ? filteredJobs.map(job => (
                        <motion.div 
                          layoutId={job.id}
                          key={job.id} 
                          className="bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden hover:border-blue-500/50 transition group cursor-pointer flex flex-col h-full"
                          onClick={() => setSelectedJob(job)}
                        >
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                job.type === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {job.type}
                              </div>
                              <div className="flex items-center gap-1 text-blue-400 font-bold">
                                <Zap className="w-4 h-4" />
                                <span>{job.reward} CVT</span>
                              </div>
                            </div>
                            
                            <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition italic uppercase">{job.title}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed flex-1">{job.description}</p>
                            
                            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mb-4">
                              <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-md">
                                <MapPin className="w-3 h-3" />
                                <span>{job.location.address}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-md font-mono">
                                <ExternalLink className="w-3 h-3" />
                                <span>0x{job.id.slice(0, 8)}...</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                              <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#161b22] bg-gray-800 overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + job.id}`} alt="avatar" />
                                  </div>
                                ))}
                                <div className="w-6 h-6 rounded-full border-2 border-[#161b22] bg-blue-600 flex items-center justify-center text-[8px] font-bold">+12</div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transform group-hover:translate-x-1 transition" />
                            </div>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="col-span-full py-20 text-center">
                          <div className="text-gray-600 mb-2 italic">No missions found in your sector.</div>
                          <button onClick={() => {setSearchQuery(''); setActiveCategory('all');}} className="text-blue-500 text-sm font-bold">Clear Filters</button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="dispatch"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-[#161b22] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Status Header */}
                <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Mission Active</h2>
                    <p className="text-blue-100 text-sm font-medium opacity-80">{activeJob?.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                      onClick={handleToggleStream}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeJob?.isStreaming ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30' : 'bg-white/20 hover:bg-white/30'}`}
                     >
                       {activeJob?.isStreaming ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                     </button>
                     <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Zap className="w-7 h-7" />
                     </div>
                  </div>
                </div>

                {/* Tracking UI */}
                <div className="p-8">
                  {activeJob?.isStreaming && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                          <span className="text-xs font-black text-red-500 uppercase tracking-widest">Live Streaming to Metaverse</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                             <Radio className="w-4 h-4 text-gray-500" />
                             <span className="text-[10px] font-bold text-gray-400 uppercase">24 Spectators</span>
                          </div>
                          <button 
                            onClick={() => handleSendTip(0.05)}
                            className="bg-neon-pink/20 border border-neon-pink text-neon-pink text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter hover:bg-neon-pink hover:text-white transition-all"
                          >
                             Send Tip
                          </button>
                       </div>
                    </div>
                  )}

                  <div className="relative mb-12">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800"></div>
                    
                    <div className="relative pl-12 mb-8">
                      <div className="absolute left-2.5 -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-900 z-10"></div>
                      <h4 className={`text-sm font-bold mb-1 uppercase tracking-tight ${dispatchStep === 'briefing' ? 'text-blue-400' : 'text-white'}`}>1. Mission Briefing</h4>
                      <p className="text-xs text-gray-500">Immutable contract parameters signed on ledger.</p>
                    </div>

                    <div className="relative pl-12 mb-8">
                      <div className={`absolute left-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-gray-900 z-10 transition-colors ${
                        dispatchStep === 'training' ? 'bg-blue-500 animate-pulse ring-4 ring-blue-500/20' : 
                        (dispatchStep === 'briefing' ? 'bg-gray-800' : 'bg-green-500')
                      }`}></div>
                      <h4 className={`text-sm font-bold mb-1 uppercase tracking-tight ${dispatchStep === 'training' ? 'text-blue-400' : 'text-white'}`}>2. Training & Safety</h4>
                      <p className="text-xs text-gray-500">Short-form instructional guidance and protocols.</p>
                    </div>

                    <div className="relative pl-12 mb-8">
                      <div className={`absolute left-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-gray-900 z-10 transition-colors ${
                        dispatchStep === 'ppe' ? 'bg-blue-500 animate-pulse ring-4 ring-blue-500/20' : 
                        (dispatchStep === 'briefing' || dispatchStep === 'training' ? 'bg-gray-800' : 'bg-green-500')
                      }`}></div>
                      <h4 className={`text-sm font-bold mb-1 uppercase tracking-tight ${dispatchStep === 'ppe' ? 'text-blue-400' : 'text-white'}`}>3. PPE & Readiness</h4>
                      <p className="text-xs text-gray-500">AI-guided equipment verification.</p>
                    </div>

                    <div className="relative pl-12">
                      <div className={`absolute left-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-gray-900 z-10 transition-colors ${
                        dispatchStep === 'execution' ? (status === 'verifying' ? 'bg-green-500' : 'bg-blue-500 animate-pulse ring-4 ring-blue-500/20') : 'bg-gray-800'
                      }`}></div>
                      <h4 className={`text-sm font-bold mb-1 uppercase tracking-tight ${dispatchStep === 'execution' ? 'text-blue-400' : 'text-white'}`}>4. Real-World Execution</h4>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs text-gray-500">Perform the work at: <span className="text-blue-400 font-mono">{activeJob?.location.address}</span></p>
                        {gpsLocked && (
                          <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-tighter">
                            <CheckCircle className="w-3 h-3" />
                            GPS Position Verified
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Briefing */}
                  {dispatchStep === 'briefing' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                       <h3 className="text-lg font-bold mb-4 italic uppercase">Mission Parameters</h3>
                       <div className="space-y-4 mb-8">
                          <p className="text-gray-400 text-sm leading-relaxed">{activeJob?.description}</p>
                          <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-gray-500">
                             CONTRACT_ID: 0x{activeJob?.id.slice(0, 16)}...<br/>
                             PAYOUT: {activeJob?.reward} CVT (XMR)<br/>
                             TREASURY_CUT: 1% (MANDATORY)
                          </div>
                       </div>
                       <button 
                        onClick={() => setDispatchStep('training')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl uppercase italic tracking-tight"
                       >
                         Continue to Training
                       </button>
                    </motion.div>
                  )}

                  {/* Step 2: Training */}
                  {dispatchStep === 'training' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                       <h3 className="text-lg font-bold mb-4 italic uppercase flex items-center gap-2">
                          <Play className="w-5 h-5 text-blue-500 fill-blue-500" /> Instructional Training
                       </h3>
                       <div className="aspect-video bg-black rounded-xl mb-6 flex items-center justify-center relative group overflow-hidden cursor-pointer" onClick={() => setTrainingWatched(true)}>
                          {trainingWatched ? (
                            <div className="absolute inset-0 bg-blue-600/20 flex flex-col items-center justify-center">
                               <CheckCircle className="w-12 h-12 text-white mb-2" />
                               <span className="text-white font-black uppercase text-xs">Training Complete</span>
                            </div>
                          ) : (
                            <div className="text-center group-hover:scale-110 transition-transform">
                               <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                                  <Play className="w-8 h-8 text-white fill-white" />
                               </div>
                               <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Watch Training Video</span>
                            </div>
                          )}
                          <img src={`https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800`} className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" alt="training thumbnail" />
                       </div>
                       <button 
                        disabled={!trainingWatched}
                        onClick={() => setDispatchStep('ppe')}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl uppercase italic tracking-tight"
                       >
                         Confirm Training & Continue
                       </button>
                    </motion.div>
                  )}

                  {/* Step 3: PPE */}
                  {dispatchStep === 'ppe' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                       <h3 className="text-lg font-bold mb-4 italic uppercase flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-500" /> PPE Verification
                       </h3>
                       <p className="text-sm text-gray-400 mb-6 leading-relaxed">AI Watchdog requires visual confirmation of safety equipment before execution begins.</p>
                       
                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className={`p-4 rounded-xl border transition-all cursor-pointer ${ppeConfirmed ? 'bg-blue-600/20 border-blue-500' : 'bg-black/40 border-gray-800'}`} onClick={() => setPpeConfirmed(true)}>
                             <CheckCircle className={`w-6 h-6 mb-2 ${ppeConfirmed ? 'text-blue-400' : 'text-gray-700'}`} />
                             <span className="text-[10px] font-black uppercase text-white">PPE Equipped</span>
                          </div>
                          <div className="p-4 rounded-xl border border-gray-800 bg-black/40 opacity-50">
                             <Camera className="w-6 h-6 mb-2 text-gray-700" />
                             <span className="text-[10px] font-black uppercase text-gray-500">AI Scan Done</span>
                          </div>
                       </div>

                       <button 
                        disabled={!ppeConfirmed}
                        onClick={() => setDispatchStep('execution')}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl uppercase italic tracking-tight"
                       >
                         Verify Readiness
                       </button>
                    </motion.div>
                  )}

                  {/* Step 4: Execution */}
                  {dispatchStep === 'execution' && status === 'dispatching' && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 italic uppercase">
                        <Camera className="text-blue-500 w-5 h-5" />
                        Submit Verification
                      </h3>
                      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                        To release the escrow of <span className="text-white font-bold">{activeJob?.reward} CVT</span>, describe what you did and optionally upload a photo.
                      </p>

                      <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Proof Description (AI Verified)</label>
                        <textarea 
                          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition h-32"
                          placeholder="Describe the work you completed in detail..."
                          value={proofDescription}
                          onChange={(e) => setProofDescription(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative group mb-6">
                        <input 
                          type="file" 
                          id="proof-upload"
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                        <label 
                          htmlFor="proof-upload"
                          className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-2xl p-10 hover:border-blue-500 hover:bg-blue-500/5 transition cursor-pointer group-hover:scale-[0.99]"
                        >
                          {verificationFile ? (
                            <img src={verificationFile} alt="Proof" className="max-h-64 rounded-lg shadow-xl" />
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                <Camera className="text-gray-400 group-hover:text-blue-400 transition" />
                              </div>
                              <span className="text-sm font-bold text-gray-400 group-hover:text-blue-400 transition uppercase tracking-tight">Capture or Upload Photo (Optional)</span>
                            </>
                          )}
                        </label>
                      </div>

                      <button 
                        onClick={handleVerify}
                        disabled={(!verificationFile && !proofDescription) || !gpsLocked}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transform active:scale-95 transition flex items-center justify-center gap-2 uppercase italic tracking-tight"
                      >
                        {!gpsLocked && <Navigation className="w-4 h-4 animate-spin" />}
                        {gpsLocked ? 'Submit to On-Chain AI Node' : 'Awaiting GPS Lock...'}
                      </button>
                    </div>
                  )}

                  {(status === 'verifying' || status === 'completed') && (
                    <div className={`rounded-2xl p-6 transition-all duration-500 border ${status === 'completed' ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}>
                          {status === 'completed' ? <CheckCircle className="text-white w-7 h-7" /> : <Shield className="text-white w-7 h-7 animate-spin" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-white uppercase tracking-wider italic">{status === 'completed' ? 'Escrow Released' : 'On-Chain AI Node Audit'}</h4>
                          <p className="text-[10px] text-gray-400 font-mono">NODE_TX_HASH: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-blue-400 mb-6">
                        <div className="flex gap-2">
                          <span className="text-gray-600">$</span>
                          <span className="break-words">{aiAnalysis}</span>
                        </div>
                      </div>

                      {status === 'completed' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                              <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Direct Payout</div>
                              <div className="text-xl font-black text-green-400">+{activeJob?.reward} CVT</div>
                              <div className="text-[9px] text-gray-600 italic">Settled via Smart Contract</div>
                            </div>
                            <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                              <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Reputation Gain</div>
                              <div className="text-xl font-black text-blue-400">+2 TRUST</div>
                              <div className="flex gap-1 mt-1">
                                {Object.keys(activeJob?.stats || {}).map(stat => (
                                  <div key={stat} className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase">{stat}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => { setStatus('browsing'); setActiveJob(null); setVerificationFile(null); setAiAnalysis(null); setDispatchStep('briefing'); setPpeConfirmed(false); setTrainingWatched(false); }}
                            className="w-full bg-gray-100 hover:bg-white text-gray-900 font-black py-4 rounded-xl transition uppercase italic tracking-tight"
                          >
                            Return to Dispatch Board
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Selected Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && !activeJob && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="absolute inset-0 bg-[#0a0c10]/95 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-[#161b22] border-t md:border border-gray-800 rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    selectedJob.type === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {selectedJob.type}
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="text-gray-500 hover:text-white transition">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <h2 className="text-3xl font-black text-white mb-4 leading-tight italic uppercase">{selectedJob.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{selectedJob.location.address}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                    <span>0x{selectedJob.id.slice(0, 12)}...</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">On-Chain Mission Details</h4>
                  <p className="text-gray-300 leading-relaxed mb-6 font-medium">{selectedJob.description}</p>
                  
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 italic">Verified Requirements</h4>
                  <div className="space-y-2">
                    {selectedJob.requirements.map(req => (
                      <div key={req} className="flex items-center gap-2 text-sm text-gray-400 capitalize">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{req.replace('_', ' ')}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-sm text-blue-400 font-bold uppercase tracking-tighter italic">
                      <Navigation className="w-4 h-4" />
                      <span>Real-Time GPS Verification Mandatory</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-8">
                  <div className="flex-1 bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4 text-center">
                    <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Contract Escrow</div>
                    <div className="text-3xl font-black text-white italic">{selectedJob.reward} <span className="text-blue-500 text-sm font-mono">CVT</span></div>
                  </div>
                  <div className="flex-1 bg-purple-600/10 border border-purple-500/30 rounded-2xl p-4 text-center">
                    <div className="text-[10px] text-purple-400 font-bold uppercase mb-1">Reputation Gain</div>
                    <div className="text-3xl font-black text-white italic">+2 <span className="text-purple-500 text-sm font-mono">TRUST</span></div>
                  </div>
                </div>

                <button 
                  onClick={() => handleAccept(selectedJob.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-blue-900/20 transform active:scale-95 transition flex items-center justify-center gap-3 uppercase italic tracking-tight"
                >
                  <Cpu className="w-6 h-6" />
                  SIGN & ACCEPT CONTRACT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Job Modal (Employer Mode) */}
      <AnimatePresence>
        {showCreateJob && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateJob(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
             <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#161b22] border border-gray-800 rounded-3xl p-8 w-full max-w-xl shadow-2xl"
             >
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Deploy Mission Contract</h2>
                   <button onClick={() => setShowCreateJob(false)} className="text-gray-500 hover:text-white transition">✕</button>
                </div>

                <form onSubmit={handleCreateJob} className="space-y-6">
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Job Title</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-purple-500 transition italic"
                        placeholder="e.g. Park Survey District 7"
                        value={newJobData.title}
                        onChange={e => setNewJobData({...newJobData, title: e.target.value})}
                      />
                   </div>
                   
                   <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Smart Contract Description</label>
                      <textarea 
                        required
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-purple-500 transition h-32 resize-none"
                        placeholder="Detail the immutable work requirements..."
                        value={newJobData.description}
                        onChange={e => setNewJobData({...newJobData, description: e.target.value})}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Escrow Amount (CVT/XMR)</label>
                        <input 
                          type="number" 
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-purple-500 transition font-mono"
                          value={newJobData.reward}
                          onChange={e => setNewJobData({...newJobData, reward: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Mission Type</label>
                        <select 
                          className={`w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white font-bold outline-none transition ${newJobData.type === 'paid' ? 'border-purple-500' : ''}`}
                          value={newJobData.type}
                          onChange={e => setNewJobData({...newJobData, type: e.target.value as any})}
                        >
                           <option value="volunteer">Volunteer (Non-Paid)</option>
                           <option value="paid">Monetary Contract</option>
                        </select>
                      </div>
                   </div>

                   <div className="bg-purple-600/10 border border-purple-500/30 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                         <Shield className="text-white w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-purple-400 uppercase tracking-tighter mb-1 italic">Sovereign Escrow Protocol</p>
                         <p className="text-[9px] text-gray-500 leading-tight">Funds are locked on-chain and released automatically upon Craig AI node verification. The platform has no access to these funds.</p>
                      </div>
                   </div>

                   <button 
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-purple-900/20 transform active:scale-95 transition uppercase italic tracking-tight"
                   >
                     Deploy Smart Contract
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Bottom Nav Stats (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0c10]/90 backdrop-blur-lg border-t border-gray-800 p-4 z-[90]">
        <div className="max-w-6xl mx-auto flex justify-around items-center">
          <div className="text-center group cursor-pointer" onClick={() => handleSendTip(0.1)}>
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Balance</div>
            <div className="text-sm font-black text-white group-hover:text-neon-pink transition">{wallet?.balance.toFixed(1) || '0.0'} CVT</div>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Monero (XMR)</div>
            <div className="text-sm font-black text-neon-pink">{multiChainAddresses?.MONERO_BALANCE || '0.00'}</div>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Rank</div>
            <div className="text-sm font-black text-green-400 italic">Citizen Lvl {user?.level || 1}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivicWatchPage;
