import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TOSPage from './pages/TOSPage'
import WelcomePage from './pages/WelcomePage'
import SignupPage from './pages/SignupPage'
import MnemonicPage from './pages/MnemonicPage'
import WalletPage from './pages/WalletPage'
import FoyerPage from './pages/FoyerPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MissionsPage } from './pages/MissionsPage'
import CivicWatchPage from './pages/CivicWatchPage'
import { GovernancePage } from './pages/GovernancePage'
import { MainLayout } from './layouts/MainLayout'
import { useGameStore } from './store/gameStore'

export default function App(){
  const initialize = useGameStore(state => state.initialize);
  const isInitialized = useGameStore(state => state.isInitialized);
  const tosAccepted = useGameStore(state => state.tosAccepted);
  const isAuthenticated = useGameStore(state => state.isAuthenticated);

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Route for TOS */}
      <Route path="/tos" element={<TOSPage />} />

      {/* Routes for Unauthenticated users */}
      {!tosAccepted ? (
        <Route path="*" element={<Navigate to="/tos" replace />} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mnemonic" element={<MnemonicPage />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </>
      ) : (
        /* Routes for Authenticated users */
        <Route path="*" element={
          <MainLayout>
            <Routes>
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/missions" element={<MissionsPage />} />
              <Route path="/civicwatch" element={<CivicWatchPage />} />
              <Route path="/governance" element={<GovernancePage />} />
              <Route path="/foyer" element={<FoyerPage />} />
              <Route path="/mnemonic" element={<MnemonicPage />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/" element={<Navigate to="/wallet" replace />} />
              <Route path="*" element={<Navigate to="/wallet" replace />} />
            </Routes>
          </MainLayout>
        } />
      )}
    </Routes>
  )
}
