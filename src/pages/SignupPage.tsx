import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [civicId, setCivicId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const { signup, loading } = useGameStore();

  const validateStep1 = () => {
    if (!username || !civicId) {
      setError('Please fill in all fields');
      return false;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    try {
      await signup(username, civicId, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Signup failed. Please try again.');
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-civic mb-4">
              <span className="text-2xl font-bold">🚀</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Join CivicVerse</h1>
            <p className="text-dark-300">Step {step} of 2</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 flex gap-2">
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 1 ? 'bg-civic-500' : 'bg-dark-700'
              }`}
            ></div>
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step >= 2 ? 'bg-civic-500' : 'bg-dark-700'
              }`}
            ></div>
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

          {/* Step 1: User Info */}
          {step === 1 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose your username"
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                  />
                </div>
              </div>

              {/* Civic ID */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Civic ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
                  <input
                    type="text"
                    value={civicId}
                    onChange={(e) => setCivicId(e.target.value)}
                    placeholder="Your unique Civic ID"
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full mt-6 py-2.5 bg-gradient-civic hover:opacity-90 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </motion.form>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSignup}
              className="space-y-4"
            >
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
                    placeholder="Create a strong password"
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-dark-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-white placeholder-dark-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-2.5 bg-gradient-civic hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-dark-300 hover:text-white font-medium transition"
              >
                ← Back
              </button>
            </motion.form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-dark-700"></div>
            <span className="text-dark-400 text-xs uppercase">Or</span>
            <div className="flex-1 h-px bg-dark-700"></div>
          </div>

          {/* Login Link */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-lg transition duration-200"
          >
            Already have an account? Login
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-dark-400 text-xs mt-6">
          By signing up, you agree to our Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
