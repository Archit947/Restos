import React from 'react';
import { clsx } from 'clsx';

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

const COLOR_MAP: Record<string, {
  iconBg: string;
  cardFrom: string;
}> = {
  brand:  { iconBg: 'bg-brand-600',   cardFrom: 'from-rose-50' },
  green:  { iconBg: 'bg-emerald-500', cardFrom: 'from-emerald-50' },
  blue:   { iconBg: 'bg-blue-500',    cardFrom: 'from-blue-50' },
  purple: { iconBg: 'bg-purple-500',  cardFrom: 'from-purple-50' },
  orange: { iconBg: 'bg-orange-500',  cardFrom: 'from-orange-50' },
  gray:   { iconBg: 'bg-slate-500',   cardFrom: 'from-slate-50' },
  yellow: { iconBg: 'bg-amber-500',   cardFrom: 'from-amber-50' },
  cyan:   { iconBg: 'bg-cyan-500',    cardFrom: 'from-cyan-50' },
};

export function StatCard({
  title, value, icon, change, changeType = 'neutral',
  color = 'brand', loading = false, onClick,
}: StatCardProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.brand;

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
      className={clsx(
        'bg-gradient-to-b', colors.cardFrom, 'to-white',
        'rounded-2xl border border-gray-100 shadow-card p-5',
        'transition-all duration-200',
        onClick && 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer'
      )}
    >
      {/* Title + Icon row */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
          {title}
        </p>
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-white shrink-0',
          colors.iconBg
        )}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <p className="text-3xl font-extrabold text-gray-900 leading-none tracking-tight">
        {value}
      </p>

      {/* Trend badge */}
      {change && (
        <div className="mt-2.5">
          <span className={clsx(
            'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
            changeType === 'increase' && 'bg-emerald-50 text-emerald-700',
            changeType === 'decrease' && 'bg-red-50 text-red-600',
            changeType === 'neutral'  && 'bg-gray-100 text-gray-500',
          )}>
            {changeType === 'increase' && '↑ '}
            {changeType === 'decrease' && '↓ '}
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
