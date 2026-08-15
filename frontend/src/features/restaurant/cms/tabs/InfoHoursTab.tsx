import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rCmsApi } from '../../../../api/restaurantAdmin';
import { imageUrl } from '../../../../utils/imageUrl';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Branding image upload tile ───────────────────────────────────────────────
function BrandingUploadTile({
  label, hint, fieldName, currentUrl, onUploaded,
}: {
  label: string; hint: string; fieldName: string;
  currentUrl?: string | null; onUploaded: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append(fieldName, file);
      const res = await rCmsApi.updateBranding(fd);
      const url = res.data.data?.[fieldName];
      if (url) onUploaded(url);
    } catch {
      alert('Image upload failed. Please try again.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || imageUrl(currentUrl);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        className="relative group border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:border-emerald-400 transition-colors cursor-pointer"
        style={{ height: fieldName === 'cover_image' ? 160 : 110 }}
        onClick={() => fileRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-xs">{hint}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">
            {uploading ? 'Uploading…' : displayUrl ? 'Change Image' : 'Upload Image'}
          </span>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">JPEG, PNG or WebP · max 10 MB</p>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function InfoHoursTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['r-cms-info'],
    queryFn: () => rCmsApi.getInfo().then((r) => r.data.data),
  });

  const [info, setInfo] = useState<any>({});
  const [hours, setHours] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [brandingUrls, setBrandingUrls] = useState<{ logo?: string; cover_image?: string }>({});

  useEffect(() => {
    if (!data) return;
    setInfo(data.info || {});
    setBrandingUrls({ logo: data.info?.logo, cover_image: data.info?.cover_image });
    // Build a full 7-day array
    const existing: any[] = data.hours || [];
    setHours(
      Array.from({ length: 7 }, (_, i) => {
        const found = existing.find((h: any) => h.day_of_week === i);
        return found || { day_of_week: i, is_open: false, open_time: '09:00', close_time: '22:00' };
      })
    );
  }, [data]);

  const save = useMutation({
    mutationFn: () => rCmsApi.updateInfo({ ...info, hours }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['r-cms-info'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const setH = (idx: number, key: string, val: any) =>
    setHours((prev) => prev.map((h, i) => (i === idx ? { ...h, [key]: val } : h)));

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Basic Info */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-4">Restaurant Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { k: 'restaurant_name', label: 'Restaurant Name' },
            { k: 'tagline', label: 'Tagline' },
            { k: 'phone', label: 'Phone' },
            { k: 'email', label: 'Email' },
            { k: 'website_url', label: 'Website URL' },
            { k: 'cuisine_type', label: 'Cuisine Type' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                value={info[k] || ''}
                onChange={(e) => setInfo((p: any) => ({ ...p, [k]: e.target.value }))}
                className="w-full input"
              />
            </div>
          ))}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={info.address || ''}
              onChange={(e) => setInfo((p: any) => ({ ...p, address: e.target.value }))}
              rows={2}
              className="w-full input resize-none"
            />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">About / Description</label>
            <textarea
              value={info.description || ''}
              onChange={(e) => setInfo((p: any) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full input resize-none"
            />
          </div>
        </div>
      </section>

      {/* Operating Hours */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-4">Operating Hours</h3>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg">
              <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{DAYS[i]}</span>
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(h.is_open)}
                  onChange={(e) => setH(i, 'is_open', e.target.checked)}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-gray-600">{h.is_open ? 'Open' : 'Closed'}</span>
              </label>
              {h.is_open && (
                <div className="flex items-center gap-2">
                  <input type="time" value={h.open_time || '09:00'} onChange={(e) => setH(i, 'open_time', e.target.value)} className="input text-sm" />
                  <span className="text-gray-400">→</span>
                  <input type="time" value={h.close_time || '22:00'} onChange={(e) => setH(i, 'close_time', e.target.value)} className="input text-sm" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Branding images */}
      <section>
        <h3 className="font-semibold text-gray-800 mb-1">Branding & Hero Image</h3>
        <p className="text-sm text-gray-500 mb-4">
          The <strong>hero / cover</strong> image appears as the background on your public site's home page.
          Changes take effect immediately — no need to click Save Changes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <BrandingUploadTile
            label="Restaurant Logo"
            hint="Upload your restaurant logo"
            fieldName="logo"
            currentUrl={brandingUrls.logo}
            onUploaded={(url) => {
              setBrandingUrls((p) => ({ ...p, logo: url }));
              qc.invalidateQueries({ queryKey: ['r-cms-info'] });
            }}
          />
          <BrandingUploadTile
            label="Hero / Cover Image"
            hint="Shown as hero background on your site"
            fieldName="cover_image"
            currentUrl={brandingUrls.cover_image}
            onUploaded={(url) => {
              setBrandingUrls((p) => ({ ...p, cover_image: url }));
              qc.invalidateQueries({ queryKey: ['r-cms-info'] });
            }}
          />
        </div>

        {/* Hero video URL — used by the Pearl theme's video hero */}
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">🎬</span>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Hero Video URL
                <span className="ml-2 text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pearl theme only</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Paste a direct MP4 video URL (e.g. from your CDN or storage bucket). The video plays silently as a full-screen background on the home page. Leave blank to use the cover image instead.
              </p>
              <input
                type="url"
                placeholder="https://your-cdn.com/videos/hero.mp4"
                value={info.hero_video_url || ''}
                onChange={(e) => setInfo((p: any) => ({ ...p, hero_video_url: e.target.value || null }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
              />
              {info.hero_video_url && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <span>✓</span> Video URL set — click <strong>Save Changes</strong> to apply.
                </p>
              )}
            </div>
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
