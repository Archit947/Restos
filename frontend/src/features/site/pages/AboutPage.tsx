import React from 'react';
import { useTheme } from '../ThemeContext';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmtTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

interface Block {
  type: 'heading' | 'paragraph' | 'image';
  content?: string;
  url?: string;
  level?: 1 | 2 | 3;
}

function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks.length) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const sizes: Record<number, number> = { 1: 32, 2: 26, 3: 20 };
          const sz = sizes[block.level ?? 2] ?? 26;
          return (
            <h2 key={i} style={{
              fontFamily: 'var(--s-heading-font)', fontSize: sz,
              fontWeight: 600, color: 'var(--s-text)', margin: '28px 0 12px', lineHeight: 1.2,
            }}>{block.content}</h2>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <p key={i} style={{ fontSize: 15, color: 'var(--s-muted)', lineHeight: 1.8, marginBottom: 16 }}>
              {block.content}
            </p>
          );
        }
        if (block.type === 'image') {
          return (
            <img key={i} src={block.url} alt={block.content || ''}
              style={{ width: '100%', borderRadius: 'var(--s-radius)', marginBottom: 20, objectFit: 'cover', maxHeight: 440, display: 'block' }}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

interface Props { restaurant: any; hours: any[]; address: any; blocks?: Block[]; }

export default function AboutPage({ restaurant, address, blocks = [] }: Props) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
      {/* Page heading */}
      <div style={{ marginBottom: 48, textAlign: isLuxe ? 'center' : 'left' }}>
        {isLuxe && (
          <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>
            Our Story
          </p>
        )}
        <h1 style={{
          fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(32px,5vw,52px)',
          fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)',
        }}>About</h1>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '12px auto 0' }} />}
      </div>

      {/* Custom about-page blocks (admin-built content) */}
      {blocks.length > 0 && <BlockRenderer blocks={blocks} />}

      {/* Fallback if no blocks: show restaurant name + cuisine */}
      {blocks.length === 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 24, fontWeight: isLuxe ? 400 : 700, color: 'var(--s-text)', marginBottom: 12 }}>
            {restaurant.restaurant_name}
          </h2>
          {restaurant.cuisine_type && (
            <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--s-primary)', marginBottom: 8 }}>
              {restaurant.cuisine_type}
            </p>
          )}
          <p style={{ fontSize: 15, color: 'var(--s-muted)', lineHeight: 1.8 }}>
            No about page content has been set yet. Check back soon!
          </p>
        </div>
      )}

      {/* Contact & Location cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, marginTop: 24 }}>
        {(restaurant.phone || restaurant.email || restaurant.whatsapp) && (
          <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 16, color: 'var(--s-text)', marginBottom: 14 }}>
              Contact
            </h3>
            {[
              restaurant.phone    && ['📞', restaurant.phone],
              restaurant.email    && ['✉️', restaurant.email],
              restaurant.whatsapp && ['💬', restaurant.whatsapp],
            ].filter(Boolean).map((row: any, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14, color: 'var(--s-muted)' }}>
                <span>{row[0]}</span><span>{row[1]}</span>
              </div>
            ))}
          </div>
        )}

        {address && (
          <div style={{ backgroundColor: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 'var(--s-radius)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 16, color: 'var(--s-text)', marginBottom: 14 }}>
              Location
            </h3>
            <p style={{ fontSize: 14, color: 'var(--s-muted)', lineHeight: 1.7 }}>
              {[address.address, address.area, address.city, address.state, address.country].filter(Boolean).join(', ')}
              {address.zip_code && ` — ${address.zip_code}`}
            </p>
            {address.latitude && address.longitude && (
              <a href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 12, fontSize: 13, color: 'var(--s-primary)', textDecoration: 'none', fontWeight: 500 }}>
                View on Google Maps →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
