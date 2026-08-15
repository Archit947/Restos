import React from 'react';
import { clsx } from 'clsx';
import type { RestaurantStatus } from '@/types';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'gray' | 'purple' | 'blue';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  danger:  'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  info:    'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  gray:    'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20',
  purple:  'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  blue:    'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20',
};

const DOT_VARIANTS: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  danger:  'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
  gray:    'bg-gray-400',
  purple:  'bg-purple-500',
  blue:    'bg-sky-500',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export function Badge({ children, variant = 'gray', size = 'sm', dot = false, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      VARIANTS[variant],
      SIZES[size],
      className
    )}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', DOT_VARIANTS[variant])} />}
      {children}
    </span>
  );
}

// Convenience component for restaurant status
export function StatusBadge({ status }: { status: RestaurantStatus }) {
  const map: Record<RestaurantStatus, { label: string; variant: BadgeVariant }> = {
    active:    { label: 'Active',    variant: 'success' },
    inactive:  { label: 'Inactive',  variant: 'gray' },
    trial:     { label: 'Trial',     variant: 'blue' },
    expired:   { label: 'Expired',   variant: 'danger' },
    suspended: { label: 'Suspended', variant: 'warning' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'gray' };
  return <Badge variant={variant} dot>{label}</Badge>;
}

// Website status badge
export function WebsiteStatusBadge({ status, enabled }: { status: string | null; enabled: boolean }) {
  if (!enabled) return <Badge variant="gray">Disabled</Badge>;
  if (status === 'published') return <Badge variant="success" dot>Published</Badge>;
  if (status === 'unpublished') return <Badge variant="gray">Unpublished</Badge>;
  return <Badge variant="warning">Draft</Badge>;
}
