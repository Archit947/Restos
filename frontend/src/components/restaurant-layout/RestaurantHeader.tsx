import React from 'react';
import { useRestaurantAuthStore } from '../../store/restaurantAuthStore';

interface RestaurantHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function RestaurantHeader({ title, subtitle, actions }: RestaurantHeaderProps) {
  const restaurant = useRestaurantAuthStore((s) => s.restaurant);

  return (
    <header className="h-14 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center px-6 gap-4 z-10 shrink-0">

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-gray-400 font-medium truncate max-w-[140px]">
            {restaurant?.name || 'Restaurant'}
          </span>
          {title && (
            <>
              <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-semibold text-gray-800 truncate">{title}</span>
            </>
          )}
        </nav>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 leading-tight truncate hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 shrink-0">
        {actions && (
          <div className="flex items-center gap-2 pr-2 border-r border-gray-100">
            {actions}
          </div>
        )}

        {/* Help */}
        <button
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Help & Documentation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Restaurant avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">
              {restaurant?.name?.charAt(0).toUpperCase() || 'R'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
