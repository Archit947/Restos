'use strict';

const express = require('express');
const https   = require('https');
const http    = require('http');
const url     = require('url');
const router  = express.Router();

const { authenticate }   = require('../../middleware/auth.middleware');
const { requireAdmin }   = require('../../middleware/rbac.middleware');
const { query, queryOne } = require('../../config/database');
const { success, created, paginated, notFound, badRequest, serverError, buildPaginationMeta }
  = require('../../utils/apiResponse');

// ─── Helper: extract ASIN from Amazon URL ────────────────────────────────────
function extractAsin(affiliateUrl) {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/gp\/product\/([A-Z0-9]{10})/,
    /\/ASIN\/([A-Z0-9]{10})/,
    /[?&]ASIN=([A-Z0-9]{10})/,
    /\/([A-Z0-9]{10})\/?(?:[?#]|$)/,
  ];
  for (const re of patterns) {
    const m = affiliateUrl.match(re);
    if (m) return m[1];
  }
  return null;
}

// ─── Helper: fetch URL with redirect following ────────────────────────────────
function fetchUrl(targetUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Too many redirects'));

    const parsed  = url.parse(targetUrl);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname:   parsed.hostname,
      path:       parsed.path,
      method:     'GET',
      timeout:    8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Cache-Control':   'no-cache',
      },
    };

    const req = lib.request(options, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
        return resolve(fetchUrl(redirectUrl, maxRedirects - 1));
      }

      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; if (body.length > 300000) req.destroy(); });
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

// ─── Helper: parse meta tags from HTML ───────────────────────────────────────
function parseMeta(html) {
  const get = (pattern) => {
    const m = html.match(pattern);
    return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() : null;
  };

  const title = get(/property="og:title"\s+content="([^"]+)"/)
    || get(/name="title"\s+content="([^"]+)"/)
    || get(/<title[^>]*>([^<]+)<\/title>/);

  const image = get(/property="og:image"\s+content="([^"]+)"/)
    || get(/name="twitter:image"\s+content="([^"]+)"/);

  const description = get(/property="og:description"\s+content="([^"]+)"/)
    || get(/name="description"\s+content="([^"]+)"/);

  // Amazon-specific: price
  let price = null;
  const priceM = html.match(/class="a-price-whole"[^>]*>([0-9,]+)</)
    || html.match(/"priceAmount":([0-9.]+)/)
    || html.match(/data-a-color="price"[^>]*>.*?₹\s*([\d,]+)/s)
    || html.match(/"displayPrice":"[₹$€£]?\s*([\d,]+\.?\d*)"/);
  if (priceM) price = parseFloat(priceM[1].replace(/,/g, ''));

  // Amazon-specific: rating
  let rating = null;
  const ratingM = html.match(/([0-9.]+) out of 5 stars/)
    || html.match(/"ratingScore":"([0-9.]+)"/);
  if (ratingM) rating = parseFloat(ratingM[1]);

  // Brand
  let brand = null;
  const brandM = html.match(/"brand":\{"name":"([^"]+)"/)
    || html.match(/class="a-spacing-top-micro"\s*>\s*(?:Visit the\s+)?(.+?)\s+(?:Store|Brand)</)
    || html.match(/data-feature-name="byline_info"[^>]*>.*?<[^>]+>([^<]+)<\/a>/s);
  if (brandM) brand = brandM[1].trim().substring(0, 100);

  return { title, image, description, price, rating, brand };
}

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN routes (requires authenticate + requireAdmin)
// ──────────────────────────────────────────────────────────────────────────────

// POST /affiliate/admin/fetch — scrape product info from affiliate URL
router.post('/admin/fetch', authenticate, requireAdmin, async (req, res) => {
  const { affiliate_url } = req.body;
  if (!affiliate_url) return badRequest(res, 'affiliate_url is required.');

  try {
    const asin = extractAsin(affiliate_url);
    let meta   = { title: null, image: null, description: null, price: null, rating: null, brand: null };

    try {
      const html = await fetchUrl(affiliate_url);
      meta = parseMeta(html);
    } catch (_) {
      // Best-effort — return partial data
    }

    // Amazon image CDN fallback using ASIN
    if (!meta.image && asin) {
      meta.image = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
    }

    return success(res, { asin, ...meta, affiliate_url });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// GET /affiliate/admin/restaurants — list all restaurants for targeting picker
router.get('/admin/restaurants', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT r.id, r.restaurant_name, s.subdomain
       FROM restaurants r
       LEFT JOIN subdomains s ON s.restaurant_id = r.id
       WHERE r.account_status = 'active'
       ORDER BY r.restaurant_name ASC`
    );
    return success(res, rows);
  } catch (err) { return serverError(res, err.message); }
});

// GET /affiliate/admin — list all products with filters
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, placement, status } = req.query;
    const lim    = Math.min(parseInt(limit), 100);
    const pg     = Math.max(1, parseInt(page));
    const offset = (pg - 1) * lim;

    const where = []; const params = [];
    if (search)    { where.push('(ap.title LIKE ? OR ap.brand LIKE ? OR ap.asin LIKE ?)'); const s = `%${search}%`; params.push(s, s, s); }
    if (placement) { where.push('ap.placement = ?'); params.push(placement); }
    if (status)    { where.push('ap.status = ?'); params.push(status); }

    const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [cntResult, listResult] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM affiliate_products ap ${wc}`, params),
      query(`SELECT ap.* FROM affiliate_products ap ${wc} ORDER BY ap.priority ASC, ap.created_at DESC LIMIT ? OFFSET ?`,
        [...params, lim, offset]),
    ]);

    const cnt  = cntResult[0];
    const rows = listResult[0];

    // Attach targeted restaurant_ids for each product
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const [targeting] = await query(
        `SELECT product_id, restaurant_id FROM affiliate_product_restaurants WHERE product_id = ANY(?)`,
        [ids]
      );
      const map = {};
      for (const t of targeting) {
        if (!map[t.product_id]) map[t.product_id] = [];
        map[t.product_id].push(t.restaurant_id);
      }
      for (const r of rows) r.restaurant_ids = map[r.id] || [];
    }

    return paginated(res, rows, buildPaginationMeta(pg, lim, cnt[0]?.total || 0));
  } catch (err) { return serverError(res, err.message); }
});

// GET /affiliate/admin/stats — dashboard stats
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [statsRows] = await query(`
      SELECT
        COUNT(*)                                                                        AS total,
        COUNT(*) FILTER (WHERE status = 'active')                                      AS active,
        COUNT(*) FILTER (WHERE status = 'inactive')                                    AS inactive,
        COUNT(*) FILTER (WHERE status = 'draft')                                       AS draft,
        COUNT(*) FILTER (WHERE status = 'scheduled' AND (start_date IS NULL OR start_date > ?)) AS scheduled,
        COALESCE(SUM(click_count), 0)                                                  AS total_clicks
      FROM affiliate_products
    `, [today]);
    const totals = statsRows[0] || {};

    // Recent clicks (last 7 days)
    const [recentClicks] = await query(`
      SELECT ap.title, COUNT(ac.id) AS clicks
      FROM affiliate_clicks ac
      JOIN affiliate_products ap ON ap.id = ac.product_id
      WHERE ac.clicked_at >= NOW() - INTERVAL '7 days'
      GROUP BY ap.id, ap.title
      ORDER BY clicks DESC
      LIMIT 5
    `);

    return success(res, { ...totals, recentClicks });
  } catch (err) { return serverError(res, err.message); }
});

// GET /affiliate/admin/:id
router.get('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const p = await queryOne('SELECT * FROM affiliate_products WHERE id = ?', [req.params.id]);
    if (!p) return notFound(res, 'Product not found.');
    const [targeting] = await query(
      'SELECT restaurant_id FROM affiliate_product_restaurants WHERE product_id = ?', [p.id]
    );
    p.restaurant_ids = targeting.map(t => t.restaurant_id);
    return success(res, p);
  } catch (err) { return serverError(res, err.message); }
});

// POST /affiliate/admin — create
router.post('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      affiliate_url, asin, title, description, image_url,
      price, currency = '₹', rating, brand,
      placement = 'homepage_section', status = 'draft',
      priority = 10, start_date, end_date,
      restaurant_ids = [],   // [] = all restaurants, [1,2,3] = targeted
    } = req.body;

    if (!affiliate_url) return badRequest(res, 'affiliate_url is required.');
    if (!title)         return badRequest(res, 'title is required.');

    const [r] = await query(
      `INSERT INTO affiliate_products
       (affiliate_url, asin, title, description, image_url, price, currency,
        rating, brand, placement, status, priority, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [affiliate_url, asin || null, title, description || null, image_url || null,
       price || null, currency, rating || null, brand || null,
       placement, status, priority, start_date || null, end_date || null,
       req.user.id]
    );

    const productId = r.insertId;

    // Insert restaurant targeting rows
    if (Array.isArray(restaurant_ids) && restaurant_ids.length > 0) {
      for (const rid of restaurant_ids) {
        await query(
          'INSERT INTO affiliate_product_restaurants (product_id, restaurant_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
          [productId, rid]
        );
      }
    }

    const product = await queryOne('SELECT * FROM affiliate_products WHERE id = ?', [productId]);
    const [targeting] = await query('SELECT restaurant_id FROM affiliate_product_restaurants WHERE product_id = ?', [productId]);
    product.restaurant_ids = targeting.map(t => t.restaurant_id);

    return created(res, product, 'Affiliate product created.');
  } catch (err) { return serverError(res, err.message); }
});

// PUT /affiliate/admin/:id — update
router.put('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      affiliate_url, asin, title, description, image_url,
      price, currency, rating, brand,
      placement, status, priority, start_date, end_date,
      restaurant_ids,  // undefined = don't touch, [] = all, [1,2] = targeted
    } = req.body;

    await query(
      `UPDATE affiliate_products SET
         affiliate_url = COALESCE(?, affiliate_url),
         asin          = ?,
         title         = COALESCE(?, title),
         description   = ?,
         image_url     = ?,
         price         = ?,
         currency      = COALESCE(?, currency),
         rating        = ?,
         brand         = ?,
         placement     = COALESCE(?, placement),
         status        = COALESCE(?, status),
         priority      = COALESCE(?, priority),
         start_date    = ?,
         end_date      = ?
       WHERE id = ?`,
      [affiliate_url || null, asin || null,
       title || null, description !== undefined ? description : undefined,
       image_url !== undefined ? image_url : undefined,
       price !== undefined ? price : undefined,
       currency || null,
       rating !== undefined ? rating : undefined,
       brand !== undefined ? brand : undefined,
       placement || null, status || null,
       priority !== undefined ? priority : undefined,
       start_date !== undefined ? (start_date || null) : undefined,
       end_date   !== undefined ? (end_date   || null) : undefined,
       req.params.id]
    );

    // Replace restaurant targeting if provided
    if (Array.isArray(restaurant_ids)) {
      await query('DELETE FROM affiliate_product_restaurants WHERE product_id = ?', [req.params.id]);
      for (const rid of restaurant_ids) {
        await query(
          'INSERT INTO affiliate_product_restaurants (product_id, restaurant_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
          [req.params.id, rid]
        );
      }
    }

    const product = await queryOne('SELECT * FROM affiliate_products WHERE id = ?', [req.params.id]);
    const [targeting] = await query('SELECT restaurant_id FROM affiliate_product_restaurants WHERE product_id = ?', [req.params.id]);
    product.restaurant_ids = targeting.map(t => t.restaurant_id);

    return success(res, product, 'Updated.');
  } catch (err) { return serverError(res, err.message); }
});

// PATCH /affiliate/admin/:id/status — quick toggle
router.patch('/admin/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['draft', 'active', 'inactive', 'scheduled'];
    if (!valid.includes(status)) return badRequest(res, 'Invalid status.');
    await query('UPDATE affiliate_products SET status = ? WHERE id = ?', [status, req.params.id]);
    return success(res, { id: req.params.id, status }, 'Status updated.');
  } catch (err) { return serverError(res, err.message); }
});

// DELETE /affiliate/admin/:id
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM affiliate_products WHERE id = ?', [req.params.id]);
    return success(res, null, 'Deleted.');
  } catch (err) { return serverError(res, err.message); }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUBLIC routes (no auth — served on public site)
// ──────────────────────────────────────────────────────────────────────────────

// GET /affiliate/public — active products for a placement, optionally filtered by restaurant
router.get('/public', async (req, res) => {
  try {
    const { placement, limit = 6, restaurant_id } = req.query;
    const today = new Date().toISOString().slice(0, 10);

    const where = [`ap.status = 'active'`];
    const params = [];

    if (placement)     { where.push('ap.placement = ?'); params.push(placement); }
    where.push('(ap.start_date IS NULL OR ap.start_date <= ?)'); params.push(today);
    where.push('(ap.end_date   IS NULL OR ap.end_date   >= ?)'); params.push(today);

    // Restaurant targeting: show if product targets this restaurant OR targets nobody (= all)
    if (restaurant_id) {
      where.push(`(
        NOT EXISTS (SELECT 1 FROM affiliate_product_restaurants apr WHERE apr.product_id = ap.id)
        OR EXISTS  (SELECT 1 FROM affiliate_product_restaurants apr WHERE apr.product_id = ap.id AND apr.restaurant_id = ?)
      )`);
      params.push(restaurant_id);
    }

    const lim = Math.min(parseInt(limit) || 6, 20);
    const [rows] = await query(
      `SELECT ap.id, ap.title, ap.description, ap.image_url, ap.price, ap.currency,
              ap.rating, ap.brand, ap.affiliate_url, ap.placement, ap.priority
       FROM affiliate_products ap
       WHERE ${where.join(' AND ')}
       ORDER BY ap.priority ASC, ap.id DESC
       LIMIT ?`,
      [...params, lim]
    );

    return success(res, rows);
  } catch (err) { return serverError(res, err.message); }
});

// POST /affiliate/public/:id/click — track a click
router.post('/public/:id/click', async (req, res) => {
  try {
    const { placement } = req.body;
    const ip        = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent']?.substring(0, 500);

    await Promise.all([
      query('UPDATE affiliate_products SET click_count = click_count + 1 WHERE id = ?', [req.params.id]),
      query(
        'INSERT INTO affiliate_clicks (product_id, placement, ip_address, user_agent) VALUES (?, ?, ?, ?)',
        [req.params.id, placement || null, ip || null, userAgent || null]
      ),
    ]);

    // Return the affiliate URL so the frontend can redirect
    const product = await queryOne('SELECT affiliate_url FROM affiliate_products WHERE id = ?', [req.params.id]);
    return success(res, { redirect_url: product?.affiliate_url || null });
  } catch (err) { return serverError(res, err.message); }
});

module.exports = router;
