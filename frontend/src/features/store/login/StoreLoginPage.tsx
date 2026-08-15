import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAuthApi } from '@/api/storeAdmin';
import { useStoreAuthStore } from '@/store/storeAuthStore';

export default function StoreLoginPage() {
  const navigate  = useNavigate();
  const { isAuthenticated, setAuth } = useStoreAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/store/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('Username and password are required.'); return; }
    setLoading(true);
    try {
      const res = await storeAuthApi.login({ username: username.trim(), password });
      const { accessToken, refreshToken, store } = res.data.data;
      setAuth({ accessToken, refreshToken }, {
        id:             store.id,
        tenantId:       store.tenantId,
        restaurantId:   store.id,
        restaurantName: store.restaurantName,
        logo:           store.logo,
        username:       store.username,
      });
      navigate('/store/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>
            🏪
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
            Store Admin
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 6, fontFamily: 'system-ui, sans-serif' }}>
            Sign in to manage your store
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#1e293b', borderRadius: 20, padding: 32, border: '1px solid #334155', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, fontFamily: 'system-ui' }}>
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6, fontFamily: 'system-ui' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your store username"
                autoComplete="username"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6, fontFamily: 'system-ui' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 16, padding: 0 }}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#4f46e5' : 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'system-ui', transition: 'opacity 0.2s' }}
            >
              {loading ? 'Signing in…' : 'Sign In to Store'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 24, fontFamily: 'system-ui' }}>
          Store Admin Portal · Restos Platform
        </p>
      </div>
    </div>
  );
}
