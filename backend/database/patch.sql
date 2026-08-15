-- ============================================================
-- Schema Patch: align DB with backend code expectations
-- Run: node src/scripts/patch.js
-- ============================================================

-- 1. restaurants: add missing columns
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER status,
  ADD COLUMN IF NOT EXISTS logo VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS plan_id INT UNSIGNED NULL,
  ADD COLUMN IF NOT EXISTS business_reg_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL;

-- 2. restaurant_credentials: add missing columns
ALTER TABLE restaurant_credentials
  ADD COLUMN IF NOT EXISTS restaurant_uid VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS temp_password VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS is_first_login TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS login_attempts INT NOT NULL DEFAULT 0;

-- 3. subdomains: add code-friendly aliases
ALTER TABLE subdomains
  ADD COLUMN IF NOT EXISTS subdomain VARCHAR(63) NULL,
  ADD COLUMN IF NOT EXISTS full_domain VARCHAR(255) NULL;

-- Populate new alias columns from existing data
UPDATE subdomains SET subdomain = slug WHERE subdomain IS NULL;
UPDATE subdomains SET full_domain = full_url WHERE full_domain IS NULL;

-- 4. websites: add status column (maps to is_published)
ALTER TABLE websites
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft';

-- Sync status from is_published
UPDATE websites SET status = CASE WHEN is_published = 1 THEN 'published' ELSE 'draft' END;

-- 5. notifications: add targeting columns
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(30) NOT NULL DEFAULT 'super_admin',
  ADD COLUMN IF NOT EXISTS read_at DATETIME NULL;

-- 6. Create restaurant_addresses table (referenced in service code)
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
  KEY idx_restaurant_id (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  trial_days INT NOT NULL DEFAULT 14,
  max_pages INT NOT NULL DEFAULT 10,
  max_products INT NOT NULL DEFAULT 50,
  max_media_mb INT NOT NULL DEFAULT 500,
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
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed plans if empty
INSERT IGNORE INTO subscription_plans
  (name, slug, price_monthly, price_yearly, trial_days, blog_enabled, reservation_enabled, event_enabled, sort_order)
VALUES
  ('Starter',      'starter',      999,  9990,  14, 0, 0, 0, 1),
  ('Professional', 'professional', 2499, 24990, 14, 1, 1, 1, 2),
  ('Enterprise',   'enterprise',   4999, 49990, 14, 1, 1, 1, 3);

-- 8. Create restaurant_subscriptions table (alias of subscriptions)
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
  KEY idx_restaurant_id (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Add 'seated' to reservations status ENUM
ALTER TABLE reservations
  MODIFY COLUMN status ENUM('pending','confirmed','seated','completed','cancelled','no_show') NOT NULL DEFAULT 'pending';

-- 11. Add cover_image to events (alias for banner, some code uses cover_image)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500) NULL AFTER banner;

-- 9. Create cms_pages table (code expects this; website_pages already exists but code uses cms_pages)
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
  KEY idx_restaurant_id (restaurant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
