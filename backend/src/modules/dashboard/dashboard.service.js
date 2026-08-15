'use strict';

const { query, queryOne } = require('../../config/database');

/**
 * Get main dashboard statistics.
 */
async function getDashboardStats() {
  // Restaurant counts by status
  const [statusCounts] = await query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive,
      SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) AS trial,
      SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expired,
      SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended
    FROM restaurants
    WHERE account_status != 'deleted'`
  );

  // Website counts
  const [websiteCounts] = await query(`
    SELECT
      COUNT(*) AS total_websites,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
      SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) AS enabled
    FROM websites`
  );

  // CMS page counts
  const [pageCounts] = await query('SELECT COUNT(*) AS total_pages FROM cms_pages');

  // Blog post counts
  const [blogCounts] = await query('SELECT COUNT(*) AS total_blogs FROM blog_posts WHERE status = "published"');

  // Event counts
  const [eventCounts] = await query('SELECT COUNT(*) AS total_events FROM events');

  // Reservation counts
  const [resCounts] = await query('SELECT COUNT(*) AS total_reservations FROM reservations');

  // Storage usage (sum from subscriptions)
  const [storageCounts] = await query('SELECT COALESCE(SUM(storage_used_mb), 0) AS total_storage_mb FROM restaurant_subscriptions');

  // Plan distribution
  const [planDist] = await query(`
    SELECT sp.name, sp.slug, COUNT(r.id) AS count
    FROM restaurants r
    JOIN subscription_plans sp ON r.plan_id = sp.id
    WHERE r.account_status != 'deleted'
    GROUP BY sp.id, sp.name, sp.slug
    ORDER BY sp.sort_order`
  );

  // New restaurants this month
  const [newThisMonth] = await query(`
    SELECT COUNT(*) AS count
    FROM restaurants
    WHERE account_status != 'deleted'
    AND YEAR(created_at) = YEAR(CURDATE())
    AND MONTH(created_at) = MONTH(CURDATE())`
  );

  return {
    restaurants: {
      total: statusCounts[0]?.total || 0,
      active: statusCounts[0]?.active || 0,
      inactive: statusCounts[0]?.inactive || 0,
      trial: statusCounts[0]?.trial || 0,
      expired: statusCounts[0]?.expired || 0,
      suspended: statusCounts[0]?.suspended || 0,
      newThisMonth: newThisMonth[0]?.count || 0,
    },
    websites: {
      total: websiteCounts[0]?.total_websites || 0,
      published: websiteCounts[0]?.published || 0,
      enabled: websiteCounts[0]?.enabled || 0,
    },
    cms: {
      totalPages: pageCounts[0]?.total_pages || 0,
    },
    content: {
      totalBlogPosts: blogCounts[0]?.total_blogs || 0,
      totalEvents: eventCounts[0]?.total_events || 0,
      totalReservations: resCounts[0]?.total_reservations || 0,
    },
    storage: {
      totalUsedMB: storageCounts[0]?.total_storage_mb || 0,
    },
    planDistribution: planDist,
  };
}

/**
 * Get restaurant growth chart data (last 12 months).
 */
async function getRestaurantGrowthData() {
  const [rows] = await query(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS month,
      DATE_FORMAT(created_at, '%b %Y') AS label,
      COUNT(*) AS count
    FROM restaurants
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    AND account_status != 'deleted'
    GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
    ORDER BY month ASC`
  );
  return rows;
}

/**
 * Get monthly new restaurants (last 12 months).
 */
async function getMonthlyNewRestaurants() {
  const [rows] = await query(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS month,
      DATE_FORMAT(created_at, '%b') AS label,
      COUNT(*) AS count
    FROM restaurants
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    AND account_status != 'deleted'
    GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
    ORDER BY month ASC`
  );
  return rows;
}

/**
 * Get active vs inactive chart data.
 */
async function getStatusDistribution() {
  const [rows] = await query(`
    SELECT
      status,
      COUNT(*) AS count
    FROM restaurants
    WHERE account_status != 'deleted'
    GROUP BY status`
  );
  return rows;
}

/**
 * Get recent activity from audit logs.
 */
async function getRecentActivity(limit = 20) {
  const [rows] = await query(`
    SELECT
      al.id, al.action, al.entity_type, al.entity_name, al.description,
      al.user_email, al.status, al.created_at,
      sa.name AS user_name
    FROM audit_logs al
    LEFT JOIN super_admins sa ON al.user_id = sa.id AND al.user_type = 'super_admin'
    ORDER BY al.created_at DESC
    LIMIT ?`,
    [limit]
  );
  return rows;
}

/**
 * Get expiring subscriptions (within next 7 days).
 */
async function getExpiringSubscriptions() {
  const [rows] = await query(`
    SELECT
      r.id, r.restaurant_name, r.email,
      rs.status, rs.expires_at, rs.trial_ends_at,
      sp.name AS plan_name,
      s.full_domain
    FROM restaurants r
    JOIN restaurant_subscriptions rs ON r.id = rs.restaurant_id
    JOIN subscription_plans sp ON rs.plan_id = sp.id
    LEFT JOIN subdomains s ON r.id = s.restaurant_id
    WHERE r.account_status = 'active'
    AND (
      (rs.expires_at IS NOT NULL AND rs.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY))
      OR
      (rs.trial_ends_at IS NOT NULL AND rs.trial_ends_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY))
    )
    ORDER BY COALESCE(rs.expires_at, rs.trial_ends_at) ASC
    LIMIT 10`
  );
  return rows;
}

/**
 * Get top restaurants by content (most blog posts, events, etc).
 */
async function getTopRestaurants() {
  const [rows] = await query(`
    SELECT
      r.id, r.restaurant_name, r.logo, r.status,
      s.full_domain,
      COUNT(DISTINCT bp.id) AS blog_count,
      COUNT(DISTINCT e.id) AS event_count,
      COUNT(DISTINCT res.id) AS reservation_count
    FROM restaurants r
    LEFT JOIN subdomains s ON r.id = s.restaurant_id
    LEFT JOIN blog_posts bp ON r.id = bp.restaurant_id
    LEFT JOIN events e ON r.id = e.restaurant_id
    LEFT JOIN reservations res ON r.id = res.restaurant_id
    WHERE r.account_status = 'active'
    GROUP BY r.id
    ORDER BY (blog_count + event_count + reservation_count) DESC
    LIMIT 5`
  );
  return rows;
}

module.exports = {
  getDashboardStats,
  getRestaurantGrowthData,
  getMonthlyNewRestaurants,
  getStatusDistribution,
  getRecentActivity,
  getExpiringSubscriptions,
  getTopRestaurants,
};
