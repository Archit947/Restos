import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/common/Input';
import { restaurantsApi } from '@/api/restaurants.api';
import { useDebounce } from '@/hooks/useDebounce';
import { PLATFORM_DOMAIN } from '@/utils/constants';
import { clsx } from 'clsx';
import type { WizardFormData } from './index';
import { THEMES } from '@/features/site/themes';

interface Step3Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
}

function generateSubdomainFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63);
}

export function Step3Website({ data, onChange }: Step3Props) {
  const [subdomainInput, setSubdomainInput] = useState(data.subdomain || generateSubdomainFromName(data.restaurant_name));
  const debouncedSubdomain = useDebounce(subdomainInput, 600);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!data.subdomain && data.restaurant_name) {
      const auto = generateSubdomainFromName(data.restaurant_name);
      setSubdomainInput(auto);
      onChange({ subdomain: auto });
    }
  }, []);

  const { data: subdomainCheck, isLoading: checkingSubdomain } = useQuery({
    queryKey: ['subdomain-check', debouncedSubdomain],
    queryFn: () => restaurantsApi.checkSubdomain(debouncedSubdomain).then(r => r.data.data),
    enabled: debouncedSubdomain.length >= 3,
  });

  const handleSubdomainChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '').substring(0, 63);
    setSubdomainInput(clean);
    onChange({ subdomain: clean });
  };

  const handleHeroChange = (file: File | null) => {
    onChange({ cover_image: file });
    if (file) {
      const url = URL.createObjectURL(file);
      setHeroPreview(url);
    } else {
      setHeroPreview(null);
    }
  };

  const isAvailable = subdomainCheck?.available;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Website Title"
          required
          placeholder="Biriyani House"
          value={data.website_title}
          onChange={(e) => onChange({ website_title: e.target.value })}
          hint="Displayed as the main heading on the website"
        />
        <Input
          label="Website Subtitle"
          placeholder="Authentic Hyderabadi Cuisine"
          value={data.website_subtitle}
          onChange={(e) => onChange({ website_subtitle: e.target.value })}
          hint="Shown below the title on the homepage"
        />
      </div>

      {/* Subdomain */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Restaurant Subdomain <span className="text-red-500">*</span>
        </label>
        <div className="flex items-stretch gap-0">
          <input
            type="text"
            value={subdomainInput}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            placeholder="biriyanihouse"
            className={clsx(
              'flex-1 px-3 py-2 rounded-l-xl border text-sm text-gray-900 bg-white',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors',
              isAvailable === false ? 'border-red-300' :
              isAvailable === true ? 'border-emerald-300' :
              'border-gray-300'
            )}
          />
          <span className="px-4 py-2 bg-gray-50 border border-l-0 border-gray-300 text-gray-500 text-sm rounded-r-xl whitespace-nowrap">
            .{PLATFORM_DOMAIN}
          </span>
        </div>
        <div className="flex items-center gap-2 h-5">
          {checkingSubdomain && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Checking availability...
            </div>
          )}
          {!checkingSubdomain && isAvailable === true && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
              ✓ Available — <strong className="font-semibold">{subdomainInput}.{PLATFORM_DOMAIN}</strong>
            </p>
          )}
          {!checkingSubdomain && isAvailable === false && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" /></svg>
              {subdomainCheck?.reason || 'Subdomain is not available.'}
            </p>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Only lowercase letters, numbers, and hyphens. No spaces. Min 3 characters.
        </p>
      </div>

      {/* Preview */}
      {isAvailable && subdomainInput && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-emerald-800 mb-2">🌐 Website Preview</p>
          <div className="bg-white rounded-lg border border-emerald-100 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-gray-50 rounded px-2 py-0.5 text-xs text-gray-500 font-mono">
                https://{subdomainInput}.{PLATFORM_DOMAIN}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-gray-900">{data.website_title || data.restaurant_name}</p>
              <p className="text-xs text-gray-500">{data.website_subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero / Cover Image Upload ── */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Hero / Cover Image
          <span className="ml-1.5 text-xs font-normal text-gray-400">(optional — used as homepage background)</span>
        </label>

        {heroPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 160 }}>
            <img src={heroPreview} alt="Hero preview" className="w-full h-full object-cover" />
            {/* Dark overlay with filename */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
              <p className="text-white text-xs font-medium truncate">{data.cover_image?.name}</p>
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleHeroChange(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Replace button */}
            <button
              type="button"
              onClick={() => heroInputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-white/90 hover:bg-white transition-colors text-xs font-medium text-gray-700 shadow-sm"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => heroInputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/30 transition-all duration-150 flex flex-col items-center justify-center gap-2.5 py-9 group"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-100 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 group-hover:text-brand-600 transition-colors">
                Click to upload hero image
              </p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP · max 10 MB · recommended 1920 × 1080</p>
            </div>
          </button>
        )}

        <input
          ref={heroInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleHeroChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* ── Template Picker ── */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Website Template <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500">Choose the visual style for your restaurant's public website.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map(theme => {
            const selected = (data.template_slug || 'bloom') === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onChange({ template_slug: theme.id })}
                className={clsx(
                  'relative rounded-xl border-2 p-3 text-left transition-all duration-150 focus:outline-none',
                  selected ? 'border-brand-500 ring-2 ring-brand-100 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div
                  className="rounded-lg h-24 w-full mb-3 overflow-hidden relative"
                  style={{ backgroundColor: theme.preview.bg }}
                >
                  <div style={{ height: 18, backgroundColor: theme.preview.bg, borderBottom: `1px solid ${theme.preview.accent}22`, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 4 }}>
                    <span style={{ width: 24, height: 5, borderRadius: 2, backgroundColor: theme.preview.accent, opacity: 0.9 }} />
                    <span style={{ width: 16, height: 5, borderRadius: 2, backgroundColor: theme.preview.text, opacity: 0.25 }} />
                    <span style={{ width: 16, height: 5, borderRadius: 2, backgroundColor: theme.preview.text, opacity: 0.25 }} />
                    <span style={{ marginLeft: 'auto', marginRight: 8, width: 22, height: 8, borderRadius: 3, backgroundColor: theme.preview.accent }} />
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ width: '60%', height: 6, borderRadius: 3, backgroundColor: theme.preview.text, opacity: 0.8, marginBottom: 4 }} />
                    <div style={{ width: '40%', height: 4, borderRadius: 2, backgroundColor: theme.preview.text, opacity: 0.4, marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ width: 40, height: 14, borderRadius: 3, backgroundColor: theme.preview.accent }} />
                      <span style={{ width: 32, height: 14, borderRadius: 3, backgroundColor: theme.preview.text, opacity: 0.12 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, padding: '0 10px' }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 18, borderRadius: 3, backgroundColor: theme.preview.text, opacity: 0.07 }} />
                    ))}
                  </div>
                  {selected && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{theme.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{theme.name}</p>
                    <p className="text-xs text-gray-400">{theme.tagline}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {isAvailable && subdomainInput && (
          <p className="text-xs text-emerald-600">
            Preview available at{' '}
            <a href={`/s/${subdomainInput}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">
              /s/{subdomainInput}
            </a>{' '}
            after creation.
          </p>
        )}
      </div>
    </div>
  );
}
