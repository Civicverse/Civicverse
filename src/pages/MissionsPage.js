import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { MapPin, Send, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
export function MissionsPage() {
    const { missions, acceptMission, completeMission } = useGameStore();
    const [selectedMission, setSelectedMission] = useState(null);
    const [proofText, setProofText] = useState('');
    const [submitStatus, setSubmitStatus] = useState('idle');
    const handleAcceptMission = (missionId) => {
        acceptMission(missionId);
        setSelectedMission(missionId);
    };
    const handleSubmitProof = (missionId) => {
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
    return (_jsx("div", { className: "min-h-screen bg-gradient-dark", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [_jsx("h1", { className: "text-4xl font-bold text-white mb-2", children: "CivicWatch Missions" }), _jsx("p", { className: "text-dark-300 mb-12", children: "Complete real-world civic missions and earn CIVIC rewards" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2 space-y-4", children: missions.map((mission, index) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.1 }, onClick: () => setSelectedMission(mission.id), className: `bg-dark-800 border cursor-pointer rounded-xl p-6 transition-all ${selectedMission === mission.id
                                    ? 'border-civic-500 ring-2 ring-civic-500/20'
                                    : 'border-dark-700 hover:border-dark-600'}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "text-3xl", children: categoryEmojis[mission.category] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-bold text-white", children: mission.title }), _jsx("p", { className: "text-dark-300 text-sm mt-1", children: mission.description })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-2xl font-bold text-civic-400", children: mission.reward }), _jsx("div", { className: "text-xs text-dark-300", children: "CIVIC" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 mt-4", children: [mission.location && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-dark-300", children: [_jsx(MapPin, { className: "w-3 h-3" }), " ", mission.location] })), _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold border ${difficultyColors[mission.difficulty]}`, children: mission.difficulty }), _jsx("span", { className: `px-2 py-1 rounded text-xs font-semibold ${mission.status === 'completed'
                                                    ? 'bg-green-500/10 text-green-300'
                                                    : mission.status === 'in-progress'
                                                        ? 'bg-blue-500/10 text-blue-300'
                                                        : 'bg-dark-700 text-dark-300'}`, children: mission.status.charAt(0).toUpperCase() + mission.status.slice(1) })] })] }, mission.id))) }), _jsx("div", { className: "lg:col-span-1", children: selectedMission ? (_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-dark-800 border border-dark-700 rounded-xl p-6 sticky top-24", children: missions.find((m) => m.id === selectedMission) && (_jsx(_Fragment, { children: (() => {
                                        const m = missions.find((x) => x.id === selectedMission);
                                        return (_jsxs(_Fragment, { children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: m.title }), _jsxs("div", { className: "space-y-4 mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase text-dark-400 font-semibold mb-1", children: "Description" }), _jsx("p", { className: "text-dark-200", children: m.description })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase text-dark-400 font-semibold mb-1", children: "Difficulty" }), _jsx("p", { className: "text-dark-200 capitalize", children: m.difficulty })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase text-dark-400 font-semibold mb-1", children: "Category" }), _jsx("p", { className: "text-dark-200 capitalize", children: m.category })] })] })] }), _jsxs("div", { className: "bg-civic-500/10 border border-civic-500/30 rounded-lg p-4 mb-6", children: [_jsx("p", { className: "text-xs uppercase text-dark-400 font-semibold mb-1", children: "Reward" }), _jsxs("div", { className: "text-3xl font-bold text-civic-400", children: [m.reward, " CIVIC"] })] }), m.status === 'in-progress' && (_jsxs(_Fragment, { children: [submitStatus === 'success' && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-200 text-xs", children: "\u2713 Proof submitted successfully!" })), submitStatus === 'error' && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-xs flex gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 flex-shrink-0 mt-0.5" }), "Please provide proof details"] })), _jsx("textarea", { value: proofText, onChange: (e) => setProofText(e.target.value), placeholder: "Describe your proof or upload details...", className: "w-full h-24 p-3 bg-dark-700 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 resize-none focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/20 transition text-sm" }), _jsxs("button", { onClick: () => handleSubmitProof(m.id), className: "w-full mt-4 py-2 bg-gradient-civic hover:opacity-90 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(Send, { className: "w-4 h-4" }), " Submit Proof"] })] })), m.status === 'available' && (_jsx("button", { onClick: () => handleAcceptMission(m.id), className: "w-full py-3 bg-gradient-civic hover:opacity-90 text-white font-semibold rounded-lg transition", children: "Accept Mission" })), m.status === 'completed' && (_jsx("div", { className: "p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-center font-semibold", children: "\u2713 Mission Complete!" }))] }));
                                    })() })) }, selectedMission)) : (_jsx("div", { className: "bg-dark-800 border border-dark-700 rounded-xl p-6 text-center", children: _jsx("p", { className: "text-dark-300", children: "Select a mission to view details" }) })) })] })] }) }));
}
