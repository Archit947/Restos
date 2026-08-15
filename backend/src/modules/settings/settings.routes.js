'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin, requireSuperAdmin } = require('../../middleware/rbac.middleware');
const { query, queryOne } = require('../../config/database');
const { success, serverError } = require('../../utils/apiResponse');
const { createAuditLog, getClientIp } = require('../../middleware/auditLog.middleware');
const { AUDIT_ACTIONS } = require('../../config/constants');

router.use(authenticate);

// Get all settings (grouped)
router.get('/', async (req, res) => {
  try {
    const { group } = req.query;
    let sql = 'SELECT * FROM platform_settings';
    const params = [];

    if (group) { sql += ' WHERE `group` = ?'; params.push(group); }
    if (!req.user || req.user.role !== 'super_admin') {
      sql += (group ? ' AND' : ' WHERE') + ' is_public = 1';
    }
    sql += ' ORDER BY `group`, id';

    const [rows] = await query(sql, params);

    // Group by category
    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.group]) acc[row.group] = [];
      // Mask secrets
      if (row.type === 'secret' && row.value) row.value = '••••••••';
      acc[row.group].push(row);
      return acc;
    }, {});

    return success(res, grouped);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Get a single setting by key
router.get('/:key', async (req, res) => {
  try {
    const setting = await queryOne('SELECT * FROM platform_settings WHERE `key` = ?', [req.params.key]);
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found.' });
    if (setting.type === 'secret' && setting.value) setting.value = '••••••••';
    return success(res, setting);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Update multiple settings (batch)
router.put('/', requireSuperAdmin, async (req, res) => {
  try {
    const { settings } = req.body; // Array of { key, value }
    if (!Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: 'settings must be an array.' });
    }

    for (const { key, value } of settings) {
      if (!key) continue;
      await query(
        'UPDATE platform_settings SET value = ?, updated_by = ? WHERE `key` = ?',
        [value, req.user.id, key]
      );
    }

    await createAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      action: AUDIT_ACTIONS.SETTINGS_UPDATED,
      entityType: 'platform_settings',
      description: `Platform settings updated. Keys: ${settings.map(s => s.key).join(', ')}`,
      ipAddress: getClientIp(req),
    });

    return success(res, null, 'Settings updated successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Update single setting
router.put('/:key', requireSuperAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    await query(
      'UPDATE platform_settings SET value = ?, updated_by = ? WHERE `key` = ?',
      [value, req.user.id, req.params.key]
    );

    await createAuditLog({
      userId: req.user.id, userEmail: req.user.email,
      action: AUDIT_ACTIONS.SETTINGS_UPDATED,
      entityType: 'platform_settings',
      entityName: req.params.key,
      description: `Setting "${req.params.key}" updated.`,
      ipAddress: getClientIp(req),
    });

    return success(res, null, 'Setting updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Get subscription plans
router.get('/plans/list', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY sort_order');
    return success(res, rows);
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
