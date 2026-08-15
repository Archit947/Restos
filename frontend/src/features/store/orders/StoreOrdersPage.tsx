import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { storeOrdersApi } from '@/api/storeAdmin';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:    { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d' },
  confirmed:  { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd' },
  processing: { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd' },
  shipped:    { bg: 'rgba(6,182,212,0.15)',  text: '#67e8f9' },
  delivered:  { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7' },
  cancelled:  { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5' },
};

const PAYMENT_COLORS: Record<string, { bg: string; text: string }> = {
  pending:  { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d' },
  paid:     { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7' },
  failed:   { bg: 'rgba(239,68,68,0.15)',  text: '#fca5a5' },
  refunded: { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd' },
};

function OrderDetailModal({ order, onClose }: { order: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [status,  setStatus]  = useState(order.status);
  const [payment, setPayment] = useState(order.payment_status);

  const statusMut = useMutation({
    mutationFn: () => storeOrdersApi.updateStatus(order.id, status),
    onSuccess: () => { toast.success('Status updated.'); qc.invalidateQueries({ queryKey: ['store-orders'] }); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed.'),
  });

  const paymentMut = useMutation({
    mutationFn: () => storeOrdersApi.updatePayment(order.id, payment),
    onSuccess: () => { toast.success('Payment status updated.'); qc.invalidateQueries({ queryKey: ['store-orders'] }); onClose(); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed.'),
  });

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, fontFamily: 'system-ui', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: 17, fontWeight: 700 }}>Order {order.order_number}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Customer */}
        <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{order.customer_name}</p>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{order.customer_phone}</p>
          {order.customer_email && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{order.customer_email}</p>}
          {order.customer_address && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>📍 {order.customer_address}</p>}
        </div>

        {/* Items */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Items</p>
          {(items || []).map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b', fontSize: 13, color: '#e2e8f0' }}>
              <span>{item.name} × {item.qty || 1}</span>
              <span>₹{(Number(item.price) * Number(item.qty || 1)).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>
            <span>Total</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        {/* Status update */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Order Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Payment Status</label>
            <select value={payment} onChange={e => setPayment(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 13, outline: 'none' }}>
              {PAYMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => statusMut.mutate()} disabled={statusMut.isPending || status === order.status}
            style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: (statusMut.isPending || status === order.status) ? 0.5 : 1 }}>
            Update Status
          </button>
          <button onClick={() => paymentMut.mutate()} disabled={paymentMut.isPending || payment === order.payment_status}
            style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13, opacity: (paymentMut.isPending || payment === order.payment_status) ? 0.5 : 1 }}>
            Update Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoreOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]         = useState<any | null>(null);
  const [page, setPage]                 = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['store-orders', statusFilter, page],
    queryFn: () => storeOrdersApi.list({ status: statusFilter || undefined, page }).then(r => r.data.data),
  });

  const orders: any[] = data?.orders || [];
  const meta = data?.meta;

  return (
    <div style={{ padding: 28, color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Orders</h1>
      <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 13 }}>Manage and track store orders</p>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setStatusFilter('')} style={filterBtn(!statusFilter)}>All</button>
        {STATUS_OPTIONS.map(s => <button key={s} onClick={() => setStatusFilter(s)} style={filterBtn(statusFilter === s)}>{s}</button>)}
      </div>

      {isLoading ? <p style={{ color: '#64748b' }}>Loading orders…</p> : (
        <>
          {orders.length === 0 && <p style={{ color: '#64748b', fontSize: 14 }}>No orders found.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.map((o: any) => {
              const sc = STATUS_COLORS[o.status] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
              const pc = PAYMENT_COLORS[o.payment_status] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
              return (
                <div key={o.id} onClick={() => setSelected(o)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'border-color 0.15s' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{o.order_number}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name} · {o.customer_phone}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>₹{o.total}</p>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: sc.bg, color: sc.text }}>{o.status}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: pc.bg, color: pc.text }}>{o.payment_status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={paginBtn}>← Prev</button>
              <span style={{ color: '#64748b', fontSize: 13, alignSelf: 'center' }}>Page {page} of {meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} style={paginBtn}>Next →</button>
            </div>
          )}
        </>
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const filterBtn = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${active ? '#8b5cf6' : '#334155'}`,
  background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
  color: active ? '#c4b5fd' : '#64748b', fontSize: 12, cursor: 'pointer',
});

const paginBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent',
  color: '#94a3b8', cursor: 'pointer', fontSize: 13,
};
