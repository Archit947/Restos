import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import RestaurantSidebar from './RestaurantSidebar';
import { useRestaurantAuthStore } from '../../store/restaurantAuthStore';

export default function RestaurantLayout() {
  const isAuthenticated = useRestaurantAuthStore((s) => s.isAuthenticated);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/restaurant/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#f7f8fa] overflow-hidden">

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
        'flex-shrink-0 transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <RestaurantSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
