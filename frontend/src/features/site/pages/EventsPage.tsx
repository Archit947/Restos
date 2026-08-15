import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { publicApi } from '../../../api/public';
import { imageUrl } from '../../../utils/imageUrl';

interface Props { subdomain: string; events: any[]; }

/**
 * The backend stores datetime as local time but MySQL2 serialises it with a
 * trailing 'Z' (UTC marker), causing a +5:30 shift in IST browsers.
 * Stripping the Z makes JS parse it as local time — matching what was entered.
 */
function parseLocal(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  // Remove trailing Z or any timezone offset so it parses as LOCAL time
  const s = String(dateStr).replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
  return new Date(s);
}

function EventCard({ event, subdomain, onBook }: { event: any; subdomain: string; onBook: (e: any) => void }) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const date = parseLocal(event.event_date);
  const isPast = date < new Date();
  const hasBanner = Boolean(imageUrl(event.banner));

  return (
    <div style={{ backgroundColor: 'var(--s-bg2)', borderRadius: 'var(--s-radius)', border: '1px solid var(--s-border)', overflow: 'hidden', boxShadow: 'var(--s-card-shadow)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Banner image (if available) ── */}
      {hasBanner ? (
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          <img src={imageUrl(event.banner)!} alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isPast ? 'grayscale(60%)' : 'none' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          {isPast && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />}
          {/* Date chip overlay */}
          <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.72)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'var(--s-heading-font)', lineHeight: 1, margin: 0 }}>{date.getDate()}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>{date.toLocaleString('en', { month: 'short' })}</p>
          </div>
          {/* Time chip */}
          {!isPast && (
            <div style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'var(--s-primary)', borderRadius: 6, padding: '4px 10px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#fff', margin: 0 }}>{date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )}
        </div>
      ) : (
        /* Colored top strip when no banner */
        <div style={{ height: 12, background: isPast ? '#6b7280' : 'linear-gradient(90deg, var(--s-primary), var(--s-accent))' }} />
      )}

      {/* ── Card body ── */}
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Date + title row (only when no banner) */}
        {!hasBanner && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', backgroundColor: 'var(--s-bg3)', borderRadius: 'var(--s-radius-sm)', padding: '10px 14px', flexShrink: 0 }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--s-primary)', fontFamily: 'var(--s-heading-font)', lineHeight: 1, margin: 0 }}>{date.getDate()}</p>
              <p style={{ fontSize: 11, color: 'var(--s-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{date.toLocaleString('en', { month: 'short' })}</p>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: isLuxe ? 400 : 600, fontSize: 20, color: 'var(--s-text)', marginBottom: 6, lineHeight: 1.3 }}>{event.title}</h3>
              {(event.venue || event.location) && <p style={{ fontSize: 13, color: 'var(--s-muted)', marginBottom: 4 }}>📍 {event.venue || event.location}</p>}
              <p style={{ fontSize: 13, color: 'var(--s-muted)', margin: 0 }}>🕐 {date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        )}

        {/* Title + venue (only when banner present — date already shown as chip overlay) */}
        {hasBanner && (
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: isLuxe ? 400 : 600, fontSize: 20, color: 'var(--s-text)', marginBottom: 4, lineHeight: 1.3 }}>{event.title}</h3>
            {(event.venue || event.location) && <p style={{ fontSize: 13, color: 'var(--s-muted)', margin: 0 }}>📍 {event.venue || event.location}</p>}
          </div>
        )}

        {/* Description */}
        {event.description && <p style={{ fontSize: 14, color: 'var(--s-muted)', lineHeight: 1.6, marginTop: 0, marginBottom: 16, flex: 1 }}>{event.description}</p>}

        {/* Footer: price + CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--s-border)' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--s-primary)', fontFamily: 'var(--s-heading-font)' }}>
            {event.ticket_price > 0 ? `${event.currency || '₹'} ${event.ticket_price}` : 'Free Entry'}
          </span>
          {!isPast ? (
            <button onClick={() => onBook(event)} style={{ padding: '9px 22px', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--s-body-font)', fontWeight: 600, fontSize: 14 }}>
              Book Tickets
            </button>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--s-muted)', fontStyle: 'italic' }}>Event ended</span>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingModal({ event, subdomain, onClose }: { event: any; subdomain: string; onClose: () => void }) {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', tickets: 1 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setLoading(true); setErr('');
    try {
      const res = await publicApi.bookEvent(subdomain, event.id, form);
      setResult(res.data.data);
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }} onClick={onClose}>
      <div style={{ backgroundColor: 'var(--s-bg2)', borderRadius: 'var(--s-radius)', border: '1px solid var(--s-border)', width: '100%', maxWidth: 440, padding: 32 }} onClick={e => e.stopPropagation()}>
        {result ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 22, color: 'var(--s-text)', marginBottom: 8 }}>Booking Confirmed!</h3>
            <p style={{ color: 'var(--s-muted)', marginBottom: 16 }}>Your booking reference:</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--s-primary)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{result.bookingReference}</p>
            <p style={{ color: 'var(--s-muted)', marginTop: 8, fontSize: 14 }}>{form.tickets} ticket(s) · {result.event}</p>
            <button onClick={onClose} style={{ marginTop: 24, padding: '10px 28px', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--s-body-font)', fontWeight: 600 }}>Close</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 20, color: 'var(--s-text)', marginBottom: 4 }}>{event.title}</h3>
            <p style={{ color: 'var(--s-muted)', fontSize: 13, marginBottom: 24 }}>Fill in your details to book</p>
            {err && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>{err}</p>}
            {[
              { k: 'customer_name', label: 'Full Name', type: 'text' },
              { k: 'customer_email', label: 'Email', type: 'email' },
              { k: 'customer_phone', label: 'Phone', type: 'tel' },
            ].map(({ k, label, type }) => (
              <div key={k} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--s-muted)', marginBottom: 6 }}>{label}</label>
                <input type={type} value={(form as any)[k]} onChange={e => set(k, e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--s-radius-sm)', border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)', color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--s-muted)', marginBottom: 6 }}>Number of Tickets</label>
              <input type="number" min={1} max={10} value={form.tickets} onChange={e => set('tickets', +e.target.value)}
                style={{ width: 80, padding: '10px 12px', borderRadius: 'var(--s-radius-sm)', border: '1px solid var(--s-border)', backgroundColor: 'var(--s-bg3)', color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px 0', borderRadius: 'var(--s-radius-sm)', border: '1px solid var(--s-border)', backgroundColor: 'transparent', color: 'var(--s-muted)', cursor: 'pointer', fontFamily: 'var(--s-body-font)', fontSize: 14 }}>Cancel</button>
              <button onClick={submit} disabled={loading} style={{ flex: 2, padding: '11px 0', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--s-body-font)', fontWeight: 600, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Booking…' : `Confirm Booking${event.ticket_price > 0 ? ` · ${event.currency || '₹'}${event.ticket_price * form.tickets}` : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function EventsPage({ subdomain, events }: Props) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const [bookingEvent, setBookingEvent] = useState<any>(null);

  const upcoming = events.filter(e => parseLocal(e.event_date) >= new Date());
  const past = events.filter(e => parseLocal(e.event_date) < new Date());

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ marginBottom: 48, textAlign: isLuxe ? 'center' : 'left' }}>
        {isLuxe && <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>Events</p>}
        <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)' }}>Events & Tickets</h1>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '12px auto 0' }} />}
      </div>

      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--s-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 16 }}>No upcoming events at the moment. Check back soon!</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 22, color: 'var(--s-text)', marginBottom: 24, fontWeight: 600 }}>Upcoming Events</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
            {upcoming.map(e => <EventCard key={e.id} event={e} subdomain={subdomain} onBook={setBookingEvent} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div style={{ opacity: 0.6 }}>
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 18, color: 'var(--s-text)', marginBottom: 20, fontWeight: 500 }}>Past Events</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {past.slice(0, 4).map(e => <EventCard key={e.id} event={e} subdomain={subdomain} onBook={() => {}} />)}
          </div>
        </div>
      )}

      {bookingEvent && <BookingModal event={bookingEvent} subdomain={subdomain} onClose={() => setBookingEvent(null)} />}
    </div>
  );
}
