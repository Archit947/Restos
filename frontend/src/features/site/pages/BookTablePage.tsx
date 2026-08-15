import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { publicApi } from '../../../api/public';

interface Props { subdomain: string; restaurant: any; }

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20];

export default function BookTablePage({ subdomain, restaurant }: Props) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const isEmber = templateId === 'ember';

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    reservation_date: '',
    reservation_time: '',
    special_requests: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [err, setErr] = useState('');

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    const { customer_name, customer_phone, reservation_date, reservation_time, party_size } = form;
    if (!customer_name || !customer_phone || !reservation_date || !reservation_time) {
      setErr('Please fill in all required fields.'); return;
    }
    setLoading(true); setErr('');
    try {
      const res = await publicApi.bookTable(subdomain, { ...form });
      setSuccess(res.data.data);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Reservation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 'var(--s-radius-sm)',
    border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)',
    color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', fontSize: 14,
    boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--s-muted)', marginBottom: 6,
  };

  if (success) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>{isLuxe ? '✦' : '🎊'}</div>
        <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 28, fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)', marginBottom: 12 }}>
          {isLuxe ? 'Reservation Confirmed' : 'Table Booked!'}
        </h2>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '0 auto 20px' }} />}
        <p style={{ fontSize: 15, color: 'var(--s-muted)', lineHeight: 1.7, marginBottom: 24 }}>
          Your reservation at <strong style={{ color: 'var(--s-text)' }}>{restaurant.restaurant_name}</strong> has been confirmed.
          We look forward to welcoming you.
        </p>
        <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
            {[
              { label: 'Name', val: form.customer_name },
              { label: 'Party Size', val: `${form.party_size} guest${form.party_size > 1 ? 's' : ''}` },
              { label: 'Date', val: new Date(form.reservation_date + 'T00:00').toLocaleDateString('en', { dateStyle: 'long' }) },
              { label: 'Time', val: form.reservation_time },
            ].map(({ label, val }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: 'var(--s-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 14, color: 'var(--s-text)', fontWeight: 500 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => { setSuccess(null); setForm({ customer_name:'', customer_phone:'', customer_email:'', party_size:2, reservation_date:'', reservation_time:'', special_requests:'' }); }}
          style={{ padding: '12px 32px', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--s-body-font)', fontWeight: 600, fontSize: 15 }}
        >
          Make Another Reservation
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ marginBottom: 40, textAlign: isLuxe ? 'center' : 'left' }}>
        {isLuxe && <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>Reservations</p>}
        <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(32px,5vw,48px)', fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)', marginBottom: 8 }}>
          {isLuxe ? 'Reserve a Table' : isEmber ? 'Book Your Table' : 'Book a Table'}
        </h1>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '12px auto 0' }} />}
        {!isLuxe && <p style={{ fontSize: 15, color: 'var(--s-muted)' }}>Reserve your spot at {restaurant.restaurant_name}</p>}
      </div>

      <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: '32px 28px' }}>
        {err && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 20, padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)' }}>{err}</p>}

        {/* Name + Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Your name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone *</label>
            <input value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} placeholder="+91 00000 00000" style={inputStyle} type="tel" />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email (optional)</label>
          <input value={form.customer_email} onChange={e => set('customer_email', e.target.value)} placeholder="for confirmation" style={inputStyle} type="email" />
        </div>

        {/* Date + Time + Party */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input value={form.reservation_date} onChange={e => set('reservation_date', e.target.value)} type="date" min={today} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Time *</label>
            <input value={form.reservation_time} onChange={e => set('reservation_time', e.target.value)} type="time" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Guests *</label>
            <select value={form.party_size} onChange={e => set('party_size', +e.target.value)} style={{ ...inputStyle }}>
              {PARTY_SIZES.map(n => <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>

        {/* Special requests */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Special Requests</label>
          <textarea
            value={form.special_requests} onChange={e => set('special_requests', e.target.value)}
            placeholder="Dietary restrictions, allergies, occasion…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <button
          onClick={submit} disabled={loading}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 'var(--s-radius-sm)', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: 'var(--s-primary)', color: '#fff',
            fontFamily: 'var(--s-body-font)', fontWeight: 700, fontSize: 16,
            opacity: loading ? 0.7 : 1, letterSpacing: isLuxe ? '0.1em' : undefined,
            textTransform: isLuxe ? 'uppercase' : undefined,
          }}
        >
          {loading ? 'Reserving…' : isLuxe ? 'Confirm Reservation' : 'Book Table'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--s-muted)', marginTop: 14 }}>
          We'll confirm your reservation shortly.
        </p>
      </div>
    </div>
  );
}
