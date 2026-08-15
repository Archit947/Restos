'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { query, queryOne }     = require('../../config/database');
const { createStorage }       = require('../../middleware/upload.middleware');
const { authenticateRestaurant } = require('../../middleware/restaurantAuth.middleware');
const { success, created, badRequest, notFound, serverError } = require('../../utils/apiResponse');

router.use(authenticateRestaurant);

// Multi-field uploader for restaurant branding images
const brandingUpload = multer({
  storage: createStorage('restaurants'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP images are allowed.'), false);
  },
}).fields([
  { name: 'logo',        maxCount: 1 },
  { name: 'cover_image', maxCount: 1 },
]);

// ═══════════════════════════════════════════════════════════════
// BRANDING — logo + hero/cover image upload
// ═══════════════════════════════════════════════════════════════

// PATCH /cms/branding — upload new logo and/or cover image
router.patch('/branding', (req, res, next) => {
  brandingUpload(req, res, (err) => {
    if (err) return badRequest(res, err.message || 'Image upload failed.');
    next();
  });
}, async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const setClauses = [];
    const params     = [];
    const result     = {};

    if (req.files?.logo?.[0]) {
      const filename = req.files.logo[0].filename;
      setClauses.push('logo = ?');
      params.push(filename);
      result.logo = `/uploads/restaurants/${filename}`;
    }
    if (req.files?.cover_image?.[0]) {
      const filename = req.files.cover_image[0].filename;
      setClauses.push('cover_image = ?');
      params.push(filename);
      result.cover_image = `/uploads/restaurants/${filename}`;
    }

    if (!setClauses.length) return badRequest(res, 'No image file provided.');

    params.push(rid);
    await query(`UPDATE restaurants SET ${setClauses.join(', ')} WHERE id = ?`, params);

    return success(res, result, 'Branding image(s) updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════
// INFO & OPERATING HOURS
// ═══════════════════════════════════════════════════════════════

/** Normalize bare restaurant image filenames to root-relative URLs.
 *  Files are stored in uploads/restaurants/ but the DB has only the bare filename. */
function normalizeRestaurantImage(filename) {
  if (!filename) return null;
  if (filename.startsWith('/') || filename.startsWith('http')) return filename;
  return `/uploads/restaurants/${filename}`;
}

router.get('/info', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const info = await queryOne(
      `SELECT r.restaurant_name, r.business_name, r.owner_name, r.email, r.phone,
              r.whatsapp, r.cuisine_type, r.description, r.logo, r.cover_image, r.hero_video_url,
              ra.address, ra.area, ra.city, ra.state, ra.country, ra.zip_code,
              ra.latitude, ra.longitude
       FROM restaurants r
       LEFT JOIN restaurant_addresses ra ON ra.restaurant_id = r.id
       WHERE r.id = ?`, [rid]
    );

    // Normalize bare filenames → /uploads/restaurants/<filename>
    if (info) {
      info.logo        = normalizeRestaurantImage(info.logo);
      info.cover_image = normalizeRestaurantImage(info.cover_image);
    }

    const [hours] = await query(
      'SELECT day_of_week, is_open, open_time, close_time FROM operating_hours WHERE restaurant_id = ? ORDER BY day_of_week',
      [rid]
    );

    return success(res, { info, hours });
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.put('/info', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;
    const {
      restaurant_name, business_name, owner_name, phone, whatsapp,
      cuisine_type, description, hero_video_url,
      address, area, city, state, country, zip_code, latitude, longitude,
      hours, // array: [{ day_of_week, is_open, open_time, close_time }]
    } = req.body;

    // Update restaurant basic info
    await query(
      `UPDATE restaurants SET
         restaurant_name = COALESCE(?, restaurant_name),
         business_name   = COALESCE(?, business_name),
         owner_name      = COALESCE(?, owner_name),
         phone           = COALESCE(?, phone),
         whatsapp        = COALESCE(?, whatsapp),
         cuisine_type    = COALESCE(?, cuisine_type),
         description     = COALESCE(?, description),
         hero_video_url  = ?
       WHERE id = ?`,
      [restaurant_name || null, business_name || null, owner_name || null,
       phone || null, whatsapp || null, cuisine_type || null, description || null,
       hero_video_url || null, rid]
    );

    // Upsert address
    const existingAddr = await queryOne('SELECT id FROM restaurant_addresses WHERE restaurant_id = ?', [rid]);
    if (existingAddr) {
      await query(
        `UPDATE restaurant_addresses SET
           address = COALESCE(?, address), area = COALESCE(?, area),
           city = COALESCE(?, city), state = COALESCE(?, state),
           country = COALESCE(?, country), zip_code = COALESCE(?, zip_code),
           latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude)
         WHERE restaurant_id = ?`,
        [address || null, area || null, city || null, state || null,
         country || null, zip_code || null, latitude || null, longitude || null, rid]
      );
    } else if (address || city) {
      await query(
        `INSERT INTO restaurant_addresses (restaurant_id, tenant_id, address, area, city, state, country, zip_code, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rid, tid, address || '', area || null, city || '', state || null,
         country || 'India', zip_code || null, latitude || null, longitude || null]
      );
    }

    // Upsert operating hours
    if (Array.isArray(hours)) {
      for (const h of hours) {
        await query(
          `INSERT INTO operating_hours (restaurant_id, tenant_id, day_of_week, is_open, open_time, close_time)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (restaurant_id, day_of_week)
           DO UPDATE SET is_open = EXCLUDED.is_open, open_time = EXCLUDED.open_time, close_time = EXCLUDED.close_time`,
          [rid, tid, h.day_of_week, h.is_open ? 1 : 0, h.open_time || null, h.close_time || null]
        );
      }
    }

    return success(res, null, 'Restaurant info updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════
// WEBSITE SETTINGS + SEO
// ═══════════════════════════════════════════════════════════════

router.get('/website', async (req, res) => {
  try {
    const site = await queryOne('SELECT * FROM websites WHERE restaurant_id = ?', [req.restaurant.id]);
    return success(res, site || {});
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.put('/website', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const {
      title, subtitle, favicon, primary_color, secondary_color, font_family,
    } = req.body;

    const existing = await queryOne('SELECT id FROM websites WHERE restaurant_id = ?', [rid]);
    if (!existing) return notFound(res, 'Website not found. Please contact support.');

    await query(
      `UPDATE websites SET
         title          = COALESCE(?, title),
         subtitle       = COALESCE(?, subtitle),
         favicon        = COALESCE(?, favicon),
         primary_color  = COALESCE(?, primary_color),
         secondary_color= COALESCE(?, secondary_color),
         font_family    = COALESCE(?, font_family)
       WHERE restaurant_id = ?`,
      [title || null, subtitle || null, favicon || null,
       primary_color || null, secondary_color || null, font_family || null, rid]
    );
    return success(res, null, 'Website settings updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.put('/seo', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { meta_title, meta_description, google_analytics, facebook_pixel, custom_css } = req.body;

    await query(
      `UPDATE websites SET
         meta_title       = COALESCE(?, meta_title),
         meta_description = COALESCE(?, meta_description),
         google_analytics = COALESCE(?, google_analytics),
         facebook_pixel   = COALESCE(?, facebook_pixel),
         custom_css       = COALESCE(?, custom_css)
       WHERE restaurant_id = ?`,
      [meta_title || null, meta_description || null, google_analytics || null,
       facebook_pixel || null, custom_css || null, rid]
    );
    return success(res, null, 'SEO settings updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════
// BLOG & ARTICLES
// ═══════════════════════════════════════════════════════════════

router.get('/blog', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { status, page = 1, limit = 20 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(parseInt(limit), 50);
    const offset = (pg - 1) * lim;

    let where = 'WHERE restaurant_id = ?';
    const params = [rid];
    if (status) { where += ' AND status = ?'; params.push(status); }

    const [[{ total }]] = await query(`SELECT COUNT(*) AS total FROM blog_posts ${where}`, params);
    const [posts] = await query(
      `SELECT id, title, slug, excerpt, featured_image, status, is_featured, published_at, views, created_at
       FROM blog_posts ${where} ORDER BY created_at DESC LIMIT ${lim} OFFSET ${offset}`,
      params
    );
    return success(res, { posts, total, page: pg, limit: lim });
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.post('/blog', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;
    const { title, excerpt, content, featured_image, author, category, tags, status = 'draft', meta_title, meta_description } = req.body;
    if (!title?.trim()) return badRequest(res, 'Post title is required.');

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();
    const publishedAt = status === 'published' ? new Date() : null;

    const [result] = await query(
      `INSERT INTO blog_posts
       (restaurant_id, tenant_id, title, slug, excerpt, content, featured_image, author, category, tags,
        status, meta_title, meta_description, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [rid, tid, title.trim(), slug, excerpt || null, content || null,
       featured_image || null, author || null, category || null, tags || null,
       status, meta_title || null, meta_description || null, publishedAt]
    );
    const post = await queryOne('SELECT * FROM blog_posts WHERE id = ?', [result.insertId]);
    return created(res, post, 'Blog post created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.get('/blog/:id', async (req, res) => {
  try {
    const post = await queryOne(
      'SELECT * FROM blog_posts WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!post) return notFound(res, 'Post not found.');
    return success(res, post);
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.put('/blog/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id, status FROM blog_posts WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Post not found.');

    const { title, excerpt, content, featured_image, author, category, tags, status, meta_title, meta_description } = req.body;
    const publishedAt = status === 'published' && existing.status !== 'published' ? new Date() : undefined;

    await query(
      `UPDATE blog_posts SET
         title = COALESCE(?, title), excerpt = COALESCE(?, excerpt),
         content = COALESCE(?, content), featured_image = COALESCE(?, featured_image),
         author = COALESCE(?, author), category = COALESCE(?, category),
         tags = COALESCE(?, tags), status = COALESCE(?, status),
         meta_title = COALESCE(?, meta_title), meta_description = COALESCE(?, meta_description)
         ${publishedAt ? ', published_at = ?' : ''}
       WHERE id = ? AND restaurant_id = ?`,
      [title || null, excerpt || null, content || null, featured_image || null,
       author || null, category || null, tags || null, status || null,
       meta_title || null, meta_description || null,
       ...(publishedAt ? [publishedAt] : []),
       req.params.id, rid]
    );
    const post = await queryOne('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);
    return success(res, post, 'Post updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.delete('/blog/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM blog_posts WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Post not found.');
    await query('DELETE FROM blog_posts WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    return success(res, null, 'Post deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════
// TABLE RESERVATIONS
// ═══════════════════════════════════════════════════════════════

router.get('/reservations', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { status, date, page = 1, limit = 20 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(parseInt(limit), 100);
    const offset = (pg - 1) * lim;

    let where = 'WHERE restaurant_id = ?';
    const params = [rid];
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (date)   { where += ' AND DATE(reservation_date) = ?'; params.push(date); }

    const [[{ total }]] = await query(`SELECT COUNT(*) AS total FROM reservations ${where}`, params);
    const [rows] = await query(
      `SELECT * FROM reservations ${where} ORDER BY reservation_date DESC LIMIT ${lim} OFFSET ${offset}`,
      params
    );
    return success(res, { reservations: rows, total, page: pg, limit: lim });
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.patch('/reservations/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { status, notes } = req.body;
    const existing = await queryOne('SELECT id FROM reservations WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Reservation not found.');
    // Use explicit field updates so clearing notes (empty string) works correctly
    await query(
      `UPDATE reservations SET
         status = CASE WHEN ? IS NOT NULL THEN ? ELSE status END,
         notes  = CASE WHEN ? IS NOT NULL THEN ? ELSE notes  END
       WHERE id = ? AND restaurant_id = ?`,
      [status ?? null, status ?? null, notes ?? null, notes ?? null, req.params.id, rid]
    );
    return success(res, null, 'Reservation updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════
// EVENT TICKETING
// ═══════════════════════════════════════════════════════════════

router.get('/events', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { status, page = 1, limit = 20 } = req.query;
    const pg = Math.max(1, parseInt(page));
    const lim = Math.min(parseInt(limit), 50);
    const offset = (pg - 1) * lim;

    let where = 'WHERE restaurant_id = ?';
    const params = [rid];
    if (status === 'upcoming') { where += ' AND event_date >= CURDATE() AND is_published = 1'; }
    else if (status === 'past') { where += ' AND event_date < CURDATE()'; }

    const [[{ total }]] = await query(`SELECT COUNT(*) AS total FROM events ${where}`, params);
    const [events] = await query(
      `SELECT * FROM events ${where} ORDER BY event_date DESC LIMIT ${lim} OFFSET ${offset}`,
      params
    );
    return success(res, { events, total, page: pg, limit: lim });
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.post('/events', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;
    const { title, description, banner, event_date, event_end_date, venue, ticket_price, capacity, booking_deadline, is_published = false } = req.body;
    if (!title?.trim() || !event_date) return badRequest(res, 'Title and event date are required.');

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const [result] = await query(
      `INSERT INTO events
       (restaurant_id, tenant_id, title, slug, description, banner, event_date, event_end_date,
        venue, ticket_price, capacity, booking_deadline, is_published, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming') RETURNING id`,
      [rid, tid, title.trim(), slug, description || null, banner || null,
       event_date, event_end_date || null, venue || null,
       ticket_price || 0, capacity || null, booking_deadline || null, is_published ? 1 : 0]
    );
    const event = await queryOne('SELECT * FROM events WHERE id = ?', [result.insertId]);
    return created(res, event, 'Event created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    const event = await queryOne('SELECT * FROM events WHERE id = ? AND restaurant_id = ?', [req.params.id, req.restaurant.id]);
    if (!event) return notFound(res, 'Event not found.');
    return success(res, event);
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.put('/events/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM events WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Event not found.');

    const { title, description, banner, event_date, event_end_date, venue, ticket_price, capacity, booking_deadline, is_published, status } = req.body;
    await query(
      `UPDATE events SET
         title = COALESCE(?, title), description = COALESCE(?, description),
         banner = COALESCE(?, banner), event_date = COALESCE(?, event_date),
         event_end_date = COALESCE(?, event_end_date), venue = COALESCE(?, venue),
         ticket_price = COALESCE(?, ticket_price), capacity = COALESCE(?, capacity),
         booking_deadline = COALESCE(?, booking_deadline),
         is_published = COALESCE(?, is_published), status = COALESCE(?, status)
       WHERE id = ? AND restaurant_id = ?`,
      [title || null, description || null, banner || null, event_date || null,
       event_end_date || null, venue || null, ticket_price || null, capacity || null,
       booking_deadline || null,
       is_published !== undefined ? (is_published ? 1 : 0) : null,
       status || null, req.params.id, rid]
    );
    const event = await queryOne('SELECT * FROM events WHERE id = ?', [req.params.id]);
    return success(res, event, 'Event updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM events WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Event not found.');
    await query('DELETE FROM events WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    return success(res, null, 'Event deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
