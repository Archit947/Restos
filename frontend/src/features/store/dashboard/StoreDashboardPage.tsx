import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeDashboardApi } from '@/api/storeAdmin';

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 20 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>{value}</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>{label}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{sub}</p>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
};

export default function StoreDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['store-dashboard'],
    queryFn: () => storeDashboardApi.get().then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div style={{ padding: 32, color: '#94a3b8', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #8b5cf6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        Loading…
      </div>
    );
  }

  const { stats, recentOrders = [], lowStockItems = [] } = data || {};

  return (
    <div style={{ padding: 28, color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#f1f5f9' }}>Store Dashboard</h1>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13 }}>Overview of your store performance</p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="📦" label="Total Items"      value={stats?.totalItems || 0} />
        <StatCard icon="🗂️" label="Categories"       value={stats?.totalCategories || 0} />
        <StatCard icon="🛍️" label="Total Orders"     value={stats?.totalOrders || 0} />
        <StatCard icon="⏳" label="Pending Orders"   value={stats?.pendingOrders || 0} />
        <StatCard icon="💰" label="Revenue (Paid)"   value={`₹${Number(stats?.totalRevenue || 0).toFixed(2)}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent orders */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px', color: '#f1f5f9' }}>Recent Orders</h2>
          {recentOrders.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13 }}>No orders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentOrders.map((o: any) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{o.order_number}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{o.customer_name}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>₹{o.total}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px', color: '#f1f5f9' }}>⚠️ Low Stock</h2>
          {lowStockItems.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13 }}>All items well-stocked.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lowStockItems.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0' }}>{item.name}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: item.stock_quantity === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: item.stock_quantity === 0 ? '#fca5a5' : '#fcd34d' }}>
                    {item.stock_quantity === 0 ? 'Out of stock' : `${item.stock_quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
