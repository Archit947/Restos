import React from 'react';
import { useTheme } from '../ThemeContext';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmtTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

interface Props { restaurant: any; hours: any[]; address: any; }

export default function AboutPage({ restaurant, hours, address }: Props) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const today = new Date().getDay();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ marginBottom: 48, textAlign: isLuxe ? 'center' : 'left' }}>
        {isLuxe && <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>Our Story</p>}
        <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)' }}>About & Hours</h1>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '12px auto 0' }} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 40 }}>
        {/* About */}
        <div>
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 24, fontWeight: isLuxe ? 400 : 700, color: 'var(--s-text)', marginBottom: 16 }}>
            {restaurant.restaurant_name}
          </h2>
          {restaurant.cuisine_type && <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--s-primary)', marginBottom: 14 }}>{restaurant.cuisine_type}</p>}
          {restaurant.description && <p style={{ fontSize: 15, color: 'var(--s-muted)', lineHeight: 1.8, marginBottom: 24 }}>{restaurant.description}</p>}

          {/* Contact */}
          <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 16, color: 'var(--s-text)', marginBottom: 14 }}>Contact</h3>
            {[
              restaurant.phone && ['📞', restaurant.phone],
              restaurant.email && ['✉️', restaurant.email],
              restaurant.whatsapp && ['💬', restaurant.whatsapp],
            ].filter(Boolean).map((row: any, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14, color: 'var(--s-muted)' }}>
                <span>{row[0]}</span><span>{row[1]}</span>
              </div>
            ))}
          </div>

          {/* Address */}
          {address && (
            <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 20, marginTop: 16 }}>
              <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 16, color: 'var(--s-text)', marginBottom: 14 }}>Location</h3>
              <p style={{ fontSize: 14, color: 'var(--s-muted)', lineHeight: 1.7 }}>
                {[address.address, address.area, address.city, address.state, address.country].filter(Boolean).join(', ')}
                {address.zip_code && ` — ${address.zip_code}`}
              </p>
              {address.latitude && address.longitude && (
                <a
                  href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--s-primary)', textDecoration: 'none', fontWeight: 500 }}
                >
                  View on Google Maps →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hours */}
        <div>
          <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 24 }}>
            <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 22, fontWeight: isLuxe ? 400 : 700, color: 'var(--s-text)', marginBottom: 20 }}>Opening Hours</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {hours.length === 0 && <p style={{ color: 'var(--s-muted)', fontSize: 14 }}>Hours not set.</p>}
              {hours.map((h: any) => {
                const isToday = h.day_of_week === today;
                return (
                  <div key={h.day_of_week} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 0', borderBottom: '1px solid var(--s-border)',
                    backgroundColor: isToday ? 'transparent' : 'transparent',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isToday && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--s-primary)', display: 'inline-block' }} />}
                      <span style={{ fontSize: 14, fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--s-text)' : 'var(--s-muted)' }}>
                        {DAYS_FULL[h.day_of_week]}
                        {isToday && <span style={{ fontSize: 11, color: 'var(--s-primary)', marginLeft: 6 }}>Today</span>}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: isToday ? 600 : 400, color: h.is_open ? (isToday ? 'var(--s-primary)' : 'var(--s-text)') : 'var(--s-muted)' }}>
                      {h.is_open ? `${fmtTime(h.open_time)} – ${fmtTime(h.close_time)}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
