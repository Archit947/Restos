import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { dashboardApi } from '@/api/dashboard.api';
import { StatCard } from './StatCard';
import { RecentActivity } from './RecentActivity';
import { RestaurantGrowthChart } from './charts/RestaurantGrowthChart';
import { StatusDistributionChart } from './charts/StatusDistributionChart';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import { formatDate, formatBytes } from '@/utils/formatters';

/* ────────────────────────────────────────────────────────────── */
/*  Tiny helper: section card header                             */
/* ────────────────────────────────────────────────────────────── */
function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Quick stat badge shown next to chart headers                 */
/* ────────────────────────────────────────────────────────────── */
function MetricBadge({ label, value, variant = 'gray' }: { label: string; value: number | string; variant?: 'green' | 'blue' | 'gray' }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[variant]}`}>
      <span className="font-bold">{value}</span>
      <span className="font-medium opacity-80">{label}</span>
    </span>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Empty state for charts / lists                               */
/* ────────────────────────────────────────────────────────────── */
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-52 flex flex-col items-center justify-center gap-2">
      <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-xs text-gray-400 font-medium">{message}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Page                                                          */
/* ────────────────────────────────────────────────────────────── */
export function DashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => dashboardApi.getCharts().then(r => r.data.data),
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.getRecentActivity(10).then(r => r.data.data),
  });

  const { data: expiring } = useQuery({
    queryKey: ['dashboard-expiring'],
    queryFn: () => dashboardApi.getExpiringSubscriptions().then(r => r.data.data),
  });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const hasGrowthData = (charts?.growth?.length ?? 0) > 0;
  const hasDistributionData = (charts?.distribution?.length ?? 0) > 0;

  return (
    <div className="space-y-7">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Platform overview &amp; real-time metrics
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {today}
          </span>
          <Link
            to="/restaurants/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Restaurant
          </Link>
        </div>
      </div>

      {/* ── Stat Cards: Restaurants ─────────────────────────────────── */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          Restaurants
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total"
            value={stats?.restaurants.total ?? 0}
            loading={statsLoading}
            color="brand"
            change={`${stats?.restaurants.newThisMonth ?? 0} this month`}
            changeType="increase"
            onClick={() => navigate('/restaurants')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            title="Active"
            value={stats?.restaurants.active ?? 0}
            loading={statsLoading}
            color="green"
            onClick={() => navigate('/restaurants?status=active')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Trial"
            value={stats?.restaurants.trial ?? 0}
            loading={statsLoading}
            color="blue"
            onClick={() => navigate('/restaurants?status=trial')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Suspended"
            value={stats?.restaurants.suspended ?? 0}
            loading={statsLoading}
            color="orange"
            onClick={() => navigate('/restaurants?status=suspended')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Stat Cards: Content & Platform ──────────────────────────── */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          Platform
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Websites"
            value={stats?.websites.total ?? 0}
            loading={statsLoading}
            color="purple"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="CMS Pages"
            value={stats?.cms.totalPages ?? 0}
            loading={statsLoading}
            color="cyan"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            title="Reservations"
            value={stats?.content.totalReservations ?? 0}
            loading={statsLoading}
            color="yellow"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            title="Storage Used"
            value={formatBytes(stats?.storage.totalUsedMB ?? 0)}
            loading={statsLoading}
            color="gray"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Growth chart */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader
              title="Restaurant Growth"
              description="New restaurants onboarded — last 12 months"
              action={
                stats && !statsLoading
                  ? <MetricBadge label="total" value={stats.restaurants.total} variant="blue" />
                  : undefined
              }
            />
            <div className="p-6">
              {hasGrowthData
                ? <RestaurantGrowthChart data={charts!.growth} loading={chartsLoading} />
                : chartsLoading
                  ? <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
                  : <EmptyChart message="No restaurant data yet" />
              }
            </div>
          </Card>
        </div>

        {/* Status distribution */}
        <div>
          <Card padding="none">
            <CardHeader
              title="Status Breakdown"
              description="Restaurants by current status"
              action={
                stats && !statsLoading
                  ? <MetricBadge label="active" value={stats.restaurants.active} variant="green" />
                  : undefined
              }
            />
            <div className="p-6">
              {hasDistributionData
                ? <StatusDistributionChart data={charts!.distribution} loading={chartsLoading} />
                : chartsLoading
                  ? <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
                  : <EmptyChart message="No status data yet" />
              }
            </div>
          </Card>
        </div>
      </div>

      {/* ── Activity + Expiring ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <Card padding="none">
          <CardHeader
            title="Recent Activity"
            description="Latest platform actions across all tenants"
            action={
              <Link to="/audit-logs" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
                View all →
              </Link>
            }
          />
          <div className="px-6 pt-4 pb-6">
            <RecentActivity activities={activity ?? []} loading={activityLoading} />
          </div>
        </Card>

        {/* Expiring Subscriptions */}
        <Card padding="none">
          <CardHeader
            title="Expiring Soon"
            description="Subscriptions expiring within the next 7 days"
            action={
              expiring?.length
                ? <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">{expiring.length} expiring</span>
                : undefined
            }
          />
          {!expiring?.length ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">All subscriptions are up to date</p>
              <p className="text-xs text-gray-400">Nothing expiring in the next 7 days</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {(expiring as Array<Record<string, unknown>>).slice(0, 5).map((item) => (
                <div key={String(item.id)} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                  <div className="min-w-0 mr-4">
                    <p className="text-sm font-semibold text-gray-900 truncate">{String(item.restaurant_name)}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {String(item.plan_name)}
                      {item.full_domain ? ` · ${String(item.full_domain)}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={String(item.status) as 'active'} />
                    <p className="text-xs text-red-500 font-medium mt-1">
                      {formatDate(String(item.expires_at || item.trial_ends_at))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Plan Distribution ────────────────────────────────────────── */}
      {stats?.planDistribution && stats.planDistribution.length > 0 && (
        <Card padding="none">
          <CardHeader title="Plan Distribution" description="Restaurants distributed across subscription plans" />
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.planDistribution.map((plan: { slug: string; name: string; count: number }) => (
                <div key={plan.slug} className="relative bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-2xl p-5 text-center hover:shadow-card transition-all">
                  <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{plan.count}</p>
                  <p className="text-sm text-gray-500 font-medium mt-1">{plan.name}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
