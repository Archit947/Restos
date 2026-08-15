'use strict';

const { verifyAccessToken } = require('../utils/tokenHelper');
const { queryOne } = require('../config/database');
const { unauthorized } = require('../utils/apiResponse');

/**
 * Authenticate a restaurant admin via Bearer JWT.
 * Sets req.restaurant (restaurant row) and req.restaurantUser (decoded payload).
 */
async function authenticateRestaurant(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorized(res, 'Authentication required.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.type !== 'restaurant_admin') {
      return unauthorized(res, 'Invalid or expired token.');
    }

    // Verify the restaurant is still active
    const restaurant = await queryOne(
      `SELECT id, tenant_id, restaurant_name, email, phone, logo,
              cuisine_type, status, account_status, plan_id
       FROM restaurants
       WHERE id = ? AND account_status NOT IN ('deleted', 'suspended')`,
      [decoded.restaurantId]
    );

    if (!restaurant) {
      return unauthorized(res, 'Account is inactive or suspended.');
    }

    // Normalize bare logo filename → root-relative URL
    if (restaurant.logo && !restaurant.logo.startsWith('/') && !restaurant.logo.startsWith('http')) {
      restaurant.logo = `/uploads/restaurants/${restaurant.logo}`;
    }

    req.restaurant    = restaurant;
    req.restaurantUser = decoded; // { id, restaurantId, tenantId, credId, type }
    next();
  } catch (err) {
    return unauthorized(res, 'Authentication failed.');
  }
}

module.exports = { authenticateRestaurant };
