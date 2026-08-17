import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { publicApi } from '../../../api/public';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Received',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const STATUS_ICONS: Record<string, string> = {
  pending: '🕐', confirmed: '✅', preparing: '👨‍🍳', ready: '📦', delivered: '🎉', cancelled: '❌',
};

interface Props { subdomain: string; }

export default function TrackPage({ subdomain }: Props) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const isEmber = templateId === 'ember';

  const [orderNum, setOrderNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState('');

  // Review form state
  const [reviewForm, setReviewForm] = useState({ customer_name: '', review_text: '', rating: 5 });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewErr, setReviewErr] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const submitReview = async () => {
    if (!reviewForm.customer_name.trim() || !reviewForm.review_text.trim()) {
      setReviewErr('Please enter your name and review.'); return;
    }
    setReviewLoading(true); setReviewErr('');
    try {
      await publicApi.submitReview(subdomain, { ...reviewForm, order_number: order?.order_number });
      setReviewSubmitted(true);
    } catch (e: any) {
      setReviewErr(e.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally { setReviewLoading(false); }
  };

  const track = async () => {
    if (!orderNum.trim()) return;
    setLoading(true); setErr(''); setOrder(null);
    try {
      const res = await publicApi.trackOrder(subdomain, orderNum.trim());
      setOrder(res.data.data);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Order not found. Please check the order number.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ marginBottom: 48, textAlign: isLuxe ? 'center' : 'left' }}>
        {isLuxe && <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>Order Status</p>}
        <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)' }}>Track Order</h1>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '12px auto 0' }} />}
      </div>

      {/* Search */}
      <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 28, marginBottom: 32 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--s-muted)', marginBottom: 8 }}>Enter your order number</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={orderNum} onChange={e => setOrderNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && track()}
            placeholder={isEmber ? 'e.g. ORD-12345678' : 'e.g. ORD-12345678'}
            style={{ flex: 1, padding: '11px 14px', borderRadius: 'var(--s-radius-sm)', border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)', color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', fontSize: 14 }}
          />
          <button
            onClick={track} disabled={loading || !orderNum.trim()}
            style={{
              padding: '11px 24px', borderRadius: 'var(--s-radius-sm)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: 'var(--s-primary)', color: '#fff', fontFamily: 'var(--s-body-font)', fontWeight: 600, fontSize: 14,
              opacity: loading || !orderNum.trim() ? 0.6 : 1, whiteSpace: 'nowrap',
            }}
          >
            {loading ? '…' : 'Track'}
          </button>
        </div>
        {err && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>{err}</p>}
      </div>

      {order && (
        <>
        <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 28 }}>
          {/* Order header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--s-muted)', marginBottom: 4 }}>Order Number</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--s-text)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{order.order_number}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--s-muted)', marginBottom: 4 }}>Placed On</p>
              <p style={{ fontSize: 14, color: 'var(--s-text)' }}>{new Date(order.created_at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          </div>

          {/* Status tracker */}
          {!isCancelled ? (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx <= stepIndex;
                  const current = idx === stepIndex;
                  return (
                    <React.Fragment key={step}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: current ? 44 : 34, height: current ? 44 : 34, borderRadius: '50%',
                          backgroundColor: done ? 'var(--s-primary)' : 'var(--s-bg3)',
                          border: `2px solid ${done ? 'var(--s-primary)' : 'var(--s-border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: current ? 20 : 16, transition: 'all 0.2s',
                          boxShadow: current ? '0 0 0 4px var(--s-primary)33' : 'none',
                        }}>
                          {done ? (current ? STATUS_ICONS[step] : '✓') : <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--s-border)', display: 'block' }} />}
                        </div>
                        <p style={{ fontSize: 10, color: done ? 'var(--s-primary)' : 'var(--s-muted)', marginTop: 6, textAlign: 'center', maxWidth: 60, lineHeight: 1.2, fontWeight: current ? 600 : 400 }}>
                          {STATUS_LABELS[step]}
                        </p>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 2, backgroundColor: idx < stepIndex ? 'var(--s-primary)' : 'var(--s-border)', margin: '0 2px', marginBottom: 22, transition: 'background-color 0.3s' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 'var(--s-radius-sm)', marginBottom: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: 20 }}>❌</span>
              <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 500 }}>This order has been cancelled.</p>
            </div>
          )}

          {/* Order details */}
          <div style={{ borderTop: '1px solid var(--s-border)', paddingTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Customer', val: order.customer_name },
                { label: 'Phone', val: order.customer_phone },
                { label: 'Type', val: order.order_type?.replace('_', ' ') },
                { label: 'Total', val: `${order.items?.[0]?.currency || '₹'} ${Number(order.total).toFixed(2)}` },
              ].map(({ label, val }) => val && (
                <div key={label}>
                  <p style={{ fontSize: 11, color: 'var(--s-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 14, color: 'var(--s-text)', fontWeight: 500, textTransform: 'capitalize' }}>{val}</p>
                </div>
              ))}
            </div>

            {order.items && order.items.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--s-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Items Ordered</p>
                {order.items.map((it: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--s-border)' }}>
                    <span style={{ fontSize: 14, color: 'var(--s-text)' }}>{it.qty}× {it.name}</span>
                    <span style={{ fontSize: 14, color: 'var(--s-muted)' }}>{it.currency} {(it.price * it.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--s-text)' }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--s-primary)' }}>{order.items[0]?.currency} {Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {order.status === 'delivered' && (
          <div style={{
            backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)',
            borderRadius: 'var(--s-radius)', padding: 28, marginTop: 20,
          }}>
            {reviewSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 20, color: 'var(--s-text)', marginBottom: 8 }}>
                  Thank you for your review!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--s-muted)' }}>Your feedback helps other customers and means a lot to us.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 18, fontWeight: 600, color: 'var(--s-text)', marginBottom: 6 }}>
                  How was your experience?
                </h3>
                <p style={{ fontSize: 13, color: 'var(--s-muted)', marginBottom: 20 }}>Leave a review to help us improve.</p>

                {/* Star rating */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--s-muted)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rating</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 28, padding: 2, lineHeight: 1, opacity: n <= reviewForm.rating ? 1 : 0.25, transition: 'opacity 0.15s' }}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--s-muted)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Name</label>
                  <input
                    value={reviewForm.customer_name}
                    onChange={e => setReviewForm(f => ({ ...f, customer_name: e.target.value }))}
                    placeholder="e.g. Priya S."
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 'var(--s-radius-sm)',
                      border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)',
                      color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', fontSize: 14,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Review text */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--s-muted)', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Review</label>
                  <textarea
                    value={reviewForm.review_text}
                    onChange={e => setReviewForm(f => ({ ...f, review_text: e.target.value }))}
                    placeholder="Tell us about your experience…"
                    rows={4}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 'var(--s-radius-sm)',
                      border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)',
                      color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', fontSize: 14,
                      resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {reviewErr && (
                  <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 14, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 4 }}>
                    {reviewErr}
                  </p>
                )}

                <button
                  onClick={submitReview} disabled={reviewLoading}
                  style={{
                    padding: '11px 28px', borderRadius: 'var(--s-radius-sm)', border: 'none',
                    backgroundColor: 'var(--s-primary)', color: '#fff',
                    fontFamily: 'var(--s-body-font)', fontWeight: 600, fontSize: 14,
                    cursor: reviewLoading ? 'not-allowed' : 'pointer', opacity: reviewLoading ? 0.7 : 1,
                  }}
                >
                  {reviewLoading ? 'Submitting…' : 'Submit Review'}
                </button>
              </>
            )}
          </div>
        )}
        </>
      )}
    </div>
  );
}
