'use strict';

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { query, queryOne } = require('../../config/database');
const { authenticateRestaurant } = require('../../middleware/restaurantAuth.middleware');
const { hashPassword, generateTempPassword } = require('../../utils/passwordHelper');
const { success, created, notFound, badRequest, serverError } = require('../../utils/apiResponse');

router.use(authenticateRestaurant);

// ── GET / — list KDS staff ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [staff] = await query(
      `SELECT id, name, station_name, username, temp_password, is_active, last_login_at, created_at
       FROM kitchen_staff WHERE restaurant_id = ? ORDER BY created_at DESC`,
      [req.restaurant.id]
    );
    return success(res, { staff });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── POST / — create KDS staff ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const rid  = req.restaurant.id;
    const tid  = req.restaurant.tenant_id;
    const { name, station_name } = req.body;
    if (!name?.trim()) return badRequest(res, 'Staff name is required.');

    // Auto-generate username: kds_<restaurantId>_<hex>
    const username    = `kds_${rid}_${crypto.randomBytes(3).toString('hex')}`;
    const tempPass    = generateTempPassword();
    const passwordHash = await hashPassword(tempPass);

    const [result] = await query(
      `INSERT INTO kitchen_staff (restaurant_id, tenant_id, name, station_name, username, password_hash, temp_password)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [rid, tid, name.trim(), station_name?.trim() || 'Kitchen Station', username, passwordHash, tempPass]
    );

    return created(res, {
      id: result.insertId,
      name: name.trim(),
      station_name: station_name?.trim() || 'Kitchen Station',
      username,
      tempPassword: tempPass,
    }, 'KDS staff account created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── PATCH /:id — update staff (name / station / active) ──────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const existing = await queryOne(
      'SELECT id FROM kitchen_staff WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!existing) return notFound(res, 'Staff not found.');

    const { name, station_name, is_active } = req.body;
    await query(
      `UPDATE kitchen_staff SET
         name         = COALESCE(?, name),
         station_name = COALESCE(?, station_name),
         is_active    = CASE WHEN ? IS NOT NULL THEN ? ELSE is_active END
       WHERE id = ?`,
      [name || null, station_name || null, is_active ?? null, is_active ?? null, req.params.id]
    );
    return success(res, null, 'Staff updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── DELETE /:id — delete KDS staff ───────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const existing = await queryOne(
      'SELECT id FROM kitchen_staff WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!existing) return notFound(res, 'Staff not found.');
    await query('DELETE FROM kitchen_staff WHERE id = ?', [req.params.id]);
    return success(res, null, 'Staff account deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── POST /:id/reset-password — reset password ─────────────────────────────────
router.post('/:id/reset-password', async (req, res) => {
  try {
    const existing = await queryOne(
      'SELECT id FROM kitchen_staff WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!existing) return notFound(res, 'Staff not found.');

    const tempPass    = generateTempPassword();
    const passwordHash = await hashPassword(tempPass);
    await query(
      'UPDATE kitchen_staff SET password_hash = ?, temp_password = ?, login_attempts = 0 WHERE id = ?',
      [passwordHash, tempPass, req.params.id]
    );
    return success(res, { tempPassword: tempPass }, 'Password reset successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
