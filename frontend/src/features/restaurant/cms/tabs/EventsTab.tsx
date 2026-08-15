import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rCmsApi } from '../../../../api/restaurantAdmin';
import { imageUrl } from '../../../../utils/imageUrl';

interface Event {
  id: number; title: string; description?: string;
  event_date: string; event_end_date?: string;
  venue?: string; location?: string;
  ticket_price?: number; currency?: string;
  capacity?: number;
  banner?: string;
  is_published: boolean; status?: string;
  created_at: string;
}

// ─── Event modal ──────────────────────────────────────────────────────────────
function EventModal({ event, onClose, onSave, saving }: {
  event: Event | null; onClose: () => void; onSave: (d: any) => void; saving: boolean;
}) {
  const [form, setForm] = useState({
    title:          event?.title || '',
    description:    event?.description || '',
    event_date:     event?.event_date?.slice(0, 16) || '',
    event_end_date: event?.event_end_date?.slice(0, 16) || '',
    venue:          event?.venue || event?.location || '',
    ticket_price:   event?.ticket_price ?? 0,
    currency:       event?.currency || 'INR',
    capacity:       event?.capacity ?? '',
    banner:         event?.banner || '',
    is_published:   event?.is_published ?? false,
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const res = await rCmsApi.uploadEventImage(fd);
      if (res.data.success && res.data.data?.url) set('banner', res.data.data.url);
    } catch { alert('Image upload failed. Please try again.'); }
    finally { setUploading(false); }
  };

  const isFree = !form.ticket_price || Number(form.ticket_price) === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">{event ? 'Edit Event' : 'Create New Event'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Cover Image</label>
            {imageUrl(form.banner) ? (
              <div className="relative rounded-xl overflow-hidden mb-2" style={{ height: 140 }}>
                <img src={imageUrl(form.banner)!} alt="Event cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-xs font-semibold shadow"
                  >Change</button>
                  <button
                    onClick={() => set('banner', '')}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold shadow"
                  >Remove</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition disabled:opacity-50"
              >
                <span className="text-2xl">{uploading ? '⏳' : '🖼️'}</span>
                <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Click to upload cover image'}</span>
                <span className="text-[10px] text-gray-300">JPG, PNG, WEBP — recommended 1200×600px</span>
              </button>
            )}
            <input type="file" ref={fileRef} onChange={uploadBanner} accept="image/*" className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full input" placeholder="e.g. Sunset Wine Tasting Evening" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full input resize-none" placeholder="Tell guests what to expect…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
              <input type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} className="w-full input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <input type="datetime-local" value={form.event_end_date} onChange={e => set('event_end_date', e.target.value)} className="w-full input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue / Location</label>
              <input value={form.venue} onChange={e => set('venue', e.target.value)} className="w-full input" placeholder="Restaurant name, address, or online link" />
            </div>
          </div>

          {/* Ticket pricing */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">🎟 Ticket Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price per Ticket</label>
                <div className="flex">
                  <select value={form.currency} onChange={e => set('currency', e.target.value)} className="input rounded-r-none w-[68px] border-r-0 text-sm">
                    {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input type="number" min={0} value={form.ticket_price} onChange={e => set('ticket_price', e.target.value)}
                    className="input rounded-l-none flex-1" placeholder="0 = Free" />
                </div>
                {isFree && <p className="text-xs text-emerald-600 mt-1">✓ Free entry</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total Capacity</label>
                <input type="number" min={1} value={form.capacity} onChange={e => set('capacity', e.target.value)}
                  className="w-full input" placeholder="Leave blank = unlimited" />
              </div>
            </div>
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-emerald-50 rounded-xl">
            <div
              onClick={() => set('is_published', !form.is_published)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_published ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_published ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{form.is_published ? 'Published on website' : 'Save as draft'}</p>
              <p className="text-xs text-gray-500">{form.is_published ? 'Customers can see and book this event' : 'Not visible to customers yet'}</p>
            </div>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
          <button
            onClick={() => onSave({ ...form, ticket_price: Number(form.ticket_price) || 0, banner: form.banner || null })}
            disabled={saving || !form.title.trim() || !form.event_date}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : event ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main EventsTab ───────────────────────────────────────────────────────────
export default function EventsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; event: Event | null }>({ open: false, event: null });

  const { data, isLoading } = useQuery({
    queryKey: ['r-events', filter],
    queryFn: () => rCmsApi.getEvents(filter ? { status: filter } : undefined).then(r => r.data.data),
  });

  const events: Event[] = data?.events || [];
  const total: number = data?.total || 0;

  const save = useMutation({
    mutationFn: (d: any) => modal.event ? rCmsApi.updateEvent(modal.event!.id, d) : rCmsApi.createEvent(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['r-events'] }); setModal({ open: false, event: null }); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => rCmsApi.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['r-events'] }),
  });
  const togglePublish = useMutation({
    mutationFn: ({ id, is_published }: { id: number; is_published: boolean }) =>
      rCmsApi.updateEvent(id, { is_published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['r-events'] }),
  });

  // Stats
  const published = events.filter(e => e.is_published).length;
  const upcoming  = events.filter(e => new Date(e.event_date) >= new Date()).length;

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Events',  val: total,     color: '#374151', bg: '#f9fafb' },
          { label: 'Published',     val: published,  color: '#065f46', bg: '#ecfdf5' },
          { label: 'Upcoming',      val: upcoming,   color: '#1d4ed8', bg: '#eff6ff' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg }} className="rounded-2xl px-5 py-4 border border-white shadow-sm">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2">
          {[['', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition
                ${filter === v ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >{l}</button>
          ))}
        </div>
        <button
          onClick={() => setModal({ open: true, event: null })}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
        >🎉 Create Event</button>
      </div>

      {isLoading && <div className="text-center text-gray-400 py-14">Loading…</div>}

      {!isLoading && events.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-semibold text-base">No events yet</p>
          <p className="text-sm mt-1">Create events and let customers buy tickets directly from your website.</p>
          <button onClick={() => setModal({ open: true, event: null })} className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">Create First Event</button>
        </div>
      )}

      <div className="space-y-3">
        {events.map(ev => {
          const evDate = new Date(ev.event_date);
          const isPast = evDate < new Date();
          const isFree = !ev.ticket_price || Number(ev.ticket_price) === 0;

          return (
            <div key={ev.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden flex ${isPast ? 'opacity-70' : ''}`}>
              {/* Cover image (if set) or Date block */}
              {imageUrl(ev.banner) ? (
                <div className="w-24 flex-shrink-0 relative overflow-hidden">
                  <img src={imageUrl(ev.banner)!} alt={ev.title} className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  {/* Date overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-1 text-center">
                    <p className="text-white text-xs font-bold">{evDate.getDate()} {evDate.toLocaleString('en', { month: 'short' })}</p>
                  </div>
                </div>
              ) : (
                <div className="w-20 flex-shrink-0 flex flex-col items-center justify-center py-4 px-2 text-center"
                  style={{ backgroundColor: ev.is_published ? '#ecfdf5' : '#f9fafb' }}>
                  <p className="text-2xl font-bold leading-none" style={{ color: ev.is_published ? '#065f46' : '#374151' }}>{evDate.getDate()}</p>
                  <p className="text-[11px] uppercase tracking-wide font-medium text-gray-500">{evDate.toLocaleString('en', { month: 'short' })}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{evDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )}

              <div className="flex-1 px-5 py-4 flex items-center gap-4 min-w-0 border-l border-gray-100">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{ev.title}</p>
                  {(ev.venue || ev.location) && <p className="text-xs text-gray-400 mt-0.5">📍 {ev.venue || ev.location}</p>}
                  {ev.description && <p className="text-xs text-gray-400 truncate mt-0.5">{ev.description}</p>}
                </div>

                {/* Price */}
                <div className="text-center flex-shrink-0 hidden sm:block">
                  <p className="text-lg font-bold text-gray-800">{isFree ? 'Free' : `${ev.currency || '₹'} ${Number(ev.ticket_price).toFixed(0)}`}</p>
                  <p className="text-[10px] text-gray-400">{isFree ? 'Entry' : 'per ticket'}</p>
                  {ev.capacity && <p className="text-[10px] text-gray-400 mt-0.5">Cap. {ev.capacity}</p>}
                </div>

                {/* Status + actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {/* Publish toggle */}
                  <button
                    onClick={() => togglePublish.mutate({ id: ev.id, is_published: !ev.is_published })}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${ev.is_published ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    title={ev.is_published ? 'Published — click to unpublish' : 'Draft — click to publish'}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${ev.is_published ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className={`text-[10px] font-semibold ${ev.is_published ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {ev.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Edit / Delete */}
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setModal({ open: true, event: ev })} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500" title="Edit">✏️</button>
                  <button onClick={() => { if (confirm(`Delete "${ev.title}"?`)) remove.mutate(ev.id); }} className="p-1.5 rounded-lg hover:bg-red-50 transition text-red-400" title="Delete">🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <EventModal
          event={modal.event}
          onClose={() => setModal({ open: false, event: null })}
          onSave={d => save.mutate(d)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}
