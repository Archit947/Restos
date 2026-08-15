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

// GET /affiliate/admin — list all products with filters
router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, placement, status } = req.query;
    const lim    = Math.min(parseInt(limit), 100);
    const pg     = Math.max(1, parseInt(page));
    const offset = (pg - 1) * lim;

    const where = []; const params = [];
    if (search)    { where.push('(title LIKE ? OR brand LIKE ? OR asin LIKE ?)'); const s = `%${search}%`; params.push(s, s, s); }
    if (placement) { where.push('placement = ?'); params.push(placement); }
    if (status)    { where.push('status = ?'); params.push(status); }

    const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [cntResult, listResult] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM affiliate_products ${wc}`, params),
      query(`SELECT * FROM affiliate_products ${wc} ORDER BY priority ASC, created_at DESC LIMIT ? OFFSET ?`,
        [...params, lim, offset]),
    ]);

    const cnt  = cntResult[0];    // array of rows from COUNT query
    const rows = listResult[0];   // array of all product rows

    return paginated(res, rows, buildPaginationMeta(pg, lim, cnt[0]?.total || 0));
  } catch (err) { return serverError(res, err.message); }
});

// GET /affiliate/admin/stats — dashboard stats
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [statsRows] = await query(`
      SELECT
        COUNT(*)                                              AS total,
        SUM(status = 'active')                               AS active,
        SUM(status = 'inactive')                             AS inactive,
        SUM(status = 'draft')                                AS draft,
        SUM(status = 'scheduled' AND (start_date IS NULL OR start_date > ?)) AS scheduled,
        SUM(COALESCE(click_count, 0))                        AS total_clicks
      FROM affiliate_products
    `, [today]);
    const totals = statsRows[0] || {};

    // Recent clicks
    const [recentClicks] = await query(`
      SELECT ap.title, COUNT(ac.id) AS clicks
      FROM affiliate_clicks ac
      JOIN affiliate_products ap ON ap.id = ac.product_id
      WHERE ac.clicked_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY ap.id
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

    const product = await queryOne('SELECT * FROM affiliate_products WHERE id = ?', [r.insertId]);
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

    const product = await queryOne('SELECT * FROM affiliate_products WHERE id = ?', [req.params.id]);
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

// GET /affiliate/public — active products for a placement
router.get('/public', async (req, res) => {
  try {
    const { placement, limit = 6 } = req.query;
    const today = new Date().toISOString().slice(0, 10);

    const where = [`status = 'active'`];
    const params = [];

    if (placement) { where.push('placement = ?'); params.push(placement); }

    // Respect start/end dates
    where.push('(start_date IS NULL OR start_date <= ?)'); params.push(today);
    where.push('(end_date   IS NULL OR end_date   >= ?)'); params.push(today);

    const lim = Math.min(parseInt(limit) || 6, 20);
    const [rows] = await query(
      `SELECT id, title, description, image_url, price, currency, rating, brand,
              affiliate_url, placement, priority
       FROM affiliate_products
       WHERE ${where.join(' AND ')}
       ORDER BY priority ASC, id DESC
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
