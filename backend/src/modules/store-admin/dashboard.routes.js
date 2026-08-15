'use strict';

const express = require('express');
const router  = express.Router();

const { query, queryOne }   = require('../../config/database');
const { authenticateStore } = require('../../middleware/storeAuth.middleware');
const { success, serverError } = require('../../utils/apiResponse');

// All routes require store auth
router.use(authenticateStore);

// ── GET /dashboard ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rid = req.restaurant.id;

    const [[itemCount]]  = await query('SELECT COUNT(*) AS cnt FROM store_items  WHERE restaurant_id = ?', [rid]);
    const [[catCount]]   = await query('SELECT COUNT(*) AS cnt FROM store_categories WHERE restaurant_id = ?', [rid]);
    const [[orderCount]] = await query('SELECT COUNT(*) AS cnt FROM store_orders WHERE restaurant_id = ?', [rid]);
    const [[pendingCount]] = await query(
      "SELECT COUNT(*) AS cnt FROM store_orders WHERE restaurant_id = ? AND status = 'pending'", [rid]
    );
    const [[revenue]] = await query(
      "SELECT COALESCE(SUM(total), 0) AS total FROM store_orders WHERE restaurant_id = ? AND payment_status = 'paid'", [rid]
    );

    // Recent orders (last 5)
    const [recentOrders] = await query(
      `SELECT id, order_number, customer_name, total, status, payment_status, created_at
       FROM store_orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 5`,
      [rid]
    );

    // Low stock items (< 5)
    const [lowStock] = await query(
      `SELECT id, name, stock_quantity FROM store_items
       WHERE restaurant_id = ? AND stock_quantity < 5 AND is_available = 1
       ORDER BY stock_quantity ASC LIMIT 5`,
      [rid]
    );

    return success(res, {
      stats: {
        totalItems:    itemCount[0]?.cnt    || 0,
        totalCategories: catCount[0]?.cnt  || 0,
        totalOrders:   orderCount[0]?.cnt  || 0,
        pendingOrders: pendingCount[0]?.cnt || 0,
        totalRevenue:  Number(revenue[0]?.total) || 0,
      },
      recentOrders,
      lowStockItems: lowStock,
    });
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
