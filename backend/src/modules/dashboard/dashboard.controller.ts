import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../database/connection';
import { AppError } from '../../utils/AppError';

/**
 * GET /api/v1/dashboard/stats
 * Returns key metrics for the super admin dashboard
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalRestaurants,
      activeRestaurants,
      inactiveRestaurants,
      trialRestaurants,
      suspendedRestaurants,
      expiredRestaurants,
      totalWebsites,
      publishedWebsites,
      totalPages,
      totalReservations,
      totalBlogPosts,
      totalEvents,
      totalMedia,
      storageUsed,
    ] = await Promise.all([
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM restaurants'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM restaurants WHERE status = "active"'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM restaurants WHERE status = "inactive"'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM restaurants WHERE status = "trial"'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM restaurants WHERE status = "suspended"'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM restaurants WHERE status = "expired"'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM websites'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM websites WHERE is_published = 1'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM website_pages'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM reservations'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM blog_posts WHERE status = "published"'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM events'),
      queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM media_library'),
      queryOne<{ total: number }>('SELECT COALESCE(SUM(file_size), 0) AS total FROM media_library'),
    ]);

    res.json({
      success: true,
      data: {
        totalRestaurants: totalRestaurants?.cnt ?? 0,
        activeRestaurants: activeRestaurants?.cnt ?? 0,
        inactiveRestaurants: inactiveRestaurants?.cnt ?? 0,
        trialRestaurants: trialRestaurants?.cnt ?? 0,
        suspendedRestaurants: suspendedRestaurants?.cnt ?? 0,
        expiredRestaurants: expiredRestaurants?.cnt ?? 0,
        totalWebsites: totalWebsites?.cnt ?? 0,
        publishedWebsites: publishedWebsites?.cnt ?? 0,
        totalPages: totalPages?.cnt ?? 0,
        totalReservations: totalReservations?.cnt ?? 0,
        totalBlogPosts: totalBlogPosts?.cnt ?? 0,
        totalEvents: totalEvents?.cnt ?? 0,
        totalMedia: totalMedia?.cnt ?? 0,
        storageUsedBytes: storageUsed?.total ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/dashboard/charts
 * Restaurant growth over the last 12 months
 */
export const getDashboardCharts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Monthly growth for last 12 months
    const monthlyGrowth = await query(
      `SELECT 
         DATE_FORMAT(created_at, '%Y-%m') AS month,
         DATE_FORMAT(created_at, '%b %Y') AS label,
         COUNT(*) AS count
       FROM restaurants
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month, label
       ORDER BY month ASC`
    );

    // Status distribution
    const statusDistribution = await query(
      `SELECT status, COUNT(*) AS count FROM restaurants GROUP BY status`
    );

    // Plan distribution
    const planDistribution = await query(
      `SELECT plan, COUNT(*) AS count FROM subscriptions GROUP BY plan`
    );

    // Top 5 cities
    const topCities = await query(
      `SELECT city, COUNT(*) AS count FROM restaurants
       WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        monthlyGrowth,
        statusDistribution,
        planDistribution,
        topCities,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/dashboard/activity
 * Recent audit log activity
 */
export const getDashboardActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recentActivity = await query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id, al.description,
              al.actor_email, al.created_at,
              r.restaurant_name
       FROM audit_logs al
       LEFT JOIN restaurants r ON r.id = al.entity_id
       ORDER BY al.created_at DESC
       LIMIT 20`
    );

    res.json({ success: true, data: recentActivity });
  } catch (error) {
    next(error);
  }
};
