import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, queryOne, execute } from '../../database/connection';
import { AppError } from '../../utils/AppError';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination';
import { provisionTenant } from '../../services/tenant.service';
import { generateSubdomainSlug, validateSubdomainSlug } from '../../utils/subdomain';
import { execute as dbExecute } from '../../database/connection';

// ─────────────────────────────────────────────────────────────────────────────
// LIST restaurants with filters, search, pagination
// GET /api/v1/restaurants
// ─────────────────────────────────────────────────────────────────────────────
export const listRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);
    const { search, status, plan, city, country } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('MATCH(r.restaurant_name, r.owner_name, r.email, r.city) AGAINST (? IN BOOLEAN MODE)');
      params.push(`${search}*`);
    }
    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (city) { conditions.push('r.city LIKE ?'); params.push(`%${city}%`); }
    if (country) { conditions.push('r.country = ?'); params.push(country); }
    if (plan) { conditions.push('s.plan = ?'); params.push(plan); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM restaurants r
       LEFT JOIN subscriptions s ON s.restaurant_id = r.id
       ${where}`,
      params
    );
    const total = countResult[0]?.total ?? 0;

    const rows = await query(
      `SELECT r.id, r.restaurant_name, r.business_name, r.owner_name, r.email,
              r.phone, r.city, r.country, r.status, r.logo_url, r.created_at,
              s.plan, s.trial_ends_at, s.expires_at,
              sub.slug AS subdomain, sub.full_url AS website_url,
              w.is_published AS website_published, w.is_enabled AS website_enabled
       FROM restaurants r
       LEFT JOIN subscriptions s ON s.restaurant_id = r.id
       LEFT JOIN subdomains sub ON sub.restaurant_id = r.id
       LEFT JOIN websites w ON w.restaurant_id = r.id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      ...buildPaginatedResponse(rows, total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET single restaurant with full details
// GET /api/v1/restaurants/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurant = await queryOne(
      `SELECT r.*, t.tenant_code, t.status AS tenant_status,
              s.plan, s.trial_days, s.trial_ends_at, s.expires_at,
              s.storage_limit_mb, s.website_enabled, s.cms_enabled,
              s.blog_enabled, s.reservation_enabled, s.events_enabled,
              s.affiliate_enabled, s.marketing_enabled, s.status AS subscription_status,
              sub.slug AS subdomain, sub.full_url AS website_url, sub.custom_domain,
              w.id AS website_id, w.title AS website_title, w.subtitle AS website_subtitle,
              w.is_published AS website_published, w.is_enabled AS website_enabled,
              rc.restaurant_login_id, rc.username, rc.is_temp_password, rc.email_verified, rc.last_login_at AS restaurant_last_login
       FROM restaurants r
       LEFT JOIN tenants t ON t.id = r.tenant_id
       LEFT JOIN subscriptions s ON s.restaurant_id = r.id
       LEFT JOIN subdomains sub ON sub.restaurant_id = r.id
       LEFT JOIN websites w ON w.restaurant_id = r.id
       LEFT JOIN restaurant_credentials rc ON rc.restaurant_id = r.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!restaurant) throw new AppError('Restaurant not found', 404);

    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE restaurant + full tenant provisioning
// POST /api/v1/restaurants
// ─────────────────────────────────────────────────────────────────────────────
export const createRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      // Step 1
      restaurant_name, business_name, owner_name, email, phone, whatsapp,
      gst_number, pan_number, business_reg_number, cuisine_type, description,
      // Step 2
      country, state, city, area, zip_code, full_address, latitude, longitude,
      // Step 3
      website_title, website_subtitle, subdomain_slug: rawSlug,
      plan = 'starter',
    } = req.body;

    // Handle string values from FormData
    const trial_days = Number(req.body.trial_days || 14);
    const storage_limit_mb = Number(req.body.storage_limit_mb || 500);
    const website_enabled = req.body.website_enabled === 'true' || req.body.website_enabled === true;
    const cms_enabled = req.body.cms_enabled === 'true' || req.body.cms_enabled === true;
    const blog_enabled = req.body.blog_enabled === 'true' || req.body.blog_enabled === true;
    const reservation_enabled = req.body.reservation_enabled === 'true' || req.body.reservation_enabled === true;
    const events_enabled = req.body.events_enabled === 'true' || req.body.events_enabled === true;
    const affiliate_enabled = req.body.affiliate_enabled === 'true' || req.body.affiliate_enabled === true;
    const marketing_enabled = req.body.marketing_enabled === 'true' || req.body.marketing_enabled === true;

    // Validate email uniqueness
    const emailExists = await queryOne('SELECT id FROM restaurants WHERE email = ?', [email]);
    if (emailExists) throw new AppError('A restaurant with this email already exists', 409);

    // Validate & resolve subdomain slug
    const subdomainSlug = rawSlug || generateSubdomainSlug(restaurant_name);
    const slugValidation = validateSubdomainSlug(subdomainSlug);
    if (!slugValidation.valid) throw new AppError(slugValidation.reason!, 400);

    const slugExists = await queryOne('SELECT id FROM subdomains WHERE slug = ?', [subdomainSlug]);
    if (slugExists) throw new AppError('This subdomain is already taken', 409);

    // Generate IDs and sequence for tenant code
    const restaurantId = uuidv4();
    const tenantId = uuidv4();

    const { generateTenantCode } = await import('../../utils/subdomain');
    const maxResult = await queryOne<{ maxSeq: number }>('SELECT MAX(CAST(SUBSTRING(tenant_code, 5) AS UNSIGNED)) AS maxSeq FROM tenants');
    const seq = (maxResult?.maxSeq ?? 0) + 1;
    const tenantCode = generateTenantCode(seq);

    // ── Create TENANT record first (foreign key dependency) ──
    await execute(`INSERT INTO tenants (id, tenant_code, status) VALUES (?, ?, 'trial')`, [tenantId, tenantCode]);

    const logoUrl = req.files && (req.files as any).logo ? `/uploads/${(req.files as any).logo[0].filename}` : null;
    const coverUrl = req.files && (req.files as any).cover ? `/uploads/${(req.files as any).cover[0].filename}` : null;

    // ── Insert RESTAURANT ──
    await execute(
      `INSERT INTO restaurants 
       (id, tenant_id, restaurant_name, business_name, owner_name, email, phone, whatsapp,
        gst_number, pan_number, business_reg_number, cuisine_type, description,
        logo_url, cover_image_url, country, state, city, area, zip_code,
        full_address, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial')`,
      [
        restaurantId, tenantId, restaurant_name, business_name, owner_name, email, phone, whatsapp || null,
        gst_number || null, pan_number || null, business_reg_number || null,
        cuisine_type || null, description || null, logoUrl, coverUrl,
        country || 'India', state || null, city || null, area || null,
        zip_code || null, full_address || null,
        latitude || null, longitude || null,
      ]
    );

    // Provision complete tenant workspace
    const provisioned = await provisionTenant({
      tenantId,
      tenantCode,
      seq,
      restaurantId,
      restaurantName: restaurant_name,
      ownerName: owner_name,
      email,
      subdomainSlug,
      websiteTitle: website_title || restaurant_name,
      websiteSubtitle: website_subtitle,
      plan,
      trialDays: trial_days,
      storageLimitMb: storage_limit_mb,
      websiteEnabled: website_enabled,
      cmsEnabled: cms_enabled,
      blogEnabled: blog_enabled,
      reservationEnabled: reservation_enabled,
      eventsEnabled: events_enabled,
      affiliateEnabled: affiliate_enabled,
      marketingEnabled: marketing_enabled,
    });

    // Audit log
    await execute(
      `INSERT INTO audit_logs (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, ip_address)
       VALUES (?, 'super_admin', ?, ?, 'RESTAURANT_CREATED', 'restaurant', ?, ?, ?)`,
      [
        uuidv4(),
        req.admin!.id,
        req.admin!.email,
        restaurantId,
        `Restaurant "${restaurant_name}" created with subdomain ${provisioned.subdomainSlug}`,
        req.ip,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Restaurant created and workspace provisioned successfully',
      data: {
        restaurantId,
        ...provisioned,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE restaurant
// PUT /api/v1/restaurants/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await queryOne('SELECT id FROM restaurants WHERE id = ?', [req.params.id]);
    if (!existing) throw new AppError('Restaurant not found', 404);

    const {
      restaurant_name, business_name, owner_name, phone, whatsapp,
      gst_number, pan_number, business_reg_number, cuisine_type, description,
      country, state, city, area, zip_code, full_address, latitude, longitude, status,
    } = req.body;

    await execute(
      `UPDATE restaurants SET
       restaurant_name = COALESCE(?, restaurant_name),
       business_name = COALESCE(?, business_name),
       owner_name = COALESCE(?, owner_name),
       phone = COALESCE(?, phone),
       whatsapp = COALESCE(?, whatsapp),
       gst_number = COALESCE(?, gst_number),
       pan_number = COALESCE(?, pan_number),
       business_reg_number = COALESCE(?, business_reg_number),
       cuisine_type = COALESCE(?, cuisine_type),
       description = COALESCE(?, description),
       country = COALESCE(?, country),
       state = COALESCE(?, state),
       city = COALESCE(?, city),
       area = COALESCE(?, area),
       zip_code = COALESCE(?, zip_code),
       full_address = COALESCE(?, full_address),
       latitude = COALESCE(?, latitude),
       longitude = COALESCE(?, longitude),
       status = COALESCE(?, status)
       WHERE id = ?`,
      [
        restaurant_name, business_name, owner_name, phone, whatsapp,
        gst_number, pan_number, business_reg_number, cuisine_type, description,
        country, state, city, area, zip_code, full_address, latitude, longitude,
        status, req.params.id,
      ]
    );

    // Audit
    await execute(
      `INSERT INTO audit_logs (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, ip_address)
       VALUES (?, 'super_admin', ?, ?, 'RESTAURANT_UPDATED', 'restaurant', ?, 'Restaurant updated', ?)`,
      [uuidv4(), req.admin!.id, req.admin!.email, req.params.id, req.ip]
    );

    const updated = await queryOne('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Restaurant updated', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUSPEND restaurant
// POST /api/v1/restaurants/:id/suspend
// ─────────────────────────────────────────────────────────────────────────────
export const suspendRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurant = await queryOne('SELECT id, restaurant_name, status FROM restaurants WHERE id = ?', [req.params.id]);
    if (!restaurant) throw new AppError('Restaurant not found', 404);
    if (restaurant.status === 'suspended') throw new AppError('Restaurant is already suspended', 400);

    await execute('UPDATE restaurants SET status = "suspended" WHERE id = ?', [req.params.id]);
    await execute('UPDATE tenants SET status = "suspended" WHERE id = (SELECT tenant_id FROM restaurants WHERE id = ?)', [req.params.id]);

    await execute(
      `INSERT INTO notifications (id, type, title, message, data) VALUES (?, 'RESTAURANT_SUSPENDED', ?, ?, ?)`,
      [uuidv4(), `Restaurant Suspended: ${restaurant.restaurant_name}`, `${restaurant.restaurant_name} has been suspended`, JSON.stringify({ restaurantId: req.params.id })]
    );

    await execute(
      `INSERT INTO audit_logs (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, ip_address)
       VALUES (?, 'super_admin', ?, ?, 'RESTAURANT_SUSPENDED', 'restaurant', ?, ?, ?)`,
      [uuidv4(), req.admin!.id, req.admin!.email, req.params.id, `Restaurant "${restaurant.restaurant_name}" suspended`, req.ip]
    );

    res.json({ success: true, message: 'Restaurant suspended successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE restaurant
// POST /api/v1/restaurants/:id/activate
// ─────────────────────────────────────────────────────────────────────────────
export const activateRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurant = await queryOne('SELECT id, restaurant_name FROM restaurants WHERE id = ?', [req.params.id]);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    await execute('UPDATE restaurants SET status = "active" WHERE id = ?', [req.params.id]);
    await execute('UPDATE tenants SET status = "active" WHERE id = (SELECT tenant_id FROM restaurants WHERE id = ?)', [req.params.id]);

    await execute(
      `INSERT INTO audit_logs (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, ip_address)
       VALUES (?, 'super_admin', ?, ?, 'RESTAURANT_ACTIVATED', 'restaurant', ?, ?, ?)`,
      [uuidv4(), req.admin!.id, req.admin!.email, req.params.id, `Restaurant "${restaurant.restaurant_name}" activated`, req.ip]
    );

    res.json({ success: true, message: 'Restaurant activated successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE restaurant (cascades all tenant data)
// DELETE /api/v1/restaurants/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const restaurant = await queryOne('SELECT id, restaurant_name, tenant_id FROM restaurants WHERE id = ?', [req.params.id]);
    if (!restaurant) throw new AppError('Restaurant not found', 404);

    // Cascade delete (FK ON DELETE CASCADE handles children)
    await execute('DELETE FROM tenants WHERE id = ?', [restaurant.tenant_id]);

    await execute(
      `INSERT INTO audit_logs (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, ip_address)
       VALUES (?, 'super_admin', ?, ?, 'RESTAURANT_DELETED', 'restaurant', ?, ?, ?)`,
      [uuidv4(), req.admin!.id, req.admin!.email, req.params.id, `Restaurant "${restaurant.restaurant_name}" permanently deleted`, req.ip]
    );

    res.json({ success: true, message: 'Restaurant and all associated data deleted' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET restaurant password
// POST /api/v1/restaurants/:id/reset-password
// ─────────────────────────────────────────────────────────────────────────────
export const resetRestaurantPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { generateTemporaryPassword } = await import('../../utils/subdomain');
    const tempPass = generateTemporaryPassword();
    const hash = await bcrypt.hash(tempPass, 12);

    await execute(
      'UPDATE restaurant_credentials SET password_hash = ?, is_temp_password = TRUE WHERE restaurant_id = ?',
      [hash, req.params.id]
    );

    await execute(
      `INSERT INTO audit_logs (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, ip_address)
       VALUES (?, 'super_admin', ?, ?, 'PASSWORD_RESET', 'restaurant', ?, 'Restaurant password reset by admin', ?)`,
      [uuidv4(), req.admin!.id, req.admin!.email, req.params.id, req.ip]
    );

    res.json({ success: true, message: 'Password reset successfully', data: { temporaryPassword: tempPass } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PLAN
// POST /api/v1/restaurants/:id/change-plan
// ─────────────────────────────────────────────────────────────────────────────
export const changePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { plan, storage_limit_mb, blog_enabled, reservation_enabled, events_enabled, affiliate_enabled, marketing_enabled } = req.body;

    const before = await queryOne('SELECT * FROM subscriptions WHERE restaurant_id = ?', [req.params.id]);
    if (!before) throw new AppError('Subscription not found', 404);

    await execute(
      `UPDATE subscriptions SET plan = ?, storage_limit_mb = COALESCE(?, storage_limit_mb),
       blog_enabled = COALESCE(?, blog_enabled), reservation_enabled = COALESCE(?, reservation_enabled),
       events_enabled = COALESCE(?, events_enabled), affiliate_enabled = COALESCE(?, affiliate_enabled),
       marketing_enabled = COALESCE(?, marketing_enabled), status = 'active'
       WHERE restaurant_id = ?`,
      [plan, storage_limit_mb, blog_enabled, reservation_enabled, events_enabled, affiliate_enabled, marketing_enabled, req.params.id]
    );

    await execute(
      `INSERT INTO audit_logs (id, actor_type, actor_id, actor_email, action, entity_type, entity_id, description, before_value, after_value, ip_address)
       VALUES (?, 'super_admin', ?, ?, 'PLAN_CHANGED', 'subscription', ?, ?, ?, ?, ?)`,
      [uuidv4(), req.admin!.id, req.admin!.email, req.params.id, `Plan changed from ${before.plan} to ${plan}`, JSON.stringify({ plan: before.plan }), JSON.stringify({ plan }), req.ip]
    );

    res.json({ success: true, message: `Plan changed to ${plan}` });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK ACTIONS
// POST /api/v1/restaurants/bulk
// ─────────────────────────────────────────────────────────────────────────────
export const bulkAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action, ids } = req.body as { action: string; ids: string[] };

    if (!ids?.length) throw new AppError('No restaurants selected', 400);

    const placeholders = ids.map(() => '?').join(',');

    if (action === 'activate') {
      await execute(`UPDATE restaurants SET status = 'active' WHERE id IN (${placeholders})`, ids);
    } else if (action === 'suspend') {
      await execute(`UPDATE restaurants SET status = 'suspended' WHERE id IN (${placeholders})`, ids);
    } else if (action === 'delete') {
      const tenantIds = await query<{ tenant_id: string }>(
        `SELECT tenant_id FROM restaurants WHERE id IN (${placeholders})`, ids
      );
      const tids = tenantIds.map((r) => r.tenant_id).filter(Boolean);
      if (tids.length) {
        await execute(`DELETE FROM tenants WHERE id IN (${tids.map(() => '?').join(',')})`, tids);
      }
    } else {
      throw new AppError('Invalid bulk action', 400);
    }

    res.json({ success: true, message: `Bulk ${action} applied to ${ids.length} restaurant(s)` });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBDOMAIN CHECK
// GET /api/v1/restaurants/subdomain/check
// ─────────────────────────────────────────────────────────────────────────────
export const checkSubdomain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slug = (req.query.slug as string || '').toLowerCase().trim();
    const validation = validateSubdomainSlug(slug);

    if (!validation.valid) {
      res.json({ success: true, data: { available: false, reason: validation.reason } });
      return;
    }

    const existing = await queryOne('SELECT id FROM subdomains WHERE slug = ?', [slug]);
    res.json({
      success: true,
      data: {
        available: !existing,
        slug,
        url: `${slug}.restos.com`,
        reason: existing ? 'This subdomain is already taken' : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
