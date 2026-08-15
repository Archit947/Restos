import React from 'react';
import { clsx } from 'clsx';
import { formatRelative } from '@/utils/formatters';
import { ACTION_LABELS } from '@/utils/constants';
import type { ActivityItem } from '@/types';

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3.5 bg-gray-100 rounded w-4/5" />
              <div className="h-3 bg-gray-100 rounded w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((item) => {
        const actionMeta = ACTION_LABELS[item.action] || { label: item.action, icon: '📋', color: 'gray' };
        return (
          <div key={item.id} className="flex items-start gap-3 py-2.5 rounded-xl hover:bg-gray-50 px-2 -mx-2 transition-colors">
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5',
              item.status === 'failure' ? 'bg-red-50' : item.status === 'warning' ? 'bg-amber-50' : 'bg-gray-50'
            )}>
              {actionMeta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">
                <span className="font-medium">{item.user_name || item.user_email || 'System'}</span>
                {' '}
                <span className="text-gray-500">{actionMeta.label.toLowerCase()}</span>
                {item.entity_name && (
                  <> — <span className="font-medium text-gray-700">{item.entity_name}</span></>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatRelative(item.created_at)}</p>
            </div>
            {item.status !== 'success' && (
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0',
                item.status === 'failure' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              )}>
                {item.status}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
