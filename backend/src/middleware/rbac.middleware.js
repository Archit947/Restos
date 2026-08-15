'use strict';

const { forbidden } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

/**
 * Role hierarchy - higher index = more permissions
 */
const ROLE_HIERARCHY = {
  [ROLES.SUPPORT]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3,
};

/**
 * Check if user has at least the minimum required role.
 * @param {...string} allowedRoles - Roles that are permitted
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Authentication required.');
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const hasPermission = allowedRoles.some(role => {
      const requiredLevel = ROLE_HIERARCHY[role] || 0;
      return userRoleLevel >= requiredLevel;
    });

    if (!hasPermission) {
      return forbidden(res, `Access denied. Required role: ${allowedRoles.join(' or ')}.`);
    }

    next();
  };
}

/**
 * Require super_admin role specifically.
 */
const requireSuperAdmin = requireRole(ROLES.SUPER_ADMIN);

/**
 * Require at least admin role (admin or super_admin).
 */
const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * Require at least support role (any role).
 */
const requireSupport = requireRole(ROLES.SUPPORT);

module.exports = { requireRole, requireSuperAdmin, requireAdmin, requireSupport };
