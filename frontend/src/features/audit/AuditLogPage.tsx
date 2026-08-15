import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { Table, Pagination } from '@/components/common/Table';
import { Input, Select } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/utils/formatters';
import { ACTION_LABELS } from '@/utils/constants';
import type { AuditLog } from '@/types';
import { clsx } from 'clsx';

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, limit, debouncedSearch, actionFilter, statusFilter, fromDate, toDate],
    queryFn: () => api.get('/audit-logs', {
      params: {
        page, limit,
        search: debouncedSearch || undefined,
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      },
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: actions = [] } = useQuery<string[]>({
    queryKey: ['audit-actions'],
    queryFn: () => api.get('/audit-logs/meta/actions').then(r => r.data.data || []),
  });

  const logs: AuditLog[] = (data as { data?: AuditLog[] })?.data || [];
  const meta = (data as { meta?: { total: number; totalPages: number } })?.meta;

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (v: unknown) => (
        <span className="text-xs text-gray-500 whitespace-nowrap font-mono">{formatDateTime(String(v))}</span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (v: unknown) => {
        const meta = ACTION_LABELS[String(v)] || { label: String(v), icon: '📋', color: 'gray' };
        return (
          <div className="flex items-center gap-2">
            <span className="text-base">{meta.icon}</span>
            <span className="text-xs font-medium text-gray-700">{meta.label}</span>
          </div>
        );
      },
    },
    {
      key: 'entity_name',
      label: 'Entity',
      render: (_: unknown, row: AuditLog) => (
        <div>
          {row.entity_name && <p className="text-sm font-medium text-gray-800">{row.entity_name}</p>}
          {row.entity_type && <p className="text-xs text-gray-400 capitalize">{row.entity_type}</p>}
        </div>
      ),
    },
    {
      key: 'user_email',
      label: 'User',
      render: (_: unknown, row: AuditLog) => (
        <div>
          <p className="text-sm text-gray-700">{row.admin_name || row.user_email || '—'}</p>
          <p className="text-xs text-gray-400 capitalize">{row.user_type?.replace('_', ' ')}</p>
        </div>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (v: unknown) => <span className="text-xs font-mono text-gray-500">{String(v) || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (v: unknown) => (
        <Badge variant={String(v) === 'success' ? 'success' : String(v) === 'failure' ? 'danger' : 'warning'}>
          {String(v)}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Details',
      render: (v: unknown) => (
        <span className="text-xs text-gray-500 max-w-xs block truncate" title={String(v)}>
          {String(v) || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete history of all platform actions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search actions, entities, users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-52">
            <Select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              placeholder="All Actions"
              options={actions.map(a => ({ value: a, label: ACTION_LABELS[a]?.label || a }))}
            />
          </div>
          <div className="w-32">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              placeholder="All Status"
              options={[
                { value: 'success', label: 'Success' },
                { value: 'failure', label: 'Failure' },
                { value: 'warning', label: 'Warning' },
              ]}
            />
          </div>
          <div>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={logs}
          loading={isLoading}
          emptyMessage="No audit logs found"
          emptyDescription="Actions will appear here as they happen."
        />
        {meta && (
          <div className="border-t border-gray-100 px-4">
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
