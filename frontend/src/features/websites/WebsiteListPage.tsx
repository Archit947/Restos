import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/api/axios';
import { Table, Pagination } from '@/components/common/Table';
import { Input, Select } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/utils/formatters';
import { clsx } from 'clsx';

export function WebsiteListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['websites', page, limit, debouncedSearch, statusFilter],
    queryFn: () => api.get('/websites', {
      params: { page, limit, search: debouncedSearch || undefined, status: statusFilter || undefined },
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => api.post(`/websites/${id}/publish`),
    onSuccess: () => { toast.success('Website published!'); queryClient.invalidateQueries({ queryKey: ['websites'] }); },
    onError: () => toast.error('Publish failed.'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/websites/${id}/toggle`),
    onSuccess: (res) => {
      const enabled = (res.data as { data?: { is_enabled?: boolean } })?.data?.is_enabled;
      toast.success(`Website ${enabled ? 'enabled' : 'disabled'}.`);
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    },
    onError: () => toast.error('Toggle failed.'),
  });

  const websites: Record<string, unknown>[] = (data as { data?: Record<string, unknown>[] })?.data || [];
  const meta = (data as { meta?: { total: number; totalPages: number } })?.meta;

  const columns = [
    {
      key: 'restaurant_name',
      label: 'Restaurant',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{String(row.restaurant_name)}</p>
          <p className="text-xs text-gray-400">{String(row.full_domain || '')}</p>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Website Title',
      render: (v: unknown) => <span className="text-sm text-gray-700">{String(v) || '—'}</span>,
    },
    {
      key: 'template_name',
      label: 'Template',
      render: (v: unknown) => (
        <Badge variant="purple">{String(v) || 'No Template'}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v: unknown) => (
        <Badge variant={v === 'published' ? 'success' : v === 'draft' ? 'warning' : 'gray'} dot>
          {String(v)}
        </Badge>
      ),
    },
    {
      key: 'is_enabled',
      label: 'Enabled',
      render: (v: unknown) => (
        <span className={clsx('text-xs font-medium', v ? 'text-emerald-600' : 'text-gray-400')}>
          {v ? '● Online' : '○ Offline'}
        </span>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      render: (v: unknown) => <span className="text-xs text-gray-400">{formatDate(String(v))}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center justify-end gap-2">
          {row.status !== 'published' && (
            <Button size="xs" variant="success"
              onClick={() => publishMutation.mutate(Number(row.id))}
              loading={publishMutation.isPending}>
              Publish
            </Button>
          )}
          <Button size="xs" variant="secondary"
            onClick={() => toggleMutation.mutate(Number(row.id))}
            loading={toggleMutation.isPending}>
            {row.is_enabled ? 'Disable' : 'Enable'}
          </Button>
          {String(row.full_domain || '') && (
            <a href={String(row.full_domain).startsWith('http') ? String(row.full_domain) : `https://${String(row.full_domain)}`} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Websites</h1>
        <p className="text-sm text-gray-500 mt-0.5">{meta?.total || 0} restaurant websites</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder="Search websites..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          </div>
          <div className="w-36">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              placeholder="All Status"
              options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'unpublished', label: 'Unpublished' }]}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={websites}
          loading={isLoading}
          emptyMessage="No websites found"
        />
        {meta && (
          <div className="border-t border-gray-100 px-4">
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={limit} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
          </div>
        )}
      </div>
    </div>
  );
}
