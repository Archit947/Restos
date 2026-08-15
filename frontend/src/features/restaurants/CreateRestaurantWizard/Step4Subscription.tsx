import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings.api';
import { Select, Input, Toggle } from '@/components/common/Input';
import { clsx } from 'clsx';
import type { SubscriptionPlan } from '@/types';
import type { WizardFormData } from './index';

interface Step4Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
}

export function Step4Subscription({ data, onChange }: Step4Props) {
  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['plans'],
    queryFn: () => settingsApi.getPlans().then(r => r.data.data || []),
  });

  const selectedPlan = plans.find(p => String(p.id) === String(data.plan_id));

  return (
    <div className="space-y-5">
      {/* Plan Selection */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Subscription Plan <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => onChange({ plan_id: String(plan.id), trial_days: plan.trial_days })}
                className={clsx(
                  'border-2 rounded-xl p-4 cursor-pointer transition-all',
                  String(data.plan_id) === String(plan.id)
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900">{plan.name}</p>
                  {String(data.plan_id) === String(plan.id) && (
                    <span className="w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-brand-700">₹{plan.price_monthly}<span className="text-xs font-normal text-gray-500">/mo</span></p>
                <p className="text-xs text-gray-500 mt-1">{plan.storage_limit_mb >= 1024 ? `${plan.storage_limit_mb / 1024}GB` : `${plan.storage_limit_mb}MB`} storage</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Plan Features (show if plan selected) */}
      {selectedPlan && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Included in {selectedPlan.name}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['Website', selectedPlan.website_enabled],
              ['CMS', selectedPlan.cms_enabled],
              ['Blog', selectedPlan.blog_enabled],
              ['Reservations', selectedPlan.reservation_enabled],
              ['Events', selectedPlan.event_enabled],
              ['Affiliate', selectedPlan.affiliate_enabled],
              ['Marketing', selectedPlan.marketing_enabled],
              ['Custom Domain', selectedPlan.custom_domain],
            ].map(([label, enabled]) => (
              <div key={String(label)} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={clsx('w-3 h-3 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0', enabled ? 'bg-emerald-500' : 'bg-gray-300')}>
                  {enabled ? '✓' : '✗'}
                </span>
                {String(label)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trial & Status */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Trial Days"
          type="number"
          min={0}
          max={90}
          value={data.trial_days}
          onChange={(e) => onChange({ trial_days: parseInt(e.target.value) })}
        />
        <Select
          label="Initial Status"
          value={data.status}
          onChange={(e) => onChange({ status: e.target.value })}
          options={[
            { value: 'trial', label: 'Trial' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {/* Feature Overrides */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Feature Access</p>
        <div className="space-y-3">
          <Toggle label="Website" description="Allow restaurant to have a public website" checked={data.website_enabled} onChange={(v) => onChange({ website_enabled: v })} />
          <Toggle label="CMS" description="Content management for website pages" checked={data.cms_enabled} onChange={(v) => onChange({ cms_enabled: v })} />
          <Toggle label="Blog" description="Blog/article publishing feature" checked={data.blog_enabled} onChange={(v) => onChange({ blog_enabled: v })} />
          <Toggle label="Reservations" description="Online table reservation system" checked={data.reservation_enabled} onChange={(v) => onChange({ reservation_enabled: v })} />
          <Toggle label="Events" description="Create and manage events" checked={data.event_enabled} onChange={(v) => onChange({ event_enabled: v })} />
          <Toggle label="Affiliate Products" description="Affiliate product listings" checked={data.affiliate_enabled} onChange={(v) => onChange({ affiliate_enabled: v })} />
          <Toggle label="Marketing Banners" description="Promotional banner management" checked={data.marketing_enabled} onChange={(v) => onChange({ marketing_enabled: v })} />
        </div>
      </div>

      {/* Store Portal */}
      <div className="border-t border-gray-200 pt-5">
        <p className="text-sm font-medium text-gray-700 mb-3">🏪 Affiliated Store</p>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <Toggle
            label="Enable Store Portal"
            description="Create an affiliated store admin login — the store's products will appear on the restaurant's public website"
            checked={data.has_store}
            onChange={(v) => onChange({ has_store: v })}
          />
          {data.has_store && (
            <div className="mt-3 flex items-start gap-2 text-xs text-purple-700 bg-white border border-purple-200 rounded-lg px-3 py-2">
              <span className="mt-0.5">ℹ️</span>
              <span>A store admin login will be created automatically. Credentials will be shown in the next step.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
