'use strict';

const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create an audit log entry.
 * @param {Object} options
 */
async function createAuditLog({
  userId,
  userType = 'super_admin',
  userEmail,
  tenantId,
  action,
  entityType,
  entityId,
  entityName,
  description,
  beforeValue,
  afterValue,
  ipAddress,
  userAgent,
  status = 'success',
}) {
  try {
    await query(
      `INSERT INTO audit_logs
       (user_id, user_type, user_email, tenant_id, action, entity_type, entity_id,
        entity_name, description, before_value, after_value, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        userType,
        userEmail || null,
        tenantId || null,
        action,
        entityType || null,
        entityId ? String(entityId) : null,
        entityName || null,
        description || null,
        beforeValue ? JSON.stringify(beforeValue) : null,
        afterValue ? JSON.stringify(afterValue) : null,
        ipAddress || null,
        userAgent || null,
        status,
      ]
    );
  } catch (err) {
    logger.error('Failed to create audit log:', err.message);
  }
}

/**
 * Express middleware to auto-log requests (optional, for sensitive endpoints).
 * Attach as route middleware where needed.
 */
function auditMiddleware(action, entityType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Log after response is sent
      if (body && body.success) {
        createAuditLog({
          userId: req.user?.id,
          userEmail: req.user?.email,
          action,
          entityType,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'success',
        }).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Extract client IP address from request, accounting for proxies.
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

module.exports = { createAuditLog, auditMiddleware, getClientIp };
