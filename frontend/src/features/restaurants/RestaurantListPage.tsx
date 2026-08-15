import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { restaurantsApi } from '@/api/restaurants.api';
import { settingsApi } from '@/api/settings.api';
import { Table, Pagination } from '@/components/common/Table';
import { Button } from '@/components/common/Button';
import { Badge, StatusBadge, WebsiteStatusBadge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/Modal';
import { Input, Select } from '@/components/common/Input';
import { formatDate, formatRelative, initials, generateAvatarColor } from '@/utils/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import type { Restaurant, SubscriptionPlan } from '@/types';
import { clsx } from 'clsx';
import { imageUrl } from '@/utils/imageUrl';

const SORT_OPTIONS = [
  { value: 'id', label: 'Newest First' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'status', label: 'Status' },
];

export function RestaurantListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [sort, setSort] = useState('id');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id?: number; ids?: number[] } | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', page, limit, debouncedSearch, statusFilter, planFilter, sort],
    queryFn: () => restaurantsApi.list({
      page, limit, search: debouncedSearch || undefined, status: statusFilter || undefined,
      plan_id: planFilter || undefined, sort, order: 'DESC',
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ['plans'],
    queryFn: () => settingsApi.getPlans().then(r => r.data.data || []),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      restaurantsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update status.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => restaurantsApi.delete(id),
    onSuccess: () => {
      toast.success('Restaurant deleted.');
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed.');
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: string }) =>
      restaurantsApi.bulkAction(ids, action),
    onSuccess: () => {
      toast.success('Bulk action completed.');
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      setSelectedIds([]);
      setConfirmAction(null);
    },
    onError: () => toast.error('Bulk action failed.'),
  });

  const restaurants: Restaurant[] = (data as { data?: Restaurant[] })?.data || [];
  const meta = (data as { meta?: { total: number; totalPages: number } })?.meta;

  const columns = [
    {
      key: 'restaurant_name',
      label: 'Restaurant',
      render: (_: unknown, row: Restaurant) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0', generateAvatarColor(row.restaurant_name))}>
            {row.logo ? (
              <img src={imageUrl(row.logo)!} alt="" className="w-8 h-8 rounded-xl object-cover" />
            ) : (
              initials(row.restaurant_name)
            )}
          </div>
          <div className="min-w-0">
            <button
              onClick={() => navigate(`/restaurants/${row.id}`)}
              className="text-sm font-semibold text-gray-900 hover:text-brand-600 truncate block max-w-[180px]"
            >
              {row.restaurant_name}
            </button>
            <p className="text-xs text-gray-400 truncate">{row.owner_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact',
      render: (_: unknown, row: Restaurant) => (
        <div>
          <p className="text-sm text-gray-700">{row.email}</p>
          <p className="text-xs text-gray-400">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'plan_name',
      label: 'Plan',
      render: (_: unknown, row: Restaurant) => (
        <Badge variant="purple">{row.plan_name || 'No Plan'}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: Restaurant) => <StatusBadge status={row.status} />,
    },
    {
      key: 'website_status',
      label: 'Website',
      render: (_: unknown, row: Restaurant) => (
        <div className="space-y-1">
          <WebsiteStatusBadge status={row.website_status} enabled={row.website_enabled} />
          {row.full_domain && (
            <a href={row.full_domain.startsWith('http') ? row.full_domain : `https://${row.full_domain}`} target="_blank" rel="noopener noreferrer"
              className="block text-xs text-brand-600 hover:underline truncate max-w-[140px]">
              {row.full_domain}
            </a>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (v: unknown) => (
        <span className="text-xs text-gray-500">{formatDate(String(v))}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (_: unknown, row: Restaurant) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => navigate(`/restaurants/${row.id}`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            title="View"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          {row.status !== 'suspended' ? (
            <button
              onClick={() => setConfirmAction({ type: 'suspend', id: row.id })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Suspend"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => statusMutation.mutate({ id: row.id, status: 'active' })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Activate"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setConfirmAction({ type: 'delete', id: row.id })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta?.total || 0} restaurants on the platform
          </p>
        </div>
        <Button
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
          onClick={() => navigate('/restaurants/new')}
        >
          Add Restaurant
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search restaurants, owners, emails..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              placeholder="All Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'trial', label: 'Trial' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
          </div>
          <div className="w-40">
            <Select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              placeholder="All Plans"
              options={plans.map(p => ({ value: String(p.id), label: p.name }))}
            />
          </div>
          <div className="w-40">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={SORT_OPTIONS}
            />
          </div>
          {(search || statusFilter || planFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setPlanFilter(''); setPage(1); }}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm font-medium text-brand-700">{selectedIds.length} selected</span>
          <Button size="xs" variant="ghost" onClick={() => setConfirmAction({ type: 'bulk-activate', ids: selectedIds })}>Activate</Button>
          <Button size="xs" variant="ghost" onClick={() => setConfirmAction({ type: 'bulk-suspend', ids: selectedIds })}>Suspend</Button>
          <Button size="xs" variant="danger" onClick={() => setConfirmAction({ type: 'bulk-delete', ids: selectedIds })}>Delete</Button>
          <Button size="xs" variant="ghost" onClick={() => setSelectedIds([])}>Cancel</Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={restaurants}
          loading={isLoading}
          selectable
          selectedIds={selectedIds}
          onSelectAll={(selected) =>
            setSelectedIds(selected ? restaurants.map(r => r.id) : [])
          }
          onSelectRow={(id, selected) =>
            setSelectedIds(prev => selected ? [...prev, id] : prev.filter(i => i !== id))
          }
          emptyMessage="No restaurants found"
          emptyDescription="Try adjusting your search or add a new restaurant."
        />
        {meta && (
          <div className="border-t border-gray-100 px-4">
            <Pagination
              page={meta ? page : 1}
              totalPages={meta?.totalPages || 1}
              total={meta?.total || 0}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        )}
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={confirmAction?.type === 'suspend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => statusMutation.mutate({ id: confirmAction!.id!, status: 'suspended' })}
        title="Suspend Restaurant"
        message="Are you sure you want to suspend this restaurant? Their website will become inaccessible."
        confirmLabel="Suspend"
        variant="warning"
        loading={statusMutation.isPending}
      />
      <ConfirmDialog
        open={confirmAction?.type === 'delete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => deleteMutation.mutate(confirmAction!.id!)}
        title="Delete Restaurant"
        message="This will permanently delete the restaurant and all their data. This action cannot be undone."
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={deleteMutation.isPending}
      />
      <ConfirmDialog
        open={['bulk-activate', 'bulk-suspend', 'bulk-delete'].includes(confirmAction?.type || '')}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          const action = confirmAction?.type?.replace('bulk-', '') || '';
          bulkMutation.mutate({ ids: confirmAction!.ids!, action });
        }}
        title={`Bulk ${confirmAction?.type?.replace('bulk-', '') || ''}`}
        message={`Are you sure you want to ${confirmAction?.type?.replace('bulk-', '')} ${selectedIds.length} restaurants?`}
        confirmLabel="Confirm"
        variant={confirmAction?.type === 'bulk-delete' ? 'danger' : 'warning'}
        loading={bulkMutation.isPending}
      />
    </div>
  );
}
