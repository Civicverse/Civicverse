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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useGameStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  return <MainLayout>{children}</MainLayout>;
}

export default function App(){
  // Enforce startup flow: TOS -> Welcome -> SignIn/SignUp -> Mnemonic (new only) -> Wallet -> Foyer
  return (
    <Routes>
      <Route path="/tos" element={<TOSPage/>} />
      <Route path="/welcome" element={<WelcomePage/>} />
      <Route path="/signup" element={<SignupPage/>} />
      <Route path="/signin" element={<LoginPage/>} />
      <Route path="/login" element={<LoginPage/>} />
      <Route path="/mnemonic" element={<MnemonicPage/>} />
      
      {/* Protected Routes */}
      <Route path="/wallet" element={<ProtectedRoute><WalletPage/></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>} />
      <Route path="/missions" element={<ProtectedRoute><MissionsPage/></ProtectedRoute>} />
      <Route path="/civicwatch" element={<ProtectedRoute><CivicWatchPage/></ProtectedRoute>} />
      <Route path="/governance" element={<ProtectedRoute><GovernancePage/></ProtectedRoute>} />
      <Route path="/foyer" element={<ProtectedRoute><FoyerPage/></ProtectedRoute>} />
      
      <Route path="/" element={<Navigate to="/tos" replace />} />
      <Route path="*" element={<Navigate to="/tos" replace />} />
    </Routes>
  )
}
