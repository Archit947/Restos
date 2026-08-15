'use strict';

const express = require('express');
const router  = express.Router();

const { query } = require('../../config/database');
const { authenticateRestaurant } = require('../../middleware/restaurantAuth.middleware');
const { success, serverError } = require('../../utils/apiResponse');

router.use(authenticateRestaurant);

// GET /api/v1/restaurant/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const rid = req.restaurant.id;

    const [rows] = await query(`
      SELECT
        -- Menu
        (SELECT COUNT(*) FROM menu_categories WHERE restaurant_id = ?)                                        AS total_categories,
        (SELECT COUNT(*) FROM menu_items      WHERE restaurant_id = ?)                                        AS total_items,
        (SELECT COUNT(*) FROM menu_items      WHERE restaurant_id = ? AND is_available = 1)                   AS available_items,
        -- Orders
        (SELECT COUNT(*) FROM customer_orders WHERE restaurant_id = ?)                                        AS total_orders,
        (SELECT COUNT(*) FROM customer_orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE())      AS today_orders,
        (SELECT COUNT(*) FROM customer_orders WHERE restaurant_id = ? AND status IN ('pending','confirmed','preparing','ready')) AS active_orders,
        (SELECT COALESCE(SUM(total),0) FROM customer_orders WHERE restaurant_id = ? AND status NOT IN ('cancelled')) AS total_revenue,
        (SELECT COALESCE(SUM(total),0) FROM customer_orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE() AND status NOT IN ('cancelled')) AS today_revenue,
        -- Reservations
        (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ? AND DATE(reservation_date) = CURDATE()) AS today_reservations,
        (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ? AND reservation_date > NOW())           AS upcoming_reservations,
        (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ? AND status = 'pending')                 AS pending_reservations,
        (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ?)                                        AS total_reservations,
        -- Content
        (SELECT COUNT(*) FROM blog_posts      WHERE restaurant_id = ? AND status = 'published')               AS published_posts,
        (SELECT COUNT(*) FROM blog_posts      WHERE restaurant_id = ?)                                        AS total_posts,
        (SELECT COUNT(*) FROM events          WHERE restaurant_id = ? AND is_published = 1 AND event_date >= CURDATE()) AS upcoming_events,
        (SELECT COUNT(*) FROM events          WHERE restaurant_id = ?)                                        AS total_events,
        -- Website
        (SELECT status     FROM websites      WHERE restaurant_id = ? LIMIT 1)                                AS website_status,
        (SELECT is_enabled FROM websites      WHERE restaurant_id = ? LIMIT 1)                                AS website_enabled
    `, Array(18).fill(rid));

    const stats = rows[0];

    // Recent orders (last 5)
    const [recentOrders] = await query(`
      SELECT id, order_number, customer_name, total, status, order_type, created_at
      FROM customer_orders
      WHERE restaurant_id = ?
      ORDER BY created_at DESC
      LIMIT 5`, [rid]);

    // Recent reservations (last 5)
    const [recentReservations] = await query(`
      SELECT id, customer_name, party_size, reservation_date, status, created_at
      FROM reservations
      WHERE restaurant_id = ?
      ORDER BY created_at DESC
      LIMIT 5`, [rid]);

    // Recent blog posts (last 5)
    const [recentPosts] = await query(`
      SELECT id, title, status, published_at, created_at
      FROM blog_posts
      WHERE restaurant_id = ?
      ORDER BY created_at DESC
      LIMIT 5`, [rid]);

    return success(res, {
      stats,
      recentOrders,
      recentReservations,
      recentPosts,
    });
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
