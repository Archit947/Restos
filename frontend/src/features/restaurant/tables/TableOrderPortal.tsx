/**
 * TableOrderPortal – Standalone tablet-optimised table-ordering interface.
 * Route: /restaurant/tportal  (no sidebar)
 *
 * FREE  table → tap → new order modal  → Confirm → KDS + table goes BUSY
 * BUSY  table → tap → active order shown + add more items + Get Bill button
 * Get Bill    → order status → 'ready'  → admin completes payment → table frees
 */
import React, { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { useRestaurantAuthStore } from '../../../store/restaurantAuthStore';
import { rTablesApi, rMenuApi, rOrdersApi } from '../../../api/restaurantAdmin';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Area    { id: number; name: string; table_count: number; is_active: boolean; }
interface RTable  { id: number; area_id: number | null; area_name?: string; table_number: number; label?: string; capacity: number; status: 'available' | 'occupied' | 'reserved'; }
interface CartItem{ id: number; item_number: number; name: string; price: number; qty: number; is_veg: boolean; }
interface ActiveOrder {
  id: number; order_number: string; status: string;
  items: CartItem[]; subtotal: number; total: number;
  table_number: string; area_name: string;
  payment_method: string; created_at: string;
}

// ── Status palette ────────────────────────────────────────────────────────────
const ST = {
  available: { ring: '#10b981', bg: '#f0fdf4', num: '#065f46', dot: '#10b981', label: 'FREE',  clickable: true  },
  occupied:  { ring: '#ef4444', bg: '#fff1f2', num: '#991b1b', dot: '#ef4444', label: 'BUSY',  clickable: true  },
  reserved:  { ring: '#f59e0b', bg: '#fffbeb', num: '#92400e', dot: '#f59e0b', label: 'RSVD',  clickable: false },
};

// ── Item-number fetch helper (shared by both modals) ─────────────────────────
async function fetchByNumber(num: number): Promise<CartItem> {
  const res  = await rMenuApi.getItemByNumber(num);
  const item = res.data.data;
  return { id: item.id, item_number: item.item_number, name: item.name, price: Number(item.price), qty: 1, is_veg: item.is_veg };
}

// ── Shared item-number input bar ──────────────────────────────────────────────
function ItemNumInput({ onAdd }: { onAdd: (item: CartItem) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [val, setVal]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [lastAdded, setLastAdded] = useState('');

  useEffect(() => { ref.current?.focus(); }, []);

  async function add() {
    const n = parseInt(val);
    if (!n) return;
    setLoading(true);
    try {
      const item = await fetchByNumber(n);
      onAdd(item);
      setLastAdded(item.name);
      setVal('');
      ref.current?.focus();
    } catch {
      toast.error(`Item #${n} not found`);
      setVal('');
      ref.current?.focus();
    } finally { setLoading(false); }
  }

  return (
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300 select-none">#</span>
          <input
            ref={ref}
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Item number…"
            className="w-full pl-11 pr-4 py-4 text-2xl font-black font-mono border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 bg-white text-gray-900 placeholder-gray-300 transition"
          />
        </div>
        <button onClick={add} disabled={loading || !val}
          className="px-7 py-4 bg-emerald-600 text-white text-lg font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition min-w-[80px]">
          {loading ? '…' : 'Add'}
        </button>
      </div>
      {lastAdded && <p className="text-sm text-emerald-600 font-semibold mt-2 ml-1">✓ Added: {lastAdded}</p>}
    </div>
  );
}

// ── Cart row ──────────────────────────────────────────────────────────────────
function CartRow({ item, onDelta }: { item: CartItem; onDelta?: (d: number) => void }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3.5">
      <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 font-mono text-sm font-bold shrink-0">
        #{item.item_number}
      </span>
      <span className={`w-2 h-2 rounded-full shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className="flex-1 font-semibold text-gray-800 text-sm">{item.name}</span>
      <span className="text-xs text-gray-400 shrink-0">₹{item.price}</span>
      {onDelta ? (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onDelta(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 font-bold text-lg transition">−</button>
          <span className="w-8 text-center font-bold text-gray-800 text-base">{item.qty}</span>
          <button onClick={() => onDelta(+1)} className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 font-bold text-lg transition">+</button>
        </div>
      ) : (
        <span className="text-sm text-gray-500 shrink-0">× {item.qty}</span>
      )}
      <span className="w-20 text-right font-bold text-gray-800 shrink-0">₹{(item.price * item.qty).toLocaleString()}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NEW ORDER MODAL  (FREE table)
// ══════════════════════════════════════════════════════════════════════════════
function NewOrderModal({ table, area, onClose, onConfirm, placing }:
  { table: RTable; area?: Area; onClose: () => void; onConfirm: (cart: CartItem[], notes: string, pm: string) => void; placing: boolean }) {

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [pm, setPm] = useState('cash');
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function addToCart(item: CartItem) {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, item];
    });
  }

  function changeQty(id: number, d: number) {
    setCart(p => p.map(c => c.id === id ? { ...c, qty: c.qty + d } : c).filter(c => c.qty > 0));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shrink-0">
          <div>
            <p className="text-emerald-200 text-sm font-medium">{area?.name || 'New Order'}</p>
            <h2 className="text-2xl font-black">Table {table.table_number}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-emerald-200 text-xs">Capacity</p>
              <p className="text-xl font-bold">👤 {table.capacity}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-2xl font-light transition">×</button>
          </div>
        </div>

        {/* Item input */}
        <ItemNumInput onAdd={addToCart} />

        {/* Cart */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-gray-300 gap-2">
              <span className="text-4xl">🛒</span>
              <p className="text-sm">Type an item # above to start the order</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cart.map(item => <CartRow key={item.id} item={item} onDelta={d => changeQty(item.id, d)} />)}
            </div>
          )}
        </div>

        {/* Notes + payment + confirm */}
        {cart.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 space-y-3">
            <div className="flex gap-3">
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes / special requests…"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900 placeholder-gray-400" />
              <div className="flex gap-1.5">
                {['cash', 'card', 'upi'].map(m => (
                  <button key={m} onClick={() => setPm(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border uppercase transition ${pm === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{cart.reduce((s, c) => s + c.qty, 0)} items</p>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-gray-900">₹{subtotal.toLocaleString()}</span>
                <button onClick={() => onConfirm(cart, notes, pm)} disabled={placing}
                  className="px-8 py-3.5 bg-emerald-600 text-white font-black text-base rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition shadow-lg shadow-emerald-200">
                  {placing ? 'Sending…' : 'Confirm Order →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ACTIVE ORDER MODAL  (BUSY table — add items + Get Bill)
// ══════════════════════════════════════════════════════════════════════════════
function ActiveOrderModal({ table, area, onClose, onTableFreed }:
  { table: RTable; area?: Area; onClose: () => void; onTableFreed: () => void }) {

  const qc = useQueryClient();
  const [newCart, setNewCart] = useState<CartItem[]>([]);

  const { data: order, isLoading, error, refetch } = useQuery<ActiveOrder>({
    queryKey: ['active-order', table.id],
    queryFn: () => rOrdersApi.getActiveTableOrder(table.id).then(r => r.data.data),
    refetchInterval: 15000,
  });

  function addToNew(item: CartItem) {
    setNewCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, item];
    });
  }

  function changeNewQty(id: number, d: number) {
    setNewCart(p => p.map(c => c.id === id ? { ...c, qty: c.qty + d } : c).filter(c => c.qty > 0));
  }

  const newSubtotal = newCart.reduce((s, i) => s + i.price * i.qty, 0);

  // Add more items to existing order
  const addItemsMutation = useMutation({
    mutationFn: () => rOrdersApi.addItems(order!.id, newCart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))),
    onSuccess: () => {
      toast.success(`${newCart.reduce((s, c) => s + c.qty, 0)} item(s) added to order`);
      setNewCart([]);
      refetch();
      qc.invalidateQueries({ queryKey: ['tp-tables'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add items'),
  });

  // Get Bill — change status to 'ready'
  const getBillMutation = useMutation({
    mutationFn: () => rOrdersApi.updateStatus(order!.id, 'ready'),
    onSuccess: () => {
      toast.success(`Bill requested for Table ${table.table_number} — check Orders section`);
      qc.invalidateQueries({ queryKey: ['tp-tables'] });
      onTableFreed();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const existingTotal = order ? Number(order.total) : 0;
  const grandTotal    = existingTotal + newSubtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header — red for busy */}
        <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white shrink-0">
          <div>
            <p className="text-red-200 text-sm font-medium">{area?.name || 'Active Order'} · {order?.order_number || '—'}</p>
            <h2 className="text-2xl font-black">Table {table.table_number} <span className="text-base font-normal opacity-70">· Occupied</span></h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-red-200 text-xs">Running Total</p>
              <p className="text-xl font-black">₹{grandTotal.toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-2xl font-light transition">×</button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-40 text-gray-400 gap-3">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" />
            <span className="text-sm">Loading order…</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
            <p className="text-sm">No active order found for this table.</p>
            <button onClick={onClose} className="text-xs text-emerald-600 hover:underline">Close</button>
          </div>
        )}

        {order && (
          <>
            {/* Existing order items */}
            <div className="shrink-0">
              <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Order</p>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                  order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'preparing' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{order.status}</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-44 overflow-y-auto">
                {order.items.map((item, i) => <CartRow key={i} item={item} />)}
              </div>
              <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-100">
                <span className="text-sm text-gray-500">Order subtotal</span>
                <span className="font-bold text-gray-800">₹{Number(order.subtotal).toLocaleString()}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 px-6 py-2 shrink-0">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add More Items</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Add items input */}
            <ItemNumInput onAdd={addToNew} />

            {/* New items */}
            <div className="flex-1 overflow-y-auto">
              {newCart.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-gray-300 text-sm">
                  Type an item # above to add more items
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {newCart.map(item => <CartRow key={item.id} item={item} onDelta={d => changeNewQty(item.id, d)} />)}
                </div>
              )}
            </div>

            {/* Footer: Add to order + Get Bill */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <div className="flex gap-3">
                {/* Add to order */}
                <button
                  onClick={() => addItemsMutation.mutate()}
                  disabled={newCart.length === 0 || addItemsMutation.isPending}
                  className="flex-1 py-3.5 bg-gray-800 text-white font-bold rounded-2xl hover:bg-gray-700 disabled:opacity-40 transition text-sm flex items-center justify-center gap-2"
                >
                  {addItemsMutation.isPending ? 'Adding…' : (
                    <>
                      <span>➕ Add to Order</span>
                      {newCart.length > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                          +₹{newSubtotal.toLocaleString()}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* Get Bill */}
                <button
                  onClick={() => getBillMutation.mutate()}
                  disabled={getBillMutation.isPending || order.status === 'ready'}
                  className={`px-6 py-3.5 font-black rounded-2xl transition text-sm flex items-center gap-2 ${
                    order.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                  }`}
                >
                  {getBillMutation.isPending ? 'Sending…' : order.status === 'ready' ? '✓ Bill Sent' : '🧾 Get Bill'}
                </button>
              </div>

              {newCart.length > 0 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Grand total after adding: <span className="font-bold text-gray-700">₹{grandTotal.toLocaleString()}</span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PORTAL
// ══════════════════════════════════════════════════════════════════════════════
export default function TableOrderPortal() {
  const isAuthenticated = useRestaurantAuthStore(s => s.isAuthenticated);
  const restaurant      = useRestaurantAuthStore(s => s.restaurant);
  if (!isAuthenticated) return <Navigate to="/restaurant/login" replace />;

  const qc = useQueryClient();
  const [areaId, setAreaId]         = useState<number | null>(null);
  const [freeTable, setFreeTable]   = useState<RTable | null>(null);   // new order
  const [busyTable, setBusyTable]   = useState<RTable | null>(null);   // active order
  const [flash, setFlash]           = useState<number | null>(null);   // green flash on confirm

  const { data: areas = [], refetch: refetchAreas } = useQuery<Area[]>({
    queryKey: ['tp-areas'],
    queryFn: () => rTablesApi.getAreas().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const { data: tables = [], refetch: refetchTables } = useQuery<RTable[]>({
    queryKey: ['tp-tables'],
    queryFn: () => rTablesApi.getTables().then(r => r.data.data),
    refetchInterval: 20000,
  });

  const visibleTables = (areaId ? tables.filter(t => t.area_id === areaId) : tables)
    .slice().sort((a, b) => a.table_number - b.table_number);

  const activeArea = areaId ? areas.find(a => a.id === areaId) : undefined;

  // Place new order
  const placeMutation = useMutation({
    mutationFn: ({ table, cart, notes, pm }: any) =>
      rOrdersApi.create({
        items: cart.map((i: CartItem) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        order_type: 'dine_in',
        table_id: table.id,
        table_number: String(table.table_number),
        area_name: table.area_name || activeArea?.name || '',
        special_instructions: notes,
        payment_method: pm,
        source: 'table',
      }),
    onSuccess: (_, { table }) => {
      setFreeTable(null);
      setFlash(table.table_number);
      setTimeout(() => { setFlash(null); refetchTables(); }, 2500);
      qc.invalidateQueries({ queryKey: ['tp-tables'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Order failed'),
  });

  function handleTableTap(table: RTable) {
    if (table.status === 'available') setFreeTable(table);
    if (table.status === 'occupied')  setBusyTable(table);
    // reserved: do nothing
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white select-none overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', borderRadius: '14px' } }} />

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-lg">
            {restaurant?.name?.charAt(0).toUpperCase() || 'R'}
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-sm leading-tight">{restaurant?.name || 'Restaurant'}</p>
            <p className="text-gray-400 text-xs">Table Portal</p>
          </div>
        </div>

        {/* Area tabs */}
        <div className="flex items-center gap-2 overflow-x-auto flex-1 mx-4 justify-center">
          <button onClick={() => setAreaId(null)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${!areaId ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            All Areas
          </button>
          {areas.filter(a => a.is_active).map(a => (
            <button key={a.id} onClick={() => setAreaId(a.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${areaId === a.id ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {a.name} <span className="opacity-50 ml-1">({a.table_count})</span>
            </button>
          ))}
        </div>

        {/* Legend + refresh */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-3">
            {[['#10b981','Free'],['#ef4444','Busy'],['#f59e0b','Rsvd']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
              </div>
            ))}
          </div>
          <button onClick={() => { refetchAreas(); refetchTables(); }}
            className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition text-base">
            ↻
          </button>
        </div>
      </div>

      {/* ── Hint bar ── */}
      <div className="px-5 py-2 bg-gray-900/60 border-b border-gray-800/60 shrink-0 flex items-center gap-4 text-xs text-gray-500">
        <span>🟢 Tap a <b className="text-gray-400">Free</b> table to take a new order</span>
        <span className="text-gray-700">·</span>
        <span>🔴 Tap a <b className="text-gray-400">Busy</b> table to add items or get the bill</span>
      </div>

      {/* ── Table grid ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {visibleTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-600">
            <span className="text-7xl">🪑</span>
            <p className="text-xl font-bold text-gray-500">No tables yet</p>
            <p className="text-sm">Go to admin → Table Portal → Setup Tables to add tables.</p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {visibleTables.map(table => {
              const st      = ST[table.status] || ST.available;
              const isFlash = flash === table.table_number;

              return (
                <button
                  key={table.id}
                  onClick={() => handleTableTap(table)}
                  disabled={!st.clickable}
                  style={{
                    background:  isFlash ? '#059669' : st.bg,
                    borderColor: isFlash ? '#10b981' : st.ring,
                  }}
                  className={[
                    'relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-200',
                    'aspect-square',
                    st.clickable
                      ? 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-black/50'
                      : 'cursor-not-allowed opacity-60',
                    table.status === 'occupied' && !isFlash ? 'ring-2 ring-red-300/30' : '',
                  ].join(' ')}
                >
                  {/* Status dot */}
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full"
                    style={{ background: isFlash ? '#fff' : st.dot }} />

                  {/* Table number */}
                  <span className="text-4xl font-black leading-none"
                    style={{ color: isFlash ? '#fff' : st.num }}>
                    {table.table_number}
                  </span>

                  {/* Label */}
                  {table.label && (
                    <span className="text-[11px] font-semibold mt-1 px-1 text-center leading-tight"
                      style={{ color: isFlash ? '#d1fae5' : st.num, opacity: 0.65 }}>
                      {table.label}
                    </span>
                  )}

                  {/* Area (all-areas view only) */}
                  {!areaId && table.area_name && (
                    <span className="text-[10px] mt-0.5 font-medium"
                      style={{ color: isFlash ? '#d1fae5' : st.num, opacity: 0.5 }}>
                      {table.area_name}
                    </span>
                  )}

                  {/* Capacity */}
                  <span className="text-[11px] mt-1.5"
                    style={{ color: isFlash ? '#d1fae5' : st.num, opacity: 0.5 }}>
                    👤{table.capacity}
                  </span>

                  {/* Status label */}
                  <span className="absolute bottom-2 text-[9px] font-black uppercase tracking-wider"
                    style={{ color: isFlash ? '#d1fae5' : st.num, opacity: 0.55 }}>
                    {isFlash ? '✓ ORDERED' : st.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* New order modal (FREE table) */}
      {freeTable && (
        <NewOrderModal
          table={freeTable}
          area={activeArea}
          onClose={() => setFreeTable(null)}
          onConfirm={(cart, notes, pm) => placeMutation.mutate({ table: freeTable, cart, notes, pm })}
          placing={placeMutation.isPending}
        />
      )}

      {/* Active order modal (BUSY table) */}
      {busyTable && (
        <ActiveOrderModal
          table={busyTable}
          area={activeArea}
          onClose={() => setBusyTable(null)}
          onTableFreed={refetchTables}
        />
      )}
    </div>
  );
}
