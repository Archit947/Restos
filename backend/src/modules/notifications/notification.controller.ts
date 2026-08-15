import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, execute } from '../../database/connection';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';

/**
 * GET /api/v1/notifications
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { unread_only } = req.query as { unread_only?: string };

    const where = unread_only === 'true' ? 'WHERE is_read = 0' : '';
    const countResult = await queryOne<{ total: number }>(`SELECT COUNT(*) AS total FROM notifications ${where}`);
    const rows = await query(`SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
    const unreadCount = await queryOne<{ cnt: number }>('SELECT COUNT(*) AS cnt FROM notifications WHERE is_read = 0');

    res.json({
      success: true,
      ...buildPaginatedResponse(rows, countResult?.total ?? 0, page, limit),
      unreadCount: unreadCount?.cnt ?? 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notifications/:id/read
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
