import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Gamepad2, Users, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, wallet, missions, setMissions } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize demo missions
    if (missions.length === 0) {
      const demoMissions = [
        {
          id: '1',
          title: 'Report Community Issue',
          description: 'Document and report a local infrastructure issue (pothole, broken streetlight, etc.)',
          category: 'civic' as const,
          reward: 50,
          difficulty: 'easy' as const,
          status: 'available' as const,
          location: 'Downtown District',
          image: '🛣️',
        },
        {
          id: '2',
          title: 'Environmental Cleanup',
          description: 'Organize or participate in a local cleanup effort',
          category: 'environmental' as const,
          reward: 100,
          difficulty: 'medium' as const,
          status: 'available' as const,
          location: 'Central Park',
          image: '🌱',
        },
        {
          id: '3',
          title: 'Community Education',
          description: 'Teach a workshop or educational session to locals',
          category: 'educational' as const,
          reward: 150,
          difficulty: 'hard' as const,
          status: 'available' as const,
          image: '📚',
        },
      ];
      setMissions(demoMissions);
    }
    setLoading(false);
  }, []);

  const stats = [
    { label: 'Trust Score', value: user?.trustScore || 0, icon: Zap, color: 'text-yellow-400' },
    { label: 'Level', value: user?.level || 1, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Active Missions', value: missions.filter((m) => m.status === 'in-progress').length, icon: Gamepad2, color: 'text-civic-400' },
    { label: 'Completed', value: missions.filter((m) => m.status === 'completed').length, icon: Users, color: 'text-blue-400' },
  ];

  const completedMissions = missions.filter((m) => m.status === 'completed').length;
  const totalMissions = missions.length;
  const progressPercent = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-dark-800/50 border-b border-dark-700 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-12 h-12 rounded-full border-2 border-civic-500"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
                <p className="text-dark-300">Civic ID: {user?.civicId.slice(0, 16)}...</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-civic-400">{wallet?.balance.toFixed(2)} CIVIC</div>
              <p className="text-dark-300">Wallet Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-civic-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-300 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-800 border border-dark-700 rounded-xl p-8 mb-12"
        >
          <h2 className="text-xl font-bold text-white mb-4">Overall Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-300">Missions Completed</span>
                <span className="text-civic-400 font-semibold">{completedMissions}/{totalMissions}</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-civic-500 to-civic-400"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate('/foyer')}
            className="bg-gradient-civic hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105"
          >
            🏛️ Enter Foyer
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/governance')}
            className="bg-dark-800 border border-dark-700 hover:border-civic-500/50 text-white font-semibold py-4 px-6 rounded-xl transition"
          >
            🗳️ Governance
          </motion.button>
        </div>
      </div>
    </div>
  );
}
