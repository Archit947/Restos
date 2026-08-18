import React, { useState } from 'react';
import { useTheme } from '../ThemeContext';
import { publicApi } from '../../../api/public';
import { useQuery } from '@tanstack/react-query';
import { imageUrl } from '../../../utils/imageUrl';
import { AffiliateAdSection } from '../components/AffiliateAdSection';

/** Strip UTC marker so datetimes stored as local time display correctly. */
function parseLocal(d: string | null | undefined): Date {
  if (!d) return new Date();
  return new Date(String(d).replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

interface Props { subdomain: string; posts: any[]; restaurantId?: number; }

function PostCard({ post, onOpen }: { post: any; onOpen: () => void }) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const date = parseLocal(post.published_at || post.created_at);
  const imgSrc = imageUrl(post.featured_image);

  return (
    <div
      onClick={onOpen}
      style={{
        backgroundColor: 'var(--s-bg2)',
        borderRadius: 'var(--s-radius)',
        border: '1px solid var(--s-border)',
        overflow: 'hidden',
        boxShadow: 'var(--s-card-shadow)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}
    >
      {/* Cover image */}
      <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={post.title}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, var(--s-bg3), var(--s-primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}

        {/* Category chip overlay */}
        {post.category && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'var(--s-primary)', color: '#000',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
          }}>
            {post.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        <p style={{
          fontSize: 11, color: 'var(--s-primary)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
        }}>
          {date.toLocaleString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h3 style={{
          fontFamily: 'var(--s-heading-font)',
          fontWeight: isLuxe ? 400 : 600,
          fontSize: 18,
          color: 'var(--s-text)',
          lineHeight: 1.4,
          marginBottom: post.excerpt ? 10 : 14,
        }}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p style={{ fontSize: 14, color: 'var(--s-muted)', lineHeight: 1.6, marginBottom: 14 }}>
            {post.excerpt.substring(0, 100)}{post.excerpt.length > 100 ? '…' : ''}
          </p>
        )}
        <p style={{ fontSize: 13, color: 'var(--s-primary)', fontWeight: 600 }}>Read More →</p>
      </div>
    </div>
  );
}

function PostModal({ subdomain, slug, onClose }: { subdomain: string; slug: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['blog-post', subdomain, slug],
    queryFn: () => publicApi.getBlogPost(subdomain, slug).then(r => r.data.data),
  });
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const imgSrc = imageUrl(data?.featured_image);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.75)',
        overflowY: 'auto', padding: '40px 16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--s-bg)',
          borderRadius: 'var(--s-radius)',
          border: '1px solid var(--s-border)',
          maxWidth: 760, margin: '0 auto',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--s-muted)', fontSize: 24, lineHeight: 1, padding: '4px 8px',
            }}
          >×</button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--s-muted)' }}>Loading…</div>
        ) : data && (
          <>
            {/* Hero image */}
            {imgSrc && (
              <div style={{ width: '100%', maxHeight: 360, overflow: 'hidden' }}>
                <img
                  src={imgSrc}
                  alt={data.title}
                  style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            <div style={{ padding: '32px 40px 40px' }}>
              {/* Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <p style={{
                  fontSize: 11, color: 'var(--s-primary)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {parseLocal(data.published_at || data.created_at).toLocaleString('en', { dateStyle: 'long' })}
                </p>
                {data.author && (
                  <span style={{ fontSize: 11, color: 'var(--s-muted)' }}>· By {data.author}</span>
                )}
                {data.category && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4,
                    background: 'var(--s-primary)', color: '#000',
                  }}>{data.category}</span>
                )}
              </div>

              {/* Title */}
              <h2 style={{
                fontFamily: 'var(--s-heading-font)',
                fontSize: 'clamp(22px,4vw,34px)',
                fontWeight: isLuxe ? 300 : 700,
                color: 'var(--s-text)',
                marginBottom: 20,
                lineHeight: 1.3,
              }}>
                {data.title}
              </h2>

              {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', marginBottom: 24 }} />}

              {/* Excerpt */}
              {data.excerpt && (
                <p style={{
                  fontSize: 17, color: 'var(--s-muted)', lineHeight: 1.7,
                  marginBottom: 20, fontStyle: 'italic',
                  borderLeft: '3px solid var(--s-primary)', paddingLeft: 16,
                }}>
                  {data.excerpt}
                </p>
              )}

              {/* Content */}
              <div style={{
                fontSize: 16, color: 'var(--s-text)',
                lineHeight: 1.85, opacity: 0.85, whiteSpace: 'pre-wrap',
              }}>
                {data.content}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BlogPage({ subdomain, posts, restaurantId }: Props) {
  const { templateId } = useTheme();
  const isLuxe = templateId === 'luxe';
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <>
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ marginBottom: 48, textAlign: isLuxe ? 'center' : 'left' }}>
        {isLuxe && (
          <p style={{
            fontSize: 10, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'var(--s-primary)', marginBottom: 12,
          }}>Stories</p>
        )}
        <h1 style={{
          fontFamily: 'var(--s-heading-font)',
          fontSize: 'clamp(32px,5vw,52px)',
          fontWeight: isLuxe ? 300 : 700,
          color: 'var(--s-text)',
        }}>
          {isLuxe ? 'Stories & Inspirations' : 'Stories & Blog'}
        </h1>
        {isLuxe && <div style={{ width: 50, height: 1, background: 'var(--s-primary)', margin: '12px auto 0' }} />}
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--s-muted)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p style={{ fontSize: 16 }}>No stories published yet. Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 28 }}>
          {posts.map(p => (
            <PostCard key={p.id} post={p} onOpen={() => setOpenSlug(p.slug)} />
          ))}
        </div>
      )}

      {openSlug && (
        <PostModal subdomain={subdomain} slug={openSlug} onClose={() => setOpenSlug(null)} />
      )}
    </div>
    <AffiliateAdSection placement="blog_page" title="You Might Also Like" maxItems={3} restaurantId={restaurantId} />
    </>
  );
}
