import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, padding = 'md', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-gray-100 shadow-card',
        PADDING[padding],
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({ title, value, icon, change, changeType = 'neutral', color = 'brand', loading = false, onClick }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    brand:  { bg: 'bg-brand-50', text: 'text-brand-600', iconBg: 'bg-brand-100' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    blue:   { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', iconBg: 'bg-orange-100' },
    gray:   { bg: 'bg-gray-50', text: 'text-gray-600', iconBg: 'bg-gray-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
    cyan:   { bg: 'bg-cyan-50', text: 'text-cyan-600', iconBg: 'bg-cyan-100' },
  };

  const { text, iconBg } = colorMap[color] || colorMap.brand;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-100 rounded w-28" />
          <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-8 bg-gray-100 rounded w-20" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-gray-100 shadow-card p-6',
        'transition-all duration-200',
        onClick && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBg, text)}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
        {change && (
          <span className={clsx(
            'text-xs font-medium mb-0.5',
            changeType === 'increase' && 'text-emerald-600',
            changeType === 'decrease' && 'text-red-500',
            changeType === 'neutral' && 'text-gray-500'
          )}>
            {changeType === 'increase' ? '↑' : changeType === 'decrease' ? '↓' : ''} {change}
          </span>
        )}
      </div>
    </div>
  );
}

// Section Header
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Empty State
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 text-gray-300">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
