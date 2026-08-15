import { Request, Response, NextFunction } from 'express';
import { execute } from '../database/connection';
import { logger } from '../config/logger';

interface AuditOptions {
  action: string;
  entityType: string;
  getEntityId?: (req: Request, result?: any) => string | null;
  getDescription?: (req: Request) => string;
}

/**
 * Factory that creates an audit log middleware for a given action
 */
export const auditLog = (options: AuditOptions) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Store original json method to intercept response
    const originalJson = _res.json.bind(_res);
    (_res as any)._auditResult = null;

    _res.json = function (body: any) {
      if (body?.success !== false) {
        (_res as any)._auditResult = body?.data;
      }
      return originalJson(body);
    };

    // After response is sent, write audit log
    _res.on('finish', async () => {
      if (_res.statusCode >= 200 && _res.statusCode < 300) {
        try {
          const { v4: uuidv4 } = await import('uuid');
          const actor = req.admin;
          if (!actor) return;

          const entityId = options.getEntityId
            ? options.getEntityId(req, (_res as any)._auditResult)
            : (req.params.id || null);

          const description = options.getDescription
            ? options.getDescription(req)
            : `${options.action} performed`;

          await execute(
            `INSERT INTO audit_logs 
             (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, ip_address, user_agent)
             VALUES (?, 'super_admin', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              actor.id,
              actor.email,
              options.action,
              options.entityType,
              entityId,
              description,
              req.ip,
              req.headers['user-agent'] || '',
            ]
          );
        } catch (err) {
          logger.error('Audit log error:', err);
        }
      }
    });

    next();
  };
};
