import React from 'react';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <RestaurantHeader title="Sales Analytics" subtitle="Revenue, orders, and growth insights" />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4 text-3xl">📊</div>
          <h2 className="text-xl font-bold text-gray-800">Sales Analytics</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xs">Analytics and reporting features are coming soon.</p>
        </div>
      </div>
    </div>
  );
}
