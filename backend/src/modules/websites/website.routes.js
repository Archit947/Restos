'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');
const { query, queryOne } = require('../../config/database');
const { success, paginated, notFound, serverError, buildPaginationMeta } = require('../../utils/apiResponse');
const { createAuditLog, getClientIp } = require('../../middleware/auditLog.middleware');
const { AUDIT_ACTIONS } = require('../../config/constants');

router.use(authenticate);

// List all websites
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const lim = Math.min(parseInt(limit), 100);
    const pg = Math.max(1, parseInt(page));
    const offset = (pg - 1) * lim;

    let where = [];
    const params = [];
    if (search) { where.push('(r.restaurant_name LIKE ? OR w.title LIKE ? OR s.full_domain LIKE ?)'); const q = `%${search}%`; params.push(q, q, q); }
    if (status) { where.push('w.status = ?'); params.push(status); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRes] = await query(
      `SELECT COUNT(*) AS total FROM websites w JOIN restaurants r ON w.restaurant_id = r.id LEFT JOIN subdomains s ON r.id = s.restaurant_id ${whereClause}`,
      params
    );
    const [rows] = await query(
      `SELECT w.*, r.restaurant_name, r.logo, r.status AS restaurant_status,
       s.subdomain, s.full_domain, t.name AS template_name
       FROM websites w
       JOIN restaurants r ON w.restaurant_id = r.id
       LEFT JOIN subdomains s ON r.id = s.restaurant_id
       LEFT JOIN website_templates t ON w.template_id = t.id
       ${whereClause}
       ORDER BY w.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );

    return paginated(res, rows, buildPaginationMeta(pg, lim, countRes[0]?.total || 0));
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Get website details by restaurant ID
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const website = await queryOne(
      `SELECT w.*, t.name AS template_name, s.subdomain, s.full_domain
       FROM websites w
       LEFT JOIN website_templates t ON w.template_id = t.id
       LEFT JOIN subdomains s ON w.restaurant_id = s.restaurant_id
       WHERE w.restaurant_id = ?`,
      [req.params.restaurantId]
    );
    if (!website) return notFound(res, 'Website not found.');
    return success(res, website);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Update website settings
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, primary_color, secondary_color, font_family, meta_title, meta_description, custom_css } = req.body;
    await query(
      `UPDATE websites SET
       title = COALESCE(?, title), subtitle = COALESCE(?, subtitle),
       primary_color = COALESCE(?, primary_color), secondary_color = COALESCE(?, secondary_color),
       font_family = COALESCE(?, font_family), meta_title = COALESCE(?, meta_title),
       meta_description = COALESCE(?, meta_description), custom_css = COALESCE(?, custom_css)
       WHERE id = ?`,
      [title, subtitle, primary_color, secondary_color, font_family, meta_title, meta_description, custom_css, req.params.id]
    );
    return success(res, null, 'Website updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Publish website
router.post('/:id/publish', requireAdmin, async (req, res) => {
  try {
    const website = await queryOne('SELECT * FROM websites WHERE id = ?', [req.params.id]);
    if (!website) return notFound(res, 'Website not found.');

    await query("UPDATE websites SET status = 'published', published_at = NOW() WHERE id = ?", [req.params.id]);

    await createAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      tenantId: website.tenant_id,
      action: AUDIT_ACTIONS.WEBSITE_PUBLISHED,
      entityType: 'website', entityId: req.params.id,
      description: `Website ${req.params.id} published.`,
      ipAddress: getClientIp(req),
    });

    return success(res, null, 'Website published successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Unpublish website
router.post('/:id/unpublish', requireAdmin, async (req, res) => {
  try {
    await query("UPDATE websites SET status = 'unpublished' WHERE id = ?", [req.params.id]);
    await createAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      action: AUDIT_ACTIONS.WEBSITE_UNPUBLISHED,
      entityType: 'website', entityId: req.params.id,
      ipAddress: getClientIp(req),
    });
    return success(res, null, 'Website unpublished.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Toggle website enabled/disabled
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const website = await queryOne('SELECT is_enabled FROM websites WHERE id = ?', [req.params.id]);
    if (!website) return notFound(res, 'Website not found.');
    const newState = !website.is_enabled;
    await query('UPDATE websites SET is_enabled = ? WHERE id = ?', [newState, req.params.id]);
    const action = newState ? AUDIT_ACTIONS.WEBSITE_ENABLED : AUDIT_ACTIONS.WEBSITE_DISABLED;
    await createAuditLog({ userId: req.user.id, action, entityType: 'website', entityId: req.params.id, ipAddress: getClientIp(req) });
    return success(res, { is_enabled: newState }, `Website ${newState ? 'enabled' : 'disabled'}.`);
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
