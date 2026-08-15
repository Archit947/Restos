import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi } from '../../../api/public';

interface StorePageProps {
  subdomain: string;
}

function CartIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  currency: string;
}

interface CheckoutForm {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  notes: string;
}

export default function StorePage({ subdomain }: StorePageProps) {
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [catFilter, setCatFilter] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordered, setOrdered]     = useState<{ orderNumber: string; total: number } | null>(null);
  const [form, setForm]           = useState<CheckoutForm>({ customer_name: '', customer_phone: '', customer_email: '', customer_address: '', notes: '' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-store', subdomain],
    queryFn: () => publicApi.getStore(subdomain).then(r => r.data.data),
  });

  const placeOrder = useMutation({
    mutationFn: () => publicApi.placeStoreOrder(subdomain, {
      ...form,
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
    }),
    onSuccess: (res) => {
      setOrdered(res.data.data);
      setCart([]);
      setCheckoutOpen(false);
    },
  });

  if (isLoading) return (
    <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'var(--s-body-font)' }}>
      Loading store…
    </div>
  );

  if (isError) return (
    <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 48 }}>🏪</span>
      <p style={{ color: '#888', fontFamily: 'var(--s-body-font)' }}>Store is not available.</p>
    </div>
  );

  const { categories = [], items = [] } = data || {};
  const filtered = catFilter ? items.filter((i: any) => String(i.category_id) === catFilter) : items;
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: 1, currency: item.currency || '₹' }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0);
      return updated;
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: 'var(--s-body-font)' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--s-text)', fontFamily: 'var(--s-heading-font)', margin: '0 0 8px' }}>
          🏪 Our Store
        </h1>
        <p style={{ color: 'var(--s-muted)', fontSize: 14 }}>
          Browse and order from our selection of products.
        </p>
      </div>

      {/* Order success banner */}
      {ordered && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 20, margin: '0 0 6px' }}>🎉</p>
          <p style={{ fontWeight: 700, color: 'var(--s-text)', margin: '0 0 4px' }}>Order Placed!</p>
          <p style={{ color: 'var(--s-muted)', fontSize: 14, margin: 0 }}>Order Number: <strong>{ordered.orderNumber}</strong> · Total: ₹{ordered.total}</p>
          <button onClick={() => setOrdered(null)} style={{ marginTop: 12, padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.4)', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: 13 }}>Close</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: cart.length > 0 ? '1fr 320px' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: products */}
        <div>
          {/* Category filter */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              <button onClick={() => setCatFilter('')} style={catBtn(!catFilter)}>All</button>
              {categories.map((c: any) => (
                <button key={c.id} onClick={() => setCatFilter(String(c.id))} style={catBtn(catFilter === String(c.id))}>{c.name}</button>
              ))}
            </div>
          )}

          {/* Items grid */}
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--s-muted)', fontSize: 14 }}>No items available in this category.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {filtered.map((item: any) => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div key={item.id} style={{ background: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 14, overflow: 'hidden' }}>
                    {item.image
                      ? <img src={item.image} alt={item.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                      : <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, background: 'var(--s-bg3)' }}>📦</div>
                    }
                    <div style={{ padding: 14 }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'var(--s-text)' }}>{item.name}</p>
                      {item.description && <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--s-muted)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.description}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--s-primary)' }}>₹{item.price}</span>
                        {item.stock_quantity === 0 ? (
                          <span style={{ fontSize: 12, color: '#ef4444' }}>Out of stock</span>
                        ) : inCart ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => updateQty(item.id, -1)} style={qtyBtn}>−</button>
                            <span style={{ fontWeight: 600, color: 'var(--s-text)', minWidth: 20, textAlign: 'center' }}>{inCart.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} style={qtyBtn}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--s-primary)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: cart */}
        {cart.length > 0 && (
          <div style={{ background: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 16, padding: 20, position: 'sticky', top: 80 }}>
            <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: 'var(--s-text)' }}>
              <CartIcon /> Cart ({cartCount})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--s-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ margin: '2px 0 0', color: 'var(--s-muted)', fontSize: 12 }}>₹{item.price} × {item.qty}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={qtyBtn}>−</button>
                    <button onClick={() => updateQty(item.id, 1)} style={qtyBtn}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--s-border)', paddingTop: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, color: 'var(--s-text)' }}>
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <button onClick={() => setCheckoutOpen(true)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: 'var(--s-primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Checkout →
            </button>
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: 'var(--s-bg)', border: '1px solid var(--s-border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', fontFamily: 'var(--s-body-font)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: 'var(--s-text)', fontFamily: 'var(--s-heading-font)', fontSize: 18 }}>Checkout</h3>
              <button onClick={() => setCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--s-muted)', cursor: 'pointer', fontSize: 22 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { k: 'customer_name',    label: 'Full Name *',   type: 'text' },
                { k: 'customer_phone',   label: 'Phone *',       type: 'tel' },
                { k: 'customer_email',   label: 'Email',         type: 'email' },
                { k: 'customer_address', label: 'Delivery Address', type: 'text' },
              ].map(({ k, label, type }) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--s-muted)', marginBottom: 4 }}>{label}</label>
                  <input type={type} value={(form as any)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--s-border)', background: 'var(--s-bg2)', color: 'var(--s-text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--s-muted)', marginBottom: 4 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--s-border)', background: 'var(--s-bg2)', color: 'var(--s-text)', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              {/* Order summary */}
              <div style={{ background: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 10, padding: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--s-muted)' }}>ORDER SUMMARY</p>
                {cart.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--s-text)', marginBottom: 4 }}>
                    <span>{i.name} × {i.qty}</span>
                    <span>₹{(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--s-border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, color: 'var(--s-text)' }}>
                  <span>Total</span><span>₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
              {placeOrder.isError && (
                <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>
                  {(placeOrder.error as any)?.response?.data?.message || 'Failed to place order.'}
                </p>
              )}
              <button
                onClick={() => { if (!form.customer_name || !form.customer_phone) return; placeOrder.mutate(); }}
                disabled={placeOrder.isPending || !form.customer_name || !form.customer_phone}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'var(--s-primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: (placeOrder.isPending || !form.customer_name || !form.customer_phone) ? 0.6 : 1 }}>
                {placeOrder.isPending ? 'Placing Order…' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const catBtn = (active: boolean): React.CSSProperties => ({
  padding: '7px 16px', borderRadius: 20,
  border: `1.5px solid ${active ? 'var(--s-primary)' : 'var(--s-border)'}`,
  background: active ? 'var(--s-primary)' : 'var(--s-bg2)',
  color: active ? '#fff' : 'var(--s-muted)',
  fontSize: 13, cursor: 'pointer', fontFamily: 'var(--s-body-font)',
});

const qtyBtn: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 6, border: '1px solid var(--s-border)',
  background: 'var(--s-bg)', color: 'var(--s-text)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700,
};
