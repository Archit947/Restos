'use strict';

const { query, queryOne, transaction } = require('../../config/database');
const { hashPassword, generateTempPassword } = require('../../utils/passwordHelper');
const {
  generateUniqueSubdomain, generateRestaurantUID, generateUsername
} = require('../../utils/slugHelper');
const { createTenantWorkspace, generateTenantId, generateSchemaPrefix } = require('../tenants/tenant.service');
const { createAuditLog, getClientIp } = require('../../middleware/auditLog.middleware');
const { createNotification } = require('../notifications/notification.service');
const { AUDIT_ACTIONS, NOTIFICATION_TYPES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, RESTAURANT_STATUS } = require('../../config/constants');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * Normalize a restaurant image path stored as a bare filename in the DB.
 * Files are saved under uploads/restaurants/ by the multer middleware.
 */
function normalizeRestaurantImage(filename) {
  if (!filename) return null;
  if (filename.startsWith('/') || filename.startsWith('http')) return filename;
  return `/uploads/restaurants/${filename}`;
}

/**
 * Apply image normalization to a restaurant row (in-place).
 */
function normalizeRow(row) {
  if (!row) return row;
  row.logo        = normalizeRestaurantImage(row.logo);
  row.cover_image = normalizeRestaurantImage(row.cover_image);
  return row;
}

/**
 * Normalise a FormData boolean field to a real 0/1 value.
 * FormData always sends values as strings ('true'/'false'/'1'/'0').
 */
function toBool(val, defaultVal = false) {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (val === 'true' || val === '1' || val === 1) return true;
  if (val === 'false' || val === '0' || val === 0) return false;
  return Boolean(val);
}

/**
 * Get paginated list of restaurants with filters.
 */
async function listRestaurants({ page = 1, limit = DEFAULT_PAGE_SIZE, search, status, plan_id, city, country, sort = 'id', order = 'DESC' }) {
  limit = Math.min(parseInt(limit), MAX_PAGE_SIZE);
  page = Math.max(1, parseInt(page));
  const offset = (page - 1) * limit;

  let where = ['r.account_status != "deleted"'];
  const params = [];

  if (search) {
    where.push('(r.restaurant_name LIKE ? OR r.owner_name LIKE ? OR r.email LIKE ? OR rc.restaurant_uid LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (status) { where.push('r.status = ?'); params.push(status); }
  if (plan_id) { where.push('r.plan_id = ?'); params.push(plan_id); }
  if (city) { where.push('ra.city LIKE ?'); params.push(`%${city}%`); }
  if (country) { where.push('ra.country LIKE ?'); params.push(`%${country}%`); }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const validSorts = { id: 'r.id', name: 'r.restaurant_name', created: 'r.created_at', status: 'r.status' };
  const orderCol = validSorts[sort] || 'r.id';
  const orderDir = order === 'ASC' ? 'ASC' : 'DESC';

  const countSql = `
    SELECT COUNT(*) AS total
    FROM restaurants r
    LEFT JOIN restaurant_addresses ra ON r.id = ra.restaurant_id
    LEFT JOIN restaurant_credentials rc ON r.id = rc.restaurant_id
    ${whereClause}`;

  const dataSql = `
    SELECT
      r.id, r.tenant_id, r.restaurant_name, r.business_name, r.owner_name,
      r.email, r.phone, r.logo, r.cover_image, r.status, r.account_status,
      r.cuisine_type, r.created_at,
      ra.city, ra.state, ra.country,
      sp.name AS plan_name, sp.slug AS plan_slug,
      rc.restaurant_uid, rc.username, rc.is_active AS credential_active, rc.last_login_at,
      w.status AS website_status, w.is_enabled AS website_enabled,
      s.subdomain, s.full_domain
    FROM restaurants r
    LEFT JOIN restaurant_addresses ra ON r.id = ra.restaurant_id
    LEFT JOIN restaurant_credentials rc ON r.id = rc.restaurant_id
    LEFT JOIN subscription_plans sp ON r.plan_id = sp.id
    LEFT JOIN websites w ON r.id = w.restaurant_id
    LEFT JOIN subdomains s ON r.id = s.restaurant_id
    ${whereClause}
    ORDER BY ${orderCol} ${orderDir}
    LIMIT ? OFFSET ?`;

  const [countResult] = await query(countSql, params);
  const total = countResult[0]?.total || 0;

  const [rows] = await query(dataSql, [...params, limit, offset]);

  return { restaurants: rows.map(normalizeRow), total, page, limit };
}

/**
 * Get a single restaurant with all details.
 */
async function getRestaurantById(id) {
  const restaurant = await queryOne(`
    SELECT r.*, sp.name AS plan_name, sp.slug AS plan_slug,
           rc.id AS user_id, rc.restaurant_uid, rc.username, rc.temp_password,
           rc.is_active AS credential_active,
           rc.last_login_at, rc.login_attempts, rc.is_first_login,
           w.id AS website_id, w.status AS website_status, w.title AS website_title,
           w.subtitle AS website_subtitle, w.is_enabled AS website_enabled,
           s.subdomain, s.full_domain, s.custom_domain, s.ssl_enabled,
           rs.status AS sub_status, rs.trial_ends_at, rs.expires_at,
           rs.website_enabled AS sub_website_enabled, rs.cms_enabled AS sub_cms_enabled,
           rs.blog_enabled, rs.reservation_enabled, rs.event_enabled,
           rs.affiliate_enabled, rs.marketing_enabled, rs.storage_used_mb
    FROM restaurants r
    LEFT JOIN subscription_plans sp ON r.plan_id = sp.id
    LEFT JOIN restaurant_credentials rc ON r.id = rc.restaurant_id
    LEFT JOIN websites w ON r.id = w.restaurant_id
    LEFT JOIN subdomains s ON r.id = s.restaurant_id
    LEFT JOIN restaurant_subscriptions rs ON r.id = rs.restaurant_id
    WHERE r.id = ? AND r.account_status != 'deleted'`, [id]);

  if (!restaurant) return null;

  // Get address
  const address = await queryOne('SELECT * FROM restaurant_addresses WHERE restaurant_id = ?', [id]);
  restaurant.address = address;

  // Get CMS page count
  const [pageCount] = await query('SELECT COUNT(*) AS cnt FROM cms_pages WHERE restaurant_id = ?', [id]);
  restaurant.cms_pages_count = pageCount[0]?.cnt || 0;

  // Get blog/events/reservation counts
  const [blogCount] = await query('SELECT COUNT(*) AS cnt FROM blog_posts WHERE restaurant_id = ?', [id]);
  const [eventCount] = await query('SELECT COUNT(*) AS cnt FROM events WHERE restaurant_id = ?', [id]);
  const [resCount] = await query('SELECT COUNT(*) AS cnt FROM reservations WHERE restaurant_id = ?', [id]);
  restaurant.blog_count = blogCount[0]?.cnt || 0;
  restaurant.event_count = eventCount[0]?.cnt || 0;
  restaurant.reservation_count = resCount[0]?.cnt || 0;

  return normalizeRow(restaurant);
}

/**
 * Create a new restaurant with full tenant workspace (transactional).
 */
async function createRestaurant(data, adminUser, req) {
  return transaction(async (conn) => {
    const {
      restaurant_name, business_name, owner_name, email, phone, whatsapp,
      gst_number, pan_number, business_reg_no, cuisine_type, description,
      logo, cover_image,
      country, state, city, area, zip_code, address, latitude, longitude,
      website_title, website_subtitle, subdomain: requestedSubdomain,
      template_slug,
      plan_id, trial_days, status = 'trial',
    } = data;

    // FormData sends booleans as strings — normalise them to real booleans
    const website_enabled     = toBool(data.website_enabled, true);
    const cms_enabled         = toBool(data.cms_enabled, true);
    const blog_enabled        = toBool(data.blog_enabled, false);
    const reservation_enabled = toBool(data.reservation_enabled, false);
    const event_enabled       = toBool(data.event_enabled, false);
    const affiliate_enabled   = toBool(data.affiliate_enabled, false);
    const marketing_enabled   = toBool(data.marketing_enabled, false);
    const has_store           = toBool(data.has_store, false);

    // Generate unique identifiers
    const tenantId = generateTenantId();
    const schemaPrefix = generateSchemaPrefix(tenantId);
    const restaurantUID = await generateRestaurantUID();

    // Generate subdomain
    const subdomain = requestedSubdomain
      ? await (async () => {
          const { isSubdomainAvailable } = require('../../utils/slugHelper');
          const available = await isSubdomainAvailable(requestedSubdomain.toLowerCase());
          if (!available) throw Object.assign(new Error('Subdomain is already taken.'), { statusCode: 409 });
          return requestedSubdomain.toLowerCase();
        })()
      : await generateUniqueSubdomain(restaurant_name);

    const fullDomain = env.PLATFORM.SITE_BASE_URL
      ? `${env.PLATFORM.SITE_BASE_URL}/${subdomain}`          // dev: http://localhost:5173/site/biriyanihouse
      : `${subdomain}${env.PLATFORM.SUBDOMAIN_SUFFIX}`;       // prod: biriyanihouse.restos.com

    // Get the selected plan
    const plan = plan_id
      ? await queryOne('SELECT * FROM subscription_plans WHERE id = ?', [plan_id])
      : await queryOne("SELECT * FROM subscription_plans WHERE slug = 'starter'");

    if (!plan) throw new Error('Subscription plan not found.');

    // 1. Insert tenant
    await conn.execute(
      'INSERT INTO tenants (tenant_id, schema_prefix, status) VALUES (?, ?, "active")',
      [tenantId, schemaPrefix]
    );

    // 2. Insert restaurant
    const [restaurantResult] = await conn.execute(
      `INSERT INTO restaurants
       (tenant_id, restaurant_name, business_name, owner_name, email, phone, whatsapp,
        gst_number, pan_number, business_reg_no, cuisine_type, description, logo, cover_image,
        status, account_status, plan_id, created_by, has_store)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
       RETURNING id`,
      [
        tenantId, restaurant_name, business_name || null, owner_name, email.toLowerCase(), phone,
        whatsapp || null, gst_number || null, pan_number || null, business_reg_no || null,
        cuisine_type || null, description || null, logo || null, cover_image || null,
        status, plan.id, adminUser.id, has_store,
      ]
    );

    const restaurantId = restaurantResult.insertId;

    // Update tenant with restaurant_id
    await conn.execute('UPDATE tenants SET restaurant_id = ? WHERE tenant_id = ?', [restaurantId, tenantId]);

    // 3. Insert address
    if (address) {
      await conn.execute(
        `INSERT INTO restaurant_addresses
         (restaurant_id, tenant_id, country, state, city, area, zip_code, address, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [restaurantId, tenantId, country || 'India', state || '', city || '', area || null,
         zip_code || null, address, latitude || null, longitude || null]
      );
    }

    // 4. Insert subdomain
    await conn.execute(
      'INSERT INTO subdomains (restaurant_id, tenant_id, subdomain, full_domain, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [restaurantId, tenantId, subdomain, fullDomain]
    );

    // 5. Insert subscription
    const trialDays = trial_days || plan.trial_days;
    const trialEndsAt = status === 'trial' ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null;
    const expiresAt = status === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    await conn.execute(
      `INSERT INTO restaurant_subscriptions
       (restaurant_id, tenant_id, plan_id, billing_cycle, status, trial_ends_at, starts_at, expires_at,
        website_enabled, cms_enabled, blog_enabled, reservation_enabled, event_enabled, affiliate_enabled, marketing_enabled)
       VALUES (?, ?, ?, 'trial', ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        restaurantId, tenantId, plan.id, status, trialEndsAt, expiresAt,
        plan.website_enabled && website_enabled,
        plan.cms_enabled && cms_enabled,
        plan.blog_enabled && blog_enabled,
        plan.reservation_enabled && reservation_enabled,
        plan.event_enabled && event_enabled,
        plan.affiliate_enabled && affiliate_enabled,
        plan.marketing_enabled && marketing_enabled,
      ]
    );

    // 6. Generate credentials
    const username = generateUsername(restaurant_name);
    const tempPassword = generateTempPassword(12);
    const passwordHash = await hashPassword(tempPassword);

    await conn.execute(
      `INSERT INTO restaurant_credentials
       (restaurant_id, tenant_id, restaurant_uid, username, password_hash, temp_password, is_active, is_first_login)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
      [restaurantId, tenantId, restaurantUID, username, passwordHash, tempPassword]
    );

    // 6b. Create store credentials if has_store is enabled
    let storeUsername = null;
    let storeTempPassword = null;
    if (has_store) {
      storeUsername     = `store_${generateUsername(restaurant_name)}`;
      storeTempPassword = generateTempPassword(12);
      const storePasswordHash = await hashPassword(storeTempPassword);
      await conn.execute(
        `INSERT INTO store_credentials
         (restaurant_id, tenant_id, username, password_hash, temp_password, is_active, is_first_login)
         VALUES (?, ?, ?, ?, ?, TRUE, TRUE)`,
        [restaurantId, tenantId, storeUsername, storePasswordHash, storeTempPassword]
      );
    }

    // 7. Create tenant workspace (website + CMS + navigation)
    const restaurantDataForWorkspace = {
      id: restaurantId,
      tenant_id: tenantId,
      restaurant_name,
      email: email.toLowerCase(),
      phone,
      website_title: website_title || restaurant_name,
      website_subtitle: website_subtitle || `Welcome to ${restaurant_name}`,
      template_slug: template_slug || 'bloom',
    };
    await createTenantWorkspace(restaurantDataForWorkspace, conn);

    // 8. Audit log
    await createAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      tenantId,
      action: AUDIT_ACTIONS.RESTAURANT_CREATED,
      entityType: 'restaurant',
      entityId: restaurantId,
      entityName: restaurant_name,
      description: `Restaurant "${restaurant_name}" created. Subdomain: ${fullDomain}`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      afterValue: { restaurant_name, email, subdomain, plan: plan.slug },
    });

    // 9. Create notification for super admin
    await createNotification({
      recipientId: adminUser.id,
      type: NOTIFICATION_TYPES.RESTAURANT_CREATED,
      title: 'New Restaurant Created',
      message: `"${restaurant_name}" has been successfully onboarded. Domain: ${fullDomain}`,
      data: { restaurantId, subdomain, fullDomain },
    });

    logger.info(`✅ Restaurant created: ${restaurant_name} (ID: ${restaurantId}, Tenant: ${tenantId})`);

    return {
      restaurantId,
      tenantId,
      restaurantUID,
      username,
      tempPassword,
      subdomain,
      fullDomain,
      plan: { id: plan.id, name: plan.name, slug: plan.slug },
      hasStore: has_store,
      storeUsername,
      storeTempPassword,
    };
  });
}

/**
 * Update restaurant details.
 */
async function updateRestaurant(id, data, adminUser, req) {
  const existing = await queryOne('SELECT * FROM restaurants WHERE id = ? AND account_status != "deleted"', [id]);
  if (!existing) throw Object.assign(new Error('Restaurant not found.'), { statusCode: 404 });

  const {
    restaurant_name, business_name, owner_name, phone, whatsapp,
    gst_number, pan_number, business_reg_no, cuisine_type, description,
    logo, cover_image,
    country, state, city, area, zip_code, address, latitude, longitude,
  } = data;

  await query(
    `UPDATE restaurants SET
     restaurant_name = COALESCE(?, restaurant_name),
     business_name = COALESCE(?, business_name),
     owner_name = COALESCE(?, owner_name),
     phone = COALESCE(?, phone),
     whatsapp = COALESCE(?, whatsapp),
     gst_number = COALESCE(?, gst_number),
     pan_number = COALESCE(?, pan_number),
     business_reg_no = COALESCE(?, business_reg_no),
     cuisine_type = COALESCE(?, cuisine_type),
     description = COALESCE(?, description),
     logo = COALESCE(?, logo),
     cover_image = COALESCE(?, cover_image)
     WHERE id = ?`,
    [restaurant_name, business_name, owner_name, phone, whatsapp,
     gst_number, pan_number, business_reg_no, cuisine_type, description,
     logo, cover_image, id]
  );

  // Update address
  if (address || city || state || country) {
    const existingAddr = await queryOne('SELECT id FROM restaurant_addresses WHERE restaurant_id = ?', [id]);
    if (existingAddr) {
      await query(
        `UPDATE restaurant_addresses SET
         country = COALESCE(?, country), state = COALESCE(?, state), city = COALESCE(?, city),
         area = COALESCE(?, area), zip_code = COALESCE(?, zip_code), address = COALESCE(?, address),
         latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude)
         WHERE restaurant_id = ?`,
        [country, state, city, area, zip_code, address, latitude, longitude, id]
      );
    }
  }

  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    tenantId: existing.tenant_id,
    action: AUDIT_ACTIONS.RESTAURANT_UPDATED,
    entityType: 'restaurant',
    entityId: id,
    entityName: restaurant_name || existing.restaurant_name,
    description: `Restaurant "${existing.restaurant_name}" updated.`,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    beforeValue: { restaurant_name: existing.restaurant_name, phone: existing.phone },
    afterValue: { restaurant_name, phone },
  });

  return getRestaurantById(id);
}

/**
 * Update restaurant status (activate / suspend / expire).
 */
async function updateStatus(id, status, adminUser, req) {
  const existing = await queryOne('SELECT * FROM restaurants WHERE id = ?', [id]);
  if (!existing) throw Object.assign(new Error('Restaurant not found.'), { statusCode: 404 });

  await query('UPDATE restaurants SET status = ?, account_status = ? WHERE id = ?',
    [status, status === 'suspended' ? 'suspended' : 'active', id]);

  const action = status === 'suspended' ? AUDIT_ACTIONS.RESTAURANT_SUSPENDED : AUDIT_ACTIONS.RESTAURANT_ACTIVATED;

  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    tenantId: existing.tenant_id,
    action,
    entityType: 'restaurant',
    entityId: id,
    entityName: existing.restaurant_name,
    description: `Restaurant "${existing.restaurant_name}" status changed to ${status}.`,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  if (status === 'suspended') {
    await createNotification({
      recipientId: adminUser.id,
      type: NOTIFICATION_TYPES.RESTAURANT_SUSPENDED,
      title: 'Restaurant Suspended',
      message: `"${existing.restaurant_name}" has been suspended.`,
    });
  }

  return { success: true };
}

/**
 * Soft delete a restaurant.
 */
async function deleteRestaurant(id, adminUser, req) {
  const existing = await queryOne('SELECT * FROM restaurants WHERE id = ?', [id]);
  if (!existing) throw Object.assign(new Error('Restaurant not found.'), { statusCode: 404 });

  await query('UPDATE restaurants SET account_status = "deleted" WHERE id = ?', [id]);
  await query('UPDATE tenants SET status = "deleted" WHERE tenant_id = ?', [existing.tenant_id]);

  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    tenantId: existing.tenant_id,
    action: AUDIT_ACTIONS.RESTAURANT_DELETED,
    entityType: 'restaurant',
    entityId: id,
    entityName: existing.restaurant_name,
    description: `Restaurant "${existing.restaurant_name}" deleted.`,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  return { success: true };
}

/**
 * Reset restaurant password.
 */
async function resetRestaurantPassword(restaurantId, adminUser, req) {
  const existing = await queryOne('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
  if (!existing) throw Object.assign(new Error('Restaurant not found.'), { statusCode: 404 });

  const tempPassword = generateTempPassword(12);
  const passwordHash = await hashPassword(tempPassword);

  await query(
    'UPDATE restaurant_credentials SET password_hash = ?, temp_password = ?, is_first_login = 1 WHERE restaurant_id = ?',
    [passwordHash, tempPassword, restaurantId]
  );

  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    tenantId: existing.tenant_id,
    action: AUDIT_ACTIONS.RESTAURANT_PASSWORD_RESET,
    entityType: 'restaurant',
    entityId: restaurantId,
    entityName: existing.restaurant_name,
    description: `Password reset for restaurant "${existing.restaurant_name}".`,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  return { tempPassword };
}

/**
 * Change restaurant plan.
 */
async function changePlan(restaurantId, planId, adminUser, req) {
  const plan = await queryOne('SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1', [planId]);
  if (!plan) throw Object.assign(new Error('Plan not found.'), { statusCode: 404 });

  const existing = await queryOne('SELECT * FROM restaurants WHERE id = ?', [restaurantId]);
  if (!existing) throw Object.assign(new Error('Restaurant not found.'), { statusCode: 404 });

  await query('UPDATE restaurants SET plan_id = ? WHERE id = ?', [planId, restaurantId]);
  await query(
    'UPDATE restaurant_subscriptions SET plan_id = ?, status = "active", expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE restaurant_id = ?',
    [planId, restaurantId]
  );

  await createAuditLog({
    userId: adminUser.id,
    userEmail: adminUser.email,
    tenantId: existing.tenant_id,
    action: AUDIT_ACTIONS.PLAN_CHANGED,
    entityType: 'restaurant',
    entityId: restaurantId,
    entityName: existing.restaurant_name,
    description: `Plan changed to "${plan.name}" for restaurant "${existing.restaurant_name}".`,
    ipAddress: getClientIp(req),
    beforeValue: { plan_id: existing.plan_id },
    afterValue: { plan_id: planId, plan_name: plan.name },
  });

  return { success: true, plan };
}

/**
 * Bulk action on multiple restaurants.
 */
async function bulkAction(ids, action, adminUser, req) {
  if (!ids?.length) throw new Error('No restaurant IDs provided.');

  const validActions = ['activate', 'suspend', 'delete'];
  if (!validActions.includes(action)) throw new Error(`Invalid action: ${action}`);

  const placeholders = ids.map(() => '?').join(',');
  const restaurants = (await query(`SELECT * FROM restaurants WHERE id IN (${placeholders})`, ids))[0];

  for (const restaurant of restaurants) {
    if (action === 'activate') {
      await updateStatus(restaurant.id, 'active', adminUser, req);
    } else if (action === 'suspend') {
      await updateStatus(restaurant.id, 'suspended', adminUser, req);
    } else if (action === 'delete') {
      await deleteRestaurant(restaurant.id, adminUser, req);
    }
  }

  return { success: true, processed: restaurants.length };
}

module.exports = {
  listRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  updateStatus,
  deleteRestaurant,
  resetRestaurantPassword,
  changePlan,
  bulkAction,
};
