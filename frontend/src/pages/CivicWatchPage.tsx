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
  Map as MapIcon
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [status, setStatus] = useState<'browsing' | 'dispatching' | 'verifying' | 'completed'>('browsing');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const { user, updateUser, wallet, updateWallet } = useGameStore();

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

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await civicWatchApi.getJobs();
      setJobs(data);
      // Check if user already has an active job
      const myActiveJob = data.find(j => j.assignee === did && (j.status === 'in_progress' || j.status === 'verifying'));
      if (myActiveJob) {
        setActiveJob(myActiveJob);
        setStatus(myActiveJob.status === 'verifying' ? 'verifying' : 'dispatching');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    if (!did) return alert('Please create an identity first');
    try {
      const res = await civicWatchApi.acceptJob(jobId, did);
      setActiveJob(res.job);
      setStatus('dispatching');
      setSelectedJob(null);
      fetchJobs();
    } catch (err) {
      alert('Failed to accept job: ' + err.message);
    }
  };

  const handleVerify = async () => {
    if (!activeJob || !did || !verificationFile) return;
    setStatus('verifying');
    setAiAnalysis("Craig AI is analyzing your proof for authenticity, GPS consistency, and impact verification...");
    
    try {
      const res = await civicWatchApi.verifyJob(activeJob.id, did, verificationFile);
      
      // Simulate Craig AI feedback delay
      setTimeout(() => {
        setAiAnalysis("✓ Proof Verified. 100% Match with Civic Standard. Impact recorded in Global Ledger.");
        
        setTimeout(() => {
          if (res.payoutDetails) {
            // Update local user stats and wallet
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
        }, 1500);
      }, 2000);

    } catch (err) {
      setStatus('dispatching');
      alert('Verification failed: ' + err.message);
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
              <h1 className="text-xl font-bold tracking-tight">CivicWatch <span className="text-blue-500 text-xs font-mono ml-1">v0.9-NIGHTLY</span></h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Real-World Impact Dispatch</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <div className="text-xs text-gray-400">Reputation Score</div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-24 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${user?.trustScore || 50}%` }}></div>
                </div>
                <span className="text-sm font-bold text-green-400">{user?.trustScore || 50}</span>
              </div>
            </div>
            {did ? (
              <div className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-gray-300">{did.slice(0, 10)}...</span>
              </div>
            ) : (
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full text-xs font-bold transition">Connect Identity</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {status === 'browsing' ? (
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
                            
                            <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition">{job.title}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed flex-1">{job.description}</p>
                            
                            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mb-4">
                              <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-md">
                                <MapPin className="w-3 h-3" />
                                <span>{job.location.address}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded-md">
                                <Clock className="w-3 h-3" />
                                <span>~25 mins</span>
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
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                    <Zap className="w-7 h-7" />
                  </div>
                </div>

                {/* Tracking UI */}
                <div className="p-8">
                  <div className="relative mb-12">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-800"></div>
                    
                    <div className="relative pl-12 mb-8">
                      <div className="absolute left-2.5 -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-gray-900 z-10"></div>
                      <h4 className="text-sm font-bold text-white mb-1">Dispatched</h4>
                      <p className="text-xs text-gray-500">Mission accepted and signed on ledger.</p>
                    </div>

                    <div className="relative pl-12 mb-8">
                      <div className={`absolute left-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-gray-900 z-10 ${status !== 'dispatching' ? 'bg-green-500' : 'bg-blue-500 animate-pulse ring-4 ring-blue-500/20'}`}></div>
                      <h4 className="text-sm font-bold text-white mb-1">On Location</h4>
                      <p className="text-xs text-gray-500">Perform the work at: <span className="text-blue-400 font-mono">{activeJob?.location.address}</span></p>
                    </div>

                    <div className="relative pl-12">
                      <div className={`absolute left-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-gray-900 z-10 ${status === 'completed' ? 'bg-green-500' : (status === 'verifying' ? 'bg-blue-500 animate-pulse' : 'bg-gray-800')}`}></div>
                      <h4 className="text-sm font-bold text-white mb-1">Verification</h4>
                      <p className="text-xs text-gray-500">Submit proof of impact for Craig AI audit.</p>
                    </div>
                  </div>

                  {status === 'dispatching' && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Camera className="text-blue-500 w-5 h-5" />
                        Submit Verification
                      </h3>
                      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                        To claim your <span className="text-white font-bold">{activeJob?.reward} CVT</span>, upload a clear photo or video proof of the completed work.
                      </p>
                      
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
                              <span className="text-sm font-bold text-gray-400 group-hover:text-blue-400 transition">Capture or Upload Proof</span>
                            </>
                          )}
                        </label>
                      </div>

                      <button 
                        onClick={handleVerify}
                        disabled={!verificationFile}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transform active:scale-95 transition"
                      >
                        Submit for Craig AI Audit
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
                          <h4 className="font-bold text-white uppercase tracking-wider">{status === 'completed' ? 'Mission Verified' : 'AI Audit in Progress'}</h4>
                          <p className="text-[10px] text-gray-400 font-mono">NODE_TX_HASH: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-blue-400 mb-6">
                        <div className="flex gap-2">
                          <span className="text-gray-600">$</span>
                          <span>{aiAnalysis}</span>
                        </div>
                      </div>

                      {status === 'completed' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                              <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Reward Payout</div>
                              <div className="text-xl font-black text-green-400">+{activeJob?.reward} CVT</div>
                              <div className="text-[9px] text-gray-600">Incl. 1% Micro-Tax Deduction</div>
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
                            onClick={() => { setStatus('browsing'); setActiveJob(null); setVerificationFile(null); setAiAnalysis(null); }}
                            className="w-full bg-gray-100 hover:bg-white text-gray-900 font-bold py-3 rounded-xl transition"
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

                <h2 className="text-3xl font-black text-white mb-4 leading-tight">{selectedJob.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>{selectedJob.location.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>~25 mins</span>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Mission Description</h4>
                  <p className="text-gray-300 leading-relaxed mb-6">{selectedJob.description}</p>
                  
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Verification Requirements</h4>
                  <div className="space-y-2">
                    {selectedJob.requirements.map(req => (
                      <div key={req} className="flex items-center gap-2 text-sm text-gray-400 capitalize">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{req.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-8">
                  <div className="flex-1 bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4">
                    <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Potential Reward</div>
                    <div className="text-3xl font-black text-white">{selectedJob.reward} <span className="text-blue-500 text-sm">CVT</span></div>
                  </div>
                  <div className="flex-1 bg-purple-600/10 border border-purple-500/30 rounded-2xl p-4">
                    <div className="text-[10px] text-purple-400 font-bold uppercase mb-1">Reputation Gain</div>
                    <div className="text-3xl font-black text-white">+2 <span className="text-purple-500 text-sm">TRUST</span></div>
                  </div>
                </div>

                <button 
                  onClick={() => handleAccept(selectedJob.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-blue-900/20 transform active:scale-95 transition flex items-center justify-center gap-3"
                >
                  <Zap className="w-6 h-6 fill-white" />
                  ACCEPT DISPATCH
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Bottom Nav Stats (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0c10]/90 backdrop-blur-lg border-t border-gray-800 p-4 z-[90]">
        <div className="max-w-6xl mx-auto flex justify-around items-center">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Balance</div>
            <div className="text-sm font-black text-white">{wallet?.balance.toFixed(1) || '0.0'} CVT</div>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Active Missions</div>
            <div className="text-sm font-black text-blue-500">{activeJob ? '1' : '0'} / 3</div>
          </div>
          <div className="h-8 w-px bg-gray-800"></div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Rank</div>
            <div className="text-sm font-black text-green-400">Citizen Lvl {user?.level || 1}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivicWatchPage;
