import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rAuthApi, rStaffApi } from '../../../api/restaurantAdmin';
import { useRestaurantAuthStore } from '../../../store/restaurantAuthStore';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';

// ─── KDS Staff Section ────────────────────────────────────────────────────────
interface Staff {
  id: number; name: string; station_name: string; username: string;
  temp_password?: string; is_active: boolean; last_login_at: string | null; created_at: string;
}

function KdsStaffSection() {
  const qc = useQueryClient();
  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [newStation, setNewStation] = useState('');
  const [revealed, setRevealed]   = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['r-staff'],
    queryFn:  () => rStaffApi.list().then(r => r.data.data),
  });
  const staff: Staff[] = data?.staff || [];

  const createMutation = useMutation({
    mutationFn: () => rStaffApi.create({ name: newName.trim(), station_name: newStation.trim() || 'Kitchen Station' }),
    onSuccess: (res) => {
      const created = res.data.data;
      // Show the newly generated credentials
      setRevealed(prev => ({ ...prev, [created.id]: created.tempPassword }));
      qc.invalidateQueries({ queryKey: ['r-staff'] });
      setCreating(false); setNewName(''); setNewStation('');
      toast.success(`KDS account created: ${created.username}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create staff.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rStaffApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['r-staff'] }); toast.success('Staff account deleted.'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed.'),
  });

  const resetMutation = useMutation({
    mutationFn: (id: number) => rStaffApi.resetPassword(id),
    onSuccess: (res, id) => {
      const { tempPassword } = res.data.data;
      setRevealed(prev => ({ ...prev, [id]: tempPassword }));
      toast.success('Password reset. Share the new password with the staff member.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Reset failed.'),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">👨‍🍳 Kitchen KDS Staff</h3>
          <p className="text-xs text-gray-400 mt-0.5">Staff accounts for the Kitchen Display System portal at <code className="bg-gray-100 px-1 rounded text-gray-600">/kds</code></p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >+ Add KDS Staff</button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <p className="text-sm font-semibold text-emerald-800 mb-3">New KDS Staff Account</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Staff Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full input text-sm" placeholder="e.g. Chef Ravi" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Station Name</label>
              <input value={newStation} onChange={e => setNewStation(e.target.value)} className="w-full input text-sm" placeholder="e.g. Hot Kitchen, Grill" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">Username and password will be auto-generated. Share them securely with the staff member.</p>
          <div className="flex gap-2">
            <button onClick={() => { setCreating(false); setNewName(''); setNewStation(''); }}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newName.trim()}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
            >{createMutation.isPending ? 'Creating…' : 'Create Account'}</button>
          </div>
        </div>
      )}

      {/* Staff list */}
      <div className="divide-y divide-gray-50">
        {isLoading && <p className="px-6 py-8 text-center text-gray-400 text-sm">Loading…</p>}

        {!isLoading && staff.length === 0 && (
          <p className="px-6 py-10 text-center text-gray-400 text-sm">No KDS staff yet. Add one to get started.</p>
        )}

        {staff.map(s => (
          <div key={s.id} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{s.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.station_name}</span>
                  {!s.is_active && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{s.username}</p>
                {s.last_login_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last login: {new Date(s.last_login_at).toLocaleDateString('en', { dateStyle: 'medium' })}
                  </p>
                )}

                {/* Revealed credentials */}
                {revealed[s.id] && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800 mb-1">🔑 Credentials — share securely:</p>
                    <p className="text-xs text-amber-900 font-mono">Username: <strong>{s.username}</strong></p>
                    <p className="text-xs text-amber-900 font-mono">Password: <strong>{revealed[s.id]}</strong></p>
                    <p className="text-xs text-amber-600 mt-1">KDS Login URL: <strong>{window.location.origin}/kds/login</strong></p>
                    <button onClick={() => setRevealed(prev => { const n = { ...prev }; delete n[s.id]; return n; })}
                      className="text-xs text-amber-500 hover:underline mt-1">Hide</button>
                  </div>
                )}
              </div>

              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => resetMutation.mutate(s.id)}
                  disabled={resetMutation.isPending}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                >Reset Password</button>
                <button
                  onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMutation.mutate(s.id); }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition"
                >Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function RSettingsPage() {
  const navigate = useNavigate();
  const logout   = useRestaurantAuthStore((s) => s.logout);

  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');
  const [saving, setSaving]   = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setErr('New passwords do not match.'); return; }
    if (next.length < 8)  { setErr('Password must be at least 8 characters.'); return; }
    setErr(''); setSaving(true);
    try {
      await rAuthApi.changePassword(current, next);
      setMsg('Password changed successfully.');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await rAuthApi.logout(); } catch { /* ignore */ }
    logout();
    navigate('/restaurant/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      <RestaurantHeader title="Settings" subtitle="Account, security, and staff management" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">

          {/* KDS Staff Management */}
          <KdsStaffSection />

          {/* Change password */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
            {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
            {msg && <p className="mb-3 text-sm text-emerald-600">{msg}</p>}
            <form onSubmit={changePassword} className="space-y-4">
              {[
                { label: 'Current Password', val: current, set: setCurrent },
                { label: 'New Password',     val: next,    set: setNext },
                { label: 'Confirm Password', val: confirm, set: setConfirm },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="password" value={val} onChange={e => set(e.target.value)} required className="w-full input" />
                </div>
              ))}
              <button type="submit" disabled={saving}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60">
                {saving ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Sign out */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Sign Out</h3>
            <p className="text-sm text-gray-400 mb-4">This will log you out of the restaurant admin panel.</p>
            <button onClick={handleLogout}
              className="px-5 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
