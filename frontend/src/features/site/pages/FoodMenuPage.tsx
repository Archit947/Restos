import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { imageUrl } from '../../../utils/imageUrl';

interface CartItem { id: number; name: string; price: number; qty: number; currency: string; }
interface Props {
  subdomain: string;
  categories: any[];
  items: any[];
  cart: CartItem[];
  onAddToCart: (item: any) => void;
}

export default function FoodMenuPage({ subdomain, categories, items, cart, onAddToCart }: Props) {
  const { templateId } = useTheme();
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const isLuxe = templateId === 'luxe';
  const isEmber = templateId === 'ember';

  const filtered = selectedCat ? items.filter(i => i.category_id === selectedCat) : items;
  const cartMap = Object.fromEntries(cart.map(c => [c.id, c.qty]));

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 48, textAlign: isLuxe ? 'center' : 'left' }}>
        {isLuxe && <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>Our Menu</p>}
        <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)', marginBottom: 8 }}>
          {isLuxe ? 'Culinary Selections' : isEmber ? 'Our Menu' : 'Food Menu'}
        </h1>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '0 auto' }} />}
      </div>

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          <button
            onClick={() => setSelectedCat(null)}
            style={{
              padding: '8px 20px', borderRadius: isLuxe ? 2 : 'var(--s-radius)', border: '1.5px solid var(--s-border)',
              backgroundColor: !selectedCat ? 'var(--s-primary)' : 'transparent',
              color: !selectedCat ? '#fff' : 'var(--s-muted)',
              cursor: 'pointer', fontSize: 13, fontFamily: 'var(--s-body-font)', fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelectedCat(c.id)}
              style={{
                padding: '8px 20px', borderRadius: isLuxe ? 2 : 'var(--s-radius)', border: '1.5px solid var(--s-border)',
                backgroundColor: selectedCat === c.id ? 'var(--s-primary)' : 'transparent',
                color: selectedCat === c.id ? '#fff' : 'var(--s-muted)',
                cursor: 'pointer', fontSize: 13, fontFamily: 'var(--s-body-font)', fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >{c.name}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--s-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <p style={{ fontSize: 16 }}>No menu items available yet.</p>
        </div>
      )}

      {/* Items grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
        {filtered.map(item => {
          const inCart = cartMap[item.id] || 0;
          return (
            <div key={item.id} style={{
              backgroundColor: 'var(--s-bg2)', borderRadius: 'var(--s-radius)',
              border: '1px solid var(--s-border)', overflow: 'hidden',
              boxShadow: 'var(--s-card-shadow)', display: 'flex', flexDirection: 'column',
            }}>
              {/* Item image */}
              <div style={{ height: 160, background: `linear-gradient(135deg, var(--s-bg3), var(--s-bg2))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative', overflow: 'hidden' }}>
                {imageUrl(item.image || item.image_url) ? (
                  <img
                    src={imageUrl(item.image || item.image_url)!}
                    alt={item.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span>{item.is_veg ? '🥗' : '🍗'}</span>
                )}
                <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 16, zIndex: 1 }}>{item.is_veg ? '🟢' : '🔴'}</span>
                {item.is_featured && <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, backgroundColor: 'var(--s-accent)', color: isLuxe ? '#0a0f1e' : '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>★ Chef's Pick</span>}
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 16, color: 'var(--s-text)', flex: 1, lineHeight: 1.3 }}>{item.name}</h3>
                  <span style={{ color: 'var(--s-primary)', fontWeight: 700, fontSize: 16, marginLeft: 8, whiteSpace: 'nowrap' }}>{item.currency} {Number(item.price).toFixed(0)}</span>
                </div>
                {item.category_name && <span style={{ fontSize: 11, color: 'var(--s-muted)', marginBottom: 8 }}>{item.category_name}</span>}
                {item.description && <p style={{ fontSize: 13, color: 'var(--s-muted)', lineHeight: 1.5, flex: 1, marginBottom: 14 }}>{item.description.substring(0, 90)}</p>}
                {item.spiciness_level > 0 && <p style={{ fontSize: 12, marginBottom: 10 }}>{'🌶'.repeat(item.spiciness_level)}</p>}

                <button
                  onClick={() => onAddToCart(item)}
                  style={{
                    padding: '9px 0', borderRadius: 'var(--s-radius-sm)', border: 'none', cursor: 'pointer',
                    backgroundColor: inCart ? 'var(--s-primary)' : 'var(--s-bg3)',
                    color: inCart ? '#fff' : 'var(--s-text)',
                    fontFamily: 'var(--s-body-font)', fontWeight: 600, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.15s',
                  }}
                >
                  {inCart ? `✓ In Cart (${inCart})` : '+ Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
