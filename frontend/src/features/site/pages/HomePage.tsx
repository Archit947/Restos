import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { imageUrl } from '../../../utils/imageUrl';
import { AffiliateAdSection } from '../components/AffiliateAdSection';

interface Props {
  subdomain: string;
  restaurant: any;
  menuItems: any[];
  reviews?: any[];
  restaurantId?: number;
}

// ─── Hero variants ────────────────────────────────────────────────────────────

function BloomHero({ subdomain, restaurant }: Pick<Props, 'subdomain' | 'restaurant'>) {
  const base = `/s/${subdomain}`;
  const coverSrc = imageUrl(restaurant.cover_image);
  return (
    <section style={{ backgroundColor: 'var(--s-bg3)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-block', backgroundColor: 'var(--s-primary)', color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 20 }}>
            {restaurant.cuisine_type || 'Restaurant'}
          </div>
          <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, color: 'var(--s-text)' }}>
            {restaurant.website_title || restaurant.restaurant_name}
          </h1>
          {restaurant.website_subtitle && <p style={{ fontSize: 18, color: 'var(--s-muted)', marginBottom: 36, lineHeight: 1.6 }}>{restaurant.website_subtitle}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <NavLink to={`${base}/menu`} style={{ padding: '14px 28px', borderRadius: 'var(--s-radius)', backgroundColor: 'var(--s-primary)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
              Order Food Online →
            </NavLink>
            <NavLink to={`${base}/book`} style={{ padding: '14px 28px', borderRadius: 'var(--s-radius)', border: '2px solid var(--s-primary)', color: 'var(--s-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
              Book a Table
            </NavLink>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 32, fontSize: 13, color: 'var(--s-muted)' }}>
            <span>⭐ 4.8 (200+ ratings)</span>
            <span>🕐 30-40 mins delivery</span>
          </div>
        </div>
        {/* Hero image — falls back to gradient if no cover_image */}
        <div style={{ borderRadius: 'calc(var(--s-radius) * 2)', overflow: 'hidden', aspectRatio: '4/3', position: 'relative', background: 'linear-gradient(135deg, var(--s-primary) 0%, var(--s-accent) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
          {coverSrc ? (
            <img src={coverSrc} alt={restaurant.restaurant_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>🍽️</span>
          )}
        </div>
      </div>
    </section>
  );
}

function EmberHero({ subdomain, restaurant }: Pick<Props, 'subdomain' | 'restaurant'>) {
  const base = `/s/${subdomain}`;
  const coverSrc = imageUrl(restaurant.cover_image);
  return (
    <section style={{
      minHeight: '92vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
      background: '#0d0d0d',
    }}>
      {/* Cover / hero image as a full background with dark overlay */}
      {coverSrc ? (
        <>
          <img src={coverSrc} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,13,13,0.55) 0%, rgba(26,10,0,0.45) 50%, rgba(13,13,13,0.65) 100%)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a00 50%, #0d0d0d 100%)' }} />
      )}
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,93,4,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%', textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'inline-block', border: '1px solid var(--s-primary)', color: 'var(--s-primary)', borderRadius: 2, padding: '5px 16px', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
          {restaurant.cuisine_type || 'Fine Cuisine'}
        </div>
        <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(48px,7vw,96px)', fontWeight: 700, lineHeight: 1, color: 'var(--s-text)', marginBottom: 24, textShadow: '0 0 60px rgba(232,93,4,0.3)' }}>
          {restaurant.website_title || restaurant.restaurant_name}
        </h1>
        {restaurant.website_subtitle && <p style={{ fontSize: 'clamp(16px,2vw,22px)', color: 'var(--s-muted)', marginBottom: 48, fontFamily: 'var(--s-body-font)', fontWeight: 300, letterSpacing: '0.02em' }}>{restaurant.website_subtitle}</p>}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <NavLink to={`${base}/menu`} style={{ padding: '16px 36px', borderRadius: 'var(--s-radius)', background: 'linear-gradient(90deg, var(--s-primary), var(--s-accent))', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 4px 30px rgba(232,93,4,0.4)' }}>
            Order Food Online →
          </NavLink>
          <NavLink to={`${base}/book`} style={{ padding: '16px 36px', borderRadius: 'var(--s-radius)', border: '1px solid rgba(232,93,4,0.5)', color: 'var(--s-text)', textDecoration: 'none', fontWeight: 500, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
            Reserve a Table
          </NavLink>
        </div>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 48, fontSize: 13, color: 'var(--s-muted)' }}>
          <span>⭐ 4.6 (215+ ratings)</span>
          <span>·</span>
          <span>🕐 30-40 mins delivery</span>
        </div>
      </div>
    </section>
  );
}

function LuxeHero({ subdomain, restaurant }: Pick<Props, 'subdomain' | 'restaurant'>) {
  const base = `/s/${subdomain}`;
  const coverSrc = imageUrl(restaurant.cover_image);
  return (
    <section style={{
      minHeight: '88vh', display: 'flex', alignItems: 'center', position: 'relative',
      background: '#050810',
    }}>
      {/* Cover / hero image as a full background with dark overlay */}
      {coverSrc ? (
        <>
          <img src={coverSrc} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,8,16,0.6) 0%, rgba(10,15,30,0.5) 50%, rgba(5,8,16,0.7) 100%)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #050810 0%, #0a0f1e 100%)' }} />
      )}
      {/* Gold line decoration */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 1, height: 80, background: 'linear-gradient(180deg, transparent, var(--s-primary))' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px', textAlign: 'center', width: '100%' }}>
        <p style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 32 }}>
          {restaurant.cuisine_type || 'Fine Dining'}
        </p>
        <h1 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(48px,6vw,84px)', fontWeight: 300, color: 'var(--s-text)', marginBottom: 24, letterSpacing: '0.04em', lineHeight: 1.1 }}>
          {restaurant.website_title || restaurant.restaurant_name}
        </h1>
        <div style={{ width: 80, height: 1, background: 'linear-gradient(90deg, transparent, var(--s-primary), transparent)', margin: '0 auto 24px' }} />
        {restaurant.website_subtitle && <p style={{ fontSize: 16, color: 'var(--s-muted)', marginBottom: 56, letterSpacing: '0.06em', lineHeight: 1.8, fontWeight: 300 }}>{restaurant.website_subtitle}</p>}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          <NavLink to={`${base}/menu`} style={{ padding: '14px 40px', border: '1px solid var(--s-primary)', color: 'var(--s-primary)', textDecoration: 'none', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'all 0.3s' }}>
            View Our Menu
          </NavLink>
          <NavLink to={`${base}/book`} style={{ padding: '14px 40px', backgroundColor: 'var(--s-primary)', color: '#0a0f1e', textDecoration: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Make a Reservation
          </NavLink>
        </div>
      </div>

      {/* Bottom decoration */}
      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 1, height: 60, background: 'linear-gradient(0deg, transparent, var(--s-primary))' }} />
    </section>
  );
}

// ─── Pearl Hero — Full-bleed video/image, no overlay, no text ───────────────
function PearlHero({ restaurant }: Pick<Props, 'restaurant'>) {
  const coverSrc = imageUrl(restaurant.cover_image);
  const videoUrl = restaurant.hero_video_url || null;

  return (
    // marginTop: -68px tucks this section behind the sticky nav (68px tall)
    // so the video fills the viewport edge-to-edge with zero gap
    <section style={{
      marginTop: -68,
      height: 'calc(100vh + 68px)',
      position: 'relative',
      overflow: 'hidden',
      background: '#111',
    }}>
      {/* ── Full-bleed media — video preferred, cover image fallback ── */}
      {videoUrl ? (
        <video
          key={videoUrl}
          autoPlay muted loop playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src={videoUrl} />
        </video>
      ) : coverSrc ? (
        <img
          src={coverSrc}
          alt=""
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        /* Gradient placeholder when neither video nor cover image is set */
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1c1a17 0%, #3a2a1a 50%, #1c1a17 100%)' }} />
      )}

      {/* ── Subtle bottom fade into the next section ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(to bottom, transparent, var(--s-bg))',
        pointerEvents: 'none',
      }} />
    </section>
  );
}

// ─── Pearl Experience section (replaces generic Popular Dishes for pearl) ─────
function PearlFeatures({ subdomain }: { subdomain: string }) {
  const features = [
    { icon: '🍽️', title: 'Curated Menu',      desc: 'Every dish crafted with seasonal, locally-sourced ingredients by our award-winning chefs.' },
    { icon: '🌿', title: 'Farm to Table',     desc: 'We partner directly with local farms to bring you the freshest produce possible.' },
    { icon: '🥂', title: 'Premium Ambiance',  desc: 'An atmosphere designed for celebration, intimacy, and unforgettable dining moments.' },
  ];

  return (
    <section style={{ padding: '96px 28px', background: 'var(--s-bg2)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 1, background: 'var(--s-primary)' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--s-body-font)', fontWeight: 500, color: 'var(--s-primary)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Our Promise</span>
            <div style={{ width: 24, height: 1, background: 'var(--s-primary)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(30px,4vw,48px)', fontWeight: 600, color: 'var(--s-text)', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            The Art of Fine Dining
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              padding: '36px 32px', borderRadius: 12, background: 'var(--s-bg)',
              border: '1px solid var(--s-border)', transition: 'transform 0.25s, box-shadow 0.25s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--s-card-shadow)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 36, marginBottom: 20 }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 22, fontWeight: 600, color: 'var(--s-text)', marginBottom: 12, lineHeight: 1.2 }}>{f.title}</h3>
              <p style={{ fontFamily: 'var(--s-body-font)', fontSize: 14, color: 'var(--s-muted)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 52 }}>
          <NavLink to={`/s/${subdomain}/menu`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 30px',
            borderRadius: 30, border: '1.5px solid var(--s-primary)', color: 'var(--s-primary)',
            textDecoration: 'none', fontFamily: 'var(--s-body-font)', fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
          }}>
            View Full Menu →
          </NavLink>
        </div>
      </div>
    </section>
  );
}

// ─── Pearl Signature Dishes (featured items for pearl theme) ──────────────────
function PearlDishes({ items, subdomain }: { items: any[]; subdomain: string }) {
  const featured = items.filter(i => i.is_featured).slice(0, 3);
  if (!featured.length) return null;

  return (
    <section style={{ padding: '96px 28px', background: 'var(--s-bg)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 1, background: 'var(--s-primary)' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--s-body-font)', fontWeight: 500, color: 'var(--s-primary)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Chef's Selection</span>
            <div style={{ width: 24, height: 1, background: 'var(--s-primary)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(30px,4vw,48px)', fontWeight: 600, color: 'var(--s-text)', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Signature Dishes
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
          {featured.map((item: any) => (
            <div key={item.id} style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--s-bg2)', border: '1px solid var(--s-border)', boxShadow: 'var(--s-card-shadow)', transition: 'transform 0.25s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-5px)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'none'}
            >
              {/* Image */}
              <div style={{ height: 220, position: 'relative', background: 'linear-gradient(135deg, var(--s-bg3), var(--s-bg2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, overflow: 'hidden' }}>
                {imageUrl(item.image || item.image_url) ? (
                  <img src={imageUrl(item.image || item.image_url)!} alt={item.name}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : <span>{item.is_veg ? '🥗' : '🍽️'}</span>}
                {/* Price badge */}
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'var(--s-bg2)', border: '1px solid var(--s-border)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, color: 'var(--s-primary)', fontFamily: 'var(--s-body-font)' }}>
                  {item.currency || '₹'} {Number(item.price).toFixed(0)}
                </div>
              </div>
              {/* Content */}
              <div style={{ padding: '20px 22px' }}>
                <h3 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 20, fontWeight: 600, color: 'var(--s-text)', margin: '0 0 8px', lineHeight: 1.2 }}>{item.name}</h3>
                {item.description && <p style={{ fontFamily: 'var(--s-body-font)', fontSize: 13, color: 'var(--s-muted)', lineHeight: 1.6, margin: '0 0 16px' }}>{item.description.substring(0, 90)}{item.description.length > 90 ? '…' : ''}</p>}
                <NavLink to={`/s/${subdomain}/menu`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 20, backgroundColor: 'var(--s-primary)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600, fontFamily: 'var(--s-body-font)' }}>
                  Order Now
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pearl Testimonials ───────────────────────────────────────────────────────
const STATIC_PEARL_REVIEWS = [
  { customer_name: 'Priya S.',  review_text: 'An extraordinary culinary journey. Every dish told a story of craftsmanship and passion.', rating: 5 },
  { customer_name: 'Rahul M.',  review_text: 'The finest dining experience in the city. The ambiance and flavors are simply unparalleled.', rating: 5 },
  { customer_name: 'Ananya K.', review_text: 'From the moment we walked in to the last bite, perfection in every single detail.', rating: 5 },
];

function PearlTestimonials({ reviews: propReviews }: { reviews?: any[] }) {
  const reviews = (propReviews && propReviews.length > 0) ? propReviews.slice(0, 3) : STATIC_PEARL_REVIEWS;

  return (
    <section style={{ padding: '96px 28px', background: 'var(--s-bg3)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative large quote */}
      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--s-heading-font)', fontSize: 200, lineHeight: 1, color: 'var(--s-primary)', opacity: 0.04, userSelect: 'none', pointerEvents: 'none' }}>"</div>

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 1, background: 'var(--s-primary)' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--s-body-font)', fontWeight: 500, color: 'var(--s-primary)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Testimonials</span>
            <div style={{ width: 24, height: 1, background: 'var(--s-primary)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(30px,4vw,48px)', fontWeight: 600, color: 'var(--s-text)', margin: 0, letterSpacing: '-0.01em' }}>
            What Our Guests Say
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {reviews.map((r, i) => (
            <div key={r.id ?? i} style={{ padding: '32px 28px', borderRadius: 12, background: 'var(--s-bg2)', border: '1px solid var(--s-border)', boxShadow: 'var(--s-card-shadow)' }}>
              <div style={{ fontSize: 28, fontFamily: 'var(--s-heading-font)', color: 'var(--s-primary)', marginBottom: 12, lineHeight: 1 }}>"</div>
              <div style={{ color: '#c9a84c', fontSize: 13, marginBottom: 14, letterSpacing: '0.1em' }}>{'★'.repeat(r.rating ?? r.stars ?? 5)}</div>
              <p style={{ fontFamily: 'var(--s-body-font)', fontSize: 14, color: 'var(--s-text)', lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic', opacity: 0.85 }}>{r.review_text ?? r.text}</p>
              <div>
                <p style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 16, color: 'var(--s-text)', margin: 0 }}>{r.customer_name ?? r.name}</p>
                {r.role && <p style={{ fontFamily: 'var(--s-body-font)', fontSize: 11, color: 'var(--s-primary)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.role}</p>}
                {r.created_at && <p style={{ fontFamily: 'var(--s-body-font)', fontSize: 11, color: 'var(--s-muted)', margin: '3px 0 0' }}>{new Date(r.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pearl CTA Banner ─────────────────────────────────────────────────────────
function PearlCTA({ subdomain }: { subdomain: string }) {
  return (
    <section style={{ padding: '80px 28px', background: 'var(--s-bg2)', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontFamily: 'var(--s-body-font)', color: 'var(--s-primary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>Reserve Your Evening</p>
        <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, color: 'var(--s-text)', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          Ready for an Unforgettable Experience?
        </h2>
        <p style={{ fontFamily: 'var(--s-body-font)', fontSize: 16, color: 'var(--s-muted)', marginBottom: 36, lineHeight: 1.6 }}>
          Secure your table for a dining experience crafted just for you.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <NavLink to={`/s/${subdomain}/book`} style={{ padding: '14px 34px', borderRadius: 30, backgroundColor: 'var(--s-primary)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14, fontFamily: 'var(--s-body-font)', boxShadow: '0 8px 28px rgba(181,103,61,0.24)' }}>
            Book a Table
          </NavLink>
          <NavLink to={`/s/${subdomain}/menu`} style={{ padding: '14px 34px', borderRadius: 30, border: '1.5px solid var(--s-border)', color: 'var(--s-text)', textDecoration: 'none', fontWeight: 400, fontSize: 14, fontFamily: 'var(--s-body-font)' }}>
            Browse Menu
          </NavLink>
        </div>
      </div>
    </section>
  );
}

// ─── Popular Dishes section ───────────────────────────────────────────────────
function PopularDishes({ items, subdomain }: { items: any[]; subdomain: string }) {
  const { templateId } = useTheme();
  const featured = items.filter(i => i.is_featured).slice(0, 4);
  if (!featured.length) return null;

  const isEmber = templateId === 'ember';
  const isLuxe  = templateId === 'luxe';

  return (
    <section style={{ padding: '80px 24px', backgroundColor: isEmber ? '#111' : isLuxe ? 'var(--s-bg2)' : 'var(--s-bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: isLuxe ? 'center' : 'left', marginBottom: 48 }}>
          {isLuxe && <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>Signature</p>}
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(28px,4vw,44px)', fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)', marginBottom: 8 }}>
            {isLuxe ? 'Our Signature Dishes' : isEmber ? 'Fan Favourites' : 'Popular Dishes'}
          </h2>
          {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '0 auto' }} />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 24 }}>
          {featured.map((item: any) => (
            <div key={item.id} style={{ backgroundColor: 'var(--s-bg2)', borderRadius: 'var(--s-radius)', border: '1px solid var(--s-border)', overflow: 'hidden', boxShadow: 'var(--s-card-shadow)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ height: 180, background: `linear-gradient(135deg, var(--s-bg3), var(--s-bg2))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, position: 'relative', overflow: 'hidden' }}>
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
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 16, color: 'var(--s-text)', lineHeight: 1.3 }}>{item.name}</h3>
                  <span style={{ color: 'var(--s-primary)', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', marginLeft: 8 }}>{item.currency} {Number(item.price).toFixed(0)}</span>
                </div>
                {item.description && <p style={{ fontSize: 13, color: 'var(--s-muted)', lineHeight: 1.5, marginBottom: 12 }}>{item.description.substring(0, 80)}</p>}
                <NavLink to={`/s/${subdomain}/menu`} style={{ display: 'inline-block', padding: '7px 16px', borderRadius: 'var(--s-radius-sm)', backgroundColor: 'var(--s-primary)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  Order Now
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials section ─────────────────────────────────────────────────────
const STATIC_REVIEWS = [
  { customer_name: 'Priya S.',  review_text: 'Absolutely incredible food! The flavors were authentic and the service was impeccable.', rating: 5 },
  { customer_name: 'Rahul M.',  review_text: 'Best dining experience in the city. Will definitely be coming back!', rating: 5 },
  { customer_name: 'Ananya K.', review_text: 'A hidden gem. The ambiance and food exceeded all expectations.', rating: 5 },
];

function Testimonials({ reviews: propReviews }: { reviews?: any[] }) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const isEmber = templateId === 'ember';

  const reviews = (propReviews && propReviews.length > 0) ? propReviews.slice(0, 3) : STATIC_REVIEWS;

  return (
    <section style={{ padding: '80px 24px', backgroundColor: isEmber ? 'var(--s-bg2)' : isLuxe ? 'var(--s-bg)' : 'var(--s-bg3)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {isLuxe && <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12 }}>Testimonials</p>}
          <h2 style={{ fontFamily: 'var(--s-heading-font)', fontSize: 'clamp(26px,4vw,40px)', fontWeight: isLuxe ? 300 : 700, color: 'var(--s-text)' }}>
            {isLuxe ? 'What Our Guests Say' : isEmber ? 'What People Are Saying' : 'Customer Reviews'}
          </h2>
          {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '12px auto 0' }} />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
          {reviews.map((r, i) => (
            <div key={r.id ?? i} style={{
              backgroundColor: 'var(--s-bg2)', padding: 28, borderRadius: 'var(--s-radius)',
              border: isEmber ? '1px solid var(--s-border)' : isLuxe ? '1px solid var(--s-border)' : 'none',
              boxShadow: 'var(--s-card-shadow)',
            }}>
              {isLuxe && <p style={{ fontSize: 32, color: 'var(--s-primary)', marginBottom: 12, fontFamily: 'var(--s-heading-font)', lineHeight: 1 }}>"</p>}
              <div style={{ color: '#fbbf24', fontSize: 14, marginBottom: 12 }}>{'★'.repeat(r.rating ?? r.stars ?? 5)}</div>
              <p style={{ fontSize: 15, color: 'var(--s-text)', lineHeight: 1.7, marginBottom: 16, fontStyle: isLuxe ? 'italic' : 'normal', opacity: 0.85 }}>{r.review_text ?? r.text}</p>
              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--s-primary)' }}>— {r.customer_name ?? r.name}</p>
              {r.created_at && <p style={{ fontSize: 11, color: 'var(--s-muted)', marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage({ subdomain, restaurant, menuItems, reviews = [], restaurantId }: Props) {
  const { templateId } = useTheme();

  // ── Pearl theme — full premium layout ──────────────────────────────────────
  if (templateId === 'pearl') {
    return (
      <div>
        <PearlHero restaurant={restaurant} />
        <PearlFeatures subdomain={subdomain} />
        <PearlDishes items={menuItems} subdomain={subdomain} />
        <AffiliateAdSection placement="homepage_section" title="Hand-Picked for Your Dining Experience" maxItems={3} restaurantId={restaurantId} />
        <PearlTestimonials reviews={reviews} />
        <PearlCTA subdomain={subdomain} />
      </div>
    );
  }

  // ── Other themes ───────────────────────────────────────────────────────────
  return (
    <div>
      {templateId === 'ember' && <EmberHero subdomain={subdomain} restaurant={restaurant} />}
      {templateId === 'luxe'  && <LuxeHero  subdomain={subdomain} restaurant={restaurant} />}
      {templateId === 'bloom' && <BloomHero subdomain={subdomain} restaurant={restaurant} />}
      <PopularDishes items={menuItems} subdomain={subdomain} />
      <AffiliateAdSection placement="homepage_section" title="Recommended for You" maxItems={3} restaurantId={restaurantId} />
      <Testimonials reviews={reviews} />
    </div>
  );
}
