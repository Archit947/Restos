import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

interface FooterProps {
  subdomain: string;
  restaurant: any;
  address: any;
  hours: any[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

function BloomFooter({ subdomain, restaurant, address, hours }: FooterProps) {
  const base = `/s/${subdomain}`;
  return (
    <footer style={{ backgroundColor: 'var(--s-primary)', color: '#fff', paddingTop: 56, paddingBottom: 32 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 40, marginBottom: 40 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{restaurant.restaurant_name}</h3>
            {restaurant.description && <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.7, marginBottom: 16 }}>{restaurant.description}</p>}
            <p style={{ fontSize: 13, opacity: 0.7 }}>📍 {[address?.city, address?.state].filter(Boolean).join(', ')}</p>
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>Quick Links</h4>
            {[['', 'Home'], ['/menu', 'Food Menu'], ['/events', 'Events'], ['/blog', 'Blog'], ['/about', 'About & Hours'], ['/book', 'Book a Table']].map(([to, label]) => (
              <NavLink key={to} to={`${base}${to}`} style={{ display: 'block', color: '#fff', opacity: 0.8, textDecoration: 'none', fontSize: 14, marginBottom: 6, transition: 'opacity 0.15s' }}>{label}</NavLink>
            ))}
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>Hours</h4>
            {hours.slice(0, 7).map((h: any) => (
              <div key={h.day_of_week} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, opacity: h.is_open ? 1 : 0.4 }}>
                <span>{DAYS[h.day_of_week]}</span>
                <span>{h.is_open ? `${fmtTime(h.open_time)} – ${fmtTime(h.close_time)}` : 'Closed'}</span>
              </div>
            ))}
          </div>
          {(restaurant.phone || restaurant.email) && (
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>Contact</h4>
              {restaurant.phone && <p style={{ fontSize: 14, marginBottom: 6 }}>📞 {restaurant.phone}</p>}
              {restaurant.email && <p style={{ fontSize: 14, marginBottom: 6 }}>✉️ {restaurant.email}</p>}
              {restaurant.whatsapp && <p style={{ fontSize: 14 }}>💬 {restaurant.whatsapp}</p>}
            </div>
          )}
        </div>
        <div style={{ borderTop: 'rgba(255,255,255,0.2) 1px solid', paddingTop: 24, textAlign: 'center', fontSize: 12, opacity: 0.5 }}>
          © {new Date().getFullYear()} {restaurant.restaurant_name} · Powered by Restos
        </div>
      </div>
    </footer>
  );
}

function EmberFooter({ subdomain, restaurant, address, hours }: FooterProps) {
  const base = `/s/${subdomain}`;
  return (
    <footer style={{ backgroundColor: '#080808', borderTop: '1px solid var(--s-border)', paddingTop: 64, paddingBottom: 32 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 48, marginBottom: 48 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 28, fontWeight: 700, color: 'var(--s-accent)', marginBottom: 12, lineHeight: 1.2 }}>{restaurant.restaurant_name}</h3>
            {restaurant.cuisine_type && <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--s-primary)', marginBottom: 10 }}>{restaurant.cuisine_type}</p>}
            {restaurant.description && <p style={{ fontSize: 14, color: 'var(--s-muted)', lineHeight: 1.7, marginBottom: 16 }}>{restaurant.description.substring(0, 120)}...</p>}
          </div>
          <div>
            <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--s-primary)', marginBottom: 16 }}>Navigate</h4>
            {[['', 'Home'], ['/menu', 'Food Menu'], ['/events', 'Events & Tickets'], ['/blog', 'Stories & Blog'], ['/about', 'About & Hours'], ['/book', 'Book a Table']].map(([to, label]) => (
              <NavLink key={to} to={`${base}${to}`} style={{ display: 'block', color: 'var(--s-muted)', textDecoration: 'none', fontSize: 14, marginBottom: 8 }}>{label}</NavLink>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--s-primary)', marginBottom: 16 }}>Opening Hours</h4>
            {hours.slice(0, 7).map((h: any) => (
              <div key={h.day_of_week} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: h.is_open ? 'var(--s-muted)' : '#444', marginBottom: 6 }}>
                <span style={{ color: h.is_open ? 'var(--s-text)' : '#444' }}>{DAYS[h.day_of_week]}</span>
                <span>{h.is_open ? `${fmtTime(h.open_time)} – ${fmtTime(h.close_time)}` : 'Closed'}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 24, textAlign: 'center', fontSize: 12, color: '#444' }}>
          © {new Date().getFullYear()} {restaurant.restaurant_name} · Powered by <span style={{ color: 'var(--s-primary)' }}>Restos</span>
        </div>
      </div>
    </footer>
  );
}

function LuxeFooter({ subdomain, restaurant, address, hours }: FooterProps) {
  const base = `/s/${subdomain}`;
  return (
    <footer style={{ backgroundColor: '#050810', borderTop: '1px solid var(--s-border)', paddingTop: 64, paddingBottom: 32 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        {/* Centered brand */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 34, fontWeight: 300, color: 'var(--s-primary)', letterSpacing: '0.1em', marginBottom: 8 }}>{restaurant.restaurant_name}</h3>
          <div style={{ width: 60, height: 1, background: 'var(--s-primary)', margin: '0 auto 12px' }} />
          {restaurant.cuisine_type && <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--s-muted)' }}>{restaurant.cuisine_type}</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 40, marginBottom: 48 }}>
          <div>
            <h4 style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--s-primary)', marginBottom: 16 }}>Explore</h4>
            {[['', 'Home'], ['/menu', 'Our Menu'], ['/events', 'Events'], ['/blog', 'Stories'], ['/about', 'About Us'], ['/book', 'Reservations']].map(([to, label]) => (
              <NavLink key={to} to={`${base}${to}`} style={{ display: 'block', color: 'var(--s-muted)', textDecoration: 'none', fontSize: 13, marginBottom: 8, letterSpacing: '0.03em' }}>{label}</NavLink>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--s-primary)', marginBottom: 16 }}>Hours</h4>
            {hours.slice(0, 7).map((h: any) => (
              <div key={h.day_of_week} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--s-muted)', marginBottom: 6, letterSpacing: '0.03em' }}>
                <span>{DAYS[h.day_of_week]}</span>
                <span style={{ color: h.is_open ? 'var(--s-text)' : '#444' }}>{h.is_open ? `${fmtTime(h.open_time)} – ${fmtTime(h.close_time)}` : '—'}</span>
              </div>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--s-primary)', marginBottom: 16 }}>Contact</h4>
            {[address?.address, [address?.city, address?.state].filter(Boolean).join(', '), address?.country].filter(Boolean).map((line, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--s-muted)', marginBottom: 4, letterSpacing: '0.03em' }}>{line}</p>
            ))}
            {restaurant.phone && <p style={{ fontSize: 12, color: 'var(--s-muted)', marginTop: 8 }}>{restaurant.phone}</p>}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--s-border)', paddingTop: 24, textAlign: 'center', fontSize: 11, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          © {new Date().getFullYear()} {restaurant.restaurant_name}
        </div>
      </div>
    </footer>
  );
}

export default function SiteFooter(props: FooterProps) {
  const { templateId } = useTheme();
  if (templateId === 'ember') return <EmberFooter {...props} />;
  if (templateId === 'luxe')  return <LuxeFooter {...props} />;
  return <BloomFooter {...props} />;
}
