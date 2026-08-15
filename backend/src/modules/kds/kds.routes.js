'use strict';

const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/database');
const { verifyPassword } = require('../../utils/passwordHelper');
const { generateAuthTokens, hashToken, verifyAccessToken, verifyRefreshToken } = require('../../utils/tokenHelper');
const { success, notFound, badRequest, unauthorized, serverError } = require('../../utils/apiResponse');

// ── KDS Auth Middleware ───────────────────────────────────────────────────────
async function authenticateKds(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return unauthorized(res, 'Authentication required.');

    const token   = header.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded || decoded.type !== 'kds') return unauthorized(res, 'Invalid or expired token.');

    const staff = await queryOne(
      `SELECT ks.*, r.restaurant_name, r.logo, r.account_status
       FROM kitchen_staff ks
       JOIN restaurants r ON ks.restaurant_id = r.id
       WHERE ks.id = ? AND ks.is_active = 1`,
      [decoded.kdsId]
    );
    if (!staff || staff.account_status === 'suspended') {
      return unauthorized(res, 'Account inactive or restaurant suspended.');
    }

    req.kdsUser  = staff;
    req.kdsToken = decoded;
    next();
  } catch (err) {
    return unauthorized(res, 'Authentication failed.');
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

// POST /auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return badRequest(res, 'Username and password are required.');

    const staff = await queryOne(
      `SELECT ks.*, r.restaurant_name, r.logo, r.account_status
       FROM kitchen_staff ks
       JOIN restaurants r ON ks.restaurant_id = r.id
       WHERE ks.username = ?`,
      [username.toLowerCase().trim()]
    );

    if (!staff || !staff.is_active) return unauthorized(res, 'Invalid username or password.');
    if (staff.account_status === 'suspended') return unauthorized(res, 'Restaurant account suspended. Contact your admin.');
    if (staff.login_attempts >= 5) return unauthorized(res, 'Account locked. Contact your restaurant manager.');

    const valid = await verifyPassword(password, staff.password_hash);
    if (!valid) {
      await query('UPDATE kitchen_staff SET login_attempts = login_attempts + 1 WHERE id = ?', [staff.id]);
      return unauthorized(res, 'Invalid username or password.');
    }

    // Reset attempts, record login
    await query('UPDATE kitchen_staff SET login_attempts = 0, last_login_at = NOW() WHERE id = ?', [staff.id]);

    const payload = {
      kdsId:        staff.id,
      restaurantId: staff.restaurant_id,
      tenantId:     staff.tenant_id,
      type:         'kds',
    };
    const { accessToken, refreshToken, refreshTokenHash } = generateAuthTokens(payload);

    await query(
      `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at)
       VALUES (?, 'kds', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [staff.id, refreshTokenHash]
    );

    return success(res, {
      accessToken,
      refreshToken,
      staff: {
        id:             staff.id,
        name:           staff.name,
        stationName:    staff.station_name,
        restaurantId:   staff.restaurant_id,
        restaurantName: staff.restaurant_name,
        logo:           staff.logo,
      },
    }, 'Login successful.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// POST /auth/refresh
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'Refresh token required.');

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== 'kds') return unauthorized(res, 'Invalid refresh token.');

    const tokenHash = hashToken(refreshToken);
    const stored = await queryOne(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND is_revoked = 0 AND expires_at > NOW()',
      [tokenHash]
    );
    if (!stored) return unauthorized(res, 'Refresh token expired or revoked.');

    await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash]);

    const payload = { kdsId: decoded.kdsId, restaurantId: decoded.restaurantId, tenantId: decoded.tenantId, type: 'kds' };
    const { accessToken, refreshToken: newRefresh, refreshTokenHash } = generateAuthTokens(payload);

    await query(
      `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at)
       VALUES (?, 'kds', ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [decoded.kdsId, refreshTokenHash]
    );

    return success(res, { accessToken, refreshToken: newRefresh });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// GET /auth/me
router.get('/auth/me', authenticateKds, async (req, res) => {
  const s = req.kdsUser;
  return success(res, {
    id: s.id, name: s.name, stationName: s.station_name,
    restaurantId: s.restaurant_id, restaurantName: s.restaurant_name, logo: s.logo,
  });
});

// POST /auth/logout
router.post('/auth/logout', authenticateKds, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hash = hashToken(refreshToken);
      await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [hash]);
    } else {
      await query("UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ? AND user_type = 'kds'", [req.kdsUser.id]);
    }
    return success(res, null, 'Logged out successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════
// ORDERS (KDS view — active orders only, sorted oldest first)
// ═══════════════════════════════════════════════════════════════

// GET /orders — active orders for the kitchen
router.get('/orders', authenticateKds, async (req, res) => {
  try {
    const rid = req.kdsUser.restaurant_id;
    const { status, all } = req.query;

    let where, params;
    if (status) {
      where  = 'WHERE restaurant_id = ? AND status = ?';
      params = [rid, status];
    } else if (all) {
      where  = 'WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()';
      params = [rid];
    } else {
      // Default: active (non-terminal) orders
      where  = "WHERE restaurant_id = ? AND status NOT IN ('delivered','cancelled')";
      params = [rid];
    }

    const [orders] = await query(
      `SELECT * FROM customer_orders ${where} ORDER BY created_at ASC`,
      params
    );

    const parsed = orders.map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    }));

    return success(res, { orders: parsed });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// PATCH /orders/:id/status — KDS advances order status
router.patch('/orders/:id/status', authenticateKds, async (req, res) => {
  try {
    const rid    = req.kdsUser.restaurant_id;
    const { status } = req.body;
    const valid  = ['confirmed', 'preparing', 'ready', 'delivered'];

    if (!status || !valid.includes(status)) {
      return badRequest(res, `Invalid status. KDS can set: ${valid.join(', ')}`);
    }

    const existing = await queryOne(
      'SELECT id FROM customer_orders WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rid]
    );
    if (!existing) return notFound(res, 'Order not found.');

    await query('UPDATE customer_orders SET status = ? WHERE id = ?', [status, req.params.id]);
    return success(res, null, 'Order updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
