'use strict';

const { verifyAccessToken } = require('../utils/tokenHelper');
const { unauthorized } = require('../utils/apiResponse');
const { queryOne } = require('../config/database');

/**
 * Authenticate super admin via Bearer JWT token.
 * Attaches `req.user` on success.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No authentication token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return unauthorized(res, 'Invalid or expired token. Please log in again.');
    }

    // Verify user still exists and is active
    const admin = await queryOne(
      'SELECT id, name, email, role, is_active FROM super_admins WHERE id = ?',
      [decoded.id]
    );

    if (!admin) {
      return unauthorized(res, 'User account not found.');
    }

    if (!admin.is_active) {
      return unauthorized(res, 'Your account has been deactivated.');
    }

    req.user = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      type: 'super_admin',
    };

    next();
  } catch (error) {
    return unauthorized(res, 'Authentication failed.');
  }
}

/**
 * Optionally authenticate — does not fail if no token provided.
 * Used for routes accessible to both authenticated and guest users.
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const admin = await queryOne(
          'SELECT id, name, email, role, is_active FROM super_admins WHERE id = ?',
          [decoded.id]
        );
        if (admin && admin.is_active) {
          req.user = { id: admin.id, name: admin.name, email: admin.email, role: admin.role, type: 'super_admin' };
        }
      }
    }
  } catch (_) {}
  next();
}

module.exports = { authenticate, optionalAuthenticate };
