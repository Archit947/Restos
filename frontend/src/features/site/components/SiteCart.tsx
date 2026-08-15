import React, { useState } from 'react';
import { useCartStore } from '../cartStore';
import { useTheme } from '../ThemeContext';
import { publicApi } from '../../../api/public';

interface Props { subdomain: string; }

export default function SiteCart({ subdomain }: Props) {
  const { open, items, setOpen, removeItem, updateQty, clearCart, total, count } = useCartStore();
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';

  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', order_type: 'dine_in', special_instructions: '' });
  const [loading, setLoading] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [err, setErr] = useState('');

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const currency = items[0]?.currency || '₹';

  const placeOrder = async () => {
    if (!form.customer_name || !form.customer_phone) { setErr('Name and phone are required.'); return; }
    setLoading(true); setErr('');
    try {
      const res = await publicApi.placeOrder(subdomain, {
        ...form,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, currency: i.currency })),
        subtotal: total(),
        total: total(),
      });
      setOrderRef(res.data.data.orderNumber);
      setStep('success');
      clearCart();
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--s-radius-sm)',
    border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)',
    color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', fontSize: 13,
    boxSizing: 'border-box',
  };

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 400 }} onClick={() => setOpen(false)} />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '95vw',
        backgroundColor: 'var(--s-bg2)', borderLeft: '1px solid var(--s-border)',
        zIndex: 401, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--s-border)' }}>
          <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 20, fontWeight: isLuxe ? 400 : 700, color: 'var(--s-text)', margin: 0 }}>
            {step === 'success' ? 'Order Placed!' : step === 'checkout' ? 'Checkout' : `Cart (${count()})`}
          </h3>
          <button onClick={() => { setOpen(false); setStep('cart'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--s-muted)', fontSize: 24, lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {step === 'success' && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h4 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 22, color: 'var(--s-text)', marginBottom: 8 }}>Order Confirmed!</h4>
              <p style={{ color: 'var(--s-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Your order has been placed. Track it using:</p>
              <p style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: 'var(--s-primary)', letterSpacing: '0.1em', marginBottom: 24 }}>{orderRef}</p>
              <button onClick={() => { setOpen(false); setStep('cart'); }} style={{ padding: '11px 28px', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--s-body-font)', fontWeight: 600 }}>Done</button>
            </div>
          )}

          {step === 'checkout' && (
            <div>
              <button onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--s-primary)', fontSize: 13, fontFamily: 'var(--s-body-font)', marginBottom: 20, padding: 0 }}>← Back to cart</button>
              {err && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>{err}</p>}
              {[
                { k: 'customer_name', label: 'Name *', type: 'text' },
                { k: 'customer_phone', label: 'Phone *', type: 'tel' },
                { k: 'customer_email', label: 'Email', type: 'email' },
              ].map(({ k, label, type }) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--s-muted)', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={(form as any)[k]} onChange={e => set(k, e.target.value)} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--s-muted)', marginBottom: 5 }}>Order Type</label>
                <select value={form.order_type} onChange={e => set('order_type', e.target.value)} style={inputStyle}>
                  <option value="dine_in">Dine In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--s-muted)', marginBottom: 5 }}>Special Instructions</label>
                <textarea value={form.special_instructions} onChange={e => set('special_instructions', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {/* Order summary */}
              <div style={{ backgroundColor: 'var(--s-bg3)', borderRadius: 'var(--s-radius-sm)', padding: 16, marginBottom: 16 }}>
                {items.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--s-muted)', marginBottom: 6 }}>
                    <span>{i.qty}× {i.name}</span>
                    <span>{currency} {(i.price * i.qty).toFixed(0)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--s-border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, color: 'var(--s-text)' }}>
                  <span>Total</span><span>{currency} {total().toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--s-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <p style={{ fontSize: 15 }}>Your cart is empty.</p>
                  <p style={{ fontSize: 13, marginTop: 6 }}>Add some items from the menu!</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--s-border)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {item.is_veg ? '🥗' : '🍗'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--s-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize: 13, color: 'var(--s-primary)', fontWeight: 600 }}>{item.currency} {(item.price * item.qty).toFixed(0)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)', color: 'var(--s-text)', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--s-text)', minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)', color: 'var(--s-text)', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step === 'cart' && items.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--s-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--s-text)' }}>Total</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--s-primary)' }}>{currency} {total().toFixed(0)}</span>
            </div>
            <button onClick={() => setStep('checkout')} style={{ width: '100%', padding: '13px 0', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--s-body-font)', fontWeight: 700, fontSize: 15 }}>
              Proceed to Checkout
            </button>
          </div>
        )}

        {step === 'checkout' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--s-border)' }}>
            <button onClick={placeOrder} disabled={loading} style={{ width: '100%', padding: '13px 0', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--s-body-font)', fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Placing Order…' : `Place Order · ${currency} ${total().toFixed(0)}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
