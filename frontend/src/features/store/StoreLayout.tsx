import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useStoreAuthStore } from '@/store/storeAuthStore';
import { storeAuthApi } from '@/api/storeAdmin';

const NAV_ITEMS = [
  { to: '/store/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/store/items',     icon: '📦', label: 'Items & Inventory' },
  { to: '/store/orders',    icon: '🛍️', label: 'Orders' },
];

export default function StoreLayout() {
  const { isAuthenticated, store, logout, refreshToken } = useStoreAuthStore();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!isAuthenticated) return <Navigate to="/store/login" replace />;

  const handleLogout = async () => {
    setSigningOut(true);
    try { await storeAuthApi.logout(refreshToken ?? undefined); } catch {}
    logout();
    navigate('/store/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              🏪
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {store?.restaurantName || 'Store'}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Store Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 8, textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
                color: isActive ? '#c4b5fd' : '#94a3b8',
                background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #334155' }}>
          <div style={{ padding: '8px 12px', marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {store?.username}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={signingOut}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 13.5, fontWeight: 500 }}
          >
            <span>🚪</span>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
