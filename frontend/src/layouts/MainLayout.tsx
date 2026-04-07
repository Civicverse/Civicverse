import React from 'react';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-dark text-white">
      {/* Main Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
