import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MapPin, Send, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function MissionsPage() {
  const { missions, acceptMission, completeMission } = useGameStore();
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [proofText, setProofText] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleAcceptMission = (missionId: string) => {
    acceptMission(missionId);
    setSelectedMission(missionId);
  };

  const handleSubmitProof = (missionId: string) => {
    if (!proofText.trim()) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
      return;
    }
    completeMission(missionId, proofText);
    setProofText('');
    setSubmitStatus('success');
    setTimeout(() => setSubmitStatus('idle'), 3000);
  };

  const difficultyColors = {
    easy: 'bg-green-500/10 text-green-300 border-green-500/30',
    medium: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    hard: 'bg-red-500/10 text-red-300 border-red-500/30',
  };

  const categoryEmojis = {
    civic: '⚔️',
    environmental: '🌱',
    social: '👥',
    educational: '📚',
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">CivicWatch Missions</h1>
        <p className="text-dark-300 mb-12">Complete real-world civic missions and earn CIVIC rewards</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Missions List */}
          <div className="lg:col-span-2 space-y-4">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedMission(mission.id)}
                className={`bg-dark-800 border cursor-pointer rounded-xl p-6 transition-all ${
                  selectedMission === mission.id
                    ? 'border-civic-500 ring-2 ring-civic-500/20'
                    : 'border-dark-700 hover:border-dark-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{categoryEmojis[mission.category]}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{mission.title}</h3>
                      <p className="text-dark-300 text-sm mt-1">{mission.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-civic-400">{mission.reward}</div>
                    <div className="text-xs text-dark-300">CIVIC</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {mission.location && (
                    <span className="flex items-center gap-1 text-xs text-dark-300">
                      <MapPin className="w-3 h-3" /> {mission.location}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold border ${
                      difficultyColors[mission.difficulty]
                    }`}
                  >
                    {mission.difficulty}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      mission.status === 'completed'
                        ? 'bg-green-500/10 text-green-300'
                        : mission.status === 'in-progress'
                        ? 'bg-blue-500/10 text-blue-300'
                        : 'bg-dark-700 text-dark-300'
                    }`}
                  >
                    {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mission Details Panel */}
          <div className="lg:col-span-1">
            {selectedMission ? (
              <motion.div
                key={selectedMission}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6 sticky top-24"
              >
                {missions.find((m) => m.id === selectedMission) && (
                  <>
                    {(() => {
                      const m = missions.find((x) => x.id === selectedMission)!;
                      return (
                        <>
                          <h3 className="text-xl font-bold text-white mb-4">{m.title}</h3>

                          <div className="space-y-4 mb-6">
                            <div>
                              <p className="text-xs uppercase text-dark-400 font-semibold mb-1">
                                Description
                              </p>
                              <p className="text-dark-200">{m.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs uppercase text-dark-400 font-semibold mb-1">
                                  Difficulty
                                </p>
                                <p className="text-dark-200 capitalize">{m.difficulty}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase text-dark-400 font-semibold mb-1">
                                  Category
                                </p>
                                <p className="text-dark-200 capitalize">{m.category}</p>
                              </div>
                            </div>
                          </div>

                          {/* Reward */}
                          <div className="bg-civic-500/10 border border-civic-500/30 rounded-lg p-4 mb-6">
                            <p className="text-xs uppercase text-dark-400 font-semibold mb-1">
                              Reward
                            </p>
                            <div className="text-3xl font-bold text-civic-400">{m.reward} CIVIC</div>
                          </div>

                          {/* Proof Submit */}
                          {m.status === 'in-progress' && (
                            <>
                              {submitStatus === 'success' && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-200 text-xs"
                                >
                                  ✓ Proof submitted successfully!
                                </motion.div>
                              )}
                              {submitStatus === 'error' && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-xs flex gap-2"
                                >
                                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  Please provide proof details
                                </motion.div>
                              )}
                              <textarea
                                value={proofText}
                                onChange={(e) => setProofText(e.target.value)}
                                placeholder="Describe your proof or upload details..."
                                className="w-full h-24 p-3 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 resize-none focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-sm"
                              />
                              <button
                                onClick={() => handleSubmitProof(m.id)}
                                className="w-full mt-4 py-2 bg-gradient-civic hover:opacity-90 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                              >
                                <Send className="w-4 h-4" /> Submit Proof
                              </button>
                            </>
                          )}

                          {m.status === 'available' && (
                            <button
                              onClick={() => handleAcceptMission(m.id)}
                              className="w-full py-3 bg-gradient-civic hover:opacity-90 text-white font-semibold rounded-lg transition"
                            >
                              Accept Mission
                            </button>
                          )}

                          {m.status === 'completed' && (
                            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-center font-semibold">
                              ✓ Mission Complete!
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </motion.div>
            ) : (
              <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 text-center">
                <p className="text-dark-300">Select a mission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
