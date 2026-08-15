-- ============================================================
-- RESTOS MULTI-TENANT RESTAURANT SAAS — DATABASE SCHEMA
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS restos_saas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restos_saas;

-- ============================================================
-- 1. SUPER ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS super_admins (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('super_admin','admin') NOT NULL DEFAULT 'super_admin',
  avatar        VARCHAR(500)  NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ============================================================
-- 2. REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  admin_id      CHAR(36)      NOT NULL,
  token_hash    VARCHAR(255)  NOT NULL UNIQUE,
  expires_at    DATETIME      NOT NULL,
  ip_address    VARCHAR(45)   NULL,
  user_agent    TEXT          NULL,
  revoked       BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (admin_id) REFERENCES super_admins(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_admin_tokens (admin_id)
) ENGINE=InnoDB;

-- ============================================================
-- 3. TENANTS (isolation anchor)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_code   VARCHAR(50)   NOT NULL UNIQUE COMMENT 'Short code like RST-0001',
  status        ENUM('active','inactive','suspended','trial','expired') NOT NULL DEFAULT 'trial',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tenant_code (tenant_code)
) ENGINE=InnoDB;

-- ============================================================
-- 4. RESTAURANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id                      CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id               CHAR(36)      NOT NULL UNIQUE,
  restaurant_name         VARCHAR(200)  NOT NULL,
  business_name           VARCHAR(200)  NOT NULL,
  owner_name              VARCHAR(100)  NOT NULL,
  email                   VARCHAR(255)  NOT NULL UNIQUE,
  phone                   VARCHAR(30)   NOT NULL,
  whatsapp                VARCHAR(30)   NULL,
  gst_number              VARCHAR(50)   NULL,
  pan_number              VARCHAR(50)   NULL,
  business_reg_number     VARCHAR(100)  NULL,
  cuisine_type            VARCHAR(200)  NULL,
  description             TEXT          NULL,
  logo_url                VARCHAR(500)  NULL,
  cover_image_url         VARCHAR(500)  NULL,
  -- Address
  country                 VARCHAR(100)  NOT NULL DEFAULT 'India',
  state                   VARCHAR(100)  NULL,
  city                    VARCHAR(100)  NULL,
  area                    VARCHAR(100)  NULL,
  zip_code                VARCHAR(20)   NULL,
  full_address            TEXT          NULL,
  latitude                DECIMAL(10,8) NULL,
  longitude               DECIMAL(11,8) NULL,
  -- Status
  status                  ENUM('active','inactive','trial','suspended','expired') NOT NULL DEFAULT 'trial',
  created_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_restaurant_email (email),
  INDEX idx_restaurant_status (status),
  INDEX idx_restaurant_city (city),
  INDEX idx_restaurant_country (country),
  FULLTEXT idx_restaurant_search (restaurant_name, owner_name, email, city)
) ENGINE=InnoDB;

-- ============================================================
-- 5. RESTAURANT CREDENTIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_credentials (
  id                    CHAR(36)      NOT NULL DEFAULT (UUID()),
  restaurant_id         CHAR(36)      NOT NULL UNIQUE,
  tenant_id             CHAR(36)      NOT NULL,
  restaurant_login_id   VARCHAR(50)   NOT NULL UNIQUE COMMENT 'e.g. RST-0001',
  username              VARCHAR(100)  NOT NULL UNIQUE,
  password_hash         VARCHAR(255)  NOT NULL,
  is_temp_password      BOOLEAN       NOT NULL DEFAULT TRUE,
  email_verified        BOOLEAN       NOT NULL DEFAULT FALSE,
  setup_completed       BOOLEAN       NOT NULL DEFAULT FALSE,
  last_login_at         DATETIME      NULL,
  password_reset_token  VARCHAR(255)  NULL,
  password_reset_expiry DATETIME      NULL,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_credentials_username (username),
  INDEX idx_credentials_login_id (restaurant_login_id)
) ENGINE=InnoDB;

-- ============================================================
-- 6. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  restaurant_id   CHAR(36)      NOT NULL,
  tenant_id       CHAR(36)      NOT NULL,
  plan            ENUM('starter','professional','enterprise') NOT NULL DEFAULT 'starter',
  trial_days      INT           NOT NULL DEFAULT 14,
  trial_ends_at   DATETIME      NULL,
  starts_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME      NULL,
  storage_limit_mb INT          NOT NULL DEFAULT 500,
  website_enabled BOOLEAN       NOT NULL DEFAULT TRUE,
  cms_enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
  blog_enabled    BOOLEAN       NOT NULL DEFAULT FALSE,
  reservation_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  events_enabled  BOOLEAN       NOT NULL DEFAULT FALSE,
  affiliate_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  status          ENUM('active','trial','expired','cancelled') NOT NULL DEFAULT 'trial',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_subscription_restaurant (restaurant_id),
  INDEX idx_subscription_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 7. SUBDOMAINS
-- ============================================================
CREATE TABLE IF NOT EXISTS subdomains (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  restaurant_id   CHAR(36)      NOT NULL UNIQUE,
  tenant_id       CHAR(36)      NOT NULL UNIQUE,
  slug            VARCHAR(100)  NOT NULL UNIQUE COMMENT 'e.g. biriyanihouse',
  full_url        VARCHAR(500)  NOT NULL COMMENT 'e.g. biriyanihouse.restos.com',
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  ssl_enabled     BOOLEAN       NOT NULL DEFAULT FALSE,
  custom_domain   VARCHAR(255)  NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_subdomain_slug (slug)
) ENGINE=InnoDB;

-- ============================================================
-- 8. WEBSITE TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id          CHAR(36)      NOT NULL DEFAULT (UUID()),
  name        VARCHAR(100)  NOT NULL,
  slug        VARCHAR(100)  NOT NULL UNIQUE,
  description TEXT          NULL,
  thumbnail   VARCHAR(500)  NULL,
  preview_url VARCHAR(500)  NULL,
  category    VARCHAR(100)  NOT NULL DEFAULT 'general',
  version     VARCHAR(20)   NOT NULL DEFAULT '1.0.0',
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  is_default  BOOLEAN       NOT NULL DEFAULT FALSE,
  config_json JSON          NULL COMMENT 'Template configuration and color schemes',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_template_slug (slug)
) ENGINE=InnoDB;

-- ============================================================
-- 9. WEBSITES
-- ============================================================
CREATE TABLE IF NOT EXISTS websites (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  restaurant_id   CHAR(36)      NOT NULL UNIQUE,
  tenant_id       CHAR(36)      NOT NULL UNIQUE,
  template_id     CHAR(36)      NULL,
  title           VARCHAR(200)  NOT NULL,
  subtitle        VARCHAR(300)  NULL,
  is_published    BOOLEAN       NOT NULL DEFAULT FALSE,
  is_enabled      BOOLEAN       NOT NULL DEFAULT TRUE,
  primary_color   VARCHAR(20)   NOT NULL DEFAULT '#6366f1',
  secondary_color VARCHAR(20)   NOT NULL DEFAULT '#8b5cf6',
  font_family     VARCHAR(100)  NOT NULL DEFAULT 'Inter',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
  INDEX idx_website_restaurant (restaurant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 10. WEBSITE PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS website_pages (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  website_id      CHAR(36)      NOT NULL,
  tenant_id       CHAR(36)      NOT NULL,
  title           VARCHAR(200)  NOT NULL,
  slug            VARCHAR(200)  NOT NULL,
  page_type       ENUM('home','about','menu','gallery','reservation','events','blog','contact','privacy','terms','custom') NOT NULL DEFAULT 'custom',
  is_published    BOOLEAN       NOT NULL DEFAULT FALSE,
  is_system       BOOLEAN       NOT NULL DEFAULT FALSE COMMENT 'System pages cannot be deleted',
  sort_order      INT           NOT NULL DEFAULT 0,
  meta_title      VARCHAR(200)  NULL,
  meta_description VARCHAR(500) NULL,
  content_json    JSON          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  UNIQUE KEY uk_page_slug (website_id, slug),
  INDEX idx_page_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. WEBSITE SETTINGS (SEO + Config per website)
-- ============================================================
CREATE TABLE IF NOT EXISTS website_settings (
  id                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  website_id          CHAR(36)      NOT NULL UNIQUE,
  tenant_id           CHAR(36)      NOT NULL UNIQUE,
  favicon_url         VARCHAR(500)  NULL,
  og_image_url        VARCHAR(500)  NULL,
  google_analytics_id VARCHAR(100)  NULL,
  facebook_pixel_id   VARCHAR(100)  NULL,
  schema_markup       JSON          NULL,
  custom_css          TEXT          NULL,
  custom_js           TEXT          NULL,
  robots_txt          TEXT          NULL,
  sitemap_enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
  maintenance_mode    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 12. CMS CONTENT (structured data per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_content (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id       CHAR(36)      NOT NULL UNIQUE,
  restaurant_id   CHAR(36)      NOT NULL UNIQUE,
  -- Structured info
  business_name   VARCHAR(200)  NULL,
  tagline         VARCHAR(300)  NULL,
  description     TEXT          NULL,
  phone           VARCHAR(30)   NULL,
  email           VARCHAR(255)  NULL,
  address         TEXT          NULL,
  google_maps_url TEXT          NULL,
  -- Opening hours JSON: { mon: { open: "09:00", close: "22:00", closed: false }, ... }
  opening_hours   JSON          NULL,
  -- Social links JSON: { facebook: "...", instagram: "...", twitter: "..." }
  social_links    JSON          NULL,
  -- Navigation JSON
  nav_links       JSON          NULL,
  -- Footer JSON
  footer_config   JSON          NULL,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_cms_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 13. MEDIA LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS media_library (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id       CHAR(36)      NOT NULL,
  restaurant_id   CHAR(36)      NOT NULL,
  file_name       VARCHAR(255)  NOT NULL,
  original_name   VARCHAR(255)  NOT NULL,
  file_path       VARCHAR(500)  NOT NULL,
  file_url        VARCHAR(500)  NOT NULL,
  mime_type       VARCHAR(100)  NOT NULL,
  file_size       BIGINT        NOT NULL DEFAULT 0,
  folder          VARCHAR(200)  NOT NULL DEFAULT '/',
  tags            JSON          NULL,
  alt_text        VARCHAR(300)  NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_media_tenant (tenant_id),
  INDEX idx_media_folder (tenant_id, folder)
) ENGINE=InnoDB;

-- ============================================================
-- 14. BLOG CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id     CHAR(36)      NOT NULL,
  restaurant_id CHAR(36)      NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  slug          VARCHAR(100)  NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_blog_cat_slug (tenant_id, slug),
  INDEX idx_blog_cat_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 15. BLOG POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id           CHAR(36)      NOT NULL,
  restaurant_id       CHAR(36)      NOT NULL,
  category_id         CHAR(36)      NULL,
  title               VARCHAR(300)  NOT NULL,
  slug                VARCHAR(300)  NOT NULL,
  excerpt             TEXT          NULL,
  content             LONGTEXT      NULL,
  featured_image_url  VARCHAR(500)  NULL,
  author_name         VARCHAR(100)  NOT NULL DEFAULT 'Admin',
  tags                JSON          NULL,
  status              ENUM('draft','published','scheduled') NOT NULL DEFAULT 'draft',
  published_at        DATETIME      NULL,
  scheduled_at        DATETIME      NULL,
  meta_title          VARCHAR(200)  NULL,
  meta_description    VARCHAR(500)  NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  UNIQUE KEY uk_blog_slug (tenant_id, slug),
  INDEX idx_blog_tenant (tenant_id),
  INDEX idx_blog_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 16. RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id       CHAR(36)      NOT NULL,
  restaurant_id   CHAR(36)      NOT NULL,
  guest_name      VARCHAR(100)  NOT NULL,
  guest_email     VARCHAR(255)  NULL,
  guest_phone     VARCHAR(30)   NOT NULL,
  party_size      INT           NOT NULL DEFAULT 1,
  reservation_date DATE         NOT NULL,
  reservation_time TIME         NOT NULL,
  special_requests TEXT         NULL,
  status          ENUM('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
  confirmation_code VARCHAR(20) NOT NULL,
  notes           TEXT          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_reservation_tenant (tenant_id),
  INDEX idx_reservation_date (reservation_date),
  INDEX idx_reservation_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 17. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id                CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id         CHAR(36)      NOT NULL,
  restaurant_id     CHAR(36)      NOT NULL,
  title             VARCHAR(200)  NOT NULL,
  description       TEXT          NULL,
  banner_url        VARCHAR(500)  NULL,
  event_date        DATE          NOT NULL,
  event_time        TIME          NULL,
  ticket_price      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  capacity          INT           NULL,
  booking_deadline  DATE          NULL,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_event_tenant (tenant_id),
  INDEX idx_event_date (event_date)
) ENGINE=InnoDB;

-- ============================================================
-- 18. AFFILIATE PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_products (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id       CHAR(36)      NOT NULL,
  restaurant_id   CHAR(36)      NOT NULL,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT          NULL,
  affiliate_url   VARCHAR(500)  NOT NULL,
  commission_pct  DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  category        VARCHAR(100)  NULL,
  image_url       VARCHAR(500)  NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_affiliate_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 19. MARKETING BANNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS marketing_banners (
  id                CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id         CHAR(36)      NOT NULL,
  restaurant_id     CHAR(36)      NOT NULL,
  title             VARCHAR(200)  NOT NULL,
  banner_type       ENUM('homepage','sidebar','popup','promotional') NOT NULL DEFAULT 'homepage',
  image_url         VARCHAR(500)  NULL,
  link_url          VARCHAR(500)  NULL,
  campaign_start    DATETIME      NULL,
  campaign_end      DATETIME      NULL,
  display_rules     JSON          NULL,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order        INT           NOT NULL DEFAULT 0,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_banner_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 20. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  actor_type    ENUM('super_admin','restaurant') NOT NULL DEFAULT 'super_admin',
  actor_id      CHAR(36)      NOT NULL,
  actor_email   VARCHAR(255)  NOT NULL,
  action        VARCHAR(100)  NOT NULL COMMENT 'e.g. RESTAURANT_CREATED, PLAN_CHANGED',
  entity_type   VARCHAR(100)  NOT NULL COMMENT 'e.g. restaurant, subscription',
  entity_id     CHAR(36)      NULL,
  description   TEXT          NULL,
  before_value  JSON          NULL,
  after_value   JSON          NULL,
  ip_address    VARCHAR(45)   NULL,
  user_agent    TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_actor (actor_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 21. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  type          VARCHAR(100)  NOT NULL COMMENT 'e.g. RESTAURANT_CREATED',
  title         VARCHAR(200)  NOT NULL,
  message       TEXT          NOT NULL,
  data          JSON          NULL,
  is_read       BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notification_read (is_read),
  INDEX idx_notification_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 22. PLATFORM SETTINGS (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id              INT           NOT NULL DEFAULT 1,
  platform_name   VARCHAR(200)  NOT NULL DEFAULT 'Restos',
  platform_domain VARCHAR(255)  NOT NULL DEFAULT 'restos.com',
  logo_url        VARCHAR(500)  NULL,
  favicon_url     VARCHAR(500)  NULL,
  timezone        VARCHAR(100)  NOT NULL DEFAULT 'Asia/Kolkata',
  currency        VARCHAR(10)   NOT NULL DEFAULT 'INR',
  currency_symbol VARCHAR(10)   NOT NULL DEFAULT '₹',
  date_format     VARCHAR(50)   NOT NULL DEFAULT 'DD/MM/YYYY',
  language        VARCHAR(20)   NOT NULL DEFAULT 'en',
  maintenance_mode BOOLEAN      NOT NULL DEFAULT FALSE,
  smtp_host       VARCHAR(255)  NULL,
  smtp_port       INT           NULL,
  smtp_user       VARCHAR(255)  NULL,
  smtp_pass       VARCHAR(255)  NULL,
  smtp_from       VARCHAR(255)  NULL,
  smtp_secure     BOOLEAN       NOT NULL DEFAULT FALSE,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_singleton CHECK (id = 1)
) ENGINE=InnoDB;

-- Initialize platform settings row
INSERT IGNORE INTO platform_settings (id) VALUES (1);

-- ============================================================
-- 23. MENU CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id     CHAR(36)      NOT NULL,
  restaurant_id CHAR(36)      NOT NULL,
  name          VARCHAR(150)  NOT NULL,
  description   TEXT          NULL,
  sort_order    INT           NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_menu_cat_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 24. MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id                CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id         CHAR(36)      NOT NULL,
  restaurant_id     CHAR(36)      NOT NULL,
  category_id       CHAR(36)      NOT NULL,
  name              VARCHAR(200)  NOT NULL,
  description       TEXT          NULL,
  base_price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency          VARCHAR(10)   NOT NULL DEFAULT 'INR',
  image_url         VARCHAR(500)  NULL,
  is_veg            BOOLEAN       NOT NULL DEFAULT TRUE,
  spiciness_level   INT           NOT NULL DEFAULT 0,
  allergens         JSON          NULL,
  nutritional_info  JSON          NULL,
  is_available      BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order        INT           NOT NULL DEFAULT 0,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
  INDEX idx_menu_item_tenant (tenant_id),
  INDEX idx_menu_item_category (category_id)
) ENGINE=InnoDB;

-- ============================================================
-- 25. MENU VARIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_variants (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  menu_item_id    CHAR(36)      NOT NULL,
  name            VARCHAR(100)  NOT NULL COMMENT 'e.g. Small, Medium, Large',
  price           DECIMAL(10,2) NOT NULL,
  is_available    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 26. MENU ADD-ONS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_addons (
  id            CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id     CHAR(36)      NOT NULL,
  restaurant_id CHAR(36)      NOT NULL,
  name          VARCHAR(150)  NOT NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_available  BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_addon_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 27. MENU ITEM ADD-ONS (Mapping)
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_item_addons (
  menu_item_id  CHAR(36)      NOT NULL,
  addon_id      CHAR(36)      NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (menu_item_id, addon_id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  FOREIGN KEY (addon_id) REFERENCES menu_addons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 28. INVENTORY SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_suppliers (
  id              CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id       CHAR(36)      NOT NULL,
  restaurant_id   CHAR(36)      NOT NULL,
  name            VARCHAR(200)  NOT NULL,
  contact_person  VARCHAR(100)  NULL,
  email           VARCHAR(255)  NULL,
  phone           VARCHAR(50)   NULL,
  address         TEXT          NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_supplier_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 29. INVENTORY INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_ingredients (
  id                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id           CHAR(36)      NOT NULL,
  restaurant_id       CHAR(36)      NOT NULL,
  supplier_id         CHAR(36)      NULL,
  name                VARCHAR(200)  NOT NULL,
  sku                 VARCHAR(100)  NULL,
  unit_of_measure     VARCHAR(20)   NOT NULL COMMENT 'kg, g, L, ml, pcs',
  cost_per_unit       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  current_stock       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  low_stock_threshold DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES inventory_suppliers(id) ON DELETE SET NULL,
  INDEX idx_ingredient_tenant (tenant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 30. INVENTORY TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id                CHAR(36)      NOT NULL DEFAULT (UUID()),
  tenant_id         CHAR(36)      NOT NULL,
  restaurant_id     CHAR(36)      NOT NULL,
  ingredient_id     CHAR(36)      NOT NULL,
  transaction_type  ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity          DECIMAL(10,2) NOT NULL,
  unit_cost         DECIMAL(10,2) NULL,
  total_cost        DECIMAL(10,2) NULL,
  reference_number  VARCHAR(100)  NULL,
  notes             TEXT          NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES inventory_ingredients(id) ON DELETE CASCADE,
  INDEX idx_transaction_tenant (tenant_id)
) ENGINE=InnoDB;
