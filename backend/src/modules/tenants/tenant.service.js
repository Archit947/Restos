'use strict';

const { v4: uuidv4 } = require('uuid');
const { query, queryOne, transaction } = require('../../config/database');
const { DEFAULT_PAGES, DEFAULT_NAVIGATION } = require('../../config/constants');
const { generateSlug } = require('../../utils/slugHelper');
const logger = require('../../utils/logger');

/**
 * Automatically create a complete tenant workspace when a restaurant is created.
 * This includes: tenant, website, CMS pages, CMS settings, navigation menus.
 */
async function createTenantWorkspace(restaurantData, connection) {
  const tenantId = restaurantData.tenant_id;
  const restaurantId = restaurantData.id;

  // 1. Get the default template
  const defaultTemplate = await queryOne(
    'SELECT id FROM website_templates WHERE is_default = 1 AND is_active = 1 LIMIT 1'
  );

  // 2. Create the website record
  const templateSlug = restaurantData.template_slug || 'bloom';
  await connection.execute(
    `INSERT INTO websites (restaurant_id, tenant_id, template_id, template_slug, title, subtitle, status, is_enabled)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', 1)`,
    [
      restaurantId,
      tenantId,
      defaultTemplate?.id || null,
      templateSlug,
      restaurantData.website_title || restaurantData.restaurant_name,
      restaurantData.website_subtitle || `Welcome to ${restaurantData.restaurant_name}`,
    ]
  );

  // 3. Create default CMS pages
  for (const page of DEFAULT_PAGES) {
    await connection.execute(
      `INSERT INTO cms_pages
       (restaurant_id, tenant_id, title, slug, page_type, status, is_default, sort_order, published_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, NULL)`,
      [restaurantId, tenantId, page.title, page.slug, page.page_type, page.is_default, page.sort_order]
    );
  }

  // 4. Create CMS settings (structured business info)
  await connection.execute(
    `INSERT INTO cms_settings (restaurant_id, tenant_id, business_email, business_phone, opening_hours, social_links)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      restaurantId,
      tenantId,
      restaurantData.email,
      restaurantData.phone,
      JSON.stringify({
        monday: { open: '09:00', close: '22:00', closed: false },
        tuesday: { open: '09:00', close: '22:00', closed: false },
        wednesday: { open: '09:00', close: '22:00', closed: false },
        thursday: { open: '09:00', close: '22:00', closed: false },
        friday: { open: '09:00', close: '22:00', closed: false },
        saturday: { open: '09:00', close: '23:00', closed: false },
        sunday: { open: '10:00', close: '21:00', closed: false },
      }),
      JSON.stringify({ facebook: '', instagram: '', twitter: '', youtube: '' }),
    ]
  );

  // 5. Create default navigation menus
  for (const [location, items] of Object.entries(DEFAULT_NAVIGATION)) {
    await connection.execute(
      `INSERT INTO navigation_menus (restaurant_id, tenant_id, location, items) VALUES (?, ?, ?, ?)`,
      [restaurantId, tenantId, location, JSON.stringify(items)]
    );
  }

  logger.info(`✅ Tenant workspace created for restaurant: ${restaurantData.restaurant_name} (${tenantId})`);
}

/**
 * Generate a new tenant ID (UUID v4).
 */
function generateTenantId() {
  return uuidv4();
}

/**
 * Generate a schema prefix for the tenant.
 * Format: t_<short_uuid>
 */
function generateSchemaPrefix(tenantId) {
  return `t_${tenantId.replace(/-/g, '').substring(0, 8)}`;
}

/**
 * Get tenant by restaurant ID.
 */
async function getTenantByRestaurantId(restaurantId) {
  return queryOne('SELECT * FROM tenants WHERE restaurant_id = ?', [restaurantId]);
}

/**
 * Suspend a tenant.
 */
async function suspendTenant(tenantId) {
  await query("UPDATE tenants SET status = 'suspended' WHERE tenant_id = ?", [tenantId]);
}

/**
 * Activate a tenant.
 */
async function activateTenant(tenantId) {
  await query("UPDATE tenants SET status = 'active' WHERE tenant_id = ?", [tenantId]);
}

module.exports = {
  createTenantWorkspace,
  generateTenantId,
  generateSchemaPrefix,
  getTenantByRestaurantId,
  suspendTenant,
  activateTenant,
};
