import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  ExternalLink, 
  Shield, 
  Eye, 
  EyeOff,
  RefreshCw,
  Search,
  ChevronRight,
  Zap,
  Lock,
  QrCode
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import CivicWallet from '../lib/civicWallet';
import CivicIdentity from '../lib/civicIdentity';

export function WalletDetailsPage() {
  const { wallet, multiChainAddresses, user } = useGameStore();
  const [activeChain, setActiveChain] = useState<'BTC' | 'ETH' | 'KASPA' | 'MONERO' | 'CIVIC'>('CIVIC');
  const [showSeed, setShowSeed] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendForm, setSendForm] = useState({ to: '', amount: '' });
  const [txHistory, setTxHistory] = useState<any[]>([]);

  const chains = [
    { id: 'CIVIC', name: 'CivicVerse Native', symbol: 'CVT', color: 'bg-blue-600', icon: '🛡️', balance: wallet?.balance || 0 },
    { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', color: 'bg-orange-500', icon: '₿', balance: 0.042 },
    { id: 'ETH', name: 'Ethereum', symbol: 'ETH', color: 'bg-indigo-500', icon: 'Ξ', balance: 1.25 },
    { id: 'KASPA', name: 'Kaspa', symbol: 'KAS', color: 'bg-teal-500', icon: '💎', balance: 15400 },
    { id: 'MONERO', name: 'Monero', symbol: 'XMR', color: 'bg-orange-700', icon: 'Ⓜ️', balance: 12.5 },
  ];

  useEffect(() => {
     // Load mock history
     setTxHistory([
       { id: '1', type: 'receive', amount: 50, symbol: 'CVT', from: 'CivicWatch Dispatch', date: '2 hours ago', status: 'confirmed' },
       { id: '2', type: 'send', amount: 12, symbol: 'CVT', to: 'Marketplace Vendor', date: '5 hours ago', status: 'confirmed' },
       { id: '3', type: 'receive', amount: 150, symbol: 'CVT', from: 'UBI Distribution', date: '1 day ago', status: 'confirmed' },
     ]);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard');
  };

  const handleRevealSeed = async () => {
    if (showSeed) {
      setShowSeed(false);
      return;
    }

    const password = prompt('Enter password to reveal recovery phrase:');
    if (!password) return;

    try {
      const restored = await CivicWallet.restore(user?.civicId || '', password);
      if (restored) {
        setSeedPhrase(restored.mnemonic);
        setShowSeed(true);
      } else {
        alert('Invalid password');
      }
    } catch (e) {
      alert('Failed to reveal seed');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.to || !sendForm.amount) return;
    
    const password = prompt(`Sign transaction of ${sendForm.amount} ${activeChain}? Enter password:`);
    if (!password) return;

    setIsSending(true);
    // Simulate multi-chain signing
    setTimeout(() => {
      alert(`Transaction Signed & Broadcasted!\n\nTxHash: 0x${Math.random().toString(16).slice(2)}...`);
      setIsSending(false);
      setSendForm({ to: '', amount: '' });
    }, 2000);
  };

  const currentAddress = activeChain === 'CIVIC' ? (wallet?.address || 'N/A') : (multiChainAddresses?.[activeChain] || 'No address derived');

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
           <div className="flex items-center gap-2 mb-2">
              <Lock className="text-green-500 w-4 h-4" />
              <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Non-Custodial Multi-Chain Vault</span>
           </div>
           <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">Vault Details</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar: Chain Selection */}
          <div className="lg:col-span-1 space-y-4">
             <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Select Chain</h3>
                <div className="space-y-2">
                   {chains.map(chain => (
                     <button
                      key={chain.id}
                      onClick={() => setActiveChain(chain.id as any)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        activeChain === chain.id 
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/10' 
                        : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${chain.color}`}>
                              {chain.icon}
                           </div>
                           <div className="text-left">
                              <div className="text-xs font-bold">{chain.name}</div>
                              <div className="text-[10px] opacity-60 font-mono">{chain.symbol}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs font-black">{chain.balance.toLocaleString()}</div>
                           <div className="text-[9px] text-gray-500">~$ {(chain.balance * (chain.id === 'BTC' ? 65000 : chain.id === 'ETH' ? 3500 : 1.5)).toLocaleString()}</div>
                        </div>
                     </button>
                   ))}
                </div>
             </div>

             <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                   <Shield className="text-red-500 w-5 h-5" />
                   <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">Security Zone</h3>
                </div>
                <button 
                  onClick={handleRevealSeed}
                  className="w-full bg-gray-900 hover:bg-red-900/20 border border-gray-800 hover:border-red-500/30 p-4 rounded-2xl flex items-center justify-between transition group"
                >
                   <div className="flex items-center gap-3">
                      {showSeed ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                      <span className="text-xs font-bold text-gray-300">Recovery Phrase</span>
                   </div>
                   <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-red-400" />
                </button>
                
                <AnimatePresence>
                   {showSeed && (
                     <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 overflow-hidden"
                     >
                        <div className="bg-black p-4 rounded-2xl border border-red-500/30 font-mono text-[11px] text-red-400 leading-relaxed break-words">
                           {seedPhrase}
                        </div>
                        <p className="text-[9px] text-red-500/60 mt-2 italic">⚠️ Never share this phrase. It grants total access to your assets.</p>
                     </motion.div>
                   )}
                </AnimatePresence>
             </div>
          </div>

          {/* Main Content: Active Wallet Details */}
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                   <QrCode className="w-40 h-40" />
                </div>
                
                <div className="flex items-center gap-4 mb-8">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl ${chains.find(c => c.id === activeChain)?.color}`}>
                      {chains.find(c => c.id === activeChain)?.icon}
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{activeChain} Wallet</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{chains.find(c => c.id === activeChain)?.name}</p>
                   </div>
                </div>

                <div className="mb-10">
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Current Balance</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-white tracking-tighter">{chains.find(c => c.id === activeChain)?.balance.toLocaleString()}</span>
                      <span className="text-2xl font-black text-blue-500 italic uppercase">{activeChain === 'CIVIC' ? 'CVT' : activeChain}</span>
                   </div>
                </div>

                <div className="bg-[#0a0c10] border border-gray-800 rounded-3xl p-6 flex items-center justify-between">
                   <div className="flex-1 overflow-hidden mr-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Your Receive Address</p>
                      <div className="text-xs font-mono text-blue-400 truncate">{currentAddress}</div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => handleCopy(currentAddress)} className="p-3 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-gray-400">
                         <Copy className="w-5 h-5" />
                      </button>
                      <button className="p-3 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-gray-400">
                         <ExternalLink className="w-5 h-5" />
                      </button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Send Asset */}
                <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8">
                   <div className="flex items-center gap-3 mb-6">
                      <ArrowUpRight className="text-blue-500 w-5 h-5" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest">Send {activeChain}</h3>
                   </div>
                   <form onSubmit={handleSend} className="space-y-4">
                      <div>
                         <input 
                           type="text" 
                           placeholder="Recipient Address" 
                           className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none"
                           value={sendForm.to}
                           onChange={e => setSendForm({...sendForm, to: e.target.value})}
                         />
                      </div>
                      <div className="relative">
                         <input 
                           type="number" 
                           placeholder="Amount" 
                           className="w-full bg-[#0a0c10] border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-blue-500 outline-none"
                           value={sendForm.amount}
                           onChange={e => setSendForm({...sendForm, amount: e.target.value})}
                         />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600 uppercase">MAX</div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-gray-600 px-1">
                         <span>Estimated Fee</span>
                         <span className="text-gray-400">0.00012 {activeChain}</span>
                      </div>
                      <button 
                        type="submit"
                        disabled={isSending}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition uppercase tracking-tighter italic"
                      >
                         {isSending ? 'Signing Transaction...' : `Broadcast ${activeChain} Transfer`}
                      </button>
                   </form>
                </div>

                {/* Recent History */}
                <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <RefreshCw className="text-blue-500 w-5 h-5" />
                         <h3 className="text-xs font-bold text-white uppercase tracking-widest">Recent Activity</h3>
                      </div>
                      <button className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-widest">View All</button>
                   </div>
                   <div className="space-y-4">
                      {txHistory.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-[#0a0c10] rounded-2xl border border-gray-800/50">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'receive' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                 {tx.type === 'receive' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-white">{tx.type === 'receive' ? 'Received' : 'Sent'}</div>
                                 <div className="text-[9px] text-gray-600 font-mono">{tx.from || tx.to}</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className={`text-[10px] font-black ${tx.type === 'receive' ? 'text-green-500' : 'text-gray-300'}`}>
                                 {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
                              </div>
                              <div className="text-[8px] text-gray-600 font-bold uppercase">{tx.date}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
