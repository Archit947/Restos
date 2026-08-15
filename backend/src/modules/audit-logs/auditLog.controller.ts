import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../database/connection';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';

/**
 * GET /api/v1/audit-logs
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { action, actor_id, entity_type, from_date, to_date } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: any[] = [];

    if (action) { conditions.push('action = ?'); params.push(action); }
    if (actor_id) { conditions.push('actor_id = ?'); params.push(actor_id); }
    if (entity_type) { conditions.push('entity_type = ?'); params.push(entity_type); }
    if (from_date) { conditions.push('created_at >= ?'); params.push(from_date); }
    if (to_date) { conditions.push('created_at <= ?'); params.push(to_date + ' 23:59:59'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM audit_logs ${where}`, params
    );
    const total = countResult?.total ?? 0;

    const rows = await query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ success: true, ...buildPaginatedResponse(rows, total, page, limit) });
  } catch (error) {
    next(error);
  }
};
