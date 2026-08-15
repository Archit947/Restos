import React from 'react';
import { clsx } from 'clsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onSort?: (key: string, direction: 'ASC' | 'DESC') => void;
  sortKey?: string;
  sortOrder?: 'ASC' | 'DESC';
  selectable?: boolean;
  selectedIds?: number[];
  onSelectAll?: (selected: boolean) => void;
  onSelectRow?: (id: number, selected: boolean) => void;
  rowKey?: (row: T) => number;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Table<T = any>({
  columns, data, keyField = 'id', loading = false, emptyMessage = 'No data found',
  emptyDescription, onSort, sortKey, sortOrder, selectable, selectedIds = [], onSelectAll, onSelectRow, rowKey,
}: TableProps<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asRecord = (row: T) => row as Record<string, unknown>;
  const allSelected = data.length > 0 && data.every((row) => selectedIds.includes(Number(asRecord(row)[keyField])));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newOrder = sortKey === key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onSort(key, newOrder);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="rounded border-gray-300 text-brand-600"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={clsx(
                  'px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  !col.align && 'text-left',
                  col.sortable && 'cursor-pointer hover:text-gray-700 select-none'
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="text-gray-300">
                      {sortKey === col.key ? (sortOrder === 'ASC' ? '↑' : '↓') : '↕'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length + (selectable ? 1 : 0)} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
                  {emptyDescription && <p className="text-xs text-gray-400">{emptyDescription}</p>}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const rec = asRecord(row);
              const id = rowKey ? rowKey(row) : Number(rec[keyField]);
              const isSelected = selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  className={clsx(
                    'hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-brand-50'
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectRow?.(id, e.target.checked)}
                        className="rounded border-gray-300 text-brand-600"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4 py-3 text-sm text-gray-700',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                      )}
                    >
                      {col.render
                        ? col.render(rec[col.key], row, index)
                        : (rec[col.key] as React.ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (i === 0) return 1;
    if (i === 6) return totalPages;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span> of{' '}
          <span className="font-medium">{total}</span>
        </p>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {[10, 20, 50, 100].map((l) => (
              <option key={l} value={l}>{l} / page</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {pages.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && pages[i] - pages[i - 1] > 1 && (
              <span className="px-2 text-gray-400">…</span>
            )}
            <button
              onClick={() => onPageChange(p)}
              className={clsx(
                'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {p}
            </button>
          </React.Fragment>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
