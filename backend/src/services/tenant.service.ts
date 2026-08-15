import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { execute, query, queryOne } from '../database/connection';
import { logger } from '../config/logger';
import {
  generateSubdomainSlug,
  buildSubdomainUrl,
  generateRestaurantLoginId,
  generateTenantCode,
  generateTemporaryPassword,
} from '../utils/subdomain';

export interface TenantProvisionInput {
  tenantId: string;
  tenantCode: string;
  seq: number;
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  subdomainSlug: string;
  websiteTitle: string;
  websiteSubtitle?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  trialDays: number;
  storageLimitMb: number;
  websiteEnabled: boolean;
  cmsEnabled: boolean;
  blogEnabled: boolean;
  reservationEnabled: boolean;
  eventsEnabled: boolean;
  affiliateEnabled: boolean;
  marketingEnabled: boolean;
}

export interface TenantProvisionResult {
  tenantId: string;
  tenantCode: string;
  subdomainSlug: string;
  websiteUrl: string;
  restaurantLoginId: string;
  username: string;
  temporaryPassword: string;
}

/**
 * DEFAULT PAGES to generate for every new restaurant website
 */
const DEFAULT_PAGES = [
  { title: 'Home', slug: '/', pageType: 'home', sortOrder: 0, isSystem: true },
  { title: 'About Us', slug: 'about', pageType: 'about', sortOrder: 1, isSystem: true },
  { title: 'Menu', slug: 'menu', pageType: 'menu', sortOrder: 2, isSystem: true },
  { title: 'Gallery', slug: 'gallery', pageType: 'gallery', sortOrder: 3, isSystem: true },
  { title: 'Reservations', slug: 'reservations', pageType: 'reservation', sortOrder: 4, isSystem: true },
  { title: 'Events', slug: 'events', pageType: 'events', sortOrder: 5, isSystem: true },
  { title: 'Blog', slug: 'blog', pageType: 'blog', sortOrder: 6, isSystem: true },
  { title: 'Contact', slug: 'contact', pageType: 'contact', sortOrder: 7, isSystem: true },
  { title: 'Privacy Policy', slug: 'privacy-policy', pageType: 'privacy', sortOrder: 8, isSystem: true },
  { title: 'Terms & Conditions', slug: 'terms', pageType: 'terms', sortOrder: 9, isSystem: true },
];

/**
 * Fully provisions a new tenant workspace:
 * tenant → subdomain → website → pages → settings → CMS → credentials → subscription
 */
export async function provisionTenant(
  input: TenantProvisionInput
): Promise<TenantProvisionResult> {
  logger.info(`[TenantService] Provisioning tenant for restaurant: ${input.restaurantName}`);

  const tenantId = input.tenantId;
  const tenantCode = input.tenantCode;
  const seq = input.seq;

  // ── 4. Create SUBDOMAIN record ───────────────────────────────────
  const fullUrl = buildSubdomainUrl(input.subdomainSlug);
  await execute(
    `INSERT INTO subdomains (id, restaurant_id, tenant_id, slug, full_url)
     VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), input.restaurantId, tenantId, input.subdomainSlug, fullUrl]
  );

  // ── 5. Get default template ──────────────────────────────────────
  const template = await queryOne(
    'SELECT id FROM templates WHERE is_default = 1 AND is_active = 1 LIMIT 1'
  );

  // ── 6. Create WEBSITE record ─────────────────────────────────────
  const websiteId = uuidv4();
  await execute(
    `INSERT INTO websites (id, restaurant_id, tenant_id, template_id, title, subtitle, is_published, is_enabled)
     VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)`,
    [websiteId, input.restaurantId, tenantId, template?.id || null, input.websiteTitle, input.websiteSubtitle || '', input.websiteEnabled]
  );

  // ── 7. Create DEFAULT PAGES ──────────────────────────────────────
  for (const page of DEFAULT_PAGES) {
    await execute(
      `INSERT INTO website_pages (id, website_id, tenant_id, title, slug, page_type, sort_order, is_system, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [uuidv4(), websiteId, tenantId, page.title, page.slug, page.pageType, page.sortOrder, page.isSystem]
    );
  }

  // ── 8. Create WEBSITE SETTINGS ───────────────────────────────────
  await execute(
    `INSERT INTO website_settings (id, website_id, tenant_id, sitemap_enabled)
     VALUES (?, ?, ?, TRUE)`,
    [uuidv4(), websiteId, tenantId]
  );

  // ── 9. Create CMS CONTENT skeleton ───────────────────────────────
  const defaultOpeningHours = {
    mon: { open: '09:00', close: '22:00', closed: false },
    tue: { open: '09:00', close: '22:00', closed: false },
    wed: { open: '09:00', close: '22:00', closed: false },
    thu: { open: '09:00', close: '22:00', closed: false },
    fri: { open: '09:00', close: '22:00', closed: false },
    sat: { open: '10:00', close: '23:00', closed: false },
    sun: { open: '10:00', close: '21:00', closed: false },
  };

  await execute(
    `INSERT INTO cms_content (id, tenant_id, restaurant_id, business_name, opening_hours, social_links, nav_links)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      tenantId,
      input.restaurantId,
      input.restaurantName,
      JSON.stringify(defaultOpeningHours),
      JSON.stringify({ facebook: '', instagram: '', twitter: '', youtube: '' }),
      JSON.stringify([
        { label: 'Home', href: '/' },
        { label: 'Menu', href: '/menu' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ]),
    ]
  );

  // ── 10. Create SUBSCRIPTION ──────────────────────────────────────
  const trialEndsAt = new Date(Date.now() + input.trialDays * 24 * 60 * 60 * 1000);
  await execute(
    `INSERT INTO subscriptions 
     (id, restaurant_id, tenant_id, plan, trial_days, trial_ends_at, storage_limit_mb,
      website_enabled, cms_enabled, blog_enabled, reservation_enabled, events_enabled,
      affiliate_enabled, marketing_enabled, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial')`,
    [
      uuidv4(),
      input.restaurantId,
      tenantId,
      input.plan,
      input.trialDays,
      trialEndsAt,
      input.storageLimitMb,
      input.websiteEnabled,
      input.cmsEnabled,
      input.blogEnabled,
      input.reservationEnabled,
      input.eventsEnabled,
      input.affiliateEnabled,
      input.marketingEnabled,
    ]
  );

  // ── 11. Generate RESTAURANT CREDENTIALS ──────────────────────────
  const restaurantLoginId = generateRestaurantLoginId(seq);
  const username = input.subdomainSlug;
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  await execute(
    `INSERT INTO restaurant_credentials 
     (id, restaurant_id, tenant_id, restaurant_login_id, username, password_hash, is_temp_password)
     VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
    [uuidv4(), input.restaurantId, tenantId, restaurantLoginId, username, passwordHash]
  );

  // ── 12. Create NOTIFICATION ──────────────────────────────────────
  await execute(
    `INSERT INTO notifications (id, type, title, message, data)
     VALUES (?, 'RESTAURANT_CREATED', ?, ?, ?)`,
    [
      uuidv4(),
      `New Restaurant Onboarded: ${input.restaurantName}`,
      `${input.restaurantName} has been successfully created with subdomain ${fullUrl}`,
      JSON.stringify({ restaurantId: input.restaurantId, subdomainSlug: input.subdomainSlug }),
    ]
  );

  logger.info(`[TenantService] ✅ Tenant provisioned: ${tenantCode} → ${fullUrl}`);

  return {
    tenantId,
    tenantCode,
    subdomainSlug: input.subdomainSlug,
    websiteUrl: `https://${fullUrl}`,
    restaurantLoginId,
    username,
    temporaryPassword,
  };
}
