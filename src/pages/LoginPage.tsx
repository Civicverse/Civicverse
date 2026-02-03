import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Lock, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoginPage() {
  const navigate = useNavigate();
  const [civicId, setCivicId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!civicId || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(civicId, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-2xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-civic mb-4">
              <span className="text-2xl font-bold">⚔️</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">CivicVerse</h1>
            <p className="text-dark-300">The Real-World Game</p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Civic ID */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Civic ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  value={civicId}
                  onChange={(e) => setCivicId(e.target.value)}
                  placeholder="Enter your Civic ID"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 bg-gradient-civic hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login with Civic ID'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-dark-700"></div>
            <span className="text-dark-400 text-xs uppercase">Or</span>
            <div className="flex-1 h-px bg-dark-700"></div>
          </div>

          {/* Sign Up Link */}
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition duration-200"
          >
            Create New Account
          </button>

          {/* Demo Mode Notice */}
          <div className="mt-6 p-3 bg-civic-500/10 border border-civic-500/30 rounded-lg">
            <p className="text-civic-200 text-xs">
              💡 <strong>Demo Mode Active</strong> - All features simulated for testing
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-dark-400 text-xs mt-6">
          Part of the CivicVerse ecosystem | Privacy-preserving decentralized gaming
        </p>
      </motion.div>
    </div>
  );
}
