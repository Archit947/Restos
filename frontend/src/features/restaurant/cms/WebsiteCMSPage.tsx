import React, { useState } from 'react';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';
import InfoHoursTab from './tabs/InfoHoursTab';
import MenuSettingsTab from './tabs/MenuSettingsTab';
import SEOTab from './tabs/SEOTab';
import BlogTab from './tabs/BlogTab';
import ReservationsTab from './tabs/ReservationsTab';
import EventsTab from './tabs/EventsTab';

const TABS = [
  { id: 'info',         label: 'Structured Info & Hours', icon: '🏪' },
  { id: 'menu',         label: 'Menu',                    icon: '🍽' },
  { id: 'seo',          label: 'SEO & Search Meta',       icon: '🔍' },
  { id: 'blog',         label: 'Blog & Articles',         icon: '📝' },
  { id: 'reservations', label: 'Table Reservations',      icon: '📅' },
  { id: 'events',       label: 'Event Ticketing',         icon: '🎉' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function WebsiteCMSPage() {
  const [active, setActive] = useState<TabId>('info');

  return (
    <div className="flex flex-col h-full">
      <RestaurantHeader title="Website CMS" subtitle="Manage your public-facing website content" />

      {/* Sub-tab bar */}
      <div className="bg-white border-b border-gray-100 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                active === t.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {active === 'info'         && <InfoHoursTab />}
        {active === 'menu'         && <MenuSettingsTab />}
        {active === 'seo'          && <SEOTab />}
        {active === 'blog'         && <BlogTab />}
        {active === 'reservations' && <ReservationsTab />}
        {active === 'events'       && <EventsTab />}
      </div>
    </div>
  );
}
