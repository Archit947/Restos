import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rMenuApi, rOrdersApi } from '../../../api/restaurantAdmin';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CartItem {
  id: number;
  item_number: number;
  name: string;
  category_name?: string;
  price: number;
  qty: number;
  is_veg: boolean;
}

interface CompletedOrder {
  order_number: string;
  total: number;
  payment_method: string;
  items: CartItem[];
  customer_name: string;
  order_type: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PAY_METHODS = ['cash', 'card', 'upi', 'wallet'];

// ── POS Main ──────────────────────────────────────────────────────────────────
export default function InvoicingPage() {
  const numRef = useRef<HTMLInputElement>(null);

  const [itemNumInput, setItemNumInput]     = useState('');
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [searching, setSearching]           = useState(false);
  const [customerName, setCustomerName]     = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone]   = useState('');
  const [orderType, setOrderType]           = useState('dine_in');
  const [paymentMethod, setPaymentMethod]   = useState('cash');
  const [discount, setDiscount]             = useState(0);
  const [notes, setNotes]                   = useState('');
  const [lastOrder, setLastOrder]           = useState<CompletedOrder | null>(null);
  const [showReceipt, setShowReceipt]       = useState(false);

  const subtotal     = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt  = Math.min(discount, subtotal);
  const total        = subtotal - discountAmt;

  // ── Fetch item by number ────────────────────────────────────────────────────
  async function fetchItem() {
    const num = parseInt(itemNumInput);
    if (!num) return;
    setSearching(true);
    try {
      const res  = await rMenuApi.getItemByNumber(num);
      const item = res.data.data;
      setCart(prev => {
        const exists = prev.find(c => c.id === item.id);
        if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
        return [...prev, {
          id: item.id, item_number: item.item_number, name: item.name,
          category_name: item.category_name, price: Number(item.price),
          qty: 1, is_veg: item.is_veg,
        }];
      });
      setItemNumInput('');
      numRef.current?.focus();
    } catch {
      toast.error(`Item #${num} not found or unavailable.`);
      setItemNumInput('');
      numRef.current?.focus();
    } finally { setSearching(false); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') fetchItem();
  }

  function changeQty(id: number, delta: number) {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  }

  function clearCart() {
    setCart([]); setDiscount(0); setNotes('');
    setCustomerName('Walk-in Customer'); setCustomerPhone('');
    setOrderType('dine_in'); setPaymentMethod('cash');
    numRef.current?.focus();
  }

  // ── Place order ─────────────────────────────────────────────────────────────
  const placeMutation = useMutation({
    mutationFn: () => rOrdersApi.create({
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      customer_name: customerName || 'Walk-in Customer',
      customer_phone: customerPhone,
      order_type: orderType,
      payment_method: paymentMethod,
      payment_status: 'paid',
      discount: discountAmt,
      notes,
      source: 'pos',
    }),
    onSuccess: (res) => {
      const o = res.data.data;
      setLastOrder({
        order_number: o.order_number,
        total: o.total,
        payment_method: paymentMethod,
        items: [...cart],
        customer_name: customerName || 'Walk-in Customer',
        order_type: orderType,
        created_at: new Date().toISOString(),
      });
      setShowReceipt(true);
      clearCart();
      toast.success(`Order ${o.order_number} placed!`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to place order'),
  });

  // ── Receipt Modal ───────────────────────────────────────────────────────────
  if (showReceipt && lastOrder) {
    return (
      <div className="flex flex-col h-full">
        <RestaurantHeader title="Invoicing & POS" subtitle="Order placed successfully" />
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden">
            {/* Receipt header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-center text-white">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
              <p className="font-black text-xl">Order Confirmed</p>
              <p className="font-mono text-sm mt-1 opacity-80">{lastOrder.order_number}</p>
            </div>

            {/* Customer */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                {lastOrder.customer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{lastOrder.customer_name}</p>
                <p className="text-xs text-gray-400">{lastOrder.order_type.replace('_', ' ')} · {lastOrder.payment_method.toUpperCase()}</p>
              </div>
            </div>

            {/* Items */}
            <div className="px-6 py-3 space-y-2">
              {lastOrder.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.qty}× {item.name}</span>
                  <span className="font-medium text-gray-800">₹{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mx-6 mb-4 p-3 bg-gray-50 rounded-xl flex justify-between items-center">
              <span className="font-bold text-gray-700">Total Paid</span>
              <span className="text-xl font-black text-emerald-700">₹{Number(lastOrder.total).toLocaleString()}</span>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => { setShowReceipt(false); setTimeout(() => numRef.current?.focus(), 100); }}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition text-sm"
              >
                New Order
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm"
              >
                🖨 Print
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── POS Layout ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <RestaurantHeader
        title="Invoicing & POS"
        subtitle="Type item number to build a bill instantly"
        actions={
          cart.length > 0
            ? <button onClick={clearCart} className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">Clear Bill</button>
            : undefined
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: Item input + cart ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
          {/* Item number input */}
          <div className="p-5 bg-white border-b border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Enter Item Number</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-200 select-none">#</span>
                <input
                  ref={numRef}
                  autoFocus
                  type="number"
                  value={itemNumInput}
                  onChange={e => setItemNumInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="e.g. 5"
                  className="w-full pl-10 pr-4 py-4 text-3xl font-black font-mono border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition bg-white"
                />
              </div>
              <button
                onClick={fetchItem}
                disabled={searching || !itemNumInput}
                className="px-6 bg-emerald-600 text-white text-base font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition min-w-[72px]"
              >
                {searching ? (
                  <svg className="w-5 h-5 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : 'Add'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Press ↵ Enter to add · Check Menu Catalog for item numbers</p>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-5">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 18v-6m-3 3h6"/>
                </svg>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-400">Bill is empty</p>
                  <p className="text-sm text-gray-300 mt-0.5">Type an item number above to start</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[32px_1fr_100px_90px] gap-3 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>#</span><span>Item</span><span className="text-center">Qty</span><span className="text-right">Amount</span>
                </div>

                {cart.map(item => (
                  <div key={item.id} className="grid grid-cols-[32px_1fr_100px_90px] gap-3 items-center bg-white rounded-2xl border border-gray-100 px-3 py-3 hover:border-gray-200 transition group">
                    {/* Item # badge */}
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 font-mono text-xs font-bold shrink-0">
                      {item.item_number}
                    </span>

                    {/* Name + category */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">₹{item.price.toFixed(2)} each{item.category_name ? ` · ${item.category_name}` : ''}</p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={() => changeQty(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 font-bold text-sm transition">
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-gray-800">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, +1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 font-bold text-sm transition">
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <p className="text-sm font-bold text-gray-800 text-right">₹{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Customer + Bill summary ──────────────────────────────── */}
        <div className="w-80 flex flex-col bg-white overflow-y-auto shrink-0">
          <div className="p-5 space-y-5 flex-1">
            {/* Customer */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Customer</p>
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2" />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {/* Order type */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Order Type</p>
              <div className="flex gap-1.5">
                {[['dine_in', '🍽 Dine In'], ['takeaway', '🥡 Takeaway'], ['delivery', '🛵 Delivery']].map(([v, l]) => (
                  <button key={v} onClick={() => setOrderType(v)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                      orderType === v ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>{l}</button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PAY_METHODS.map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold border uppercase transition ${
                      paymentMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>{m}</button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Discount (₹)</p>
              <input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {/* Notes */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Special instructions, allergies…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>
          </div>

          {/* Bill summary + confirm */}
          <div className="border-t border-gray-100 p-5 space-y-3 shrink-0">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Discount</span>
                  <span>− ₹{discountAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-2 mt-2">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              onClick={() => placeMutation.mutate()}
              disabled={cart.length === 0 || placeMutation.isPending}
              className="w-full py-4 bg-emerald-600 text-white font-black text-base rounded-2xl hover:bg-emerald-700 disabled:opacity-40 transition shadow-lg shadow-emerald-100"
            >
              {placeMutation.isPending ? 'Placing…' : `Confirm & Bill — ₹${total.toLocaleString()}`}
            </button>

            {cart.length > 0 && (
              <p className="text-center text-[11px] text-gray-400">
                {cart.reduce((s, c) => s + c.qty, 0)} items · {paymentMethod.toUpperCase()} · {orderType.replace('_', ' ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
