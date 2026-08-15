import React, { useState } from 'react';
import { AffiliateProduct, affiliatePublicApi, AffiliatePlacement } from '@/api/affiliate.api';

interface AffiliateAdCardProps {
  product: AffiliateProduct;
  placement: AffiliatePlacement;
}

export function AffiliateAdCard({ product, placement }: AffiliateAdCardProps) {
  const [clicking, setClicking] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (clicking) return;
    setClicking(true);
    try {
      await affiliatePublicApi.trackClick(product.id, placement);
    } catch { /* fire-and-forget */ }
    // Open in new tab after tracking
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
    setClicking(false);
  }

  const rating = product.rating != null ? Number(product.rating) : null;
  const stars  = rating ? Math.min(5, Math.max(0, Math.round(rating))) : 0;

  return (
    <div style={{
      background: 'var(--s-bg2, #ffffff)',
      border: '1px solid var(--s-border, #e5e7eb)',
      borderRadius: 'var(--s-radius, 12px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Sponsored badge */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
        <span style={{
          fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)',
        }}>Sponsored</span>
      </div>

      {/* Product image */}
      <div style={{ height: 180, background: 'var(--s-bg3, #f9fafb)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: 12 }}
          />
        ) : (
          <span style={{ fontSize: 48, opacity: 0.3 }}>🛍️</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
        {/* Brand */}
        {product.brand && (
          <p style={{ fontSize: 10, color: 'var(--s-primary, #374151)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 0 }}>
            {product.brand}
          </p>
        )}

        {/* Title */}
        <h4 style={{
          fontFamily: 'var(--s-body-font, system-ui)', fontSize: 13, fontWeight: 600,
          color: 'var(--s-text, #111827)', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          margin: 0,
        }}>
          {product.title}
        </h4>

        {/* Description */}
        {product.description && (
          <p style={{
            fontSize: 11, color: 'var(--s-muted, #6b7280)', lineHeight: 1.55,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            margin: 0,
          }}>
            {product.description}
          </p>
        )}

        {/* Rating */}
        {rating != null && rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#f59e0b', fontSize: 12 }}>
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--s-muted, #9ca3af)' }}>{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Price */}
        {product.price && (
          <p style={{ fontFamily: 'var(--s-body-font, system-ui)', fontSize: 17, fontWeight: 700, color: 'var(--s-text, #111827)', margin: 0 }}>
            {product.currency} {Number(product.price).toLocaleString()}
          </p>
        )}

        {/* CTA button */}
        <a
          href={product.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          style={{
            display: 'block', textAlign: 'center', padding: '9px 0',
            borderRadius: 8, marginTop: 4,
            backgroundColor: '#FF9900',
            color: '#111',
            fontWeight: 700, fontSize: 12, letterSpacing: '0.02em',
            textDecoration: 'none',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e68900')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FF9900')}
        >
          {clicking ? 'Opening…' : 'View on Amazon →'}
        </a>

        {/* Disclosure */}
        <p style={{ fontSize: 9, color: 'var(--s-muted, #9ca3af)', textAlign: 'center', lineHeight: 1.3, margin: 0 }}>
          Affiliate Advertisement — We may earn a commission from qualifying purchases.
        </p>
      </div>
    </div>
  );
}
