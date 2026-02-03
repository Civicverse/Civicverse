import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/gameStore';
import { AuthProvider } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { MissionsPage } from './pages/MissionsPage';
import { WalletPage } from './pages/WalletPage';
import { GovernancePage } from './pages/GovernancePage';
import { FoyerPage } from './pages/FoyerPage';
import { MMORPGPage } from './pages/MMORPGPage';
import { FPSGamePage } from './pages/FPSGamePage';
// Protected Route Component
function ProtectedRoute({ children }) {
    const isAuthenticated = useGameStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(MainLayout, { children: children });
}
// Root redirect component that checks auth at render time
function RootRedirect() {
    const isAuthenticated = useGameStore((state) => state.isAuthenticated);
    const loading = useGameStore((state) => state.loading);
    // Show nothing while loading to prevent flash
    if (loading)
        return null;
    return isAuthenticated ? (_jsx(Navigate, { to: "/dashboard", replace: true })) : (_jsx(Navigate, { to: "/login", replace: true }));
}
function App() {
    // Restore auth on mount
    useEffect(() => {
        const civicId = localStorage.getItem('civicId');
        if (civicId) {
            useGameStore.setState({
                isAuthenticated: true,
                user: {
                    civicId,
                    username: `Citizen_${civicId.slice(0, 8)}`,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${civicId}`,
                    trustScore: 75,
                    level: 3,
                },
                wallet: {
                    address: `0x${civicId.slice(0, 40)}`,
                    balance: 1250.5,
                    pendingBalance: 150,
                    currency: 'CIVIC',
                },
                loading: false,
            });
        }
        else {
            // Mark loading complete if no saved session
            setTimeout(() => {
                useGameStore.setState({ loading: false });
            }, 100);
        }
    }, []);
    return (_jsx(BrowserRouter, { children: _jsx(AuthProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/signup", element: _jsx(SignupPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/missions", element: _jsx(ProtectedRoute, { children: _jsx(MissionsPage, {}) }) }), _jsx(Route, { path: "/wallet", element: _jsx(ProtectedRoute, { children: _jsx(WalletPage, {}) }) }), _jsx(Route, { path: "/governance", element: _jsx(ProtectedRoute, { children: _jsx(GovernancePage, {}) }) }), _jsx(Route, { path: "/foyer", element: _jsx(ProtectedRoute, { children: _jsx(FoyerPage, {}) }) }), _jsx(Route, { path: "/mmorpg", element: _jsx(ProtectedRoute, { children: _jsx(MMORPGPage, {}) }) }), _jsx(Route, { path: "/fpsgame", element: _jsx(ProtectedRoute, { children: _jsx(FPSGamePage, {}) }) }), _jsx(Route, { path: "/", element: _jsx(RootRedirect, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }) }) }));
}
export default App;
