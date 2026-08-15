'use strict';

/**
 * Schema Patch — adds missing columns/tables to align with backend code.
 * Safe to run multiple times.  node src/scripts/patch.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restos_saas',
};

// Returns existing column names for a table
async function cols(conn, table) {
  const [rows] = await conn.query('DESCRIBE ??', [table]);
  return rows.map(r => r.Field);
}

// ADD column only if it doesn't exist
async function addCol(conn, table, col, def) {
  const existing = await cols(conn, table);
  if (existing.includes(col)) { process.stdout.write('.'); return; }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
  process.stdout.write(`+${col} `);
}

// Execute statement, ignore harmless errors
async function exec(conn, sql, desc) {
  try {
    await conn.query(sql);
    console.log(`  ✅ ${desc}`);
  } catch (e) {
    if (['ER_TABLE_EXISTS_ERROR','ER_DUP_ENTRY'].includes(e.code)) {
      console.log(`  ⚡ ${desc} (already exists)`);
    } else {
      console.warn(`  ⚠️  ${desc}: ${e.message.substring(0, 80)}`);
    }
  }
}

async function patch() {
  console.log('\n🔧  Restos Schema Patch\n' + '='.repeat(40));
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log(`✅ Connected to ${DB_CONFIG.database}\n`);

  // ── restaurants ──────────────────────────────────────────
  console.log('📋 restaurants:');
  await addCol(conn, 'restaurants', 'account_status', "VARCHAR(20) NOT NULL DEFAULT 'active'");
  await addCol(conn, 'restaurants', 'logo',           'VARCHAR(500) NULL');
  await addCol(conn, 'restaurants', 'cover_image',    'VARCHAR(500) NULL');
  await addCol(conn, 'restaurants', 'plan_id',        'INT UNSIGNED NULL');
  await addCol(conn, 'restaurants', 'business_reg_no','VARCHAR(100) NULL');
  await addCol(conn, 'restaurants', 'created_by',     'VARCHAR(36) NULL');
  console.log(' done');

  // ── restaurant_credentials ───────────────────────────────
  console.log('📋 restaurant_credentials:');
  await addCol(conn, 'restaurant_credentials', 'restaurant_uid', 'VARCHAR(20) NULL');
  await addCol(conn, 'restaurant_credentials', 'temp_password',  'VARCHAR(500) NULL');
  await addCol(conn, 'restaurant_credentials', 'is_first_login', 'TINYINT(1) NOT NULL DEFAULT 1');
  await addCol(conn, 'restaurant_credentials', 'is_active',      'TINYINT(1) NOT NULL DEFAULT 1');
  await addCol(conn, 'restaurant_credentials', 'login_attempts', 'INT NOT NULL DEFAULT 0');
  console.log(' done');

  // ── subdomains ────────────────────────────────────────────
  console.log('📋 subdomains:');
  await addCol(conn, 'subdomains', 'subdomain',   'VARCHAR(63) NULL');
  await addCol(conn, 'subdomains', 'full_domain', 'VARCHAR(255) NULL');
  // Populate alias columns from existing data
  await conn.query('UPDATE subdomains SET subdomain = slug WHERE subdomain IS NULL');
  await conn.query('UPDATE subdomains SET full_domain = full_url WHERE full_domain IS NULL');
  console.log(' done');

  // ── websites ──────────────────────────────────────────────
  console.log('📋 websites:');
  await addCol(conn, 'websites', 'status', "VARCHAR(20) NOT NULL DEFAULT 'draft'");
  await conn.query("UPDATE websites SET status = CASE WHEN is_published = 1 THEN 'published' ELSE 'draft' END");
  console.log(' done');

  // ── notifications ─────────────────────────────────────────
  console.log('📋 notifications:');
  await addCol(conn, 'notifications', 'recipient_id',   'VARCHAR(36) NULL');
  await addCol(conn, 'notifications', 'recipient_type', "VARCHAR(30) NOT NULL DEFAULT 'super_admin'");
  await addCol(conn, 'notifications', 'read_at',        'DATETIME NULL');
  console.log(' done');

  // ── restaurant_addresses ─────────────────────────────────
  await exec(conn, `
    CREATE TABLE IF NOT EXISTS restaurant_addresses (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      country VARCHAR(100) DEFAULT 'India',
      state VARCHAR(100) NULL,
      city VARCHAR(100) NULL,
      area VARCHAR(100) NULL,
      zip_code VARCHAR(20) NULL,
      address TEXT NULL,
      latitude DECIMAL(10,8) NULL,
      longitude DECIMAL(11,8) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_ra_rest (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `, 'CREATE TABLE restaurant_addresses');

  // ── subscription_plans ────────────────────────────────────
  await exec(conn, `
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(50) NOT NULL,
      description TEXT NULL,
      price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      trial_days INT NOT NULL DEFAULT 14,
      storage_limit_mb INT NOT NULL DEFAULT 1024,
      website_enabled TINYINT(1) NOT NULL DEFAULT 1,
      cms_enabled TINYINT(1) NOT NULL DEFAULT 1,
      blog_enabled TINYINT(1) NOT NULL DEFAULT 0,
      reservation_enabled TINYINT(1) NOT NULL DEFAULT 0,
      event_enabled TINYINT(1) NOT NULL DEFAULT 0,
      affiliate_enabled TINYINT(1) NOT NULL DEFAULT 0,
      marketing_enabled TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_sp_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `, 'CREATE TABLE subscription_plans');

  // Seed plans
  const [planRows] = await conn.query('SELECT COUNT(*) AS cnt FROM subscription_plans');
  if (planRows[0].cnt === 0) {
    await conn.query(`
      INSERT INTO subscription_plans (name,slug,price_monthly,price_yearly,trial_days,blog_enabled,reservation_enabled,event_enabled,sort_order)
      VALUES
        ('Starter',      'starter',      999,  9990,  14, 0, 0, 0, 1),
        ('Professional', 'professional', 2499, 24990, 14, 1, 1, 1, 2),
        ('Enterprise',   'enterprise',   4999, 49990, 14, 1, 1, 1, 3)
    `);
    console.log('  ✅ Seeded 3 subscription plans');
  }

  // ── restaurant_subscriptions ──────────────────────────────
  await exec(conn, `
    CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      plan_id INT UNSIGNED NULL,
      billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
      status VARCHAR(20) NOT NULL DEFAULT 'trial',
      trial_ends_at DATETIME NULL,
      starts_at DATETIME NULL,
      expires_at DATETIME NULL,
      storage_limit_mb INT NOT NULL DEFAULT 1024,
      storage_used_mb INT NOT NULL DEFAULT 0,
      website_enabled TINYINT(1) NOT NULL DEFAULT 1,
      cms_enabled TINYINT(1) NOT NULL DEFAULT 1,
      blog_enabled TINYINT(1) NOT NULL DEFAULT 0,
      reservation_enabled TINYINT(1) NOT NULL DEFAULT 0,
      event_enabled TINYINT(1) NOT NULL DEFAULT 0,
      affiliate_enabled TINYINT(1) NOT NULL DEFAULT 0,
      marketing_enabled TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_rs_restaurant (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `, 'CREATE TABLE restaurant_subscriptions');

  // ── cms_pages ─────────────────────────────────────────────
  await exec(conn, `
    CREATE TABLE IF NOT EXISTS cms_pages (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id VARCHAR(36) NOT NULL,
      website_id INT UNSIGNED NULL,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      page_type VARCHAR(50) NOT NULL DEFAULT 'custom',
      content_json JSON NULL,
      meta_title VARCHAR(255) NULL,
      meta_description TEXT NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 0,
      is_system TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_cms_restaurant (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `, 'CREATE TABLE cms_pages');

  await conn.end();
  console.log('\n🎉 Patch complete. Start the server: npm run dev\n');
}

patch().catch(e => { console.error('❌ Patch failed:', e.message); process.exit(1); });
