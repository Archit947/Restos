'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');
const { query, queryOne, transaction } = require('../../config/database');
const { success, created, paginated, notFound, serverError, buildPaginationMeta } = require('../../utils/apiResponse');
const { createAuditLog, getClientIp } = require('../../middleware/auditLog.middleware');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { handleUpload, uploadTemplateThumbnail } = require('../../middleware/upload.middleware');
const { generateSlug } = require('../../utils/slugHelper');

router.use(authenticate);

// List templates
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, is_active } = req.query;
    const lim = Math.min(parseInt(limit), 100);
    const pg = Math.max(1, parseInt(page));
    const offset = (pg - 1) * lim;

    let where = [];
    const params = [];

    if (search) { where.push('(name LIKE ? OR description LIKE ?)'); const s = `%${search}%`; params.push(s, s); }
    if (category) { where.push('category = ?'); params.push(category); }
    if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active === 'true' ? 1 : 0); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRes] = await query(`SELECT COUNT(*) AS total FROM website_templates ${whereClause}`, params);
    const [rows] = await query(
      `SELECT * FROM website_templates ${whereClause} ORDER BY is_default DESC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );

    return paginated(res, rows, buildPaginationMeta(pg, lim, countRes[0]?.total || 0));
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Get one template
router.get('/:id', async (req, res) => {
  try {
    const template = await queryOne('SELECT * FROM website_templates WHERE id = ?', [req.params.id]);
    if (!template) return notFound(res, 'Template not found.');
    return success(res, template);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Create template
router.post('/', requireAdmin, handleUpload(uploadTemplateThumbnail), async (req, res) => {
  try {
    const { name, description, category, version, is_active, config } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

    const slug = generateSlug(name);
    const thumbnail = req.file ? req.file.publicUrl : null;

    const [result] = await query(
      `INSERT INTO website_templates (name, slug, description, thumbnail, category, version, is_active, config, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [name, slug, description || null, thumbnail, category || 'modern', version || '1.0.0',
       is_active !== undefined ? is_active : 1, config ? JSON.stringify(config) : null, req.user.id]
    );

    await createAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      action: AUDIT_ACTIONS.TEMPLATE_CREATED, entityType: 'template',
      entityId: result.insertId, entityName: name,
      ipAddress: getClientIp(req),
    });

    const template = await queryOne('SELECT * FROM website_templates WHERE id = ?', [result.insertId]);
    return created(res, template, 'Template created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Update template
router.put('/:id', requireAdmin, handleUpload(uploadTemplateThumbnail), async (req, res) => {
  try {
    const { name, description, category, version, is_active, config } = req.body;
    const thumbnail = req.file ? req.file.publicUrl : undefined;

    await query(
      `UPDATE website_templates SET
       name = COALESCE(?, name), description = COALESCE(?, description),
       category = COALESCE(?, category), version = COALESCE(?, version),
       is_active = COALESCE(?, is_active),
       thumbnail = COALESCE(?, thumbnail),
       config = COALESCE(?, config)
       WHERE id = ?`,
      [name, description, category, version, is_active !== undefined ? Boolean(is_active) : undefined,
       thumbnail, config ? JSON.stringify(config) : undefined, req.params.id]
    );

    const template = await queryOne('SELECT * FROM website_templates WHERE id = ?', [req.params.id]);
    await createAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      action: AUDIT_ACTIONS.TEMPLATE_UPDATED, entityType: 'template',
      entityId: req.params.id, entityName: template?.name,
      ipAddress: getClientIp(req),
    });

    return success(res, template, 'Template updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Delete template
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM website_templates WHERE id = ?', [req.params.id]);
    return success(res, null, 'Template deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Assign template to restaurant
router.post('/:id/assign/:restaurantId', requireAdmin, async (req, res) => {
  try {
    await query('UPDATE websites SET template_id = ? WHERE restaurant_id = ?', [req.params.id, req.params.restaurantId]);
    await createAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      action: AUDIT_ACTIONS.TEMPLATE_ASSIGNED, entityType: 'template',
      entityId: req.params.id,
      description: `Template ${req.params.id} assigned to restaurant ${req.params.restaurantId}.`,
      ipAddress: getClientIp(req),
    });
    return success(res, null, 'Template assigned to restaurant.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
