'use strict';

const express = require('express');
const router  = express.Router();

const { query, queryOne }         = require('../../config/database');
const { verifyPassword, hashPassword } = require('../../utils/passwordHelper');
const { generateAuthTokens, hashToken, verifyRefreshToken } = require('../../utils/tokenHelper');
const { authenticateStore }        = require('../../middleware/storeAuth.middleware');
const { success, badRequest, unauthorized, serverError } = require('../../utils/apiResponse');
const { getClientIp }              = require('../../middleware/auditLog.middleware');

// ────────────────────────────────────────────────────────────────
// POST /login
// ────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return badRequest(res, 'Username and password are required.');
    }

    const cred = await queryOne(
      `SELECT sc.*, r.restaurant_name, r.status AS restaurant_status, r.account_status, r.logo, r.has_store
       FROM store_credentials sc
       JOIN restaurants r ON sc.restaurant_id = r.id
       WHERE sc.username = ? AND sc.is_active = 1`,
      [username.toLowerCase().trim()]
    );

    if (!cred) {
      return unauthorized(res, 'Invalid username or password.');
    }

    if (['deleted', 'suspended'].includes(cred.account_status)) {
      return unauthorized(res, 'Your account has been suspended. Please contact support.');
    }

    if (!cred.has_store) {
      return unauthorized(res, 'Store is not enabled for this restaurant.');
    }

    if (cred.locked_until && new Date(cred.locked_until) > new Date()) {
      return unauthorized(res, 'Account is temporarily locked. Please try again later.');
    }

    const valid = await verifyPassword(password, cred.password_hash);
    if (!valid) {
      const attempts = (cred.login_attempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await query(
        'UPDATE store_credentials SET login_attempts = ?, locked_until = ? WHERE id = ?',
        [attempts, lockUntil, cred.id]
      );
      return unauthorized(res, 'Invalid username or password.');
    }

    // Reset attempts on success
    await query(
      'UPDATE store_credentials SET login_attempts = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [getClientIp(req), cred.id]
    );

    const payload = {
      credId:       cred.id,
      restaurantId: cred.restaurant_id,
      tenantId:     cred.tenant_id,
      type:         'store_admin',
    };

    const { accessToken, refreshToken, refreshTokenHash } = generateAuthTokens(payload);

    await query(
      `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, 'store_admin', ?, DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)`,
      [cred.id, refreshTokenHash, getClientIp(req), req.headers['user-agent']]
    );

    // Normalize logo
    const logoUrl = cred.logo && !cred.logo.startsWith('/') && !cred.logo.startsWith('http')
      ? `/uploads/restaurants/${cred.logo}`
      : (cred.logo || null);

    return success(res, {
      accessToken,
      refreshToken,
      isFirstLogin: Boolean(cred.is_first_login),
      store: {
        id:             cred.restaurant_id,
        tenantId:       cred.tenant_id,
        restaurantName: cred.restaurant_name,
        logo:           logoUrl,
        username:       cred.username,
      },
    }, 'Login successful.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ────────────────────────────────────────────────────────────────
// POST /refresh
// ────────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'Refresh token required.');

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== 'store_admin') {
      return unauthorized(res, 'Invalid refresh token.');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await queryOne(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND is_revoked = 0 AND expires_at > NOW()',
      [tokenHash]
    );
    if (!stored) return unauthorized(res, 'Refresh token expired or revoked.');

    await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash]);

    const payload = {
      credId:       decoded.credId,
      restaurantId: decoded.restaurantId,
      tenantId:     decoded.tenantId,
      type:         'store_admin',
    };
    const { accessToken, refreshToken: newRefresh, refreshTokenHash } = generateAuthTokens(payload);

    await query(
      `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at)
       VALUES (?, 'store_admin', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [decoded.credId, refreshTokenHash]
    );

    return success(res, { accessToken, refreshToken: newRefresh });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ────────────────────────────────────────────────────────────────
// GET /me  (authenticated)
// ────────────────────────────────────────────────────────────────
router.get('/me', authenticateStore, async (req, res) => {
  try {
    const { restaurant, storeUser } = req;
    const cred = await queryOne(
      'SELECT id, username, is_first_login, last_login_at FROM store_credentials WHERE id = ?',
      [storeUser.credId]
    );
    return success(res, { ...restaurant, ...cred, credId: cred.id });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ────────────────────────────────────────────────────────────────
// POST /logout  (authenticated)
// ────────────────────────────────────────────────────────────────
router.post('/logout', authenticateStore, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash]);
    } else {
      await query(
        "UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ? AND user_type = 'store_admin'",
        [req.storeUser.credId]
      );
    }
    return success(res, null, 'Logged out successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ────────────────────────────────────────────────────────────────
// POST /change-password  (authenticated)
// ────────────────────────────────────────────────────────────────
router.post('/change-password', authenticateStore, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return badRequest(res, 'Current and new password are required.');
    }
    if (newPassword.length < 8) {
      return badRequest(res, 'New password must be at least 8 characters.');
    }

    const cred = await queryOne(
      'SELECT id, password_hash FROM store_credentials WHERE id = ?',
      [req.storeUser.credId]
    );
    if (!cred) return unauthorized(res, 'Account not found.');

    const valid = await verifyPassword(currentPassword, cred.password_hash);
    if (!valid) return badRequest(res, 'Current password is incorrect.');

    const newHash = await hashPassword(newPassword);
    await query(
      'UPDATE store_credentials SET password_hash = ?, is_first_login = 0, temp_password = NULL WHERE id = ?',
      [newHash, cred.id]
    );

    return success(res, null, 'Password changed successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
