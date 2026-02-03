import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
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
                    category: 'civic',
                    reward: 50,
                    difficulty: 'easy',
                    status: 'available',
                    location: 'Downtown District',
                    image: '🛣️',
                },
                {
                    id: '2',
                    title: 'Environmental Cleanup',
                    description: 'Organize or participate in a local cleanup effort',
                    category: 'environmental',
                    reward: 100,
                    difficulty: 'medium',
                    status: 'available',
                    location: 'Central Park',
                    image: '🌱',
                },
                {
                    id: '3',
                    title: 'Community Education',
                    description: 'Teach a workshop or educational session to locals',
                    category: 'educational',
                    reward: 150,
                    difficulty: 'hard',
                    status: 'available',
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
    return (_jsxs("div", { className: "min-h-screen bg-gradient-dark", children: [_jsx("div", { className: "bg-dark-800/50 border-b border-dark-700 sticky top-0 z-40 backdrop-blur-xl", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [user?.avatar && (_jsx("img", { src: user.avatar, alt: user.username, className: "w-12 h-12 rounded-full border-2 border-civic-500" })), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: user?.username }), _jsxs("p", { className: "text-dark-300", children: ["Civic ID: ", user?.civicId.slice(0, 16), "..."] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-3xl font-bold text-civic-400", children: [wallet?.balance.toFixed(2), " CIVIC"] }), _jsx("p", { className: "text-dark-300", children: "Wallet Balance" })] })] }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12", children: stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.1 }, className: "bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-civic-500/50 transition", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-dark-300 text-sm font-medium", children: stat.label }), _jsx("p", { className: "text-3xl font-bold text-white mt-2", children: stat.value })] }), _jsx(Icon, { className: `w-8 h-8 ${stat.color} opacity-20` })] }) }, index));
                        }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, className: "bg-dark-800 border border-dark-700 rounded-xl p-8 mb-12", children: [_jsx("h2", { className: "text-xl font-bold text-white mb-4", children: "Overall Progress" }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-dark-300", children: "Missions Completed" }), _jsxs("span", { className: "text-civic-400 font-semibold", children: [completedMissions, "/", totalMissions] })] }), _jsx("div", { className: "h-2 bg-dark-700 rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${progressPercent}%` }, transition: { duration: 1, ease: 'easeOut' }, className: "h-full bg-gradient-to-r from-civic-500 to-civic-400" }) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(motion.button, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, onClick: () => navigate('/foyer'), className: "bg-gradient-civic hover:opacity-90 text-white font-semibold py-4 px-6 rounded-xl transition transform hover:scale-105", children: "\uD83C\uDFDB\uFE0F Enter Foyer" }), _jsx(motion.button, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5 }, onClick: () => navigate('/governance'), className: "bg-dark-800 border border-dark-700 hover:border-civic-500/50 text-white font-semibold py-4 px-6 rounded-xl transition", children: "\uD83D\uDDF3\uFE0F Governance" })] })] })] }));
}
