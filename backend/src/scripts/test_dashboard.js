'use strict';
require('dotenv').config({ path: 'D:/projects/Restos/backend/.env' });
const mysql = require('mysql2/promise');

mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restos_saas',
}).then(async conn => {
  const rid = 1;
  const [rows] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM menu_categories WHERE restaurant_id = ?)                                        AS total_categories,
      (SELECT COUNT(*) FROM menu_items      WHERE restaurant_id = ?)                                        AS total_items,
      (SELECT COUNT(*) FROM menu_items      WHERE restaurant_id = ? AND is_available = 1)                   AS available_items,
      (SELECT COUNT(*) FROM customer_orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE())      AS today_orders,
      (SELECT COUNT(*) FROM customer_orders WHERE restaurant_id = ? AND status IN ('pending','confirmed','preparing','ready')) AS active_orders,
      (SELECT COALESCE(SUM(total),0) FROM customer_orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE() AND status NOT IN ('cancelled')) AS today_revenue,
      (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ? AND DATE(reservation_date) = CURDATE()) AS today_reservations,
      (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ? AND reservation_date > NOW())           AS upcoming_reservations,
      (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ? AND status = 'pending')                 AS pending_reservations,
      (SELECT COUNT(*) FROM reservations    WHERE restaurant_id = ?)                                        AS total_reservations,
      (SELECT COUNT(*) FROM blog_posts      WHERE restaurant_id = ? AND status = 'published')               AS published_posts,
      (SELECT COUNT(*) FROM blog_posts      WHERE restaurant_id = ?)                                        AS total_posts,
      (SELECT COUNT(*) FROM events          WHERE restaurant_id = ? AND is_published = 1 AND event_date >= CURDATE()) AS upcoming_events,
      (SELECT COUNT(*) FROM events          WHERE restaurant_id = ?)                                        AS total_events,
      (SELECT status     FROM websites      WHERE restaurant_id = ? LIMIT 1)                                AS website_status,
      (SELECT is_enabled FROM websites      WHERE restaurant_id = ? LIMIT 1)                                AS website_enabled
  `, Array(16).fill(rid));
  console.log(JSON.stringify(rows[0], null, 2));
  await conn.end();
}).catch(e => console.error('ERROR:', e.message));
