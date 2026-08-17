import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  affiliateAdminApi,
  AffiliateProduct,
  AffiliateFetchResult,
  AffiliateStatus,
  AffiliatePlacement,
  PLACEMENT_LABELS,
} from '@/api/affiliate.api';
import { useDebounce } from '@/hooks/useDebounce';

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, startDate, endDate }: { status: AffiliateStatus; startDate?: string | null; endDate?: string | null }) {
  const today = new Date().toISOString().slice(0, 10);
  let effective = status;
  if (status === 'active' && endDate && endDate < today) effective = 'inactive'; // expired
  if (status === 'scheduled' && startDate && startDate <= today) effective = 'active';

  const map: Record<string, { label: string; cls: string }> = {
    active:   { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Inactive',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    draft:    { label: 'Draft',     cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    scheduled:{ label: 'Scheduled', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  };
  // expired
  const expired = status === 'active' && endDate && endDate < today;
  if (expired) return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-red-100 text-red-600 border-red-200">Expired</span>;

  const cfg = map[effective] || map.inactive;
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Star rating display ──────────────────────────────────────────────────────
function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <span className="flex items-center gap-0.5 text-amber-400 text-xs">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span className="text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────
interface ModalProps {
  product?: AffiliateProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProductModal({ product, onClose, onSaved }: ModalProps) {
  const isEdit = Boolean(product);
  const [fetchUrl, setFetchUrl] = useState(product?.affiliate_url || '');
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState<Partial<AffiliateProduct>>({
    affiliate_url: product?.affiliate_url || '',
    asin:          product?.asin || '',
    title:         product?.title || '',
    description:   product?.description || '',
    image_url:     product?.image_url || '',
    price:         product?.price ?? undefined,
    currency:      product?.currency || '₹',
    rating:        product?.rating ?? undefined,
    brand:         product?.brand || '',
    placement:     product?.placement || 'homepage_section',
    status:        product?.status || 'draft',
    priority:      product?.priority ?? 10,
    start_date:    product?.start_date || '',
    end_date:      product?.end_date || '',
  });

  const qc = useQueryClient();
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function doFetch() {
    if (!fetchUrl.trim()) return toast.error('Enter a URL first.');
    setFetching(true);
    try {
      const res = await affiliateAdminApi.fetchProduct(fetchUrl.trim());
      const d: AffiliateFetchResult = res.data.data;
      setForm(p => ({
        ...p,
        affiliate_url: fetchUrl.trim(),
        asin:          d.asin || p.asin || '',
        title:         d.title || p.title || '',
        description:   d.description || p.description || '',
        image_url:     d.image || p.image_url || '',
        price:         d.price ?? p.price,
        rating:        d.rating ?? p.rating,
        brand:         d.brand || p.brand || '',
      }));
      toast.success('Product info fetched!');
    } catch {
      toast.error('Could not fetch product info. Please fill in manually.');
    } finally {
      setFetching(false);
    }
  }

  const saveMut = useMutation({
    mutationFn: (status: AffiliateStatus) => {
      const payload = { ...form, status };
      return isEdit
        ? affiliateAdminApi.update(product!.id, payload)
        : affiliateAdminApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliate-products'] });
      qc.invalidateQueries({ queryKey: ['affiliate-stats'] });
      toast.success(isEdit ? 'Updated!' : 'Created!');
      onSaved();
    },
    onError: () => toast.error('Save failed.'),
  });

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Affiliate Product' : 'Add Affiliate Product'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Review and edit before publishing.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ── URL fetch ── */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">🔗 Affiliate URL</p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste Amazon affiliate link here…"
                value={fetchUrl}
                onChange={e => setFetchUrl(e.target.value)}
                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={doFetch}
                disabled={fetching}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
              >
                {fetching ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Fetching…</> : '⚡ Fetch Product'}
              </button>
            </div>
            <p className="text-[11px] text-blue-500 mt-1.5">The system will try to auto-fill product details. You can edit them below.</p>
          </div>

          {/* ── Preview ── */}
          {(form.image_url || form.title) && (
            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border">
              {form.image_url && (
                <img src={form.image_url} alt="" className="w-20 h-20 object-contain rounded-lg bg-white border flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{form.title || '—'}</p>
                {form.brand && <p className="text-xs text-gray-500">{form.brand}</p>}
                <div className="flex items-center gap-4 mt-1">
                  {form.price && <span className="text-sm font-bold text-emerald-600">{form.currency} {Number(form.price).toLocaleString()}</span>}
                  <Stars rating={form.rating ?? null} />
                </div>
              </div>
            </div>
          )}

          {/* ── Product details ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Product Title *</label>
              <input className={inputCls} value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Sony WH-1000XM5 Headphones" />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input className={inputCls} value={form.brand || ''} onChange={e => set('brand', e.target.value)} placeholder="e.g. Sony" />
            </div>
            <div>
              <label className={labelCls}>ASIN / Product ID</label>
              <input className={inputCls} value={form.asin || ''} onChange={e => set('asin', e.target.value)} placeholder="e.g. B09XS7JWHH" />
            </div>
            <div>
              <label className={labelCls}>Price</label>
              <div className="flex gap-1">
                <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {['₹', '$', '€', '£'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input className={inputCls} type="number" min="0" step="0.01"
                  value={form.price ?? ''} onChange={e => set('price', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Rating (0–5)</label>
              <input className={inputCls} type="number" min="0" max="5" step="0.1"
                value={form.rating ?? ''} onChange={e => set('rating', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g. 4.5" />
            </div>
            <div>
              <label className={labelCls}>Image URL</label>
              <input className={inputCls} type="url" value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className={labelCls}>Affiliate URL *</label>
              <input className={inputCls} type="url" value={form.affiliate_url || ''} onChange={e => set('affiliate_url', e.target.value)} placeholder="https://amazon.in/dp/…" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Short Description</label>
              <textarea className={`${inputCls} resize-none`} rows={2}
                value={form.description || ''} onChange={e => set('description', e.target.value)}
                placeholder="Brief description shown on the ad card…" />
            </div>
          </div>

          {/* ── Display settings ── */}
          <div className="border-t pt-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Display Settings</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Placement</label>
                <select className={`${inputCls} bg-white`} value={form.placement} onChange={e => set('placement', e.target.value)}>
                  {Object.entries(PLACEMENT_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Priority (lower = shown first)</label>
                <input className={inputCls} type="number" min="1" max="100"
                  value={form.priority ?? 10} onChange={e => set('priority', parseInt(e.target.value) || 10)} />
              </div>
              <div>
                <label className={labelCls}>Start Date</label>
                <input className={inputCls} type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value || null)} />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input className={inputCls} type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value || null)} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <div className="flex gap-2">
            <button
              onClick={() => saveMut.mutate('draft')}
              disabled={saveMut.isPending || !form.title || !form.affiliate_url}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => saveMut.mutate('active')}
              disabled={saveMut.isPending || !form.title || !form.affiliate_url}
              className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {saveMut.isPending ? 'Saving…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ product, onClose }: { product: AffiliateProduct; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold text-gray-700">Ad Preview</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
        </div>
        <div className="p-4">
          {product.image_url && (
            <div className="h-48 rounded-xl overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
              <img src={product.image_url} alt={product.title} className="h-full w-full object-contain" loading="lazy" />
            </div>
          )}
          {product.brand && <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">{product.brand}</p>}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{product.title}</h3>
          {product.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>}
          <div className="flex items-center justify-between mb-4">
            {product.price ? (
              <span className="text-lg font-bold text-gray-900">{product.currency} {Number(product.price).toLocaleString()}</span>
            ) : <span />}
            <Stars rating={product.rating} />
          </div>
          <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-900 text-sm font-bold transition-colors">
            View on Amazon →
          </a>
          <p className="text-center text-[10px] text-gray-400 mt-2">Affiliate Advertisement — We may earn a commission from qualifying purchases.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────
function StatsRow() {
  const { data } = useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: () => affiliateAdminApi.stats().then(r => r.data.data),
    staleTime: 30000,
  });
  if (!data) return null;

  const tiles = [
    { label: 'Total Products', value: data.total,        color: 'text-gray-900' },
    { label: 'Active',         value: data.active,       color: 'text-emerald-600' },
    { label: 'Inactive',       value: data.inactive,     color: 'text-gray-400' },
    { label: 'Scheduled',      value: data.scheduled,    color: 'text-blue-600' },
    { label: 'Draft',          value: data.draft,        color: 'text-yellow-600' },
    { label: 'Total Clicks',   value: Number(data.total_clicks).toLocaleString(), color: 'text-brand-600' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
      {tiles.map(t => (
        <div key={t.label} className="bg-white rounded-xl border p-3 text-center shadow-sm">
          <p className={`text-xl font-bold ${t.color}`}>{t.value}</p>
          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AffiliateAdsPage() {
  const qc = useQueryClient();
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [placementFilter, setPlacementFilter] = useState('');
  const [statusFilter, setStatusFilter]       = useState('');
  const [modal, setModal]             = useState<'add' | 'edit' | 'preview' | null>(null);
  const [selected, setSelected]       = useState<AffiliateProduct | null>(null);

  const dSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-products', page, dSearch, placementFilter, statusFilter],
    queryFn: () => affiliateAdminApi.list({ page, limit: 20, search: dSearch || undefined, placement: placementFilter || undefined, status: statusFilter || undefined })
      .then(r => r.data),
    staleTime: 15000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => affiliateAdminApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['affiliate-products'] }); qc.invalidateQueries({ queryKey: ['affiliate-stats'] }); toast.success('Deleted.'); },
    onError: () => toast.error('Delete failed.'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AffiliateStatus }) => affiliateAdminApi.setStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['affiliate-products'] }); qc.invalidateQueries({ queryKey: ['affiliate-stats'] }); },
    onError: () => toast.error('Status update failed.'),
  });

  const products: AffiliateProduct[] = data?.data || [];
  const meta = data?.meta;

  function openEdit(p: AffiliateProduct) { setSelected(p); setModal('edit'); }
  function openPreview(p: AffiliateProduct) { setSelected(p); setModal('preview'); }
  function closeModal() { setModal(null); setSelected(null); }
  function onSaved() { closeModal(); }

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🛍️</span> Affiliate Ads
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage affiliate products shown across restaurant websites.</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Affiliate Product
        </button>
      </div>

      {/* Stats */}
      <StatsRow />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className={`${inputCls} pl-9 w-full`} placeholder="Search products…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className={`${inputCls} bg-white`} value={placementFilter} onChange={e => { setPlacementFilter(e.target.value); setPage(1); }}>
          <option value="">All Placements</option>
          {Object.entries(PLACEMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className={`${inputCls} bg-white`} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {['active', 'inactive', 'draft', 'scheduled'].map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-3 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Loading…
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-gray-500 text-sm font-medium">No affiliate products found.</p>
            <button onClick={() => setModal('add')} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700">
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Image</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Placement</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Dates</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Clicks</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.id}</td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-gray-900 truncate text-sm">{p.title}</p>
                      {p.brand && <p className="text-xs text-gray-400 truncate">{p.brand}</p>}
                      {p.asin && <p className="text-[10px] text-gray-300 font-mono">ASIN: {p.asin}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.title} loading="lazy"
                            className="w-12 h-12 object-contain rounded-lg bg-gray-100 border"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">🛍️</div>
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.price
                        ? <span className="font-semibold text-gray-800">{p.currency} {Number(p.price).toLocaleString()}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        {PLACEMENT_LABELS[p.placement] || p.placement}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} startDate={p.start_date} endDate={p.end_date} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {p.start_date || p.end_date ? (
                        <div>
                          {p.start_date && <p>From: {p.start_date}</p>}
                          {p.end_date   && <p>To: {p.end_date}</p>}
                        </div>
                      ) : <span className="text-gray-300">Always</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-brand-600">{Number(p.click_count || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end flex-wrap">
                        {/* Preview */}
                        <button onClick={() => openPreview(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50" title="Preview">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {/* Toggle status */}
                        <button
                          onClick={() => statusMut.mutate({ id: p.id, status: p.status === 'active' ? 'inactive' : 'active' })}
                          className={`p-1.5 rounded-lg ${p.status === 'active' ? 'text-emerald-500 hover:text-gray-500 hover:bg-gray-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={p.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {p.status === 'active'
                            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          }
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => { if (window.confirm(`Delete "${p.title}"?`)) deleteMut.mutate(p.id); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm text-gray-500">
            <p>Page {meta.page} of {meta.totalPages} · {meta.total} products</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1 rounded-lg border disabled:opacity-40 hover:bg-gray-100">← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= meta.totalPages}
                className="px-3 py-1 rounded-lg border disabled:opacity-40 hover:bg-gray-100">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add'  && <ProductModal onClose={closeModal} onSaved={onSaved} />}
      {modal === 'edit' && selected && <ProductModal product={selected} onClose={closeModal} onSaved={onSaved} />}
      {modal === 'preview' && selected && <PreviewModal product={selected} onClose={closeModal} />}
    </div>
  );
}
