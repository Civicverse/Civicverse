import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Menu, X, LogOut, Home, Gamepad2, Wallet, Users } from 'lucide-react';
import { motion } from 'framer-motion';
export function MainLayout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useGameStore();
    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/missions', label: 'Missions', icon: Gamepad2 },
        { path: '/wallet', label: 'Wallet', icon: Wallet },
        { path: '/governance', label: 'Governance', icon: Users },
    ];
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const isActive = (path) => location.pathname === path;
    return (_jsxs("div", { className: "min-h-screen bg-gradient-dark text-white", children: [_jsx("div", { className: "fixed top-4 right-4 z-50 md:hidden", children: _jsx("button", { onClick: () => setMobileMenuOpen(!mobileMenuOpen), className: "p-2 bg-dark-800 border border-dark-700 rounded-lg", children: mobileMenuOpen ? _jsx(X, { className: "w-5 h-5" }) : _jsx(Menu, { className: "w-5 h-5" }) }) }), _jsxs(motion.nav, { initial: false, animate: { x: mobileMenuOpen ? 0 : -300 }, transition: { duration: 0.2 }, className: "fixed left-0 top-0 h-screen w-64 bg-dark-800/95 backdrop-blur border-r border-dark-700 p-6 md:translate-x-0 z-40 flex flex-col", children: [_jsxs(Link, { to: "/dashboard", className: "flex items-center gap-3 mb-8", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-gradient-civic flex items-center justify-center text-xl font-bold", children: "\u2694\uFE0F" }), _jsxs("div", { children: [_jsx("h1", { className: "font-bold text-lg", children: "CivicVerse" }), _jsx("p", { className: "text-xs text-dark-400", children: "v2.0" })] })] }), _jsx("div", { className: "flex-1 space-y-2", children: menuItems.map((item) => {
                            const Icon = item.icon;
                            return (_jsxs(Link, { to: item.path, onClick: () => setMobileMenuOpen(false), className: `flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(item.path)
                                    ? 'bg-civic-500/20 border border-civic-500 text-civic-300'
                                    : 'text-dark-300 hover:text-white hover:bg-dark-700'}`, children: [_jsx(Icon, { className: "w-5 h-5" }), item.label] }, item.path));
                        }) }), _jsxs("div", { className: "border-t border-dark-700 pt-4 space-y-4", children: [user && (_jsxs("div", { className: "flex items-center gap-3 px-4", children: [_jsx("img", { src: user.avatar, alt: user.username, className: "w-8 h-8 rounded-full border border-civic-500" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold", children: user.username }), _jsxs("p", { className: "text-dark-400 text-xs", children: ["Level ", user.level] })] })] })), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition text-dark-200 hover:text-white", children: [_jsx(LogOut, { className: "w-4 h-4" }), " Logout"] })] }), _jsx("div", { className: "mt-4 p-2 bg-civic-500/10 border border-civic-500/30 rounded-lg text-center text-xs text-civic-300", children: "\uD83E\uDDEA Demo Mode" })] }), mobileMenuOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-30 md:hidden", onClick: () => setMobileMenuOpen(false) })), _jsx("div", { className: "md:ml-64", children: children })] }));
}
