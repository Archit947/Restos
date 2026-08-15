import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { restaurantsApi } from '@/api/restaurants.api';
import { Badge, StatusBadge, WebsiteStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/Modal';
import { formatDate, formatDateTime, formatRelative, formatBytes, initials, generateAvatarColor } from '@/utils/formatters';
import type { RestaurantDetail } from '@/types';
import { imageUrl } from '@/utils/imageUrl';

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="w-44 shrink-0 text-xs font-medium text-gray-400 pt-0.5">{label}</span>
      <span className={clsx('flex-1 text-sm text-gray-800', mono && 'font-mono')}>{value ?? '—'}</span>
    </div>
  );
}

function FeatureChip({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
      enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400 line-through'
    )}>
      {enabled ? '✓' : '✗'} {label}
    </span>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <p className={clsx('text-2xl font-extrabold', color)}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Credentials box ─────────────────────────────────────────────────────────

function CredentialBox({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
        <span className={clsx('flex-1 text-sm text-gray-800 select-all', mono && 'font-mono tracking-wide')}>
          {value}
        </span>
        <button
          onClick={copy}
          title="Copy"
          className="text-gray-400 hover:text-brand-600 transition shrink-0"
        >
          {copied ? (
            <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function PasswordBox({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400">Password (temp)</span>
      <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
        <span className="flex-1 font-mono text-sm text-gray-800 select-all tracking-wide">
          {visible ? password : '•'.repeat(password.length)}
        </span>
        <button
          onClick={() => setVisible((v) => !v)}
          title={visible ? 'Hide' : 'Show'}
          className="text-gray-400 hover:text-gray-600 transition shrink-0"
        >
          {visible ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round"/>
              <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
        <button onClick={copy} title="Copy" className="text-gray-400 hover:text-brand-600 transition shrink-0">
          {copied ? (
            <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
      <p className="text-[11px] text-amber-600 mt-0.5">⚠ Share this securely. Password visible to super admins only.</p>
    </div>
  );
}

// ─── Edit Restaurant Modal ────────────────────────────────────────────────────

function EditRestaurantModal({ restaurant, onClose, onSave, saving }: {
  restaurant: RestaurantDetail;
  onClose: () => void;
  onSave: (data: FormData) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    restaurant_name: restaurant.restaurant_name || '',
    business_name:   restaurant.business_name   || '',
    owner_name:      restaurant.owner_name       || '',
    phone:           restaurant.phone            || '',
    whatsapp:        restaurant.whatsapp         || '',
    cuisine_type:    restaurant.cuisine_type     || '',
    description:     restaurant.description      || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); });
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Edit Restaurant</h3>
            <p className="text-xs text-gray-400 mt-0.5">{restaurant.restaurant_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Restaurant name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Restaurant Name *</label>
            <input
              value={form.restaurant_name}
              onChange={e => set('restaurant_name', e.target.value)}
              className="w-full input"
              placeholder="Restaurant name"
            />
          </div>

          {/* Business name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Business / Legal Name</label>
            <input
              value={form.business_name}
              onChange={e => set('business_name', e.target.value)}
              className="w-full input"
              placeholder="Legal entity name (optional)"
            />
          </div>

          {/* Owner name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Owner Name *</label>
            <input
              value={form.owner_name}
              onChange={e => set('owner_name', e.target.value)}
              className="w-full input"
              placeholder="Owner / manager name"
            />
          </div>

          {/* Phone + WhatsApp */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full input"
                placeholder="+91 00000 00000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)}
                className="w-full input"
                placeholder="+91 00000 00000"
              />
            </div>
          </div>

          {/* Cuisine type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cuisine Type</label>
            <input
              value={form.cuisine_type}
              onChange={e => set('cuisine_type', e.target.value)}
              className="w-full input"
              placeholder="e.g. Indian, Italian, Multi-cuisine"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full input resize-none"
              placeholder="Short description of the restaurant…"
            />
          </div>

          <p className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            📧 Email address cannot be changed here — contact your database administrator.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!form.restaurant_name.trim() || !form.owner_name.trim()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Store Credentials Section ────────────────────────────────────────────────

function StoreCredentialsSection({ restaurantId }: { restaurantId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['store-credentials', restaurantId],
    queryFn: () => restaurantsApi.getStoreCredentials(restaurantId).then(r => r.data.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-3 text-gray-400">
        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
        <span className="text-sm">Loading store credentials…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-lg">🏪</span>
          <h3 className="text-sm font-semibold text-gray-800">Affiliated Store Account</h3>
        </div>
        <div className="px-6 py-5 text-center text-gray-400">
          <p className="text-sm">No store account linked to this restaurant.</p>
          <p className="text-xs mt-1 text-gray-300">The store account is created when a restaurant is affiliated with a store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="text-lg">🏪</span>
        <h3 className="text-sm font-semibold text-gray-800">Affiliated Store Account</h3>
        <span className={clsx(
          'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full',
          data.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        )}>
          {data.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="px-6 py-5 space-y-4">
        <CredentialBox label="Store User ID" value={String(data.store_user_id)} />
        <CredentialBox label="Username" value={data.username} />
        {data.temp_password && <PasswordBox password={data.temp_password} />}
        <div className="pt-2 border-t border-gray-50 space-y-1">
          <Row label="Last Login" value={data.last_login_at ? formatRelative(data.last_login_at) : 'Never'} />
          <Row label="Login Attempts" value={data.login_attempts > 0 ? <span className="text-amber-600 font-medium">{data.login_attempts} failed</span> : '0'} />
          <Row label="First Login?" value={data.is_first_login ? <Badge variant="warning">Pending</Badge> : <Badge variant="success">Completed</Badge>} />
          <Row label="Account Created" value={formatDateTime(data.created_at)} />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  const { data: r, isLoading, error } = useQuery<RestaurantDetail>({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantsApi.getById(Number(id)).then((res) => res.data.data as RestaurantDetail),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => restaurantsApi.updateStatus(Number(id), status),
    onSuccess: (_, status) => {
      toast.success(`Restaurant ${status === 'suspended' ? 'suspended' : 'activated'}.`);
      qc.invalidateQueries({ queryKey: ['restaurant', id] });
      qc.invalidateQueries({ queryKey: ['restaurants'] });
      setConfirmSuspend(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Status update failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => restaurantsApi.delete(Number(id)),
    onSuccess: () => {
      toast.success('Restaurant deleted.');
      navigate('/restaurants', { replace: true });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Delete failed.'),
  });

  const editMutation = useMutation({
    mutationFn: (data: FormData) => restaurantsApi.update(Number(id), data),
    onSuccess: () => {
      toast.success('Restaurant updated.');
      qc.invalidateQueries({ queryKey: ['restaurant', id] });
      qc.invalidateQueries({ queryKey: ['restaurants'] });
      setShowEdit(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => restaurantsApi.resetPassword(Number(id)),
    onSuccess: (res) => {
      const pwd = res.data.data?.tempPassword || '';
      setNewPassword(pwd);
      qc.invalidateQueries({ queryKey: ['restaurant', id] });
      toast.success('Password reset. New temporary password is ready.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Reset failed.'),
  });

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !r) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-gray-500">Restaurant not found.</p>
        <Button variant="ghost" onClick={() => navigate('/restaurants')}>← Back to Restaurants</Button>
      </div>
    );
  }

  const displayPassword = newPassword ?? r.temp_password;
  const address = r.address;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/restaurants')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="text-sm text-gray-400">
          <button onClick={() => navigate('/restaurants')} className="hover:text-brand-600 transition">Restaurants</button>
          <span className="mx-1.5">›</span>
          <span className="text-gray-700 font-medium">{r.restaurant_name}</span>
        </div>
      </div>

      {/* ── Hero Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover band */}
        <div className="h-20 bg-gradient-to-r from-brand-600 to-brand-800" />
        <div className="px-6 pb-5 -mt-10">
          <div className="flex items-end justify-between gap-4">
            {/* Avatar */}
            <div className={clsx(
              'w-16 h-16 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold shrink-0',
              generateAvatarColor(r.restaurant_name)
            )}>
              {r.logo ? (
                <img src={imageUrl(r.logo)!} alt="" className="w-full h-full rounded-xl object-cover"/>
              ) : (
                initials(r.restaurant_name)
              )}
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 pb-1">
              <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
                ✏️ Edit
              </Button>
              {r.status !== 'suspended' ? (
                <Button size="sm" variant="ghost" onClick={() => setConfirmSuspend(true)}>
                  Suspend
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => statusMutation.mutate('active')} loading={statusMutation.isPending}>
                  Activate
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{r.restaurant_name}</h1>
              <StatusBadge status={r.status} />
              {r.website_enabled && <WebsiteStatusBadge status={r.website_status} enabled={r.website_enabled} />}
            </div>
            {r.business_name && <p className="text-sm text-gray-500 mt-0.5">{r.business_name}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>UID: <span className="font-mono text-gray-600">{r.restaurant_uid}</span></span>
              <span>Joined: {formatDate(r.created_at)}</span>
              {r.cuisine_type && <span>{r.cuisine_type}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content stats ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard value={r.cms_pages_count} label="CMS Pages" color="text-blue-600" />
        <StatCard value={r.blog_count} label="Blog Posts" color="text-purple-600" />
        <StatCard value={r.event_count} label="Events" color="text-rose-600" />
        <StatCard value={r.reservation_count} label="Reservations" color="text-amber-600" />
      </div>

      {/* ── Two column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT column */}
        <div className="space-y-5">

          {/* Basic Info */}
          <Section title="Restaurant Info">
            <Row label="Owner" value={r.owner_name} />
            <Row label="Email" value={<a href={`mailto:${r.email}`} className="text-brand-600 hover:underline">{r.email}</a>} />
            <Row label="Phone" value={r.phone} />
            {r.whatsapp && <Row label="WhatsApp" value={r.whatsapp} />}
            {r.cuisine_type && <Row label="Cuisine" value={r.cuisine_type} />}
            {r.description && <Row label="About" value={r.description} />}
            {r.gst_number && <Row label="GST" value={r.gst_number} mono />}
            {r.pan_number && <Row label="PAN" value={r.pan_number} mono />}
            {r.business_reg_no && <Row label="Reg. No." value={r.business_reg_no} mono />}
            <Row label="Added On" value={formatDateTime(r.created_at)} />
          </Section>

          {/* Address */}
          {address && (
            <Section title="Address">
              {address.address && <Row label="Street" value={address.address} />}
              {address.area && <Row label="Area" value={address.area} />}
              <Row label="City" value={[address.city, address.zip_code].filter(Boolean).join(' – ')} />
              <Row label="State" value={address.state} />
              <Row label="Country" value={address.country} />
              {address.latitude && address.longitude && (
                <Row
                  label="Coordinates"
                  value={
                    <a
                      href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline font-mono text-xs"
                    >
                      {address.latitude}, {address.longitude}
                    </a>
                  }
                />
              )}
            </Section>
          )}

          {/* Website */}
          <Section title="Website">
            <Row label="Status" value={<WebsiteStatusBadge status={r.website_status} enabled={r.website_enabled} />} />
            {r.full_domain && (
              <Row
                label="Domain"
                value={
                  <a href={r.full_domain.startsWith('http') ? r.full_domain : `https://${r.full_domain}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                    {r.full_domain}
                  </a>
                }
              />
            )}
            {r.custom_domain && <Row label="Custom Domain" value={r.custom_domain} mono />}
            {r.ssl_enabled !== undefined && <Row label="SSL" value={r.ssl_enabled ? '✓ Enabled' : '✗ Disabled'} />}
            {r.website_title && <Row label="Title" value={r.website_title} />}
            {r.website_subtitle && <Row label="Subtitle" value={r.website_subtitle} />}
          </Section>
        </div>

        {/* RIGHT column */}
        <div className="space-y-5">

          {/* 🔐 Login Credentials */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
                </svg>
                <h3 className="text-sm font-semibold text-gray-800">Login Credentials</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => resetPasswordMutation.mutate()}
                loading={resetPasswordMutation.isPending}
              >
                Reset Password
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {r.user_id != null && (
                <CredentialBox label="User ID" value={String(r.user_id)} />
              )}
              <CredentialBox label="Username" value={r.username || '—'} />
              {displayPassword ? (
                <PasswordBox password={displayPassword} />
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-gray-400">Password</span>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-400 italic">No temp password on record</span>
                    <button
                      onClick={() => resetPasswordMutation.mutate()}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Generate one
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click "Reset Password" to generate a temporary password.</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-50 space-y-1">
                <Row label="Last Login" value={r.last_login_at ? formatRelative(r.last_login_at) : 'Never'} />
                <Row label="Login Attempts" value={r.login_attempts > 0 ? <span className="text-amber-600 font-medium">{r.login_attempts} failed</span> : '0'} />
                <Row label="First Login?" value={r.is_first_login ? <Badge variant="warning">Pending</Badge> : <Badge variant="success">Completed</Badge>} />
                <Row label="Credential Active" value={r.credential_active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>} />
              </div>
            </div>
          </div>

          {/* Subscription */}
          <Section title="Subscription">
            <Row label="Plan" value={r.plan_name ? <Badge variant="purple">{r.plan_name}</Badge> : '—'} />
            <Row label="Status" value={r.sub_status ? <Badge variant={r.sub_status === 'active' ? 'success' : 'warning'}>{r.sub_status}</Badge> : '—'} />
            {r.trial_ends_at && <Row label="Trial Ends" value={formatDate(r.trial_ends_at)} />}
            {r.expires_at && <Row label="Expires" value={formatDate(r.expires_at)} />}
            <Row label="Storage Used" value={formatBytes(r.storage_used_mb || 0)} />
          </Section>

          {/* Features */}
          <Section title="Features">
            <div className="flex flex-wrap gap-2">
              <FeatureChip label="Website" enabled={r.website_enabled} />
              <FeatureChip label="CMS" enabled={Boolean((r as any).sub_cms_enabled ?? true)} />
              <FeatureChip label="Blog" enabled={r.blog_enabled} />
              <FeatureChip label="Reservations" enabled={r.reservation_enabled} />
              <FeatureChip label="Events" enabled={r.event_enabled} />
              <FeatureChip label="Affiliate" enabled={r.affiliate_enabled} />
              <FeatureChip label="Marketing" enabled={r.marketing_enabled} />
            </div>
          </Section>

          {/* Affiliated Store Credentials */}
          <StoreCredentialsSection restaurantId={Number(id)} />

        </div>
      </div>

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog
        open={confirmSuspend}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={() => statusMutation.mutate('suspended')}
        title="Suspend Restaurant"
        message={`Are you sure you want to suspend "${r.restaurant_name}"? Their website and admin panel will become inaccessible.`}
        confirmLabel="Suspend"
        variant="warning"
        loading={statusMutation.isPending}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Restaurant"
        message={`This will permanently delete "${r.restaurant_name}" and all their data. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {showEdit && (
        <EditRestaurantModal
          restaurant={r}
          onClose={() => setShowEdit(false)}
          onSave={(data) => editMutation.mutate(data)}
          saving={editMutation.isPending}
        />
      )}
    </div>
  );
}
