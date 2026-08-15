import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { imageUrl } from '../../../utils/imageUrl';

interface NavProps {
  subdomain: string;
  restaurantName: string;
  logo?: string | null;
  cartCount?: number;
  onCartClick: () => void;
  hasStore?: boolean;
}

const NAV_LINKS = [
  { to: '',             label: 'Home' },
  { to: '/menu',        label: 'Food Menu' },
  { to: '/events',      label: 'Events & Tickets' },
  { to: '/blog',        label: 'Stories & Blog' },
  { to: '/about',       label: 'About & Hours' },
  { to: '/track',       label: 'Track' },
];

// ─── Bloom Nav — Clean white, green underlines, rounded pill CTA ─────────────
function BloomNav({ subdomain, restaurantName, logo, cartCount, onCartClick, hasStore }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const base = `/s/${subdomain}`;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: 'var(--s-nav-bg)',
      boxShadow: scrolled ? '0 2px 20px rgba(45,106,79,0.08)' : 'none',
      borderBottom: '1px solid var(--s-border)',
      backdropFilter: 'blur(10px)',
      transition: 'box-shadow 0.3s',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>
        {/* Logo */}
        <NavLink to={base} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          {imageUrl(logo) ? <img src={imageUrl(logo)!} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} alt="" /> :
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'var(--s-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'var(--s-heading-font)' }}>
              {restaurantName[0]}
            </div>
          }
          <span style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 700, fontSize: 17, color: 'var(--s-text)', whiteSpace: 'nowrap' }}>{restaurantName}</span>
        </NavLink>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'auto', flex: 1 }}>
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={`${base}${l.to}`} end={l.to === ''}
              style={({ isActive }) => ({
                padding: '6px 10px', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap',
                fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--s-primary)' : 'var(--s-muted)',
                backgroundColor: isActive ? 'var(--s-bg3)' : 'transparent',
                transition: 'all 0.15s',
              })}>{l.label}</NavLink>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={onCartClick} style={{ position: 'relative', padding: '8px 14px', borderRadius: 20, border: '1.5px solid var(--s-border)', background: 'var(--s-bg2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--s-text)', fontFamily: 'var(--s-body-font)' }}>
            🛒 <span>Food</span>
            {cartCount ? <span style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'var(--s-primary)', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{cartCount}</span> : null}
          </button>
          {hasStore && (
            <NavLink to={`${base}/store`} style={{ padding: '8px 16px', borderRadius: 20, border: '1.5px solid var(--s-primary)', color: 'var(--s-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              🏪 Store
            </NavLink>
          )}
          <NavLink to={`${base}/book`} style={{ padding: '8px 18px', borderRadius: 20, backgroundColor: 'var(--s-primary)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            🕐 Book Table
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

// ─── Ember Nav — Dark, serif logo, orange glow on active link ───────────────
function EmberNav({ subdomain, restaurantName, logo, cartCount, onCartClick, hasStore }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const base = `/s/${subdomain}`;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: scrolled ? 'var(--s-nav-bg)' : 'rgba(13,13,13,0.7)',
      backdropFilter: 'blur(16px)',
      borderBottom: scrolled ? '1px solid var(--s-border)' : '1px solid transparent',
      transition: 'all 0.4s',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 70, gap: 20 }}>
        {/* Logo */}
        <NavLink to={base} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          {imageUrl(logo) ? <img src={imageUrl(logo)!} style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--s-border)' }} alt="" /> :
            <div style={{ width: 40, height: 40, borderRadius: 4, background: 'linear-gradient(135deg, var(--s-primary), var(--s-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, fontFamily: 'var(--s-heading-font)' }}>
              {restaurantName[0]}
            </div>
          }
          <span style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 700, fontSize: 20, color: 'var(--s-text)', letterSpacing: '-0.02em' }}>{restaurantName}</span>
        </NavLink>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, overflow: 'auto' }}>
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={`${base}${l.to}`} end={l.to === ''}
              style={({ isActive }) => ({
                padding: '8px 12px', textDecoration: 'none', whiteSpace: 'nowrap',
                fontSize: 13, fontFamily: 'var(--s-body-font)', fontWeight: 500, letterSpacing: '0.02em',
                color: isActive ? 'var(--s-primary)' : 'var(--s-muted)',
                borderBottom: isActive ? '2px solid var(--s-primary)' : '2px solid transparent',
                textShadow: isActive ? '0 0 12px rgba(232,93,4,0.4)' : 'none',
                transition: 'all 0.2s',
              })}>{l.label}</NavLink>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button onClick={onCartClick} style={{ position: 'relative', padding: '7px 14px', border: '1px solid var(--s-border)', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--s-text)', fontFamily: 'var(--s-body-font)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🛒 Cart
            {cartCount ? <span style={{ backgroundColor: 'var(--s-primary)', color: '#fff', borderRadius: 2, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>{cartCount}</span> : null}
          </button>
          {hasStore && (
            <NavLink to={`${base}/store`} style={{ padding: '7px 16px', borderRadius: 4, border: '1px solid var(--s-primary)', color: 'var(--s-primary)', textDecoration: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'var(--s-body-font)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              🏪 Store
            </NavLink>
          )}
          <NavLink to={`${base}/book`} style={{ padding: '8px 20px', borderRadius: 4, background: 'linear-gradient(90deg, var(--s-primary), var(--s-accent))', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'var(--s-body-font)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Book Table
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

// ─── Luxe Nav — Dark navy, gold accents, logo left, links right ───────────────
function LuxeNav({ subdomain, restaurantName, logo, cartCount, onCartClick, hasStore }: NavProps) {
  const base = `/s/${subdomain}`;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: 'var(--s-nav-bg)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--s-border)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', height: 72 }}>
        
        {/* Logo — left corner */}
        <NavLink to={base} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 32 }}>
          {imageUrl(logo)
            ? <img src={imageUrl(logo)!} style={{ height: 36, width: 36, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--s-border)' }} alt="" />
            : <div style={{ fontFamily: 'var(--s-heading-font)', fontWeight: 400, fontSize: 18, color: 'var(--s-primary)', letterSpacing: '0.06em', lineHeight: 1, whiteSpace: 'nowrap' }}>
                {restaurantName}
              </div>
          }
        </NavLink>

        {/* All nav links */}
        <div style={{ display: 'flex', gap: 0, flex: 1, overflow: 'auto' }}>
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={`${base}${l.to}`} end={l.to === ''}
              style={({ isActive }) => ({
                padding: '0 14px', height: 72, display: 'flex', alignItems: 'center',
                textDecoration: 'none', whiteSpace: 'nowrap', fontSize: 11,
                fontFamily: 'var(--s-body-font)', fontWeight: 300, letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                color: isActive ? 'var(--s-primary)' : 'var(--s-muted)',
                borderBottom: isActive ? '2px solid var(--s-primary)' : '2px solid transparent',
                transition: 'all 0.2s',
              })}>{l.label}</NavLink>
          ))}
        </div>

        {/* Right side: Cart + Store + Reserve */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={onCartClick} style={{ position: 'relative', padding: '6px 12px', border: '1px solid var(--s-border)', borderRadius: 2, background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--s-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🛒 {cartCount ? <span style={{ color: 'var(--s-primary)', fontWeight: 600 }}>{cartCount}</span> : 'Cart'}
          </button>
          {hasStore && (
            <NavLink to={`${base}/store`} style={{ padding: '8px 18px', border: '1px solid var(--s-primary)', color: 'var(--s-primary)', textDecoration: 'none', fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, transition: 'all 0.2s' }}>
              🏪 Store
            </NavLink>
          )}
          <NavLink to={`${base}/book`} style={{ padding: '8px 20px', border: '1px solid var(--s-primary)', color: 'var(--s-primary)', textDecoration: 'none', fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, transition: 'all 0.2s' }}>
            Reserve
          </NavLink>
        </div>
      </div>
    </nav>
  );
}


// ─── Pearl Nav — Warm cream, terracotta accents, editorial feel ───────────────
function PearlNav({ subdomain, restaurantName, logo, cartCount, onCartClick, hasStore }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const base = `/s/${subdomain}`;

  // ── Colour tokens that flip between transparent-over-video and opaque ──────
  const linkColor      = scrolled ? 'var(--s-muted)'   : 'rgba(255,255,255,0.82)';
  const linkActive     = scrolled ? 'var(--s-primary)'  : '#ffffff';
  const nameColor      = scrolled ? 'var(--s-text)'     : '#ffffff';
  const ctaBorder      = scrolled ? 'rgba(0,0,0,0.15)'  : 'rgba(255,255,255,0.5)';
  const ctaColor       = scrolled ? 'var(--s-text)'     : '#ffffff';

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: scrolled ? 'var(--s-nav-bg)' : 'transparent',
      backdropFilter:  scrolled ? 'blur(14px)'       : 'none',
      borderBottom:    scrolled ? '1px solid var(--s-border)' : 'none',
      transition: 'background-color 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
    }}>
      <div style={{
        maxWidth: 1300, margin: '0 auto', padding: '0 32px',
        display: 'flex', alignItems: 'center', height: 68,
      }}>
        {/* ── Logo ── */}
        <NavLink to={base} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          {imageUrl(logo)
            ? <img src={imageUrl(logo)!} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} alt="" />
            : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(135deg, var(--s-primary), var(--s-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'var(--s-heading-font)' }}>
                {restaurantName[0]}
              </div>
          }
          <span style={{
            fontFamily: 'var(--s-heading-font)', fontWeight: 600, fontSize: 18,
            color: nameColor, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
            transition: 'color 0.4s',
          }}>{restaurantName}</span>
        </NavLink>

        {/* ── Nav links — equally spaced and centred in remaining space ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flex: 1, overflow: 'hidden',
        }}>
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={`${base}${l.to}`} end={l.to === ''}
              style={({ isActive }) => ({
                padding: '6px 16px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                fontSize: 13,
                fontFamily: 'var(--s-body-font)',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? linkActive : linkColor,
                borderBottom: isActive
                  ? `1.5px solid ${linkActive}`
                  : '1.5px solid transparent',
                letterSpacing: '0.01em',
                transition: 'color 0.4s, border-color 0.4s',
              })}
            >{l.label}</NavLink>
          ))}
        </div>

        {/* ── CTA buttons ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button onClick={onCartClick} style={{
            position: 'relative', padding: '7px 14px', borderRadius: 20,
            border: `1.5px solid ${ctaBorder}`, background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: ctaColor, fontFamily: 'var(--s-body-font)',
            transition: 'color 0.4s, border-color 0.4s',
          }}>
            🛒 <span>Food</span>
            {cartCount ? <span style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: 'var(--s-primary)', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{cartCount}</span> : null}
          </button>

          {hasStore && (
            <NavLink to={`${base}/store`} style={{
              padding: '7px 15px', borderRadius: 20,
              border: `1.5px solid ${scrolled ? 'var(--s-primary)' : 'rgba(255,255,255,0.5)'}`,
              color: scrolled ? 'var(--s-primary)' : '#fff',
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'color 0.4s, border-color 0.4s',
            }}>
              🏪 Store
            </NavLink>
          )}

          <NavLink to={`${base}/book`} style={{
            padding: '8px 22px', borderRadius: 20,
            backgroundColor: 'var(--s-primary)', color: '#fff',
            textDecoration: 'none', fontSize: 13, fontWeight: 600,
            boxShadow: scrolled ? 'none' : '0 2px 12px rgba(0,0,0,0.25)',
            transition: 'box-shadow 0.4s',
          }}>
            Book Table
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

// ─── Export: template-aware nav ───────────────────────────────────────────────
export default function SiteNav(props: NavProps) {
  const { templateId } = useTheme();
  if (templateId === 'ember') return <EmberNav {...props} />;
  if (templateId === 'luxe')  return <LuxeNav  {...props} />;
  if (templateId === 'pearl') return <PearlNav {...props} />;
  return <BloomNav {...props} />;
}
