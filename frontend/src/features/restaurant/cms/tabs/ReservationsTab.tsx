import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rCmsApi } from '../../../../api/restaurantAdmin';

interface Reservation {
  id: number; customer_name: string; customer_phone: string; customer_email?: string;
  party_size: number; reservation_date: string; special_requests?: string;
  status: string; notes?: string; created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: '#b45309', bg: '#fffbeb' },
  confirmed: { label: 'Confirmed', color: '#1d4ed8', bg: '#eff6ff' },
  seated:    { label: 'Seated',    color: '#065f46', bg: '#ecfdf5' },
  completed: { label: 'Completed', color: '#374151', bg: '#f9fafb' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fff1f2' },
  no_show:   { label: 'No Show',   color: '#9f1239', bg: '#fce7f3' },
};

function fmtDate(s: string) {
  try { return new Date(s).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return s; }
}

// ─── Manage drawer ────────────────────────────────────────────────────────────
function ManageModal({ res, onClose, onSave, saving }: {
  res: Reservation; onClose: () => void; onSave: (d: any) => void; saving: boolean;
}) {
  const [status, setStatus] = useState(res.status);
  const [notes, setNotes] = useState(res.notes || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Manage Reservation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Customer card */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="font-semibold text-gray-800 text-base">{res.customer_name}</p>
            <div className="flex gap-4 flex-wrap text-sm text-gray-500">
              <span>📞 {res.customer_phone}</span>
              {res.customer_email && <span>✉️ {res.customer_email}</span>}
            </div>
            <div className="flex gap-4 flex-wrap text-sm text-gray-500">
              <span>👥 {res.party_size} guest{res.party_size !== 1 ? 's' : ''}</span>
              <span>📅 {fmtDate(res.reservation_date)}</span>
            </div>
            {res.special_requests && (
              <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-800 italic">"{res.special_requests}"</div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(STATUS_META).map(([k, v]) => (
                <button
                  key={k} onClick={() => setStatus(k)}
                  style={{ backgroundColor: status === k ? v.bg : undefined, color: status === k ? v.color : undefined, borderColor: status === k ? v.color : undefined }}
                  className={`py-2 rounded-lg text-xs font-semibold border transition
                    ${status === k ? 'border-current' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full input resize-none" placeholder="Staff notes (not visible to customer)" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
          <button
            onClick={() => onSave({ status, notes })} disabled={saving}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Update Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ReservationsTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState<Reservation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['r-reservations', statusFilter, dateFilter],
    queryFn: () => rCmsApi.getReservations({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(dateFilter   ? { date: dateFilter }     : {}),
    }).then(r => r.data.data),
  });

  const reservations: Reservation[] = data?.reservations || [];
  const total: number = data?.total || 0;

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => rCmsApi.updateReservation(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['r-reservations'] }); setSelected(null); },
  });

  // Stats
  const pending   = reservations.filter(r => r.status === 'pending').length;
  const confirmed = reservations.filter(r => r.status === 'confirmed').length;
  const today     = new Date().toISOString().split('T')[0];
  const todayCount = reservations.filter(r => r.reservation_date?.startsWith(today)).length;

  return (
    <div className="p-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending Action', val: pending, color: '#b45309', bg: '#fffbeb' },
          { label: 'Confirmed',      val: confirmed, color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Today',          val: todayCount, color: '#065f46', bg: '#ecfdf5' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg }} className="rounded-2xl px-5 py-4 border border-white shadow-sm">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {['', ...Object.keys(STATUS_META)].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition
                ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s ? STATUS_META[s]?.label : 'All'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="input !py-1.5 !px-3 text-xs w-36"
          />
          {dateFilter && <button onClick={() => setDateFilter('')} className="text-xs text-gray-400 hover:text-gray-600">✕ Clear date</button>}
        </div>
        {total > 0 && <span className="text-xs text-gray-400">{total} total</span>}
      </div>

      {isLoading && <div className="text-center text-gray-400 py-14">Loading…</div>}

      {!isLoading && reservations.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-semibold text-base">No reservations found</p>
          <p className="text-sm mt-1">Reservations made on your website will appear here.</p>
        </div>
      )}

      {/* Reservation cards */}
      <div className="space-y-2">
        {reservations.map(r => {
          const meta = STATUS_META[r.status] || { label: r.status, color: '#374151', bg: '#f9fafb' };
          const isToday = r.reservation_date?.startsWith(today);
          return (
            <div key={r.id}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition flex items-center gap-4 px-5 py-4
                ${isToday ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-100'}`}
            >
              {/* Date block */}
              <div className="text-center flex-shrink-0 w-12">
                <p className="text-lg font-bold text-gray-800 leading-none">{new Date(r.reservation_date).getDate()}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{new Date(r.reservation_date).toLocaleString('en', { month: 'short' })}</p>
                <p className="text-[10px] text-gray-400">{new Date(r.reservation_date).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-gray-100 flex-shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800">{r.customer_name}</p>
                  {isToday && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Today</span>}
                </div>
                <div className="flex gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                  <span>📞 {r.customer_phone}</span>
                  <span>👥 {r.party_size} guest{r.party_size !== 1 ? 's' : ''}</span>
                  {r.customer_email && <span className="truncate max-w-[160px]">✉️ {r.customer_email}</span>}
                </div>
                {r.special_requests && <p className="text-xs text-amber-700 mt-1 truncate italic">"{r.special_requests}"</p>}
              </div>

              {/* Status + action */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span style={{ backgroundColor: meta.bg, color: meta.color }}
                  className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold">
                  {meta.label}
                </span>
                {/* Quick actions */}
                {r.status === 'pending' && (
                  <button
                    onClick={() => update.mutate({ id: r.id, data: { status: 'confirmed' } })}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                  >Confirm</button>
                )}
                <button
                  onClick={() => setSelected(r)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition"
                >Manage</button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <ManageModal
          res={selected}
          onClose={() => setSelected(null)}
          onSave={d => update.mutate({ id: selected.id, data: d })}
          saving={update.isPending}
        />
      )}
    </div>
  );
}
