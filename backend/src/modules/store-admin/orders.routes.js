'use strict';

const express = require('express');
const router  = express.Router();

const { query, queryOne }   = require('../../config/database');
const { authenticateStore } = require('../../middleware/storeAuth.middleware');
const { success, badRequest, notFound, serverError } = require('../../utils/apiResponse');

// All routes require store auth
router.use(authenticateStore);

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// ── GET /orders ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let sql = 'SELECT * FROM store_orders WHERE restaurant_id = ?';
    const params = [req.restaurant.id];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows] = await query(sql, params);

    // Count total
    let countSql = 'SELECT COUNT(*) AS cnt FROM store_orders WHERE restaurant_id = ?';
    const countParams = [req.restaurant.id];
    if (status) { countSql += ' AND status = ?'; countParams.push(status); }
    const [[countRow]] = await query(countSql, countParams);

    return success(res, {
      orders: rows,
      meta: {
        total: countRow[0]?.cnt || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((countRow[0]?.cnt || 0) / Number(limit)),
      },
    });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── GET /orders/:id ───────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await queryOne(
      'SELECT * FROM store_orders WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!order) return notFound(res, 'Order not found.');
    return success(res, order);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── PATCH /orders/:id/status ──────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return badRequest(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const order = await queryOne(
      'SELECT id FROM store_orders WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!order) return notFound(res, 'Order not found.');

    await query('UPDATE store_orders SET status = ? WHERE id = ?', [status, req.params.id]);
    const updated = await queryOne('SELECT * FROM store_orders WHERE id = ?', [req.params.id]);
    return success(res, updated, 'Order status updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── PATCH /orders/:id/payment ─────────────────────────────────────────────────
router.patch('/:id/payment', async (req, res) => {
  try {
    const { payment_status } = req.body;
    const VALID = ['pending', 'paid', 'failed', 'refunded'];
    if (!payment_status || !VALID.includes(payment_status)) {
      return badRequest(res, `Invalid payment_status. Must be one of: ${VALID.join(', ')}`);
    }

    const order = await queryOne(
      'SELECT id FROM store_orders WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!order) return notFound(res, 'Order not found.');

    await query('UPDATE store_orders SET payment_status = ? WHERE id = ?', [payment_status, req.params.id]);
    return success(res, null, 'Payment status updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
