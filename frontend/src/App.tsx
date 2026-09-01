import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TOSPage from './pages/TOSPage'
import WelcomePage from './pages/WelcomePage'
import SignupPage from './pages/SignupPage'
import CivicVaultPage from './pages/CivicVaultPage'
import FoyerPage from './pages/FoyerPage'
import SignInPage from './pages/SignInPage'
import { CharacterCreatorPage } from './pages/CharacterCreatorPage'
import { MissionsPage } from './pages/MissionsPage'
import CivicWatchPage from './pages/CivicWatchPage'
import { GovernancePage } from './pages/GovernancePage'
import MiningPoolPage from './pages/MiningPoolPage'
import { MainLayout } from './layouts/MainLayout'
import { useGameStore } from './store/gameStore'

export default function App() {
  const isInitialized = useGameStore(state => state.isInitialized);
  const initialize = useGameStore(state => state.initialize);
  const tosAccepted = useGameStore(state => state.tosAccepted);
  const isAuthenticated = useGameStore(state => state.isAuthenticated);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
        <Route path="/signin" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  // 3. Authenticated Layout
  return (
    <MainLayout>
      <Routes>
        <Route path="/vault" element={<CivicVaultPage />} />
        <Route path="/wardrobe" element={<CharacterCreatorPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/civicwatch" element={<CivicWatchPage />} />
        <Route path="/governance" element={<GovernancePage />} />
        <Route path="/mining-pool" element={<MiningPoolPage />} />
        <Route path="/foyer" element={<FoyerPage />} />
        <Route path="/" element={<CivicVaultPage />} />
        <Route path="*" element={<Navigate to="/vault" replace />} />
      </Routes>
    </MainLayout>
  );
}
