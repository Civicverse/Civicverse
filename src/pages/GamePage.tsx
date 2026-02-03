import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface GameState {
  issueReported: number;
  score: number;
  level: number;
  time: number;
  gameActive: boolean;
}

export function GamePage() {
  const navigate = useNavigate();
  const { wallet, updateWallet } = useGameStore();
  const [gameState, setGameState] = useState<GameState>({
    issueReported: 0,
    score: 0,
    level: 1,
    time: 60,
    gameActive: true,
  });
  const [muted, setMuted] = useState(false);

  // Game timer
  useEffect(() => {
    if (!gameState.gameActive) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.time <= 1) {
          return { ...prev, time: 0, gameActive: false };
        }
        return { ...prev, time: prev.time - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.gameActive]);

  const handleIssueClick = () => {
    if (!gameState.gameActive) return;

    const points = Math.floor(Math.random() * 50) + 25;
    setGameState((prev) => ({
      ...prev,
      issueReported: prev.issueReported + 1,
      score: prev.score + points,
      level: Math.floor((prev.issueReported + 1) / 5) + 1,
    }));

    // Play sound (visual feedback)
    if (!muted) {
      // Visual feedback - score popup
      const popup = document.createElement('div');
      popup.textContent = `+${points}`;
      popup.style.position = 'fixed';
      popup.style.left = Math.random() * window.innerWidth + 'px';
      popup.style.top = Math.random() * window.innerHeight + 'px';
      popup.style.color = '#0ea5e9';
      popup.style.fontSize = '24px';
      popup.style.fontWeight = 'bold';
      popup.style.pointerEvents = 'none';
      popup.style.zIndex = '9999';
      popup.style.textShadow = '0 0 10px rgba(14, 165, 233, 0.5)';
      document.body.appendChild(popup);

      setTimeout(() => popup.remove(), 500);
    }
  };

  const handleGameEnd = () => {
    // Award the player with CIVIC tokens
    const reward = Math.floor(gameState.score / 10);
    if (wallet) {
      updateWallet({
        balance: wallet.balance + reward,
      });
    }
  };

  const handleReturnToDashboard = () => {
    handleGameEnd();
    navigate('/dashboard');
  };

  const formattedTime = `${Math.floor(gameState.time / 60)}:${(gameState.time % 60)
    .toString()
    .padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      {/* Game Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">🎮 CivicWatch Game</h1>
            <button
              onClick={() => setMuted(!muted)}
              className="p-2 hover:bg-dark-700 rounded-lg transition"
            >
              {muted ? (
                <VolumeX className="w-6 h-6 text-dark-300" />
              ) : (
                <Volume2 className="w-6 h-6 text-civic-400" />
              )}
            </button>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <p className="text-dark-300 text-sm font-medium">Score</p>
              <p className="text-2xl font-bold text-civic-400">{gameState.score}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <p className="text-dark-300 text-sm font-medium">Level</p>
              <p className="text-2xl font-bold text-yellow-400">{gameState.level}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <p className="text-dark-300 text-sm font-medium">Issues Reported</p>
              <p className="text-2xl font-bold text-green-400">{gameState.issueReported}</p>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <p className="text-dark-300 text-sm font-medium">Time Left</p>
              <p className={`text-2xl font-bold ${gameState.time < 10 ? 'text-red-400' : 'text-blue-400'}`}>
                {formattedTime}
              </p>
            </div>
          </div>

          {/* Game Area */}
          <div className="bg-gradient-civic/10 border-2 border-dashed border-civic-500/50 rounded-xl p-12 mb-8 min-h-64 flex flex-col items-center justify-center">
            {gameState.gameActive ? (
              <>
                <p className="text-dark-300 text-center mb-8 text-lg">
                  Click on issues in your neighborhood to report them and earn CIVIC rewards!
                </p>

                {/* Issue Clickable Areas */}
                <div className="grid grid-cols-3 gap-6 w-full mb-8">
                  {[1, 2, 3, 4, 5, 6].map((issue) => (
                    <motion.button
                      key={issue}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleIssueClick}
                      className="bg-dark-700 hover:bg-civic-500/20 border-2 border-civic-500/50 hover:border-civic-400 rounded-lg p-6 transition h-24 flex flex-col items-center justify-center"
                    >
                      <span className="text-3xl mb-2">🔍</span>
                      <span className="text-sm text-dark-300">Issue {issue}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Instructions */}
                <p className="text-dark-400 text-sm text-center italic">
                  Each reported issue earns you 25-75 CIVIC tokens!
                </p>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white mb-4">Game Over!</p>
                  <p className="text-civic-400 text-2xl font-bold mb-2">
                    Final Score: {gameState.score}
                  </p>
                  <p className="text-green-400 text-lg font-semibold mb-6">
                    Reward: +{Math.floor(gameState.score / 10)} CIVIC
                  </p>
                  <p className="text-dark-300">
                    You reported {gameState.issueReported} issues and reached Level {gameState.level}!
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setGameState({
                  issueReported: 0,
                  score: 0,
                  level: 1,
                  time: 60,
                  gameActive: true,
                });
              }}
              className="flex-1 bg-civic-500 hover:bg-civic-600 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {gameState.gameActive ? '🔄 Restart' : '🎮 Play Again'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReturnToDashboard}
              className="flex-1 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Dashboard
            </motion.button>
          </div>

          {/* Wallet Info */}
          <div className="mt-8 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
            <p className="text-dark-300 text-sm text-center">
              Current Balance: <span className="text-civic-400 font-bold">{wallet?.balance.toFixed(2)} CIVIC</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
