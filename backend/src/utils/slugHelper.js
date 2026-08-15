'use strict';

const slugify = require('slugify');
const { RESERVED_SUBDOMAINS } = require('../config/constants');
const { query } = require('../config/database');

/**
 * Generate a URL-safe slug from a string.
 */
function generateSlug(text, options = {}) {
  return slugify(text, {
    lower: true,
    strict: true,  // Remove special chars
    trim: true,
    replacement: '-',
    ...options,
  });
}

/**
 * Generate a subdomain slug from restaurant name.
 * Removes non-alphanumeric chars, max 63 chars.
 */
function generateSubdomain(restaurantName) {
  const base = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // keep alphanumeric, space, hyphen
    .replace(/\s+/g, '')            // remove spaces
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '')          // trim hyphens
    .substring(0, 63);
  return base;
}

/**
 * Check if a subdomain is reserved.
 */
function isReservedSubdomain(subdomain) {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}

/**
 * Check if a subdomain is available in the database.
 */
async function isSubdomainAvailable(subdomain, excludeRestaurantId = null) {
  if (isReservedSubdomain(subdomain)) return false;

  let sql = 'SELECT id FROM subdomains WHERE subdomain = ?';
  const params = [subdomain.toLowerCase()];

  if (excludeRestaurantId) {
    sql += ' AND restaurant_id != ?';
    params.push(excludeRestaurantId);
  }

  const [rows] = await query(sql, params);
  return rows.length === 0;
}

/**
 * Generate a unique subdomain by appending numbers if taken.
 * e.g., biriyanihouse → biriyanihouse1 → biriyanihouse2
 */
async function generateUniqueSubdomain(restaurantName, excludeId = null) {
  const base = generateSubdomain(restaurantName);
  let subdomain = base;
  let attempt = 0;

  while (!(await isSubdomainAvailable(subdomain, excludeId))) {
    attempt++;
    subdomain = `${base}${attempt}`;
  }

  return subdomain;
}

/**
 * Generate a unique restaurant UID like REST-0001
 */
async function generateRestaurantUID() {
  const [rows] = await query('SELECT COUNT(*) AS cnt FROM restaurants');
  const count = (rows[0].cnt || 0) + 1;
  return `REST-${String(count).padStart(4, '0')}`;
}

/**
 * Generate a unique username for restaurant login.
 * Format: restaurantname_xx
 */
function generateUsername(restaurantName) {
  const base = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${suffix}`;
}

module.exports = {
  generateSlug,
  generateSubdomain,
  isReservedSubdomain,
  isSubdomainAvailable,
  generateUniqueSubdomain,
  generateRestaurantUID,
  generateUsername,
};
