import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../api/public';
import { ThemeProvider } from './ThemeContext';
import SiteNav from './components/SiteNav';
import SiteFooter from './components/SiteFooter';
import SiteCart from './components/SiteCart';
import { useCartStore } from './cartStore';

import HomePage from './pages/HomePage';
import FoodMenuPage from './pages/FoodMenuPage';
import EventsPage from './pages/EventsPage';
import BlogPage from './pages/BlogPage';
import AboutPage from './pages/AboutPage';
import TrackPage from './pages/TrackPage';
import BookTablePage from './pages/BookTablePage';
import StorePage from './pages/StorePage';

function SiteLoader() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const sub = subdomain!;

  const infoQ    = useQuery({ queryKey: ['site-info',    sub], queryFn: () => publicApi.getInfo(sub).then(r => r.data.data) });
  const menuQ    = useQuery({ queryKey: ['site-menu',    sub], queryFn: () => publicApi.getMenu(sub).then(r => r.data.data) });
  const eventsQ  = useQuery({ queryKey: ['site-events',  sub], queryFn: () => publicApi.getEvents(sub).then(r => r.data.data) });
  const blogQ    = useQuery({ queryKey: ['site-blog',    sub], queryFn: () => publicApi.getBlog(sub).then(r => r.data.data) });
  const aboutQ   = useQuery({ queryKey: ['site-about',   sub], queryFn: () => publicApi.getAboutContent(sub).then(r => r.data.data), staleTime: 5 * 60 * 1000 });
  const reviewsQ = useQuery({ queryKey: ['site-reviews', sub], queryFn: () => publicApi.getReviews(sub).then(r => r.data.data),      staleTime: 2 * 60 * 1000 });

  const { addItem, items: cartItems, count, setOpen } = useCartStore();

  if (infoQ.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0f1e', color: '#c9a84c' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <p style={{ fontFamily: 'serif', fontSize: 18 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (infoQ.isError || !infoQ.data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d0d', color: '#f4f3ee' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontFamily: 'serif', fontSize: 24, marginBottom: 8 }}>Restaurant not found</h2>
          <p style={{ color: '#a8a29e' }}>The subdomain <strong>{sub}</strong> doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { restaurant, hours, address } = infoQ.data;
  // template_slug is returned directly on restaurant (joined from websites table)
  const templateId = restaurant?.template_slug || 'bloom';
  const categories: any[] = menuQ.data?.categories || [];
  const menuItems: any[] = menuQ.data?.items || [];
  const events: any[]    = eventsQ.data || [];
  const posts: any[]     = blogQ.data || [];
  const blocks: any[]    = aboutQ.data?.blocks || [];
  const reviews: any[]   = reviewsQ.data || [];

  const handleAddToCart = (item: any) => {
    addItem({ id: item.id, name: item.name, price: Number(item.price), currency: item.currency || '₹', is_veg: item.is_veg });
    setOpen(true);
  };

  return (
    <ThemeProvider templateId={templateId}>
      <SiteNav subdomain={sub} restaurantName={restaurant.restaurant_name} logo={restaurant.logo} cartCount={count()} onCartClick={() => setOpen(true)} hasStore={Boolean(restaurant.has_store)} />

      {/* Pearl hero overlaps the sticky nav (nav is transparent at top). Other themes need the padding offset. */}
      <div style={{ paddingTop: templateId === 'pearl' ? 0 : 64 }}>
        <Routes>
          <Route index element={<HomePage subdomain={sub} restaurant={restaurant} menuItems={menuItems} reviews={reviews} restaurantId={restaurant.id} />} />
          <Route path="menu" element={
            <FoodMenuPage subdomain={sub} categories={categories} items={menuItems} cart={cartItems} onAddToCart={handleAddToCart} />
          } />
          <Route path="events" element={<EventsPage subdomain={sub} events={events} />} />
          <Route path="blog" element={<BlogPage subdomain={sub} posts={posts} restaurantId={restaurant.id} />} />
          <Route path="about" element={<AboutPage restaurant={restaurant} hours={hours || []} address={address} blocks={blocks} />} />
          <Route path="track" element={<TrackPage subdomain={sub} />} />
          <Route path="book"  element={<BookTablePage subdomain={sub} restaurant={restaurant} />} />
          <Route path="store" element={<StorePage subdomain={sub} />} />
          <Route path="*"    element={<Navigate to="" replace />} />
        </Routes>
      </div>

      <SiteFooter subdomain={sub} restaurant={restaurant} hours={hours || []} address={address} />
      <SiteCart subdomain={sub} />
    </ThemeProvider>
  );
}

export default function SiteApp() {
  return (
    <Routes>
      <Route path=":subdomain/*" element={<SiteLoader />} />
    </Routes>
  );
}
