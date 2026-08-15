import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useRestaurantAuthStore } from '../../store/restaurantAuthStore';
import { rAuthApi } from '../../api/restaurantAdmin';

interface NavItem  { path: string; label: string; icon: React.ReactNode; }
interface NavSection { label: string; items: NavItem[]; }

const Icon = ({ d }: { d: string | string[] }) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)
      : <path strokeLinecap="round" strokeLinejoin="round" d={d} />}
  </svg>
);

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      {
        path: '/restaurant/dashboard',
        label: 'Dashboard',
        icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        path: '/restaurant/orders',
        label: 'Orders',
        icon: <Icon d={[
          'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
          'M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        ]} />,
      },
      {
        path: '/restaurant/tables',
        label: 'Table Portal',
        icon: <Icon d={['M3 10h18M3 14h18', 'M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z']} />,
      },
      {
        path: '/restaurant/menu',
        label: 'Menu Catalog',
        icon: <Icon d={['M4 6h16M4 10h16M4 14h8']} />,
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        path: '/restaurant/cms',
        label: 'Website CMS',
        icon: <Icon d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />,
      },
    ],
  },
  {
    label: 'Commerce',
    items: [
      {
        path: '/restaurant/pos',
        label: 'POS Inventory',
        icon: <Icon d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />,
      },
      {
        path: '/restaurant/invoicing',
        label: 'Invoicing & POS',
        icon: <Icon d={[
          'M9 14l6-6m-5.5.5h.01m4.99 5h.01',
          'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
        ]} />,
      },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        path: '/restaurant/customers',
        label: 'Customers & CRM',
        icon: <Icon d={[
          'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
          'M23 21v-2a4 4 0 00-3-3.87',
          'M16 3.13a4 4 0 010 7.75',
          'M9 7a4 4 0 110 8 4 4 0 010-8z',
        ]} />,
      },
      {
        path: '/restaurant/analytics',
        label: 'Sales Analytics',
        icon: <Icon d="M18 20V10M12 20V4M6 20v-6" />,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        path: '/restaurant/settings',
        label: 'Settings',
        icon: <Icon d={[
          'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
          'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        ]} />,
      },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function RestaurantSidebar({ collapsed = false, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { restaurant, logout } = useRestaurantAuthStore();

  const handleLogout = async () => {
    try { await rAuthApi.logout(); } catch { /* ok */ }
    logout();
    navigate('/restaurant/login', { replace: true });
  };

  return (
    <aside className={clsx(
      'flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>

      {/* ── Brand ── */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-5 border-b border-gray-100',
        collapsed && 'justify-center'
      )}>
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white text-sm font-black tracking-tight">
            {restaurant?.name?.charAt(0).toUpperCase() || 'R'}
          </span>
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 font-bold text-base leading-tight tracking-tight truncate">
              {restaurant?.name || 'Restaurant'}
            </p>
            <p className="text-gray-400 text-[11px] font-medium truncate">
              {restaurant?.cuisineType || 'Admin Panel'}
            </p>
          </div>
        )}

        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
            className="mt-1 p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Expand sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-none">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.label} className={sIdx > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
            {!collapsed ? (
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1.5">
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
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div className="border-t border-gray-100 p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group cursor-default">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-xs font-bold">
                {restaurant?.name?.charAt(0).toUpperCase() || 'R'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {restaurant?.name || 'Restaurant'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {restaurant?.username || 'admin'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
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
