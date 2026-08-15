import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rOrdersApi } from '../../../api/restaurantAdmin';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem { id: number; name: string; price: number; qty: number; }
interface Order {
  id: number; order_number: string; customer_name: string; customer_phone: string;
  customer_email?: string; items: OrderItem[]; subtotal: number; total: number;
  status: string; order_type: string; source?: string;
  table_number?: string; area_name?: string;
  payment_method?: string; payment_status?: string;
  special_instructions?: string; notes?: string; created_at: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; next?: string; nextLabel?: string }> = {
  pending:   { label: 'Pending',   color: '#b45309', bg: '#fffbeb', next: 'confirmed',  nextLabel: 'Confirm' },
  confirmed: { label: 'Confirmed', color: '#1d4ed8', bg: '#eff6ff', next: 'preparing',  nextLabel: 'Start Cooking' },
  preparing: { label: 'Preparing', color: '#7c3aed', bg: '#f5f3ff', next: 'ready',      nextLabel: 'Mark Ready' },
  ready:     { label: 'Ready',     color: '#065f46', bg: '#ecfdf5', next: 'delivered',  nextLabel: 'Delivered' },
  delivered: { label: 'Delivered', color: '#374151', bg: '#f9fafb' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fff1f2' },
};

const TYPE_LABEL: Record<string, string> = { dine_in: '🍽 Dine In', takeaway: '🥡 Takeaway', delivery: '🛵 Delivery' };
const SOURCE_LABEL: Record<string, string> = { online: '🌐 Online', pos: '🖥 POS', table: '🪑 Table', walkin: '🚶 Walk-in' };

function elapsed(dt: string) {
  const diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60); return `${h}h ${diff % 60}m ago`;
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderModal({ order, onClose, onStatus }: { order: Order; onClose: () => void; onStatus: (s: string) => void }) {
  const s = STATUS[order.status] || STATUS.pending;
  const next = s.next;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-mono">{order.order_number}</p>
            <h3 className="font-bold text-gray-800 text-base">{order.customer_name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ backgroundColor: s.bg, color: s.color }} className="text-xs font-semibold px-2.5 py-1 rounded-full">{s.label}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Type',   val: TYPE_LABEL[order.order_type] || order.order_type },
              { label: 'Source', val: SOURCE_LABEL[order.source || ''] || (order.source || '—') },
              { label: 'Placed', val: elapsed(order.created_at) },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {(order.table_number || order.area_name) && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800 font-medium">
              🪑 Table {order.table_number}{order.area_name ? ` — ${order.area_name}` : ''}
            </div>
          )}

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{item.qty}× {item.name}</span>
                <span className="text-sm font-medium text-gray-800">₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-base font-bold text-gray-900">₹{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {(order.payment_method || order.payment_status) && (
            <div className="flex gap-2">
              {order.payment_method && (
                <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 uppercase">{order.payment_method}</span>
              )}
              {order.payment_status && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {order.payment_status}
                </span>
              )}
            </div>
          )}

          {(order.special_instructions || order.notes) && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-medium text-amber-700 mb-1">Notes / Instructions</p>
              <p className="text-sm text-amber-800 italic">"{order.special_instructions || order.notes}"</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button
              onClick={() => onStatus('cancelled')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition"
            >Cancel</button>
          )}
          {next && (
            <button
              onClick={() => onStatus(next)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >{s.nextLabel} →</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onView }: { order: Order; onView: () => void }) {
  const s = STATUS[order.status] || STATUS.pending;
  const isUrgent = !['delivered', 'cancelled'].includes(order.status)
    && (Date.now() - new Date(order.created_at).getTime()) > 20 * 60 * 1000;

  return (
    <div
      onClick={onView}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden
        ${isUrgent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'}`}
    >
      <div className="h-1.5" style={{ backgroundColor: s.color }} />
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-mono text-xs text-gray-400">{order.order_number}</p>
            <p className="font-semibold text-gray-800 mt-0.5">{order.customer_name}</p>
          </div>
          <span style={{ backgroundColor: s.bg, color: s.color }} className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{s.label}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 flex-wrap">
          <span>{TYPE_LABEL[order.order_type] || order.order_type}</span>
          {order.source && <><span>•</span><span>{SOURCE_LABEL[order.source] || order.source}</span></>}
          <span>•</span>
          <span className={isUrgent ? 'text-amber-600 font-semibold' : ''}>{elapsed(order.created_at)}</span>
        </div>

        <div className="text-xs text-gray-500 space-y-0.5">
          {order.items.slice(0, 3).map((item, i) => <p key={i}>{item.qty}× {item.name}</p>)}
          {order.items.length > 3 && <p className="text-gray-400">+{order.items.length - 3} more items</p>}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className="font-bold text-gray-800">₹{Number(order.total).toFixed(0)}</span>
          <span className="text-xs text-emerald-600 font-medium">View →</span>
        </div>
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(orders: Order[]) {
  const header = ['Order #', 'Date', 'Customer', 'Phone', 'Type', 'Source', 'Table', 'Items', 'Subtotal', 'Total', 'Payment', 'Pay Status', 'Status', 'Notes'];
  const rows = orders.map(o => [
    o.order_number,
    fmtDate(o.created_at),
    o.customer_name,
    o.customer_phone || '',
    o.order_type,
    o.source || '',
    o.table_number ? `${o.area_name ? o.area_name + ' - ' : ''}T${o.table_number}` : '',
    o.items.map(i => `${i.qty}x ${i.name}`).join('; '),
    Number(o.subtotal).toFixed(2),
    Number(o.total).toFixed(2),
    o.payment_method || '',
    o.payment_status || '',
    o.status,
    o.special_instructions || o.notes || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`));

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── History Row ─────────────────────────────────────────────────────────────
function HistoryRow({ order, onView }: { order: Order; onView: () => void }) {
  const s = STATUS[order.status] || STATUS.pending;
  return (
    <tr onClick={onView} className="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{order.order_number}</td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(order.created_at)}</td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-800">{order.customer_name}</p>
        {order.customer_phone && <p className="text-xs text-gray-400">{order.customer_phone}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{TYPE_LABEL[order.order_type] || order.order_type}</td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{SOURCE_LABEL[order.source || ''] || (order.source || '—')}</td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {order.table_number ? `T${order.table_number}${order.area_name ? ' · ' + order.area_name : ''}` : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">₹{Number(order.total).toFixed(2)}</td>
      <td className="px-4 py-3">
        <span style={{ backgroundColor: s.bg, color: s.color }} className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">{s.label}</span>
      </td>
    </tr>
  );
}

// ─── Live View ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready',     label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

function LiveView({ onView }: { onView: (o: Order) => void }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['r-orders-live', statusFilter, search],
    queryFn: () => rOrdersApi.list({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
    }).then(r => r.data.data),
    refetchInterval: 30000,
  });

  const orders: Order[] = data?.orders || [];
  const total: number   = data?.total  || 0;
  const counts: Record<string, number> = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => rOrdersApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Order marked as ${STATUS[status]?.label || status}`);
      qc.invalidateQueries({ queryKey: ['r-orders-live'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 pt-4 pb-2 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => {
            const count = key ? (counts[key] || 0) : total;
            return (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1.5
                  ${statusFilter === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
                {count > 0 && <span className={`text-[10px] rounded-full px-1.5 ${statusFilter === key ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'}`}>{count}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number, name, phone…"
            className="flex-1 input text-sm" />
          <button onClick={() => refetch()} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition text-sm">↺</button>
        </div>
      </div>

      <div className="px-6 py-4">
        {isLoading && <div className="text-center text-gray-400 py-20">Loading orders…</div>}
        {!isLoading && orders.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-semibold text-base">No orders {statusFilter ? `with status "${STATUS[statusFilter]?.label}"` : 'yet'}</p>
            <p className="text-sm mt-1">Orders placed on your website will appear here automatically.</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onView={() => { setSelected(order); onView(order); }} />
          ))}
        </div>
      </div>

      {selected && (
        <OrderModal order={selected} onClose={() => setSelected(null)}
          onStatus={(status) => { statusMutation.mutate({ id: selected.id, status }); setSelected(null); }} />
      )}
    </div>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────
function HistoryView() {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [dateFrom, setDateFrom]         = useState(weekAgo);
  const [dateTo, setDateTo]             = useState(today);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<Order | null>(null);
  const pageSize = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['r-orders-history', dateFrom, dateTo, statusFilter, typeFilter, sourceFilter, page],
    queryFn: () => rOrdersApi.list({
      date_from: dateFrom,
      date_to:   dateTo,
      ...(statusFilter  ? { status:     statusFilter  } : {}),
      ...(typeFilter    ? { order_type: typeFilter    } : {}),
      ...(sourceFilter  ? { source:     sourceFilter  } : {}),
      page,
      limit: pageSize,
    }).then(r => r.data.data),
    keepPreviousData: true,
  } as any);

  const historyData = data as { orders: Order[]; total: number } | undefined;
  const orders: Order[] = historyData?.orders || [];
  const totalRows: number = historyData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  // Summary stats
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const delivered    = orders.filter(o => o.status === 'delivered').length;
  const cancelled    = orders.filter(o => o.status === 'cancelled').length;

  const qc = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => rOrdersApi.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      toast.success(`Order marked as ${STATUS[status]?.label || status}`);
      qc.invalidateQueries({ queryKey: ['r-orders-history'] });
      setSelected(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Filters bar */}
      <div className="px-6 pt-4 pb-2 space-y-3">
        {/* Date range */}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Statuses</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Types</option>
            <option value="dine_in">Dine In</option>
            <option value="takeaway">Takeaway</option>
            <option value="delivery">Delivery</option>
          </select>

          <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Sources</option>
            <option value="online">Online</option>
            <option value="pos">POS</option>
            <option value="table">Table</option>
            <option value="walkin">Walk-in</option>
          </select>

          <button onClick={() => refetch()} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition text-sm self-end">↺</button>

          <button
            onClick={() => exportCSV(orders)}
            disabled={orders.length === 0}
            className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition flex items-center gap-1.5 self-end"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
          </button>
        </div>

        {/* Summary stats */}
        {!isLoading && orders.length > 0 && (
          <div className="flex gap-4 flex-wrap">
            {[
              { label: 'Orders', val: totalRows },
              { label: 'Revenue (page)', val: `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              { label: 'Delivered', val: delivered },
              { label: 'Cancelled', val: cancelled },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        {isLoading && <div className="text-center text-gray-400 py-20">Loading history…</div>}

        {!isLoading && orders.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📂</div>
            <p className="font-semibold text-base">No orders in this period</p>
            <p className="text-sm mt-1">Adjust the date range or filters.</p>
          </div>
        )}

        {orders.length > 0 && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Order #', 'Date', 'Customer', 'Type', 'Source', 'Table', 'Total', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => <HistoryRow key={o.id} order={o} onView={() => setSelected(o)} />)}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">← Prev</button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <OrderModal order={selected} onClose={() => setSelected(null)}
          onStatus={(status) => statusMutation.mutate({ id: selected.id, status })} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ROrdersPage() {
  const [tab, setTab] = useState<'live' | 'history'>('live');

  return (
    <div className="flex flex-col h-full">
      <RestaurantHeader
        title="Orders"
        subtitle={tab === 'live' ? 'Live incoming orders' : 'Full order history with export'}
      />

      {/* Tab switcher */}
      <div className="flex border-b border-gray-100 px-6 bg-white shrink-0">
        {([
          { key: 'live',    label: '🔴 Live Orders' },
          { key: 'history', label: '📂 History' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition ${
              tab === key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'live'    && <LiveView    onView={() => {}} />}
      {tab === 'history' && <HistoryView />}
    </div>
  );
}
