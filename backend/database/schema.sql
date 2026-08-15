-- ============================================================
-- Restos SaaS Platform - MySQL Database Schema
-- Multi-Tenant Restaurant Management Platform
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- ============================================================
-- 1. SUPER ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS `super_admins` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(100) NOT NULL,
  `email`             VARCHAR(255) NOT NULL UNIQUE,
  `password_hash`     VARCHAR(255) NOT NULL,
  `role`              ENUM('super_admin','admin','support') NOT NULL DEFAULT 'admin',
  `avatar`            VARCHAR(500) DEFAULT NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at`     DATETIME DEFAULT NULL,
  `last_login_ip`     VARCHAR(45) DEFAULT NULL,
  `password_reset_token` VARCHAR(255) DEFAULT NULL,
  `password_reset_expires` DATETIME DEFAULT NULL,
  `email_verified_at` DATETIME DEFAULT NULL,
  `two_factor_secret` VARCHAR(255) DEFAULT NULL,
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(100) NOT NULL,
  `slug`              VARCHAR(100) NOT NULL UNIQUE,
  `description`       TEXT DEFAULT NULL,
  `price_monthly`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `price_yearly`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `trial_days`        INT NOT NULL DEFAULT 14,
  `storage_limit_mb`  INT NOT NULL DEFAULT 1024,
  `max_pages`         INT NOT NULL DEFAULT 10,
  `max_blog_posts`    INT NOT NULL DEFAULT 20,
  `max_events`        INT NOT NULL DEFAULT 10,
  `max_reservations`  INT NOT NULL DEFAULT 100,
  `website_enabled`   TINYINT(1) NOT NULL DEFAULT 1,
  `cms_enabled`       TINYINT(1) NOT NULL DEFAULT 1,
  `blog_enabled`      TINYINT(1) NOT NULL DEFAULT 0,
  `reservation_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `event_enabled`     TINYINT(1) NOT NULL DEFAULT 0,
  `affiliate_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `marketing_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `custom_domain`     TINYINT(1) NOT NULL DEFAULT 0,
  `priority_support`  TINYINT(1) NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order`        INT NOT NULL DEFAULT 0,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. WEBSITE TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS `website_templates` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(100) NOT NULL,
  `slug`              VARCHAR(100) NOT NULL UNIQUE,
  `description`       TEXT DEFAULT NULL,
  `thumbnail`         VARCHAR(500) DEFAULT NULL,
  `preview_url`       VARCHAR(500) DEFAULT NULL,
  `category`          ENUM('modern','classic','minimal','luxury','fast_food','cafe','fine_dining') NOT NULL DEFAULT 'modern',
  `version`           VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  `config`            JSON DEFAULT NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `is_default`        TINYINT(1) NOT NULL DEFAULT 0,
  `created_by`        INT UNSIGNED DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TENANTS (Core multi-tenant table)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`         VARCHAR(36) NOT NULL UNIQUE COMMENT 'UUID for tenant isolation',
  `restaurant_id`     INT UNSIGNED DEFAULT NULL,
  `db_name`           VARCHAR(100) DEFAULT NULL COMMENT 'Future: separate DB per tenant',
  `schema_prefix`     VARCHAR(50) NOT NULL COMMENT 'Table prefix for this tenant',
  `status`            ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_restaurant_id` (`restaurant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. RESTAURANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurants` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `restaurant_name`   VARCHAR(200) NOT NULL,
  `business_name`     VARCHAR(200) DEFAULT NULL,
  `owner_name`        VARCHAR(100) NOT NULL,
  `email`             VARCHAR(255) NOT NULL UNIQUE,
  `phone`             VARCHAR(20) NOT NULL,
  `whatsapp`          VARCHAR(20) DEFAULT NULL,
  `gst_number`        VARCHAR(50) DEFAULT NULL,
  `pan_number`        VARCHAR(50) DEFAULT NULL,
  `business_reg_no`   VARCHAR(100) DEFAULT NULL,
  `cuisine_type`      VARCHAR(200) DEFAULT NULL COMMENT 'Comma-separated cuisine types',
  `description`       TEXT DEFAULT NULL,
  `logo`              VARCHAR(500) DEFAULT NULL,
  `cover_image`       VARCHAR(500) DEFAULT NULL,
  `status`            ENUM('active','inactive','trial','expired','suspended') NOT NULL DEFAULT 'trial',
  `account_status`    ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  `plan_id`           INT UNSIGNED DEFAULT NULL,
  `created_by`        INT UNSIGNED NOT NULL COMMENT 'Super admin who created',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`),
  INDEX `idx_plan_id` (`plan_id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`tenant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. RESTAURANT ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurant_addresses` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `country`           VARCHAR(100) NOT NULL DEFAULT 'India',
  `state`             VARCHAR(100) NOT NULL,
  `city`              VARCHAR(100) NOT NULL,
  `area`              VARCHAR(200) DEFAULT NULL,
  `zip_code`          VARCHAR(20) DEFAULT NULL,
  `address`           TEXT NOT NULL,
  `latitude`          DECIMAL(10,8) DEFAULT NULL,
  `longitude`         DECIMAL(11,8) DEFAULT NULL,
  `google_maps_url`   VARCHAR(1000) DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_id` (`restaurant_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. RESTAURANT SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurant_subscriptions` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `plan_id`           INT UNSIGNED NOT NULL,
  `billing_cycle`     ENUM('monthly','yearly','trial','lifetime') NOT NULL DEFAULT 'trial',
  `status`            ENUM('active','inactive','trial','expired','cancelled') NOT NULL DEFAULT 'trial',
  `trial_ends_at`     DATETIME DEFAULT NULL,
  `starts_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`        DATETIME DEFAULT NULL,
  `storage_used_mb`   INT NOT NULL DEFAULT 0,
  `website_enabled`   TINYINT(1) NOT NULL DEFAULT 1,
  `cms_enabled`       TINYINT(1) NOT NULL DEFAULT 1,
  `blog_enabled`      TINYINT(1) NOT NULL DEFAULT 0,
  `reservation_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `event_enabled`     TINYINT(1) NOT NULL DEFAULT 0,
  `affiliate_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `marketing_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `notes`             TEXT DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_restaurant_id` (`restaurant_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. RESTAURANT CREDENTIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurant_credentials` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `restaurant_uid`    VARCHAR(20) NOT NULL UNIQUE COMMENT 'Human-readable unique ID e.g. REST-001',
  `username`          VARCHAR(100) NOT NULL UNIQUE,
  `password_hash`     VARCHAR(255) NOT NULL,
  `temp_password`     VARCHAR(100) DEFAULT NULL COMMENT 'Plaintext temp, cleared after first login',
  `is_first_login`    TINYINT(1) NOT NULL DEFAULT 1,
  `password_changed_at` DATETIME DEFAULT NULL,
  `last_login_at`     DATETIME DEFAULT NULL,
  `last_login_ip`     VARCHAR(45) DEFAULT NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `email_verified`    TINYINT(1) NOT NULL DEFAULT 0,
  `login_attempts`    INT NOT NULL DEFAULT 0,
  `locked_until`      DATETIME DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_id` (`restaurant_id`),
  INDEX `idx_username` (`username`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. SUBDOMAINS
-- ============================================================
CREATE TABLE IF NOT EXISTS `subdomains` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `subdomain`         VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g. biriyanihouse',
  `full_domain`       VARCHAR(200) NOT NULL COMMENT 'biriyanihouse.restos.com',
  `custom_domain`     VARCHAR(200) DEFAULT NULL,
  `ssl_enabled`       TINYINT(1) NOT NULL DEFAULT 0,
  `dns_verified`      TINYINT(1) NOT NULL DEFAULT 0,
  `redirect_to`       VARCHAR(200) DEFAULT NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_id` (`restaurant_id`),
  UNIQUE INDEX `idx_subdomain` (`subdomain`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. WEBSITES
-- ============================================================
CREATE TABLE IF NOT EXISTS `websites` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `template_id`       INT UNSIGNED DEFAULT NULL,
  `title`             VARCHAR(200) NOT NULL,
  `subtitle`          VARCHAR(500) DEFAULT NULL,
  `favicon`           VARCHAR(500) DEFAULT NULL,
  `primary_color`     VARCHAR(7) NOT NULL DEFAULT '#e53e3e',
  `secondary_color`   VARCHAR(7) NOT NULL DEFAULT '#1a202c',
  `font_family`       VARCHAR(100) NOT NULL DEFAULT 'Inter',
  `status`            ENUM('draft','published','unpublished') NOT NULL DEFAULT 'draft',
  `is_enabled`        TINYINT(1) NOT NULL DEFAULT 1,
  `meta_title`        VARCHAR(200) DEFAULT NULL,
  `meta_description`  VARCHAR(500) DEFAULT NULL,
  `google_analytics`  VARCHAR(100) DEFAULT NULL,
  `facebook_pixel`    VARCHAR(100) DEFAULT NULL,
  `custom_css`        TEXT DEFAULT NULL,
  `custom_js`         TEXT DEFAULT NULL,
  `published_at`      DATETIME DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_id` (`restaurant_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`template_id`) REFERENCES `website_templates`(`id`) ON SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. CMS PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS `cms_pages` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `title`             VARCHAR(200) NOT NULL,
  `slug`              VARCHAR(200) NOT NULL,
  `content`           LONGTEXT DEFAULT NULL,
  `page_type`         ENUM('home','about','menu','gallery','reservation','events','blog','contact','privacy','terms','custom') NOT NULL DEFAULT 'custom',
  `meta_title`        VARCHAR(200) DEFAULT NULL,
  `meta_description`  VARCHAR(500) DEFAULT NULL,
  `meta_keywords`     VARCHAR(500) DEFAULT NULL,
  `og_title`          VARCHAR(200) DEFAULT NULL,
  `og_description`    VARCHAR(500) DEFAULT NULL,
  `og_image`          VARCHAR(500) DEFAULT NULL,
  `canonical_url`     VARCHAR(500) DEFAULT NULL,
  `robots`            VARCHAR(100) DEFAULT 'index,follow',
  `schema_markup`     JSON DEFAULT NULL,
  `status`            ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  `is_default`        TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order`        INT NOT NULL DEFAULT 0,
  `published_at`      DATETIME DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_slug` (`restaurant_id`, `slug`),
  INDEX `idx_tenant_id` (`tenant_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. CMS SETTINGS (Structured business info)
-- ============================================================
CREATE TABLE IF NOT EXISTS `cms_settings` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `business_email`    VARCHAR(255) DEFAULT NULL,
  `business_phone`    VARCHAR(20) DEFAULT NULL,
  `business_phone2`   VARCHAR(20) DEFAULT NULL,
  `opening_hours`     JSON DEFAULT NULL,
  `social_links`      JSON DEFAULT NULL COMMENT 'facebook,instagram,twitter,youtube,etc',
  `google_maps_embed` TEXT DEFAULT NULL,
  `tagline`           VARCHAR(500) DEFAULT NULL,
  `currency`          VARCHAR(10) NOT NULL DEFAULT 'INR',
  `timezone`          VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  `reservation_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `reservation_form_fields` JSON DEFAULT NULL,
  `confirmation_message` TEXT DEFAULT NULL,
  `holiday_dates`     JSON DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_id` (`restaurant_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. MEDIA LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS `media_library` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `folder`            VARCHAR(200) NOT NULL DEFAULT 'root',
  `file_name`         VARCHAR(255) NOT NULL,
  `original_name`     VARCHAR(255) NOT NULL,
  `file_path`         VARCHAR(1000) NOT NULL,
  `file_url`          VARCHAR(1000) NOT NULL,
  `file_type`         ENUM('image','video','document','other') NOT NULL DEFAULT 'image',
  `mime_type`         VARCHAR(100) NOT NULL,
  `file_size`         INT NOT NULL DEFAULT 0 COMMENT 'Size in bytes',
  `width`             INT DEFAULT NULL,
  `height`            INT DEFAULT NULL,
  `alt_text`          VARCHAR(500) DEFAULT NULL,
  `tags`              JSON DEFAULT NULL,
  `uploaded_by`       INT UNSIGNED DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_restaurant_id` (`restaurant_id`),
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_folder` (`folder`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. BLOG POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `title`             VARCHAR(300) NOT NULL,
  `slug`              VARCHAR(300) NOT NULL,
  `excerpt`           TEXT DEFAULT NULL,
  `content`           LONGTEXT DEFAULT NULL,
  `featured_image`    VARCHAR(500) DEFAULT NULL,
  `author`            VARCHAR(100) DEFAULT NULL,
  `category`          VARCHAR(100) DEFAULT NULL,
  `tags`              JSON DEFAULT NULL,
  `status`            ENUM('draft','published','scheduled','archived') NOT NULL DEFAULT 'draft',
  `is_featured`       TINYINT(1) NOT NULL DEFAULT 0,
  `meta_title`        VARCHAR(200) DEFAULT NULL,
  `meta_description`  VARCHAR(500) DEFAULT NULL,
  `published_at`      DATETIME DEFAULT NULL,
  `scheduled_at`      DATETIME DEFAULT NULL,
  `views`             INT NOT NULL DEFAULT 0,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_slug` (`restaurant_id`, `slug`),
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `events` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `title`             VARCHAR(200) NOT NULL,
  `slug`              VARCHAR(200) NOT NULL,
  `description`       TEXT DEFAULT NULL,
  `banner`            VARCHAR(500) DEFAULT NULL,
  `event_date`        DATETIME NOT NULL,
  `event_end_date`    DATETIME DEFAULT NULL,
  `venue`             VARCHAR(300) DEFAULT NULL,
  `ticket_price`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `capacity`          INT DEFAULT NULL,
  `booking_deadline`  DATETIME DEFAULT NULL,
  `status`            ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
  `is_published`      TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_restaurant_id` (`restaurant_id`),
  INDEX `idx_tenant_id` (`tenant_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `reservations` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `customer_name`     VARCHAR(100) NOT NULL,
  `customer_email`    VARCHAR(255) DEFAULT NULL,
  `customer_phone`    VARCHAR(20) NOT NULL,
  `party_size`        INT NOT NULL DEFAULT 1,
  `reservation_date`  DATETIME NOT NULL,
  `special_requests`  TEXT DEFAULT NULL,
  `status`            ENUM('pending','confirmed','cancelled','no_show','completed') NOT NULL DEFAULT 'pending',
  `confirmation_code` VARCHAR(20) NOT NULL,
  `notes`             TEXT DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_restaurant_id` (`restaurant_id`),
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. AFFILIATE PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `affiliate_products` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `name`              VARCHAR(200) NOT NULL,
  `description`       TEXT DEFAULT NULL,
  `image`             VARCHAR(500) DEFAULT NULL,
  `affiliate_url`     VARCHAR(1000) NOT NULL,
  `commission`        DECIMAL(5,2) DEFAULT NULL,
  `category`          VARCHAR(100) DEFAULT NULL,
  `price`             DECIMAL(10,2) DEFAULT NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_restaurant_id` (`restaurant_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. MARKETING BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS `marketing_banners` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `title`             VARCHAR(200) NOT NULL,
  `type`              ENUM('homepage','sidebar','popup','promotional') NOT NULL DEFAULT 'homepage',
  `image`             VARCHAR(500) DEFAULT NULL,
  `link_url`          VARCHAR(1000) DEFAULT NULL,
  `link_text`         VARCHAR(100) DEFAULT NULL,
  `content`           TEXT DEFAULT NULL,
  `display_rules`     JSON DEFAULT NULL,
  `campaign_start`    DATETIME DEFAULT NULL,
  `campaign_end`      DATETIME DEFAULT NULL,
  `is_active`         TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order`        INT NOT NULL DEFAULT 0,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_restaurant_id` (`restaurant_id`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. NAVIGATION MENUS
-- ============================================================
CREATE TABLE IF NOT EXISTS `navigation_menus` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `restaurant_id`     INT UNSIGNED NOT NULL,
  `tenant_id`         VARCHAR(36) NOT NULL,
  `location`          ENUM('header','footer','mobile') NOT NULL DEFAULT 'header',
  `items`             JSON NOT NULL COMMENT 'Array of menu items with label, url, children',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_location` (`restaurant_id`, `location`),
  FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`           INT UNSIGNED DEFAULT NULL COMMENT 'Super admin or restaurant user',
  `user_type`         ENUM('super_admin','restaurant') NOT NULL DEFAULT 'super_admin',
  `user_email`        VARCHAR(255) DEFAULT NULL,
  `tenant_id`         VARCHAR(36) DEFAULT NULL,
  `action`            VARCHAR(100) NOT NULL COMMENT 'e.g. restaurant.created, website.published',
  `entity_type`       VARCHAR(100) DEFAULT NULL COMMENT 'e.g. restaurant, website, cms_page',
  `entity_id`         VARCHAR(50) DEFAULT NULL,
  `entity_name`       VARCHAR(200) DEFAULT NULL,
  `description`       TEXT DEFAULT NULL,
  `before_value`      JSON DEFAULT NULL,
  `after_value`       JSON DEFAULT NULL,
  `ip_address`        VARCHAR(45) DEFAULT NULL,
  `user_agent`        TEXT DEFAULT NULL,
  `browser`           VARCHAR(200) DEFAULT NULL,
  `status`            ENUM('success','failure','warning') NOT NULL DEFAULT 'success',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_entity_type` (`entity_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `recipient_id`      INT UNSIGNED NOT NULL COMMENT 'Super admin ID',
  `recipient_type`    ENUM('super_admin') NOT NULL DEFAULT 'super_admin',
  `type`              VARCHAR(100) NOT NULL COMMENT 'restaurant.created, plan.expired, etc',
  `title`             VARCHAR(200) NOT NULL,
  `message`           TEXT NOT NULL,
  `data`              JSON DEFAULT NULL,
  `is_read`           TINYINT(1) NOT NULL DEFAULT 0,
  `read_at`           DATETIME DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_recipient_id` (`recipient_id`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. PLATFORM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`               VARCHAR(100) NOT NULL UNIQUE,
  `value`             TEXT DEFAULT NULL,
  `type`              ENUM('string','number','boolean','json','secret') NOT NULL DEFAULT 'string',
  `group`             VARCHAR(100) NOT NULL DEFAULT 'general',
  `label`             VARCHAR(200) DEFAULT NULL,
  `description`       TEXT DEFAULT NULL,
  `is_public`         TINYINT(1) NOT NULL DEFAULT 0,
  `updated_by`        INT UNSIGNED DEFAULT NULL,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_key` (`key`),
  INDEX `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`           INT UNSIGNED NOT NULL,
  `user_type`         ENUM('super_admin','restaurant') NOT NULL DEFAULT 'super_admin',
  `token_hash`        VARCHAR(255) NOT NULL UNIQUE,
  `expires_at`        DATETIME NOT NULL,
  `ip_address`        VARCHAR(45) DEFAULT NULL,
  `user_agent`        TEXT DEFAULT NULL,
  `is_revoked`        TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`, `user_type`),
  INDEX `idx_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
