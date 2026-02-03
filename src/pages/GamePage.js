import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
export function GamePage() {
    const navigate = useNavigate();
    const { wallet, updateWallet } = useGameStore();
    const [gameState, setGameState] = useState({
        issueReported: 0,
        score: 0,
        level: 1,
        time: 60,
        gameActive: true,
    });
    const [muted, setMuted] = useState(false);
    // Game timer
    useEffect(() => {
        if (!gameState.gameActive)
            return;
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
        if (!gameState.gameActive)
            return;
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
    return (_jsx("div", { className: "min-h-screen bg-gradient-dark flex items-center justify-center p-4", children: _jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5 }, className: "w-full max-w-2xl", children: _jsxs("div", { className: "bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: "\uD83C\uDFAE CivicWatch Game" }), _jsx("button", { onClick: () => setMuted(!muted), className: "p-2 hover:bg-dark-700 rounded-lg transition", children: muted ? (_jsx(VolumeX, { className: "w-6 h-6 text-dark-300" })) : (_jsx(Volume2, { className: "w-6 h-6 text-civic-400" })) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: [_jsxs("div", { className: "bg-dark-700 rounded-lg p-4 text-center", children: [_jsx("p", { className: "text-dark-300 text-sm font-medium", children: "Score" }), _jsx("p", { className: "text-2xl font-bold text-civic-400", children: gameState.score })] }), _jsxs("div", { className: "bg-dark-700 rounded-lg p-4 text-center", children: [_jsx("p", { className: "text-dark-300 text-sm font-medium", children: "Level" }), _jsx("p", { className: "text-2xl font-bold text-yellow-400", children: gameState.level })] }), _jsxs("div", { className: "bg-dark-700 rounded-lg p-4 text-center", children: [_jsx("p", { className: "text-dark-300 text-sm font-medium", children: "Issues Reported" }), _jsx("p", { className: "text-2xl font-bold text-green-400", children: gameState.issueReported })] }), _jsxs("div", { className: "bg-dark-700 rounded-lg p-4 text-center", children: [_jsx("p", { className: "text-dark-300 text-sm font-medium", children: "Time Left" }), _jsx("p", { className: `text-2xl font-bold ${gameState.time < 10 ? 'text-red-400' : 'text-blue-400'}`, children: formattedTime })] })] }), _jsx("div", { className: "bg-gradient-civic/10 border-2 border-dashed border-civic-500/50 rounded-xl p-12 mb-8 min-h-64 flex flex-col items-center justify-center", children: gameState.gameActive ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-dark-300 text-center mb-8 text-lg", children: "Click on issues in your neighborhood to report them and earn CIVIC rewards!" }), _jsx("div", { className: "grid grid-cols-3 gap-6 w-full mb-8", children: [1, 2, 3, 4, 5, 6].map((issue) => (_jsxs(motion.button, { whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 }, onClick: handleIssueClick, className: "bg-dark-700 hover:bg-civic-500/20 border-2 border-civic-500/50 hover:border-civic-400 rounded-lg p-6 transition h-24 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-3xl mb-2", children: "\uD83D\uDD0D" }), _jsxs("span", { className: "text-sm text-dark-300", children: ["Issue ", issue] })] }, issue))) }), _jsx("p", { className: "text-dark-400 text-sm text-center italic", children: "Each reported issue earns you 25-75 CIVIC tokens!" })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-3xl font-bold text-white mb-4", children: "Game Over!" }), _jsxs("p", { className: "text-civic-400 text-2xl font-bold mb-2", children: ["Final Score: ", gameState.score] }), _jsxs("p", { className: "text-green-400 text-lg font-semibold mb-6", children: ["Reward: +", Math.floor(gameState.score / 10), " CIVIC"] }), _jsxs("p", { className: "text-dark-300", children: ["You reported ", gameState.issueReported, " issues and reached Level ", gameState.level, "!"] })] }) })) }), _jsxs("div", { className: "flex gap-4", children: [_jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => {
                                    setGameState({
                                        issueReported: 0,
                                        score: 0,
                                        level: 1,
                                        time: 60,
                                        gameActive: true,
                                    });
                                }, className: "flex-1 bg-civic-500 hover:bg-civic-600 text-white font-bold py-3 px-6 rounded-lg transition", children: gameState.gameActive ? '🔄 Restart' : '🎮 Play Again' }), _jsxs(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: handleReturnToDashboard, className: "flex-1 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(ArrowLeft, { className: "w-5 h-5" }), "Return to Dashboard"] })] }), _jsx("div", { className: "mt-8 p-4 bg-dark-700/50 rounded-lg border border-dark-600", children: _jsxs("p", { className: "text-dark-300 text-sm text-center", children: ["Current Balance: ", _jsxs("span", { className: "text-civic-400 font-bold", children: [wallet?.balance.toFixed(2), " CIVIC"] })] }) })] }) }) }));
}
