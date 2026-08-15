import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliatePublicApi, AffiliatePlacement } from '@/api/affiliate.api';
import { AffiliateAdCard } from './AffiliateAdCard';

interface AffiliateAdSectionProps {
  placement: AffiliatePlacement;
  title?: string;
  maxItems?: number;
}

export function AffiliateAdSection({ placement, title = 'Recommended for You', maxItems = 3 }: AffiliateAdSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-ads', placement],
    queryFn: () => affiliatePublicApi.getByPlacement(placement, maxItems).then(r => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const products = data || [];

  // Don't render anything while loading or when there are no products
  if (isLoading || products.length === 0) return null;

  return (
    <section style={{ padding: '56px 24px', background: 'var(--s-bg3, #f9fafb)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* AD label bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            border: '1px solid var(--s-border, #d1d5db)',
            color: 'var(--s-muted, #9ca3af)',
            padding: '2px 7px', borderRadius: 4,
            lineHeight: 1.6,
          }}>Ad</span>
          <span style={{
            flex: 1, height: 1,
            background: 'var(--s-border, #e5e7eb)',
          }} />
          <span style={{ fontSize: 10, color: 'var(--s-muted, #9ca3af)', fontStyle: 'italic' }}>
            Affiliate Advertisement — we may earn a commission
          </span>
        </div>

        {/* Product grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(220px, 1fr))`,
          gap: 20,
        }}>
          {products.map(p => (
            <AffiliateAdCard key={p.id} product={p} placement={placement} />
          ))}
        </div>

      </div>
    </section>
  );
}
