'use strict';

const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/database');
const { authenticateRestaurant } = require('../../middleware/restaurantAuth.middleware');
const { success, created, notFound, badRequest, serverError } = require('../../utils/apiResponse');

router.use(authenticateRestaurant);

// ══════════════════════════════════════════════════════════════
// AREAS
// ══════════════════════════════════════════════════════════════

router.get('/areas', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const [areas] = await query(
      `SELECT a.*, COUNT(t.id) AS table_count
       FROM restaurant_areas a
       LEFT JOIN restaurant_tables t ON t.area_id = a.id AND t.is_active = 1
       WHERE a.restaurant_id = ?
       GROUP BY a.id
       ORDER BY a.sort_order ASC, a.name ASC`,
      [rid]
    );
    return success(res, areas);
  } catch (err) { return serverError(res, err.message); }
});

router.post('/areas', async (req, res) => {
  try {
    const { name, description, sort_order = 0 } = req.body;
    if (!name?.trim()) return badRequest(res, 'Area name is required.');
    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;
    const [r] = await query(
      'INSERT INTO restaurant_areas (restaurant_id, tenant_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [rid, tid, name.trim(), description || null, sort_order]
    );
    const area = await queryOne('SELECT * FROM restaurant_areas WHERE id = ?', [r.insertId]);
    return created(res, area, 'Area created.');
  } catch (err) { return serverError(res, err.message); }
});

router.put('/areas/:id', async (req, res) => {
  try {
    const { name, description, sort_order, is_active } = req.body;
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM restaurant_areas WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Area not found.');
    await query(
      `UPDATE restaurant_areas SET
         name = COALESCE(?, name),
         description = ?,
         sort_order = COALESCE(?, sort_order),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name || null, description !== undefined ? description : null, sort_order ?? null,
       is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id]
    );
    const area = await queryOne('SELECT * FROM restaurant_areas WHERE id = ?', [req.params.id]);
    return success(res, area, 'Area updated.');
  } catch (err) { return serverError(res, err.message); }
});

router.delete('/areas/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM restaurant_areas WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Area not found.');
    // Move tables to no area before deleting
    await query('UPDATE restaurant_tables SET area_id = NULL WHERE area_id = ?', [req.params.id]);
    await query('DELETE FROM restaurant_areas WHERE id = ?', [req.params.id]);
    return success(res, null, 'Area deleted.');
  } catch (err) { return serverError(res, err.message); }
});

// ══════════════════════════════════════════════════════════════
// TABLES
// ══════════════════════════════════════════════════════════════

router.get('/tables', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { area_id } = req.query;
    let sql = `
      SELECT t.*, a.name AS area_name
      FROM restaurant_tables t
      LEFT JOIN restaurant_areas a ON t.area_id = a.id
      WHERE t.restaurant_id = ? AND t.is_active = 1`;
    const params = [rid];
    if (area_id) { sql += ' AND t.area_id = ?'; params.push(area_id); }
    sql += ' ORDER BY t.area_id ASC, t.table_number ASC';
    const [tables] = await query(sql, params);
    return success(res, tables);
  } catch (err) { return serverError(res, err.message); }
});

// Batch-create tables: area_id + count + capacity + start_from
router.post('/tables/batch', async (req, res) => {
  try {
    const { area_id, count, capacity = 4, start_from = 1 } = req.body;
    const n    = Math.min(100, Math.max(1, parseInt(count)      || 0));
    const cap  = Math.max(1,              parseInt(capacity)    || 4);
    const from = Math.max(1,              parseInt(start_from)  || 1);
    if (!n) return badRequest(res, 'count must be 1–100.');
    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;
    let createdCount = 0; let skipped = 0;
    for (let i = 0; i < n; i++) {
      const tNum = from + i;
      const dup = await queryOne(
        'SELECT id FROM restaurant_tables WHERE restaurant_id = ? AND area_id IS NOT DISTINCT FROM ? AND table_number = ? AND is_active = 1',
        [rid, area_id || null, tNum]
      );
      if (dup) { skipped++; continue; }
      await query(
        'INSERT INTO restaurant_tables (restaurant_id, tenant_id, area_id, table_number, capacity) VALUES (?, ?, ?, ?, ?)',
        [rid, tid, area_id || null, tNum, cap]
      );
      createdCount++;
    }
    return success(res, { created: createdCount, skipped }, `${createdCount} table(s) created.`);
  } catch (err) { return serverError(res, err.message); }
});

router.post('/tables', async (req, res) => {
  try {
    const { area_id, table_number, label, capacity = 4 } = req.body;
    if (!table_number) return badRequest(res, 'table_number is required.');
    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;

    // Check duplicate table_number in same area
    const dup = await queryOne(
      'SELECT id FROM restaurant_tables WHERE restaurant_id = ? AND area_id IS NOT DISTINCT FROM ? AND table_number = ? AND is_active = 1',
      [rid, area_id || null, table_number]
    );
    if (dup) return badRequest(res, `Table #${table_number} already exists in this area.`);

    const [r] = await query(
      'INSERT INTO restaurant_tables (restaurant_id, tenant_id, area_id, table_number, label, capacity) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      [rid, tid, area_id || null, table_number, label || null, capacity]
    );
    const tbl = await queryOne(
      `SELECT t.*, a.name AS area_name FROM restaurant_tables t
       LEFT JOIN restaurant_areas a ON t.area_id = a.id WHERE t.id = ?`, [r.insertId]
    );
    return created(res, tbl, 'Table created.');
  } catch (err) { return serverError(res, err.message); }
});

router.put('/tables/:id', async (req, res) => {
  try {
    const { area_id, table_number, label, capacity, is_active } = req.body;
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Table not found.');
    await query(
      `UPDATE restaurant_tables SET
         area_id = COALESCE(?, area_id), table_number = COALESCE(?, table_number),
         label = ?, capacity = COALESCE(?, capacity), is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [area_id ?? null, table_number || null, label !== undefined ? label : null,
       capacity || null, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id]
    );
    const tbl = await queryOne(
      `SELECT t.*, a.name AS area_name FROM restaurant_tables t
       LEFT JOIN restaurant_areas a ON t.area_id = a.id WHERE t.id = ?`, [req.params.id]
    );
    return success(res, tbl, 'Table updated.');
  } catch (err) { return serverError(res, err.message); }
});

router.patch('/tables/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['available', 'occupied', 'reserved'];
    if (!valid.includes(status)) return badRequest(res, 'Invalid status.');
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Table not found.');
    await query('UPDATE restaurant_tables SET status = ? WHERE id = ?', [status, req.params.id]);
    return success(res, { id: req.params.id, status }, 'Status updated.');
  } catch (err) { return serverError(res, err.message); }
});

router.delete('/tables/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Table not found.');
    await query('UPDATE restaurant_tables SET is_active = 0 WHERE id = ?', [req.params.id]);
    return success(res, null, 'Table removed.');
  } catch (err) { return serverError(res, err.message); }
});

module.exports = router;
