import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const Icon = ({ d, solid = false }: { d: string | string[]; solid?: boolean }) => (
  <svg className="w-5 h-5" fill={solid ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke={solid ? undefined : 'currentColor'} strokeWidth={1.8}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={path} />) : <path strokeLinecap="round" strokeLinejoin="round" d={d} />}
  </svg>
);

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      },
    ],
  },
  {
    label: 'Manage',
    items: [
      {
        path: '/restaurants',
        label: 'Restaurants',
        icon: <Icon d={['M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4']} />,
      },
      {
        path: '/websites',
        label: 'Websites',
        icon: <Icon d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
      {
        path: '/templates',
        label: 'Templates',
        icon: <Icon d={['M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z']} />,
      },
      {
        path: '/affiliate-ads',
        label: 'Affiliate Ads',
        icon: <Icon d={['M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z']} />,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        path: '/audit-logs',
        label: 'Audit Logs',
        icon: <Icon d={['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01']} />,
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: <Icon d={['M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z']} />,
      },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
    }
  };

  return (
    <aside className={clsx(
      'flex flex-col h-full bg-sidebar-DEFAULT text-black transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* ── Logo ───────────────────────────────────────────────────── */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-white/5',
        collapsed && 'justify-center'
      )}>
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-sm font-black tracking-tight">R</span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-black font-bold text-base leading-tight tracking-tight">Restos</p>
            <p className="text-black/40 text-[11px] font-medium">Super Admin</p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-black/30 hover:text-black hover:bg-black/10 transition-colors"
            title="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="mt-1 p-1 rounded-lg text-black/30 hover:text-black hover:bg-black/10 transition-colors"
            title="Expand sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-none">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.label} className={sIdx > 0 ? 'mt-3 pt-3 border-t border-white/5' : ''}>
            {!collapsed ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 px-3 mb-1.5">
                {section.label}
              </p>
            ) : (
              sIdx > 0 && <div className="mb-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    collapsed && 'justify-center',
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-black hover:text-black hover:bg-black/5'
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="ml-auto bg-brand-500/80 text-black text-xs px-1.5 py-0.5 rounded-full font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Footer ────────────────────────────────────────────── */}
      <div className="border-t border-white/5 p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-black truncate leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-xs text-black/50 truncate">
                {user?.role?.replace(/_/g, ' ') || 'Super Admin'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
