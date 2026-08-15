import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kdsAuthApi } from '../../api/kds';
import { useKdsAuthStore } from '../../store/kdsAuthStore';

export default function KdsLoginPage() {
  const navigate = useNavigate();
  const login    = useKdsAuthStore(s => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('Enter your credentials.'); return; }
    setLoading(true); setError('');
    try {
      const res = await kdsAuthApi.login(username.trim(), password);
      const { accessToken, refreshToken, staff } = res.data.data;
      login({ accessToken, refreshToken }, staff);
      navigate('/kds', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-4">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeLinecap="round"/>
              <path d="M8 12h8M12 8v8" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
          <p className="text-slate-400 text-sm mt-1">KDS Station Sign In</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoFocus
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="kds_restaurant_xxxxx"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In to Kitchen'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Credentials are provided by your restaurant manager.
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Restaurant Admin?{' '}
          <a href="/restaurant/login" className="text-amber-400 hover:text-amber-300 font-medium transition">
            Sign in here →
          </a>
        </p>

        <p className="mt-3 text-center text-xs text-slate-600">
          Powered by <span className="font-semibold text-slate-400">Restos</span>
        </p>
      </div>
    </div>
  );
}
