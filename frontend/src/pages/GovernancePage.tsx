import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Clock, Plus, X } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3003/api';

interface Proposal {
  id: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  status: string;
  userVoted?: boolean;
}

export function GovernancePage() {
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await axios.get(`${API_URL}/governance/proposals`);
      setProposals(res.data);
    } catch (err) {
      console.error('Failed to fetch proposals', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: string, choice: 'yes' | 'no') => {
    try {
      await axios.post(`${API_URL}/governance/vote`, { proposalId, choice });
      // Optimistic update or refetch
      fetchProposals();
    } catch (err) {
      alert('Vote failed');
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    try {
      await axios.post(`${API_URL}/governance/proposals`, {
        title: formData.title,
        description: formData.description
      });
      setFormData({ title: '', description: '' });
      setShowProposalForm(false);
      fetchProposals();
    } catch (err) {
      alert('Failed to create proposal');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Governance</h1>
            <p className="text-dark-300">Vote on proposals that shape CivicVerse's future</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowProposalForm(!showProposalForm)}
            className="bg-civic-500 hover:bg-civic-600 text-white font-bold py-3 px-6 rounded-lg transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Submit Proposal
          </motion.button>
        </div>

        {/* Proposal Form Modal */}
        {showProposalForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-800 border border-civic-500/50 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Submit a New Proposal</h2>
              <button
                onClick={() => setShowProposalForm(false)}
                className="p-2 hover:bg-dark-700 rounded-lg transition"
              >
                <X className="w-6 h-6 text-dark-300" />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Proposal Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Increase Mission Rewards by 25%"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white placeholder-dark-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 transition outline-none"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about your proposal and why it's important for the community..."
                  rows={4}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white placeholder-dark-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 transition outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="flex-1 bg-civic-500 hover:bg-civic-600 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Submit Proposal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Active Proposals', value: proposals.length.toString(), icon: '🗳️' },
            { label: 'Your Voting Power', value: '1,250 CIVIC', icon: '⚡' },
            { label: 'Governance Participation', value: '85%', icon: '📊' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-dark-800 border border-dark-700 rounded-xl p-6"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p className="text-dark-300 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Proposals */}
        <div className="space-y-4">
          {loading ? <div className="text-white">Loading proposals...</div> : proposals.map((proposal, index) => {
            const totalVotes = proposal.votesFor + proposal.votesAgainst;
            const yesPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
            const noPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;

            return (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
                    <p className="text-dark-300">{proposal.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-dark-300 text-sm ml-4">
                    <Clock className="w-4 h-4" />
                    {proposal.status}
                  </div>
                </div>

                {/* Voting Results */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-200">Vote Results</span>
                    <span className="text-sm text-dark-400">{totalVotes} votes</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-dark-700 gap-1">
                    <div
                      className="bg-green-500 transition-all"
                      style={{ width: `${yesPercent}%` }}
                    ></div>
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${noPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-green-400">✓ Yes: {proposal.votesFor}</span>
                    <span className="text-red-400">✗ No: {proposal.votesAgainst}</span>
                  </div>
                </div>

                {/* Vote Buttons */}
                <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, 'yes')}
                      className="flex-1 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" /> Vote Yes
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, 'no')}
                      className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <ThumbsDown className="w-4 h-4" /> Vote No
                    </button>
                  </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
