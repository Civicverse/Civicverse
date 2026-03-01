import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TOSPage from './pages/TOSPage'
import WelcomePage from './pages/WelcomePage'
import SignupPage from './pages/SignupPage'
import MnemonicPage from './pages/MnemonicPage'
import WalletPage from './pages/WalletPage'
import FoyerPage from './pages/FoyerPage'
import { LoginPage } from './pages/LoginPage'
import { MissionsPage } from './pages/MissionsPage'
import CivicWatchPage from './pages/CivicWatchPage'
import { GovernancePage } from './pages/GovernancePage'
import { MainLayout } from './layouts/MainLayout'
import { useGameStore } from './store/gameStore'

export default function App() {
  const isInitialized = useGameStore(state => state.isInitialized);
  const initialize = useGameStore(state => state.initialize);
  const tosAccepted = useGameStore(state => state.tosAccepted);
  const isAuthenticated = useGameStore(state => state.isAuthenticated);

  useEffect(() => {
    console.log('[App] Initializing store...');
    initialize();
  }, [initialize]);

  console.log('[App] Render state:', { isInitialized, tosAccepted, isAuthenticated });

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-500 font-mono text-xs animate-pulse">SYNCHRONIZING_PROTOCOLS...</p>
      </div>
    );
  }

  // 1. Handle TOS
  if (!tosAccepted) {
    return (
      <Routes>
        <Route path="/tos" element={<TOSPage />} />
        <Route path="*" element={<Navigate to="/tos" replace />} />
      </Routes>
    );
  }

  // 2. Handle Unauthenticated (Auth Flow)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mnemonic" element={<MnemonicPage />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  // 3. Authenticated Layout
  return (
    <MainLayout>
      <Routes>
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/civicwatch" element={<CivicWatchPage />} />
        <Route path="/governance" element={<GovernancePage />} />
        <Route path="/foyer" element={<FoyerPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/" element={<Navigate to="/foyer" replace />} />
        <Route path="*" element={<Navigate to="/foyer" replace />} />
      </Routes>
    </MainLayout>
  );
}
