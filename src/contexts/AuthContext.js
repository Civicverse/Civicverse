import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
import { useGameStore } from '../store/gameStore';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const isAuthenticated = useGameStore((state) => state.isAuthenticated);
    const user = useGameStore((state) => state.user);
    const loading = useGameStore((state) => state.loading);
    return (_jsx(AuthContext.Provider, { value: { isAuthenticated, user, loading }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
