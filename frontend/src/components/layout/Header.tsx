import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import { formatRelative } from '@/utils/formatters';
import type { Notification } from '@/types';

const BREADCRUMBS: Record<string, { label: string; icon?: string }> = {
  '/dashboard':       { label: 'Dashboard',       icon: '🏠' },
  '/restaurants':     { label: 'Restaurants',     icon: '🍽️' },
  '/restaurants/new': { label: 'Create Restaurant', icon: '➕' },
  '/websites':        { label: 'Websites',         icon: '🌐' },
  '/templates':       { label: 'Templates',        icon: '🎨' },
  '/audit-logs':      { label: 'Audit Logs',       icon: '📋' },
  '/settings':        { label: 'Settings',         icon: '⚙️' },
  '/notifications':   { label: 'Notifications',    icon: '🔔' },
};

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const page = BREADCRUMBS[location.pathname] || { label: 'Admin Panel' };

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data?.data?.count || 0;
    },
    refetchInterval: 60_000,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications-preview'],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { limit: 5, unread_only: true } });
      return res.data?.data || [];
    },
    enabled: showNotifications,
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('#notification-menu')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center px-6 gap-4 z-10">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex-1">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 font-medium">Restos</span>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-semibold text-gray-800">{page.label}</span>
        </nav>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">

        {/* Notification bell */}
        <div id="notification-menu" className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={clsx(
              'relative p-2 rounded-xl transition-colors',
              showNotifications ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <Link
                  to="/notifications"
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  onClick={() => setShowNotifications(false)}
                >
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="text-2xl mb-2">🔔</div>
                    <p className="text-sm text-gray-500 font-medium">You're all caught up!</p>
                    <p className="text-xs text-gray-400 mt-0.5">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={clsx(
                      'px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer',
                      !n.is_read && 'bg-blue-50/40 hover:bg-blue-50/60'
                    )}>
                      {!n.is_read && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 mb-0.5 align-middle" />
                      )}
                      <p className="text-sm font-semibold text-gray-800 inline">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelative(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Help & Documentation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
