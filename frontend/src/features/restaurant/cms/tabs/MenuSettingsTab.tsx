import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rCmsApi } from '../../../../api/restaurantAdmin';

export default function MenuSettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['r-cms-website'],
    queryFn: () => rCmsApi.getWebsite().then((r) => r.data.data),
  });

  const [form, setForm] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: () => rCmsApi.updateWebsite(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['r-cms-website'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <section>
        <h3 className="font-semibold text-gray-800 mb-4">Website Branding</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: 'site_title', label: 'Site Title' },
            { k: 'site_subtitle', label: 'Site Subtitle / Tagline' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input value={form[k] || ''} onChange={(e) => set(k, e.target.value)} className="w-full input" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color || '#16a34a'} onChange={(e) => set('primary_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
              <input value={form.primary_color || ''} onChange={(e) => set('primary_color', e.target.value)} className="input flex-1" placeholder="#16a34a" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.secondary_color || '#f97316'} onChange={(e) => set('secondary_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
              <input value={form.secondary_color || ''} onChange={(e) => set('secondary_color', e.target.value)} className="input flex-1" placeholder="#f97316" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
            <select value={form.font_family || 'Inter'} onChange={(e) => set('font_family', e.target.value)} className="w-full input">
              {['Inter', 'Poppins', 'Roboto', 'Lato', 'Playfair Display', 'Merriweather'].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" checked={Boolean(form.show_menu_on_website)} onChange={(e) => set('show_menu_on_website', e.target.checked)} className="accent-emerald-600" />
              <span className="text-sm text-gray-700">Show Menu on Website</span>
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60"
        >
          {save.isPending ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">✓ Saved</span>}
      </div>
    </div>
  );
}
