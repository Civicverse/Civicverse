import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading, isInitialized } = useGameStore();

  const [hasLocalIdentity, setHasLocalIdentity] = useState(false);
  const [localDid, setLocalDid] = useState<string | null>(null);

  React.useEffect(() => {
    const did = localStorage.getItem('civicverse:did');
    if (did) {
      setHasLocalIdentity(true);
      setLocalDid(did);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      // Use device-local as a placeholder if we have a local DID
      await login(localDid || 'device-local', password);
      navigate('/wallet');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your password or sign up first.');
    }
  };

  if (!isInitialized) return null;

  if (!hasLocalIdentity) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-dark-800 border border-neon-cyan/30 p-8 rounded-2xl max-w-md w-full text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">No Identity Found</h2>
          <p className="text-gray-400 mb-8">You need to create a Civic ID on this device before you can log in.</p>
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-3 bg-gradient-neon-cyan-pink rounded-lg font-bold text-white hover:shadow-lg transition"
          >
            Create Your Identity
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-tropical flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-neon-cyan/20 to-transparent rounded-full blur-3xl opacity-30 animate-pulse-neon"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-neon-pink/20 to-transparent rounded-full blur-3xl opacity-30 animate-pulse-neon"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-tropical-dark/80 backdrop-blur-xl border border-neon-cyan/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-neon-cyan-pink"></div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-neon-cyan-pink mb-4 shadow-lg"
            >
              <span className="text-3xl font-bold">🌴</span>
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-cyan bg-clip-text text-transparent mb-2 animate-pulse-neon">
              CivicVerse
            </h1>
            <p className="text-neon-cyan/80 font-medium">Enter the Tropical Neon City</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/15 border border-red-500/60 rounded-lg flex items-start gap-3 backdrop-blur-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-bold text-neon-cyan/90 mb-3 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-neon-pink group-focus-within:text-neon-cyan transition" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-tropical-surface/60 border border-neon-cyan/30 rounded-lg focus:border-neon-pink focus:outline-none focus:ring-2 focus:ring-neon-pink/30 transition text-white placeholder-tropical-accent/60 backdrop-blur-sm"
                  autoFocus
                />
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-neon-cyan-pink rounded-lg font-bold text-white/95 hover:shadow-lg hover:shadow-neon-pink/50 transition disabled:opacity-50 disabled:cursor-not-allowed text-base tracking-wide"
            >
              {loading ? (
                <motion.div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Unlocking...
                </motion.div>
              ) : (
                'Enter the City'
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-tropical-accent/80 text-sm">
              New to the verse?{' '}
              <motion.a
                href="/signup"
                whileHover={{ scale: 1.05 }}
                className="text-neon-cyan hover:text-neon-pink font-bold transition cursor-pointer"
              >
                Create Your Identity
              </motion.a>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 p-4 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30 backdrop-blur-sm"
          >
            <p className="text-xs text-neon-cyan/80 leading-relaxed">
              🔒 <strong>Non-Custodial Encrypted:</strong> Your identity and wallet are encrypted on your device only. We NEVER see your password or private keys.
            </p>
          </motion.div>
        </div>

        {/* Floating particles */}
        <motion.div className="absolute -bottom-10 -right-10 w-20 h-20 bg-neon-pink/20 rounded-full blur-2xl opacity-50" animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} />
      </motion.div>
    </div>
  );
}
