import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { kdsOrdersApi, kdsAuthApi } from '../../api/kds';
import { useKdsAuthStore } from '../../store/kdsAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem { name: string; price: number; qty: number; }
interface Order {
  id: number; order_number: string; customer_name: string; customer_phone: string;
  items: OrderItem[]; total: number; status: string; order_type: string;
  special_instructions?: string; created_at: string;
}

// ─── Column Config ────────────────────────────────────────────────────────────
const KDS_COLUMNS = [
  { key: 'pending',   label: 'New Orders',  emoji: '🔔', accent: '#f59e0b', dim: '#78350f', bg: 'rgba(245,158,11,0.07)' },
  { key: 'confirmed', label: 'Confirmed',   emoji: '✅', accent: '#3b82f6', dim: '#1d4ed8', bg: 'rgba(59,130,246,0.07)' },
  { key: 'preparing', label: 'Cooking',     emoji: '👨‍🍳', accent: '#a855f7', dim: '#7c3aed', bg: 'rgba(168,85,247,0.07)' },
  { key: 'ready',     label: 'Ready',       emoji: '🎉', accent: '#10b981', dim: '#065f46', bg: 'rgba(16,185,129,0.07)' },
];

const NEXT_STATUS: Record<string, { status: string; label: string; color: string }> = {
  pending:   { status: 'confirmed',  label: 'Accept Order',  color: '#3b82f6' },
  confirmed: { status: 'preparing', label: 'Start Cooking', color: '#a855f7' },
  preparing: { status: 'ready',     label: 'Mark Ready',    color: '#10b981' },
  ready:     { status: 'delivered', label: 'Delivered ✓',   color: '#6b7280' },
};

const ORDER_TYPE_ICON: Record<string, string> = {
  dine_in: '🍽️', takeaway: '🥡', delivery: '🛵',
};

// ─── Timer ───────────────────────────────────────────────────────────────────
function OrderTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    calc();
    const t = setInterval(calc, 10000);
    return () => clearInterval(t);
  }, [createdAt]);

  const mins = Math.floor(elapsed / 60);
  const isCritical = mins >= 30;
  const isUrgent   = mins >= 20;
  const color = isCritical ? '#ef4444' : isUrgent ? '#f59e0b' : '#6b7280';

  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 3 }}>
      <span>{isCritical ? '🚨' : isUrgent ? '⚠️' : '⏱️'}</span>
      {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
    </span>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function KdsOrderCard({
  order, accent, onNext, isPending,
}: { order: Order; accent: string; onNext: (id: number, status: string) => void; isPending: boolean; }) {
  const nextAction = NEXT_STATUS[order.status];

  return (
    <div style={{
      backgroundColor: '#1e2533',
      borderRadius: 12,
      border: `1px solid #2d3748`,
      borderLeftWidth: 3,
      borderLeftColor: accent,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: accent, margin: 0, fontWeight: 700, letterSpacing: '0.04em' }}>
            {order.order_number}
          </p>
          <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 700, margin: '3px 0 0' }}>{order.customer_name}</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <OrderTimer createdAt={order.created_at} />
          <span style={{ color: '#64748b', fontSize: 11, backgroundColor: '#2d3748', padding: '2px 7px', borderRadius: 20 }}>
            {ORDER_TYPE_ICON[order.order_type] || ''} {order.order_type.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Items */}
      <div style={{ borderTop: '1px solid #2d3748', paddingTop: 10, marginBottom: 10 }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>
              <span style={{
                color: '#fff', fontWeight: 700, backgroundColor: accent,
                padding: '0 6px', borderRadius: 5, fontSize: 11, marginRight: 6,
              }}>{item.qty}×</span>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Special instructions */}
      {order.special_instructions && (
        <div style={{
          backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8, padding: '7px 10px', marginBottom: 10,
        }}>
          <p style={{ color: '#fbbf24', fontSize: 12, margin: 0 }}>
            📝 {order.special_instructions}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
          ₹{Number(order.total).toFixed(0)}
        </span>
        {nextAction && (
          <button
            onClick={() => onNext(order.id, nextAction.status)}
            disabled={isPending}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
              backgroundColor: nextAction.color, color: '#fff', fontSize: 12, fontWeight: 700,
              opacity: isPending ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {nextAction.label} →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function KdsDashboard() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const { staff, logout, refreshToken } = useKdsAuthStore();
  const [lastRefresh, setLastRefresh]   = useState(new Date());

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['kds-orders'],
    queryFn:  () => kdsOrdersApi.list().then(r => r.data.data as { orders: Order[] }),
    refetchInterval: 20000,
  });
  useEffect(() => { if (data) setLastRefresh(new Date()); }, [data]);

  const orders: Order[] = data?.orders || [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => kdsOrdersApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kds-orders'] }),
  });

  const handleLogout = async () => {
    try { await kdsAuthApi.logout(refreshToken || ''); } catch { /* ok */ }
    logout();
    navigate('/kds/login', { replace: true });
  };

  const byStatus: Record<string, Order[]> = {};
  KDS_COLUMNS.forEach(col => { byStatus[col.key] = []; });
  orders.forEach(o => { if (byStatus[o.status]) byStatus[o.status].push(o); });
  const pendingCount = byStatus.pending?.length || 0;

  // ── Top bar ──────────────────────────────────────────────────────────────
  const TopBar = () => (
    <div style={{
      backgroundColor: '#141b2d',
      borderBottom: '1px solid #1e2a40',
      padding: '0 20px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      {/* Left: brand + station */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 16 }}>👨‍🍳</span>
        </div>

        {/* Breadcrumb */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              {staff?.restaurantName || 'Restaurant'}
            </span>
            <span style={{ color: '#374151', fontSize: 12 }}>›</span>
            <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>
              Kitchen Display
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: '#4b5563' }}>
            {staff?.stationName || 'KDS Station'}
          </p>
        </div>

        {/* Pending badge */}
        {pendingCount > 0 && (
          <div style={{
            backgroundColor: '#f59e0b', color: '#111', borderRadius: 20,
            padding: '2px 10px', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            🔔 {pendingCount} new
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#374151', fontSize: 11 }}>
          Updated {lastRefresh.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
        </span>

        <button
          onClick={() => { qc.invalidateQueries({ queryKey: ['kds-orders'] }); setLastRefresh(new Date()); }}
          style={{
            padding: '6px 12px', borderRadius: 8,
            backgroundColor: '#1e2a40', border: '1px solid #2d3748',
            color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span style={{ fontSize: 13 }}>↺</span> Refresh
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: '6px 12px', borderRadius: 8,
            backgroundColor: 'transparent', border: '1px solid #374151',
            color: '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 500,
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f1623', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <p style={{ color: '#4b5563', fontSize: 14 }}>Loading orders…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Board ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1623', display: 'flex', flexDirection: 'column' }}>
      <TopBar />

      {/* Column headers row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #1e2a40', flexShrink: 0 }}>
        {KDS_COLUMNS.map(col => {
          const count = byStatus[col.key]?.length || 0;
          return (
            <div key={col.key} style={{
              padding: '10px 16px',
              borderRight: '1px solid #1e2a40',
              backgroundColor: col.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{col.emoji}</span>
                <span style={{ color: col.accent, fontSize: 12, fontWeight: 700, letterSpacing: '0.02em' }}>
                  {col.label}
                </span>
              </div>
              <span style={{
                backgroundColor: col.dim, color: col.accent,
                borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700,
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', overflow: 'hidden' }}>
        {KDS_COLUMNS.map(col => {
          const colOrders = byStatus[col.key] || [];
          return (
            <div key={col.key} style={{
              display: 'flex', flexDirection: 'column',
              borderRight: '1px solid #1a2236', overflow: 'hidden',
            }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
                {colOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: 48, color: '#2d3748' }}>
                    <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>{col.emoji}</div>
                    <p style={{ fontSize: 12 }}>No {col.label.toLowerCase()}</p>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <KdsOrderCard
                      key={order.id}
                      order={order}
                      accent={col.accent}
                      isPending={statusMutation.isPending}
                      onNext={(id, status) => statusMutation.mutate({ id, status })}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
