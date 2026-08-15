import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useKdsAuthStore } from '../../store/kdsAuthStore';
import KdsLoginPage from './KdsLoginPage';
import KdsDashboard from './KdsDashboard';

function KdsProtected({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useKdsAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/kds/login" replace />;
}

export default function KdsApp() {
  return (
    <Routes>
      <Route path="login" element={<KdsLoginPage />} />
      <Route path="*" element={
        <KdsProtected>
          <KdsDashboard />
        </KdsProtected>
      } />
    </Routes>
  );
}
