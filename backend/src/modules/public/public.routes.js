'use strict';

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { query, queryOne } = require('../../config/database');
const { success, notFound, badRequest, serverError } = require('../../utils/apiResponse');

// ─── Helper: resolve restaurant from subdomain ────────────────────────────────
/** Normalize a restaurant image path to a root-relative URL.
 *  Files uploaded during restaurant creation are saved under uploads/restaurants/.
 *  The DB stores only the bare filename; prepend the correct sub-path here so
 *  the frontend imageUrl() helper can pass it through unchanged.
 */
function normalizeRestaurantImage(filename) {
  if (!filename) return null;
  if (filename.startsWith('/') || filename.startsWith('http')) return filename;
  return `/uploads/restaurants/${filename}`;
}

async function resolveRestaurant(subdomain) {
  const restaurant = await queryOne(`
    SELECT r.id, r.tenant_id, r.restaurant_name, r.business_name, r.owner_name,
           r.email, r.phone, r.whatsapp, r.cuisine_type, r.description,
           r.logo, r.cover_image, r.has_store, r.hero_video_url,
           r.status, r.account_status,
           w.template_slug, w.primary_color, w.secondary_color, w.font_family,
           w.title AS website_title, w.subtitle AS website_subtitle,
           w.meta_title, w.meta_description, w.custom_css, w.is_enabled,
           s.full_domain, s.subdomain
    FROM subdomains s
    JOIN restaurants r ON s.restaurant_id = r.id
    LEFT JOIN websites w ON w.restaurant_id = r.id
    WHERE s.subdomain = ? AND r.account_status = 'active'
    LIMIT 1`, [subdomain]);

  if (restaurant) {
    restaurant.logo        = normalizeRestaurantImage(restaurant.logo);
    restaurant.cover_image = normalizeRestaurantImage(restaurant.cover_image);
  }
  return restaurant;
}

// ─── GET /:subdomain — restaurant info + operating hours ─────────────────────
router.get('/:subdomain', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const rid = restaurant.id;
    const [hours] = await query(
      'SELECT day_of_week, is_open, open_time, close_time FROM operating_hours WHERE restaurant_id = ? ORDER BY day_of_week',
      [rid]
    );
    const address = await queryOne('SELECT * FROM restaurant_addresses WHERE restaurant_id = ?', [rid]);

    return success(res, { restaurant, hours, address });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── GET /:subdomain/menu — categories + items ────────────────────────────────
router.get('/:subdomain/menu', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const rid = restaurant.id;
    const [categories] = await query(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order, name',
      [rid]
    );
    const [items] = await query(
      'SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY sort_order, name',
      [rid]
    );
    return success(res, { categories, items });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── GET /:subdomain/events — published upcoming events ───────────────────────
router.get('/:subdomain/events', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const [events] = await query(
      `SELECT * FROM events
       WHERE restaurant_id = ? AND is_published = 1
       ORDER BY event_date ASC`,
      [restaurant.id]
    );
    return success(res, events);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── POST /:subdomain/events/:id/book — book event ticket ────────────────────
router.post('/:subdomain/events/:id/book', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const { customer_name, customer_email, customer_phone, tickets = 1 } = req.body;
    if (!customer_name || !customer_email) return badRequest(res, 'Name and email are required.');

    const event = await queryOne(
      'SELECT * FROM events WHERE id = ? AND restaurant_id = ? AND is_published = 1',
      [req.params.id, restaurant.id]
    );
    if (!event) return notFound(res, 'Event not found.');

    const ref = 'EVT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const total = (event.ticket_price || 0) * tickets;

    await query(
      `INSERT INTO event_bookings (restaurant_id, event_id, customer_name, customer_email, customer_phone, tickets, total, booking_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant.id, event.id, customer_name, customer_email, customer_phone || null, tickets, total, ref]
    );

    return success(res, { bookingReference: ref, event: event.title, tickets, total }, 'Booking confirmed!');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── GET /:subdomain/blog — published posts ───────────────────────────────────
router.get('/:subdomain/blog', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const [posts] = await query(
      `SELECT id, title, slug, excerpt, featured_image, author, category, published_at, created_at
       FROM blog_posts
       WHERE restaurant_id = ? AND status = 'published'
       ORDER BY published_at DESC`,
      [restaurant.id]
    );
    return success(res, posts);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── GET /:subdomain/blog/:slug — single post ─────────────────────────────────
router.get('/:subdomain/blog/:slug', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const post = await queryOne(
      "SELECT * FROM blog_posts WHERE restaurant_id = ? AND slug = ? AND status = 'published'",
      [restaurant.id, req.params.slug]
    );
    if (!post) return notFound(res, 'Post not found.');
    return success(res, post);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── POST /:subdomain/reservations — book a table ────────────────────────────
router.post('/:subdomain/reservations', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const { customer_name, customer_phone, customer_email, party_size, reservation_date, reservation_time, special_requests } = req.body;
    if (!customer_name || !customer_phone || !reservation_date || !party_size) {
      return badRequest(res, 'Name, phone, party size, and date are required.');
    }

    // Combine date + time into a single DATETIME value
    const reservationDateTime = reservation_time
      ? `${reservation_date} ${reservation_time}:00`
      : `${reservation_date} 00:00:00`;

    // Generate a unique confirmation code
    const confirmationCode = 'RES-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const [result] = await query(
      `INSERT INTO reservations (restaurant_id, tenant_id, customer_name, customer_phone, customer_email, party_size, reservation_date, special_requests, status, confirmation_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?) RETURNING id`,
      [restaurant.id, restaurant.tenant_id, customer_name, customer_phone, customer_email || null, party_size, reservationDateTime, special_requests || null, confirmationCode]
    );

    return success(res, { reservationId: result.insertId, confirmationCode }, 'Table reserved! We will confirm your booking shortly.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── POST /:subdomain/orders — place a food order ────────────────────────────
router.post('/:subdomain/orders', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const { customer_name, customer_phone, customer_email, items, order_type = 'dine_in', special_instructions } = req.body;
    if (!customer_name || !customer_phone || !items?.length) {
      return badRequest(res, 'Name, phone, and at least one item are required.');
    }

    const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
    const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.qty)), 0);
    const total = subtotal;

    await query(
      `INSERT INTO customer_orders (restaurant_id, tenant_id, order_number, customer_name, customer_phone, customer_email, items, subtotal, total, order_type, special_instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant.id, restaurant.tenant_id, orderNumber, customer_name, customer_phone, customer_email || null,
       JSON.stringify(items), subtotal, total, order_type, special_instructions || null]
    );

    return success(res, { orderNumber, total }, 'Order placed successfully!');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── GET /:subdomain/orders/:orderNumber — track an order ────────────────────
router.get('/:subdomain/orders/:orderNumber', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');

    const order = await queryOne(
      'SELECT * FROM customer_orders WHERE restaurant_id = ? AND order_number = ?',
      [restaurant.id, req.params.orderNumber.toUpperCase()]
    );
    if (!order) return notFound(res, 'Order not found.');

    // Parse JSON items
    if (typeof order.items === 'string') order.items = JSON.parse(order.items);
    return success(res, order);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── GET /:subdomain/store — store items for public site ──────────────────────
router.get('/:subdomain/store', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');
    if (!restaurant.has_store) return notFound(res, 'This restaurant does not have a store.');

    const rid = restaurant.id;
    const [categories] = await query(
      'SELECT * FROM store_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order, name',
      [rid]
    );
    const [items] = await query(
      `SELECT i.*, c.name AS category_name
       FROM store_items i
       LEFT JOIN store_categories c ON i.category_id = c.id
       WHERE i.restaurant_id = ? AND i.is_available = 1
       ORDER BY i.sort_order, i.name`,
      [rid]
    );

    // Normalize item images
    const normalizedItems = items.map(item => ({
      ...item,
      image: item.image && !item.image.startsWith('/') && !item.image.startsWith('http')
        ? `/uploads/store/${item.image}`
        : (item.image || null),
    }));

    return success(res, { categories, items: normalizedItems });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ─── POST /:subdomain/store/orders — place a store order ─────────────────────
router.post('/:subdomain/store/orders', async (req, res) => {
  try {
    const restaurant = await resolveRestaurant(req.params.subdomain);
    if (!restaurant) return notFound(res, 'Restaurant not found.');
    if (!restaurant.has_store) return notFound(res, 'This restaurant does not have a store.');

    const { customer_name, customer_phone, customer_email, customer_address, items, notes } = req.body;
    if (!customer_name || !customer_phone || !items?.length) {
      return badRequest(res, 'Name, phone, and at least one item are required.');
    }

    const orderNumber = 'STO-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
    const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.qty || 1)), 0);
    const total = subtotal;

    await query(
      `INSERT INTO store_orders
       (restaurant_id, tenant_id, order_number, customer_name, customer_phone, customer_email, customer_address, items, subtotal, total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurant.id, restaurant.tenant_id, orderNumber, customer_name, customer_phone,
       customer_email || null, customer_address || null, JSON.stringify(items), subtotal, total, notes || null]
    );

    return success(res, { orderNumber, total }, 'Order placed successfully!');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
