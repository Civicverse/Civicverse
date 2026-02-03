import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Send, Copy, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function WalletPage() {
  const { wallet, sendCrypto, loading } = useGameStore();
  const [tab, setTab] = useState<'balance' | 'send' | 'history'>('balance');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendCrypto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toAddress || !amount) return;

    try {
      await sendCrypto(toAddress, parseFloat(amount));
      setToAddress('');
      setAmount('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  const mockTransactions = [
    { id: 1, type: 'received', amount: 50, from: 'Mission Reward', date: '2025-02-02', status: 'confirmed' },
    { id: 2, type: 'sent', amount: 10, to: 'Civic Dev Fund', date: '2025-02-01', status: 'confirmed' },
    { id: 3, type: 'received', amount: 100, from: 'Environmental Cleanup', date: '2025-01-31', status: 'confirmed' },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">Wallet</h1>
        <p className="text-dark-300 mb-8">Manage your CIVIC tokens and transactions</p>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-civic rounded-2xl p-8 mb-8 text-white shadow-2xl"
        >
          <p className="text-civic-100 opacity-90 mb-2">Total Balance</p>
          <h2 className="text-5xl font-bold mb-6">{wallet?.balance.toFixed(2) || '0'} CIVIC</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm opacity-90 mb-1">Wallet Address</p>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
                <code className="text-sm flex-1 truncate">{wallet?.address}</code>
                <button className="hover:opacity-80 transition">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-90 mb-1">Pending Rewards</p>
              <p className="text-2xl font-semibold">{wallet?.pendingBalance.toFixed(2) || '0'} CIVIC</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-dark-700">
          {(['balance', 'send', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-4 font-semibold transition ${
                tab === t
                  ? 'text-civic-400 border-b-2 border-civic-500'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              {t === 'balance' && '💰 Balance'}
              {t === 'send' && '📤 Send'}
              {t === 'history' && '📊 History'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'balance' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-dark-300">Available</span>
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-white">{wallet?.balance.toFixed(2)}</p>
              <p className="text-dark-400 text-sm mt-2">Ready to use</p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-dark-300">Pending</span>
                <TrendingUp className="w-5 h-5 text-civic-400" />
              </div>
              <p className="text-3xl font-bold text-civic-400">{wallet?.pendingBalance.toFixed(2)}</p>
              <p className="text-dark-400 text-sm mt-2">Awaiting confirmation</p>
            </div>

            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-dark-300">Network</span>
              </div>
              <p className="text-3xl font-bold text-green-400">Testnet</p>
              <p className="text-dark-400 text-sm mt-2">Demo mode active</p>
            </div>
          </motion.div>
        )}

        {tab === 'send' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 max-w-md">
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-200"
                >
                  ✓ Transaction submitted successfully!
                </motion.div>
              )}

              <form onSubmit={handleSendCrypto} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Amount (CIVIC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    max={wallet?.balance}
                    className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                  />
                  <p className="text-xs text-dark-400 mt-2">
                    Available: {wallet?.balance.toFixed(2)} CIVIC
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-gradient-civic hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send CIVIC
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {tab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-3">
              {mockTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-dark-800 border border-dark-700 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${tx.type === 'received' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {tx.type === 'received' ? '📥' : '📤'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {tx.type === 'received' ? 'Received from' : 'Sent to'} {tx.type === 'received' ? tx.from : tx.to}
                      </p>
                      <p className="text-dark-400 text-sm">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${tx.type === 'received' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'received' ? '+' : '-'}{tx.amount} CIVIC
                    </p>
                    <p className="text-dark-400 text-xs capitalize">{tx.status}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
