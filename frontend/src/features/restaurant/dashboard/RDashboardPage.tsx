import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { rDashboardApi } from '../../../api/restaurantAdmin';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';

// ─── Reusable SVG icon helper ─────────────────────────────────────────────────
const Icon = ({ d, className = 'w-5 h-5' }: { d: string | string[]; className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)
      : <path strokeLinecap="round" strokeLinejoin="round" d={d} />}
  </svg>
);

// ─── Color palette (matches super admin StatCard) ─────────────────────────────
const COLOR_MAP: Record<string, { iconBg: string; cardFrom: string }> = {
  emerald: { iconBg: 'bg-emerald-500', cardFrom: 'from-emerald-50' },
  blue:    { iconBg: 'bg-blue-500',    cardFrom: 'from-blue-50'    },
  amber:   { iconBg: 'bg-amber-500',   cardFrom: 'from-amber-50'   },
  purple:  { iconBg: 'bg-purple-500',  cardFrom: 'from-purple-50'  },
  rose:    { iconBg: 'bg-rose-500',    cardFrom: 'from-rose-50'    },
  cyan:    { iconBg: 'bg-cyan-500',    cardFrom: 'from-cyan-50'    },
  orange:  { iconBg: 'bg-orange-500',  cardFrom: 'from-orange-50'  },
  slate:   { iconBg: 'bg-slate-500',   cardFrom: 'from-slate-50'   },
};

// ─── Stat Card (identical style to super admin) ───────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: keyof typeof COLOR_MAP;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  onClick?: () => void;
  loading?: boolean;
}

function StatCard({ title, value, icon, color = 'emerald', change, changeType = 'neutral', onClick, loading }: StatCardProps) {
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="h-3 bg-gray-100 rounded w-20" />
          <div className="w-10 h-10 rounded-xl bg-gray-100" />
        </div>
        <div className="h-9 bg-gray-100 rounded w-16 mb-2" />
        <div className="h-5 bg-gray-100 rounded-full w-24" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={[
        'bg-gradient-to-b', c.cardFrom, 'to-white',
        'rounded-2xl border border-gray-100 shadow-card p-5 transition-all duration-200',
        onClick ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Title + Icon */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{title}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white shrink-0 ${c.iconBg}`}>
          {icon}
        </div>
      </div>
      {/* Value */}
      <p className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">{value}</p>
      {/* Trend */}
      {change && (
        <div className="mt-2.5">
          <span className={[
            'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
            changeType === 'increase' ? 'bg-emerald-50 text-emerald-700' :
            changeType === 'decrease' ? 'bg-red-50 text-red-600' :
            'bg-gray-100 text-gray-500',
          ].join(' ')}>
            {changeType === 'increase' && '↑ '}{changeType === 'decrease' && '↓ '}{change}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700',
    confirmed: 'bg-blue-50 text-blue-700',
    preparing: 'bg-purple-50 text-purple-700',
    ready:     'bg-emerald-50 text-emerald-700',
    delivered: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-50 text-red-600',
    seated:    'bg-green-50 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    published: 'bg-emerald-50 text-emerald-700',
    draft:     'bg-gray-100 text-gray-500',
    no_show:   'bg-red-50 text-red-500',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const ORDER_TYPE_ICON: Record<string, string> = { dine_in: '🍽️', takeaway: '🥡', delivery: '🛵' };

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RDashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-dashboard'],
    queryFn:  () => rDashboardApi.stats().then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const s    = data?.stats         ?? {};
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const menuPct = s.total_items
    ? Math.round((s.available_items / s.total_items) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <RestaurantHeader
        title="Dashboard"
        subtitle={today}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-7">

          {/* ── Page header ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-400 mt-0.5">Restaurant overview &amp; real-time metrics</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-3.5 h-3.5 text-gray-400" />
                {today}
              </span>
              <button
                onClick={() => navigate('/restaurant/orders')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
              >
                <Icon d={['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2']} className="w-4 h-4" />
                View Orders
              </button>
            </div>
          </div>

          {/* ── Orders section ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Orders</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Orders"
                value={s.total_orders ?? 0}
                loading={isLoading}
                color="emerald"
                change={s.today_orders > 0 ? `${s.today_orders} today` : 'none today'}
                changeType={s.today_orders > 0 ? 'increase' : 'neutral'}
                onClick={() => navigate('/restaurant/orders')}
                icon={<Icon d={['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2']} />}
              />
              <StatCard
                title="Active Orders"
                value={s.active_orders ?? 0}
                loading={isLoading}
                color="amber"
                change={s.active_orders > 0 ? 'in kitchen now' : 'kitchen clear'}
                changeType={s.active_orders > 0 ? 'increase' : 'neutral'}
                onClick={() => navigate('/restaurant/orders')}
                icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              />
              <StatCard
                title="Total Revenue"
                value={`₹${Number(s.total_revenue ?? 0).toFixed(0)}`}
                loading={isLoading}
                color="blue"
                change={Number(s.today_revenue ?? 0) > 0 ? `₹${Number(s.today_revenue).toFixed(0)} today` : 'none today'}
                changeType={Number(s.today_revenue ?? 0) > 0 ? 'increase' : 'neutral'}
                onClick={() => navigate('/restaurant/analytics')}
                icon={<Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
              />
              <StatCard
                title="Menu Items"
                value={s.total_items ?? 0}
                loading={isLoading}
                color="purple"
                change={s.total_items > 0 ? `${menuPct}% available` : 'add items'}
                changeType={menuPct > 80 ? 'increase' : menuPct > 50 ? 'neutral' : 'decrease'}
                onClick={() => navigate('/restaurant/menu')}
                icon={<Icon d={['M4 6h16M4 10h16M4 14h8']} />}
              />
            </div>
          </section>

          {/* ── Reservations section ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Reservations</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Today"
                value={s.today_reservations ?? 0}
                loading={isLoading}
                color="amber"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              />
              <StatCard
                title="Upcoming"
                value={s.upcoming_reservations ?? 0}
                loading={isLoading}
                color="blue"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              />
              <StatCard
                title="Pending Approval"
                value={s.pending_reservations ?? 0}
                loading={isLoading}
                color="orange"
                change={s.pending_reservations > 0 ? 'needs action' : undefined}
                changeType="decrease"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
              />
              <StatCard
                title="Total"
                value={s.total_reservations ?? 0}
                loading={isLoading}
                color="slate"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d={['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', 'M9 12h6m-3-3v6']} />}
              />
            </div>
          </section>

          {/* ── Content section ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Content</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Published Posts"
                value={s.published_posts ?? 0}
                loading={isLoading}
                color="purple"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
              />
              <StatCard
                title="Total Posts"
                value={s.total_posts ?? 0}
                loading={isLoading}
                color="cyan"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d={['M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z']} />}
              />
              <StatCard
                title="Upcoming Events"
                value={s.upcoming_events ?? 0}
                loading={isLoading}
                color="rose"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
              />
              <StatCard
                title="Total Events"
                value={s.total_events ?? 0}
                loading={isLoading}
                color="rose"
                onClick={() => navigate('/restaurant/cms')}
                icon={<Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              />
            </div>
          </section>

          {/* ── Recent tables ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Recent Orders */}
            <Card>
              <CardHeader
                title="Recent Orders"
                description="Latest customer orders"
                action={
                  <Link to="/restaurant/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                    View all →
                  </Link>
                }
              />
              <div className="divide-y divide-gray-50">
                {!data?.recentOrders?.length ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                      <Icon d={['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2']} className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">No orders yet</p>
                  </div>
                ) : (
                  data.recentOrders.map((o: any) => (
                    <div
                      key={o.id}
                      onClick={() => navigate('/restaurant/orders')}
                      className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400">{o.order_number}</span>
                          <span className="text-xs text-gray-400">{ORDER_TYPE_ICON[o.order_type] || ''}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 truncate">{o.customer_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(o.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">₹{Number(o.total).toFixed(0)}</p>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Reservations */}
            <Card>
              <CardHeader
                title="Recent Reservations"
                description="Upcoming table bookings"
                action={
                  <Link to="/restaurant/cms" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                    View all →
                  </Link>
                }
              />
              <div className="divide-y divide-gray-50">
                {!data?.recentReservations?.length ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                      <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">No reservations yet</p>
                  </div>
                ) : (
                  data.recentReservations.map((r: any) => (
                    <div
                      key={r.id}
                      onClick={() => navigate('/restaurant/cms')}
                      className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.customer_name}</p>
                        <p className="text-xs text-gray-400">
                          {r.party_size} guests · {new Date(r.reservation_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* ── Quick links ── */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Menu',       href: '/restaurant/menu',       icon: <Icon d={['M4 6h16M4 10h16M4 14h8']} />,                                          bg: 'bg-emerald-50', text: 'text-emerald-700', hover: 'hover:bg-emerald-100' },
                { label: 'Orders',     href: '/restaurant/orders',     icon: <Icon d={['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2']} />, bg: 'bg-amber-50', text: 'text-amber-700', hover: 'hover:bg-amber-100' },
                { label: 'CMS',        href: '/restaurant/cms',        icon: <Icon d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />, bg: 'bg-blue-50', text: 'text-blue-700', hover: 'hover:bg-blue-100' },
                { label: 'POS',        href: '/restaurant/pos',        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,               bg: 'bg-purple-50', text: 'text-purple-700', hover: 'hover:bg-purple-100' },
                { label: 'Customers',  href: '/restaurant/customers',  icon: <Icon d={['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 7a4 4 0 110 8 4 4 0 010-8z']} />,                              bg: 'bg-rose-50', text: 'text-rose-700', hover: 'hover:bg-rose-100' },
                { label: 'Analytics',  href: '/restaurant/analytics',  icon: <Icon d="M18 20V10M12 20V4M6 20v-6" />,                                            bg: 'bg-cyan-50', text: 'text-cyan-700', hover: 'hover:bg-cyan-100' },
              ].map(({ label, href, icon, bg, text, hover }) => (
                <Link
                  key={href}
                  to={href}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 ${bg} ${hover} transition-colors group`}
                >
                  <div className={`${text} transition-transform group-hover:scale-110`}>{icon}</div>
                  <span className={`text-xs font-semibold ${text}`}>{label}</span>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
