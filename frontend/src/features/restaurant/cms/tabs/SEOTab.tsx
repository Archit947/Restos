import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rCmsApi } from '../../../../api/restaurantAdmin';

export default function SEOTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['r-cms-info'],
    queryFn: () => rCmsApi.getInfo().then((r) => r.data.data),
  });

  const [form, setForm] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data?.info) setForm(data.info); }, [data]);

  const save = useMutation({
    mutationFn: () => rCmsApi.updateSeo(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['r-cms-info'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <section>
        <h3 className="font-semibold text-gray-800 mb-4">Search Engine Optimisation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <input value={form.meta_title || ''} onChange={(e) => set('meta_title', e.target.value)} className="w-full input" placeholder="Page title for Google (~60 chars)" />
            <p className="text-xs text-gray-400 mt-1">{(form.meta_title || '').length}/60 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <textarea
              value={form.meta_description || ''}
              onChange={(e) => set('meta_description', e.target.value)}
              rows={3}
              className="w-full input resize-none"
              placeholder="Brief description for search results (~160 chars)"
            />
            <p className="text-xs text-gray-400 mt-1">{(form.meta_description || '').length}/160 characters</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-4">Analytics & Tracking</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
            <input value={form.google_analytics_id || ''} onChange={(e) => set('google_analytics_id', e.target.value)} className="w-full input" placeholder="G-XXXXXXXXXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Pixel ID</label>
            <input value={form.facebook_pixel_id || ''} onChange={(e) => set('facebook_pixel_id', e.target.value)} className="w-full input" placeholder="1234567890" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-gray-800 mb-4">Custom CSS</h3>
        <textarea
          value={form.custom_css || ''}
          onChange={(e) => set('custom_css', e.target.value)}
          rows={6}
          className="w-full font-mono text-sm input resize-y"
          placeholder="/* Custom CSS for your website */"
        />
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
