'use strict';

const { verifyAccessToken } = require('../utils/tokenHelper');
const { queryOne } = require('../config/database');
const { unauthorized } = require('../utils/apiResponse');

/**
 * Authenticate a store admin via Bearer JWT.
 * Sets req.restaurant and req.storeUser (decoded payload).
 */
async function authenticateStore(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorized(res, 'Authentication required.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.type !== 'store_admin') {
      return unauthorized(res, 'Invalid or expired token.');
    }

    // Verify the restaurant + store are still active
    const restaurant = await queryOne(
      `SELECT id, tenant_id, restaurant_name, email, phone, logo,
              cuisine_type, status, account_status, has_store
       FROM restaurants
       WHERE id = ? AND account_status NOT IN ('deleted', 'suspended') AND has_store = 1`,
      [decoded.restaurantId]
    );

    if (!restaurant) {
      return unauthorized(res, 'Store account is inactive or suspended.');
    }

    req.restaurant = restaurant;
    req.storeUser  = decoded; // { credId, restaurantId, tenantId, type }
    next();
  } catch (err) {
    return unauthorized(res, 'Authentication failed.');
  }
}

module.exports = { authenticateStore };
