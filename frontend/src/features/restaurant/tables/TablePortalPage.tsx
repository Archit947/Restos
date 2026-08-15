import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rTablesApi, rMenuApi, rOrdersApi } from '../../../api/restaurantAdmin';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Area    { id: number; name: string; description?: string; sort_order: number; is_active: boolean; table_count: number; }
interface RTable  { id: number; area_id: number | null; area_name?: string; table_number: number; label?: string; capacity: number; status: 'available' | 'occupied' | 'reserved'; }
interface CartItem { id: number; item_number: number; name: string; price: number; qty: number; is_veg: boolean; }

// ── Status colours ────────────────────────────────────────────────────────────
const TABLE_STATUS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  occupied:  { bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500'     },
  reserved:  { bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
};

// ── Order Modal ───────────────────────────────────────────────────────────────
function OrderModal({ table, area, onClose, onConfirm }:
  { table: RTable; area?: Area; onClose: () => void; onConfirm: (items: CartItem[], notes: string, pm: string) => void }) {

  const [itemNumInput, setItemNumInput] = useState('');
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [notes, setNotes]               = useState('');
  const [pm, setPm]                     = useState('cash');
  const [searching, setSearching]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  async function fetchItem() {
    const num = parseInt(itemNumInput);
    if (!num) return;
    setSearching(true);
    try {
      const res  = await rMenuApi.getItemByNumber(num);
      const item = res.data.data;
      setCart(prev => {
        const ex = prev.find(c => c.id === item.id);
        if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
        return [...prev, { id: item.id, item_number: item.item_number, name: item.name, price: Number(item.price), qty: 1, is_veg: item.is_veg }];
      });
      setItemNumInput('');
      inputRef.current?.focus();
    } catch {
      toast.error(`Item #${num} not found or unavailable.`);
      setItemNumInput('');
      inputRef.current?.focus();
    } finally { setSearching(false); }
  }

  function changeQty(id: number, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              Table {table.table_number}
              {table.label && <span className="text-gray-400 font-normal text-sm ml-2">({table.label})</span>}
            </h3>
            {area && <p className="text-xs text-gray-400">{area.name} · {table.capacity} seats</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Item number input */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type Item Number to Add</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">#</span>
              <input ref={inputRef} autoFocus type="number" value={itemNumInput}
                onChange={e => setItemNumInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchItem()}
                placeholder="e.g. 5"
                className="w-full pl-7 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <button onClick={fetchItem} disabled={searching || !itemNumInput}
              className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
              {searching ? '…' : 'Add'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">Press Enter to add quickly</p>
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-gray-300 gap-2">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              <p className="text-sm">No items yet — type an item number above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-[10px] font-mono font-bold text-gray-400 w-6">#{item.item_number}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="flex-1 text-sm font-medium text-gray-800">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-sm">−</button>
                    <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, +1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-sm">+</button>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-16 text-right">₹{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-4 space-y-3">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Notes / special instructions…" />
              <div className="flex gap-2 flex-wrap">
                {['cash', 'card', 'upi', 'wallet'].map(m => (
                  <button key={m} onClick={() => setPm(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${pm === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{cart.reduce((s, c) => s + c.qty, 0)} items</span>
            <span className="text-lg font-bold text-gray-900">Total: ₹{subtotal.toLocaleString()}</span>
          </div>
          <button disabled={cart.length === 0} onClick={() => onConfirm(cart, notes, pm)}
            className="w-full py-3 bg-emerald-600 text-white font-bold text-base rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition">
            Confirm Order → KDS
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Setup Modal (with batch creation) ────────────────────────────────────────
function SetupModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'areas' | 'tables'>('areas');

  // Areas state
  const [areaName, setAreaName] = useState('');

  // Batch table state
  const [batchAreaId,   setBatchAreaId]   = useState<number | ''>('');
  const [batchCount,    setBatchCount]    = useState('');
  const [batchCap,      setBatchCap]      = useState('4');
  const [batchFrom,     setBatchFrom]     = useState('1');

  const { data: areas = [] } = useQuery<Area[]>({ queryKey: ['r-areas'], queryFn: () => rTablesApi.getAreas().then(r => r.data.data) });
  const { data: tables = [] } = useQuery<RTable[]>({ queryKey: ['r-tables'], queryFn: () => rTablesApi.getTables().then(r => r.data.data) });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['r-areas'] }); qc.invalidateQueries({ queryKey: ['r-tables'] }); };

  const addArea = useMutation({ mutationFn: (n: string) => rTablesApi.createArea({ name: n }), onSuccess: () => { setAreaName(''); invalidate(); } });
  const delArea = useMutation({ mutationFn: (id: number) => rTablesApi.deleteArea(id), onSuccess: invalidate });

  const batchCreate = useMutation({
    mutationFn: () => rTablesApi.createBatch({
      area_id:    batchAreaId ? Number(batchAreaId) : null,
      count:      Number(batchCount),
      capacity:   Number(batchCap) || 4,
      start_from: Number(batchFrom) || 1,
    }),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`${d.created} table(s) created${d.skipped ? `, ${d.skipped} skipped (already exist)` : ''}`);
      setBatchCount('');
      invalidate();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error creating tables'),
  });

  const delTable = useMutation({ mutationFn: (id: number) => rTablesApi.deleteTable(id), onSuccess: invalidate });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg">Table Setup</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          {(['areas', 'tables'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition ${tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500'}`}>
              {t === 'areas' ? '📍 Areas' : '🪑 Tables'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Areas tab ── */}
          {tab === 'areas' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={areaName} onChange={e => setAreaName(e.target.value)}
                  placeholder="Area name  e.g. Garden, Indoor, Terrace"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={e => e.key === 'Enter' && areaName && addArea.mutate(areaName)} />
                <button onClick={() => areaName && addArea.mutate(areaName)} disabled={addArea.isPending || !areaName}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {areas.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-lg">📍</span>
                    <span className="flex-1 font-medium text-gray-800 text-sm">{a.name}</span>
                    <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{a.table_count} tables</span>
                    <button onClick={() => delArea.mutate(a.id)} className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                  </div>
                ))}
                {areas.length === 0 && <p className="text-center text-sm text-gray-400 py-6">No areas yet — add one above</p>}
              </div>
            </div>
          )}

          {/* ── Tables tab (batch creation) ── */}
          {tab === 'tables' && (
            <div className="space-y-5">
              {/* Batch form */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Add Multiple Tables at Once</p>

                {/* Area */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Area (optional)</label>
                  <select value={batchAreaId} onChange={e => setBatchAreaId(Number(e.target.value) || '')}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option value="">No area</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>

                {/* Count + Seats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">No. of Tables *</label>
                    <input type="number" min="1" max="100" value={batchCount}
                      onChange={e => setBatchCount(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Seats per Table</label>
                    <input type="number" min="1" max="50" value={batchCap}
                      onChange={e => setBatchCap(e.target.value)}
                      placeholder="4"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Start from #</label>
                    <input type="number" min="1" value={batchFrom}
                      onChange={e => setBatchFrom(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-bold" />
                  </div>
                </div>

                {/* Preview label */}
                {batchCount && Number(batchCount) > 0 && (
                  <p className="text-xs text-emerald-700 font-medium">
                    → Will create {batchCount} tables numbered {batchFrom}–{Number(batchFrom) + Number(batchCount) - 1},
                    {' '}{batchCap} seats each{batchAreaId ? `, in ${areas.find(a => a.id === Number(batchAreaId))?.name}` : ''}
                  </p>
                )}

                <button
                  onClick={() => batchCreate.mutate()}
                  disabled={!batchCount || batchCreate.isPending}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {batchCreate.isPending ? 'Creating…' : `Add ${batchCount || '—'} Tables`}
                </button>
              </div>

              {/* Existing tables list */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                  Existing Tables ({tables.length})
                </p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {tables
                    .slice().sort((a, b) => a.table_number - b.table_number)
                    .map(t => (
                      <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl">
                        <span className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-700">
                          {t.table_number}
                        </span>
                        <span className="flex-1 text-sm text-gray-700">
                          {t.area_name || <span className="text-gray-400 italic">No area</span>}
                          {t.label && <span className="text-gray-400"> ({t.label})</span>}
                        </span>
                        <span className="text-xs text-gray-400">👤{t.capacity}</span>
                        <button onClick={() => delTable.mutate(t.id)} className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                      </div>
                    ))}
                  {tables.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No tables yet</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TablePortalPage() {
  const qc = useQueryClient();
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [orderTable,  setOrderTable]  = useState<RTable | null>(null);
  const [showSetup,   setShowSetup]   = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ['r-areas'],
    queryFn: () => rTablesApi.getAreas().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: allTables = [], refetch: refetchTables } = useQuery<RTable[]>({
    queryKey: ['r-tables'],
    queryFn: () => rTablesApi.getTables().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const tables = selectedAreaId
    ? allTables.filter(t => t.area_id === selectedAreaId)
    : allTables;

  const visibleArea = selectedAreaId ? areas.find(a => a.id === selectedAreaId) : undefined;

  const createOrder = useMutation({
    mutationFn: ({ table, items, notes, pm }: any) =>
      rOrdersApi.create({
        items: items.map((i: CartItem) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        order_type: 'dine_in',
        table_id: table.id,
        table_number: String(table.table_number),
        area_name: table.area_name || visibleArea?.name || '',
        special_instructions: notes,
        payment_method: pm,
        source: 'table',
      }),
    onSuccess: (_, { table }) => {
      qc.invalidateQueries({ queryKey: ['r-tables'] });
      setOrderTable(null);
      setSuccessMsg(`Order placed for Table ${table.table_number} — sent to KDS ✓`);
      setTimeout(() => setSuccessMsg(''), 4000);
      refetchTables();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Order failed'),
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <RestaurantHeader
        title="Table Portal"
        subtitle="Manage dine-in tables and take orders"
        actions={
          <div className="flex gap-2">
            {/* Open tablet portal in new tab */}
            <a
              href="/restaurant/tportal"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              Open Tablet View
            </a>
            <button onClick={() => refetchTables()} className="px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              ↻ Refresh
            </button>
            <button onClick={() => setShowSetup(true)} className="px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition">
              ⚙ Setup Tables
            </button>
          </div>
        }
      />

      {successMsg && (
        <div className="mx-6 mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
          <span className="text-emerald-500">✓</span> {successMsg}
        </div>
      )}

      {/* Legend */}
      <div className="px-6 pt-4 flex items-center gap-4 flex-wrap">
        {Object.entries(TABLE_STATUS).map(([status, st]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
            <span className="capitalize">{status}</span>
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-auto">
          {allTables.length} table{allTables.length !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* Area tabs */}
      {areas.length > 0 && (
        <div className="px-6 mt-3 flex gap-2 flex-wrap">
          <button onClick={() => setSelectedAreaId(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${!selectedAreaId ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            All Areas
            <span className="ml-1.5 text-xs opacity-60">({allTables.length})</span>
          </button>
          {areas.map(a => (
            <button key={a.id} onClick={() => setSelectedAreaId(a.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${selectedAreaId === a.id ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {a.name}
              <span className="ml-1.5 text-xs opacity-70">({a.table_count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Tables grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <div className="text-6xl">🪑</div>
            <p className="text-lg font-semibold text-gray-600">No tables set up yet</p>
            <p className="text-sm">Click "Setup Tables" → Tables tab → add count &amp; seats.</p>
            <button onClick={() => setShowSetup(true)} className="mt-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition">
              ⚙ Setup Tables
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
            {tables
              .slice()
              .sort((a, b) => a.table_number - b.table_number)
              .map(table => {
                const st = TABLE_STATUS[table.status] || TABLE_STATUS.available;
                return (
                  <button
                    key={table.id}
                    onClick={() => table.status !== 'reserved' && setOrderTable(table)}
                    className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all
                      ${st.bg} ${st.border}
                      ${table.status === 'reserved' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md'}`}
                  >
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${st.dot}`} />
                    <span className={`text-3xl font-black ${st.text}`}>{table.table_number}</span>
                    {(table.label || (!selectedAreaId && table.area_name)) && (
                      <span className={`text-[10px] font-medium mt-0.5 ${st.text} opacity-70 text-center px-1 leading-tight`}>
                        {table.label || table.area_name}
                      </span>
                    )}
                    <span className={`text-[10px] mt-1 ${st.text} opacity-50`}>👤{table.capacity}</span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {orderTable && (
        <OrderModal
          table={orderTable}
          area={visibleArea}
          onClose={() => setOrderTable(null)}
          onConfirm={(items, notes, pm) => createOrder.mutate({ table: orderTable, items, notes, pm })}
        />
      )}

      {showSetup && (
        <SetupModal onClose={() => {
          setShowSetup(false);
          qc.invalidateQueries({ queryKey: ['r-areas'] });
          qc.invalidateQueries({ queryKey: ['r-tables'] });
        }} />
      )}
    </div>
  );
}
