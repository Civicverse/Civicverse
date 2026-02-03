import React, { useEffect } from 'react';
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
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useGameStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

// Root redirect component that checks auth at render time
function RootRedirect() {
  const isAuthenticated = useGameStore((state) => state.isAuthenticated);
  const loading = useGameStore((state) => state.loading);

  // Show nothing while loading to prevent flash
  if (loading) return null;

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
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
    } else {
      // Mark loading complete if no saved session
      setTimeout(() => {
        useGameStore.setState({ loading: false });
      }, 100);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/missions"
            element={
              <ProtectedRoute>
                <MissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/governance"
            element={
              <ProtectedRoute>
                <GovernancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/foyer"
            element={
              <ProtectedRoute>
                <FoyerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mmorpg"
            element={
              <ProtectedRoute>
                <MMORPGPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fpsgame"
            element={
              <ProtectedRoute>
                <FPSGamePage />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to appropriate page */}
          <Route path="/" element={<RootRedirect />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
