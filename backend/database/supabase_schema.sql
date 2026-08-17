-- ============================================================
-- Restos SaaS Platform — Supabase / PostgreSQL Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================

-- Auto-update updated_at trigger function (shared by all tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper macro: create the trigger on a table
-- Usage: SELECT create_updated_at_trigger('table_name');
CREATE OR REPLACE FUNCTION create_updated_at_trigger(tbl TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format(
    'CREATE TRIGGER trg_%s_updated_at
     BEFORE UPDATE ON %I
     FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
    tbl, tbl
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. SUPER ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS super_admins (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,
  role                  VARCHAR(20)  NOT NULL DEFAULT 'admin',
  avatar                VARCHAR(500),
  is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at         TIMESTAMPTZ,
  last_login_ip         VARCHAR(45),
  password_reset_token  VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  email_verified_at     TIMESTAMPTZ,
  two_factor_secret     VARCHAR(255),
  two_factor_enabled    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('super_admins');

-- ============================================================
-- 2. SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(100) NOT NULL,
  slug                  VARCHAR(100) NOT NULL UNIQUE,
  description           TEXT,
  price_monthly         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_yearly          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  trial_days            INT          NOT NULL DEFAULT 14,
  storage_limit_mb      INT          NOT NULL DEFAULT 1024,
  max_pages             INT          NOT NULL DEFAULT 10,
  max_blog_posts        INT          NOT NULL DEFAULT 20,
  max_events            INT          NOT NULL DEFAULT 10,
  max_reservations      INT          NOT NULL DEFAULT 100,
  website_enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
  cms_enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
  blog_enabled          BOOLEAN      NOT NULL DEFAULT FALSE,
  reservation_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
  event_enabled         BOOLEAN      NOT NULL DEFAULT FALSE,
  affiliate_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
  marketing_enabled     BOOLEAN      NOT NULL DEFAULT FALSE,
  custom_domain         BOOLEAN      NOT NULL DEFAULT FALSE,
  priority_support      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order            INT          NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('subscription_plans');

-- ============================================================
-- 3. WEBSITE TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS website_templates (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  description   TEXT,
  thumbnail     VARCHAR(500),
  preview_url   VARCHAR(500),
  category      VARCHAR(50)  NOT NULL DEFAULT 'modern',
  version       VARCHAR(20)  NOT NULL DEFAULT '1.0.0',
  config        JSONB,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by    INT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('website_templates');

-- ============================================================
-- 4. TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id            SERIAL PRIMARY KEY,
  tenant_id     VARCHAR(36)  NOT NULL UNIQUE,
  restaurant_id INT,
  db_name       VARCHAR(100),
  schema_prefix VARCHAR(50)  NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('tenants');
CREATE INDEX IF NOT EXISTS idx_tenants_restaurant_id ON tenants(restaurant_id);

-- ============================================================
-- 5. RESTAURANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurants (
  id                SERIAL PRIMARY KEY,
  tenant_id         VARCHAR(36)  NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  restaurant_name   VARCHAR(200) NOT NULL,
  business_name     VARCHAR(200),
  owner_name        VARCHAR(100) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  phone             VARCHAR(20)  NOT NULL,
  whatsapp          VARCHAR(20),
  gst_number        VARCHAR(50),
  pan_number        VARCHAR(50),
  business_reg_no   VARCHAR(100),
  cuisine_type      VARCHAR(200),
  description       TEXT,
  logo              VARCHAR(500),
  cover_image       VARCHAR(500),
  status            VARCHAR(20)  NOT NULL DEFAULT 'trial',
  account_status    VARCHAR(20)  NOT NULL DEFAULT 'active',
  plan_id           INT,
  has_store         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by        INT          NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('restaurants');
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id    ON restaurants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_email        ON restaurants(email);
CREATE INDEX IF NOT EXISTS idx_restaurants_status       ON restaurants(status);

-- ============================================================
-- 6. RESTAURANT ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_addresses (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INT          NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id       VARCHAR(36)  NOT NULL,
  country         VARCHAR(100) NOT NULL DEFAULT 'India',
  state           VARCHAR(100) NOT NULL DEFAULT '',
  city            VARCHAR(100) NOT NULL DEFAULT '',
  area            VARCHAR(200),
  zip_code        VARCHAR(20),
  address         TEXT         NOT NULL,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  google_maps_url VARCHAR(1000),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('restaurant_addresses');

-- ============================================================
-- 7. RESTAURANT SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
  id                  SERIAL PRIMARY KEY,
  restaurant_id       INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id           VARCHAR(36)  NOT NULL,
  plan_id             INT          NOT NULL,
  billing_cycle       VARCHAR(20)  NOT NULL DEFAULT 'trial',
  status              VARCHAR(20)  NOT NULL DEFAULT 'trial',
  trial_ends_at       TIMESTAMPTZ,
  starts_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  storage_used_mb     INT          NOT NULL DEFAULT 0,
  website_enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
  cms_enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
  blog_enabled        BOOLEAN      NOT NULL DEFAULT FALSE,
  reservation_enabled BOOLEAN      NOT NULL DEFAULT FALSE,
  event_enabled       BOOLEAN      NOT NULL DEFAULT FALSE,
  affiliate_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
  marketing_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('restaurant_subscriptions');
CREATE INDEX IF NOT EXISTS idx_rsub_restaurant_id ON restaurant_subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_rsub_status        ON restaurant_subscriptions(status);

-- ============================================================
-- 8. RESTAURANT CREDENTIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_credentials (
  id                  SERIAL PRIMARY KEY,
  restaurant_id       INT          NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id           VARCHAR(36)  NOT NULL,
  restaurant_uid      VARCHAR(20)  NOT NULL UNIQUE,
  username            VARCHAR(100) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  temp_password       VARCHAR(100),
  is_first_login      BOOLEAN      NOT NULL DEFAULT TRUE,
  password_changed_at TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  last_login_ip       VARCHAR(45),
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  login_attempts      INT          NOT NULL DEFAULT 0,
  locked_until        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('restaurant_credentials');

-- ============================================================
-- 9. STORE CREDENTIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS store_credentials (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INT          NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id       VARCHAR(36)  NOT NULL,
  username        VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  temp_password   VARCHAR(100),
  is_active       BOOLEAN      DEFAULT TRUE,
  is_first_login  BOOLEAN      DEFAULT TRUE,
  login_attempts  INT          DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_login_at   TIMESTAMPTZ,
  last_login_ip   VARCHAR(45),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);
SELECT create_updated_at_trigger('store_credentials');
CREATE INDEX IF NOT EXISTS idx_store_cred_restaurant ON store_credentials(restaurant_id);

-- ============================================================
-- 10. SUBDOMAINS
-- ============================================================
CREATE TABLE IF NOT EXISTS subdomains (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  subdomain     VARCHAR(100) NOT NULL UNIQUE,
  full_domain   VARCHAR(200) NOT NULL,
  custom_domain VARCHAR(200),
  ssl_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
  dns_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
  redirect_to   VARCHAR(200),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('subdomains');

-- ============================================================
-- 11. WEBSITES
-- ============================================================
CREATE TABLE IF NOT EXISTS websites (
  id                SERIAL PRIMARY KEY,
  restaurant_id     INT          NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id         VARCHAR(36)  NOT NULL,
  template_id       INT          REFERENCES website_templates(id) ON DELETE SET NULL,
  template_slug     VARCHAR(100) DEFAULT 'bloom',
  title             VARCHAR(200) NOT NULL,
  subtitle          VARCHAR(500),
  favicon           VARCHAR(500),
  primary_color     VARCHAR(7)   NOT NULL DEFAULT '#e53e3e',
  secondary_color   VARCHAR(7)   NOT NULL DEFAULT '#1a202c',
  font_family       VARCHAR(100) NOT NULL DEFAULT 'Inter',
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft',
  is_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
  meta_title        VARCHAR(200),
  meta_description  VARCHAR(500),
  google_analytics  VARCHAR(100),
  facebook_pixel    VARCHAR(100),
  custom_css        TEXT,
  custom_js         TEXT,
  about_content     TEXT,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('websites');

-- ============================================================
-- 12. CMS PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_pages (
  id                SERIAL PRIMARY KEY,
  restaurant_id     INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id         VARCHAR(36)  NOT NULL,
  title             VARCHAR(200) NOT NULL,
  slug              VARCHAR(200) NOT NULL,
  content           TEXT,
  page_type         VARCHAR(50)  NOT NULL DEFAULT 'custom',
  meta_title        VARCHAR(200),
  meta_description  VARCHAR(500),
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft',
  is_default        BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order        INT          NOT NULL DEFAULT 0,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, slug)
);
SELECT create_updated_at_trigger('cms_pages');
CREATE INDEX IF NOT EXISTS idx_cms_pages_restaurant ON cms_pages(restaurant_id);

-- ============================================================
-- 13. CMS SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_settings (
  id                        SERIAL PRIMARY KEY,
  restaurant_id             INT          NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id                 VARCHAR(36)  NOT NULL,
  business_email            VARCHAR(255),
  business_phone            VARCHAR(20),
  business_phone2           VARCHAR(20),
  opening_hours             JSONB,
  social_links              JSONB,
  google_maps_embed         TEXT,
  tagline                   VARCHAR(500),
  currency                  VARCHAR(10)  NOT NULL DEFAULT 'INR',
  timezone                  VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  reservation_enabled       BOOLEAN      NOT NULL DEFAULT FALSE,
  reservation_form_fields   JSONB,
  confirmation_message      TEXT,
  holiday_dates             JSONB,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('cms_settings');

-- ============================================================
-- 14. NAVIGATION MENUS
-- ============================================================
CREATE TABLE IF NOT EXISTS navigation_menus (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  location      VARCHAR(20)  NOT NULL DEFAULT 'header',
  items         JSONB        NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, location)
);
SELECT create_updated_at_trigger('navigation_menus');

-- ============================================================
-- 15. MEDIA LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS media_library (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  folder        VARCHAR(200) NOT NULL DEFAULT 'root',
  file_name     VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path     VARCHAR(1000) NOT NULL,
  file_url      VARCHAR(1000) NOT NULL,
  file_type     VARCHAR(20)  NOT NULL DEFAULT 'image',
  mime_type     VARCHAR(100) NOT NULL,
  file_size     INT          NOT NULL DEFAULT 0,
  width         INT,
  height        INT,
  alt_text      VARCHAR(500),
  tags          JSONB,
  uploaded_by   INT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('media_library');
CREATE INDEX IF NOT EXISTS idx_media_restaurant ON media_library(restaurant_id);

-- ============================================================
-- 16. BLOG POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id                SERIAL PRIMARY KEY,
  restaurant_id     INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id         VARCHAR(36)  NOT NULL,
  title             VARCHAR(300) NOT NULL,
  slug              VARCHAR(300) NOT NULL,
  excerpt           TEXT,
  content           TEXT,
  featured_image    VARCHAR(500),
  author            VARCHAR(100),
  category          VARCHAR(100),
  tags              JSONB,
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft',
  is_featured       BOOLEAN      NOT NULL DEFAULT FALSE,
  meta_title        VARCHAR(200),
  meta_description  VARCHAR(500),
  published_at      TIMESTAMPTZ,
  scheduled_at      TIMESTAMPTZ,
  views             INT          NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, slug)
);
SELECT create_updated_at_trigger('blog_posts');
CREATE INDEX IF NOT EXISTS idx_blog_posts_restaurant ON blog_posts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status     ON blog_posts(status);

-- ============================================================
-- 17. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id                SERIAL PRIMARY KEY,
  restaurant_id     INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id         VARCHAR(36)  NOT NULL,
  title             VARCHAR(200) NOT NULL,
  slug              VARCHAR(200) NOT NULL,
  description       TEXT,
  banner            VARCHAR(500),
  cover_image       VARCHAR(500),
  event_date        TIMESTAMPTZ  NOT NULL,
  event_end_date    TIMESTAMPTZ,
  venue             VARCHAR(300),
  ticket_price      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  capacity          INT,
  booking_deadline  TIMESTAMPTZ,
  status            VARCHAR(20)  NOT NULL DEFAULT 'upcoming',
  is_published      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('events');
CREATE INDEX IF NOT EXISTS idx_events_restaurant ON events(restaurant_id);

-- ============================================================
-- 18. RESERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id                SERIAL PRIMARY KEY,
  restaurant_id     INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id         VARCHAR(36)  NOT NULL,
  customer_name     VARCHAR(100) NOT NULL,
  customer_email    VARCHAR(255),
  customer_phone    VARCHAR(20)  NOT NULL,
  party_size        INT          NOT NULL DEFAULT 1,
  reservation_date  TIMESTAMPTZ  NOT NULL,
  special_requests  TEXT,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending',
  confirmation_code VARCHAR(20)  NOT NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('reservations');
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status     ON reservations(status);

-- ============================================================
-- 19. MENU CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_categories (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  image         VARCHAR(255),
  sort_order    SMALLINT     NOT NULL DEFAULT 0,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('menu_categories');
CREATE INDEX IF NOT EXISTS idx_menu_cat_restaurant ON menu_categories(restaurant_id, sort_order);

-- ============================================================
-- 20. MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id              SERIAL PRIMARY KEY,
  item_number     INT,
  restaurant_id   INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id       VARCHAR(36)  NOT NULL,
  category_id     INT          REFERENCES menu_categories(id) ON DELETE SET NULL,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency        VARCHAR(3)   DEFAULT 'INR',
  image           VARCHAR(255),
  is_veg          BOOLEAN      DEFAULT TRUE,
  spiciness_level SMALLINT     DEFAULT 0,
  is_available    BOOLEAN      DEFAULT TRUE,
  is_featured     BOOLEAN      DEFAULT FALSE,
  sort_order      SMALLINT     DEFAULT 0,
  tags            VARCHAR(500),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('menu_items');
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category   ON menu_items(restaurant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available  ON menu_items(restaurant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_number     ON menu_items(restaurant_id, item_number);

-- ============================================================
-- 21. RESTAURANT AREAS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_areas (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   VARCHAR(300),
  sort_order    INT          NOT NULL DEFAULT 0,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_areas_restaurant ON restaurant_areas(restaurant_id);

-- ============================================================
-- 22. RESTAURANT TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  area_id       INT          REFERENCES restaurant_areas(id) ON DELETE SET NULL,
  table_number  INT          NOT NULL,
  label         VARCHAR(50),
  capacity      INT          NOT NULL DEFAULT 4,
  status        VARCHAR(20)  NOT NULL DEFAULT 'available',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('restaurant_tables');
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_area       ON restaurant_tables(area_id);

-- ============================================================
-- 23. CUSTOMER ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_orders (
  id                    SERIAL PRIMARY KEY,
  restaurant_id         INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id             VARCHAR(36)  NOT NULL,
  order_number          VARCHAR(50)  NOT NULL UNIQUE,
  customer_name         VARCHAR(100) NOT NULL DEFAULT 'Walk-in',
  customer_phone        VARCHAR(20)  NOT NULL DEFAULT '',
  items                 JSONB        NOT NULL DEFAULT '[]',
  subtotal              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax                   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status                VARCHAR(20)  NOT NULL DEFAULT 'pending',
  order_type            VARCHAR(30)  NOT NULL DEFAULT 'dine_in',
  table_id              INT,
  table_number          VARCHAR(20),
  area_name             VARCHAR(100),
  special_instructions  TEXT,
  notes                 TEXT,
  payment_method        VARCHAR(50),
  payment_status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  source                VARCHAR(20)  NOT NULL DEFAULT 'online',
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('customer_orders');
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON customer_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON customer_orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON customer_orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table      ON customer_orders(restaurant_id, table_id);

-- ============================================================
-- 24. KITCHEN STAFF (KDS)
-- ============================================================
CREATE TABLE IF NOT EXISTS kitchen_staff (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id       VARCHAR(36)  NOT NULL,
  name            VARCHAR(100) NOT NULL,
  station_name    VARCHAR(100) NOT NULL DEFAULT 'Kitchen',
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  temp_password   VARCHAR(100),
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  login_attempts  INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('kitchen_staff');
CREATE INDEX IF NOT EXISTS idx_kitchen_staff_restaurant ON kitchen_staff(restaurant_id);

-- ============================================================
-- 25. STORE CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS store_categories (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  sort_order    SMALLINT     DEFAULT 0,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);
SELECT create_updated_at_trigger('store_categories');
CREATE INDEX IF NOT EXISTS idx_store_cat_restaurant ON store_categories(restaurant_id, sort_order);

-- ============================================================
-- 26. STORE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS store_items (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id       VARCHAR(36)  NOT NULL,
  category_id     INT          REFERENCES store_categories(id) ON DELETE SET NULL,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency        VARCHAR(3)   DEFAULT 'INR',
  image           VARCHAR(255),
  stock_quantity  INT          DEFAULT 0,
  is_available    BOOLEAN      DEFAULT TRUE,
  is_featured     BOOLEAN      DEFAULT FALSE,
  sort_order      SMALLINT     DEFAULT 0,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);
SELECT create_updated_at_trigger('store_items');
CREATE INDEX IF NOT EXISTS idx_store_items_restaurant ON store_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_store_items_category   ON store_items(category_id);

-- ============================================================
-- 27. STORE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS store_orders (
  id                SERIAL PRIMARY KEY,
  restaurant_id     INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id         VARCHAR(36)  NOT NULL,
  order_number      VARCHAR(20)  NOT NULL UNIQUE,
  customer_name     VARCHAR(100) NOT NULL,
  customer_phone    VARCHAR(20),
  customer_email    VARCHAR(150),
  customer_address  TEXT,
  items             JSONB        NOT NULL DEFAULT '[]',
  subtotal          DECIMAL(10,2) DEFAULT 0.00,
  total             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency          VARCHAR(3)   DEFAULT 'INR',
  status            VARCHAR(20)  DEFAULT 'pending',
  payment_status    VARCHAR(20)  DEFAULT 'pending',
  notes             TEXT,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);
SELECT create_updated_at_trigger('store_orders');
CREATE INDEX IF NOT EXISTS idx_store_orders_restaurant ON store_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status     ON store_orders(restaurant_id, status);

-- ============================================================
-- 27b. OPERATING HOURS
-- ============================================================
CREATE TABLE IF NOT EXISTS operating_hours (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  day_of_week   SMALLINT     NOT NULL,  -- 0=Sun 1=Mon ... 6=Sat
  is_open       BOOLEAN      DEFAULT TRUE,
  open_time     TIME,
  close_time    TIME,
  UNIQUE (restaurant_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_op_hours_restaurant ON operating_hours(restaurant_id);

-- ============================================================
-- 28. AFFILIATE PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_products (
  id            SERIAL PRIMARY KEY,
  affiliate_url VARCHAR(1000) NOT NULL,
  asin          VARCHAR(20),
  title         VARCHAR(300)  NOT NULL,
  description   TEXT,
  image_url     VARCHAR(1000),
  price         DECIMAL(10,2),
  currency      VARCHAR(10)   NOT NULL DEFAULT 'INR',
  rating        DECIMAL(3,1),
  brand         VARCHAR(100),
  placement     VARCHAR(50)   NOT NULL DEFAULT 'sidebar',
  status        VARCHAR(20)   NOT NULL DEFAULT 'active',
  priority      INT           NOT NULL DEFAULT 0,
  click_count   INT           NOT NULL DEFAULT 0,
  start_date    DATE,
  end_date      DATE,
  created_by    INT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('affiliate_products');

-- ============================================================
-- 29. RESTAURANT REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS restaurant_reviews (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT          NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(36)  NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  review_text   TEXT         NOT NULL,
  rating        SMALLINT     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  order_number  VARCHAR(20),
  is_approved   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON restaurant_reviews(restaurant_id, is_approved);

-- ============================================================
-- 30. AFFILIATE CLICKS
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id          BIGSERIAL PRIMARY KEY,
  product_id  INT          NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  placement   VARCHAR(50),
  ip_address  VARCHAR(50),
  user_agent  VARCHAR(500),
  clicked_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product ON affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_time   ON affiliate_clicks(clicked_at);

-- ============================================================
-- 29. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INT,
  user_type   VARCHAR(20)  NOT NULL DEFAULT 'super_admin',
  user_email  VARCHAR(255),
  tenant_id   VARCHAR(36),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id   VARCHAR(50),
  entity_name VARCHAR(200),
  description TEXT,
  before_value JSONB,
  after_value  JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  browser     VARCHAR(200),
  status      VARCHAR(20)  NOT NULL DEFAULT 'success',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_id  ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 30. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              SERIAL PRIMARY KEY,
  recipient_id    INT          NOT NULL,
  recipient_type  VARCHAR(20)  NOT NULL DEFAULT 'super_admin',
  type            VARCHAR(100) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  message         TEXT         NOT NULL,
  data            JSONB,
  is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read   ON notifications(is_read);

-- ============================================================
-- 31. PLATFORM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT,
  type        VARCHAR(20)  NOT NULL DEFAULT 'string',
  "group"     VARCHAR(100) NOT NULL DEFAULT 'general',
  label       VARCHAR(200),
  description TEXT,
  is_public   BOOLEAN      NOT NULL DEFAULT FALSE,
  updated_by  INT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
SELECT create_updated_at_trigger('platform_settings');

-- ============================================================
-- 32. REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INT          NOT NULL,
  user_type   VARCHAR(30)  NOT NULL DEFAULT 'super_admin',
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_user       ON refresh_tokens(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_rt_token_hash ON refresh_tokens(token_hash);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Super Admin (password will be hashed by the app after first run)
-- Default plain password: Admin@123
INSERT INTO super_admins (name, email, password_hash, role, is_active, email_verified_at)
VALUES (
  'Super Administrator',
  'admin@restos.com',
  '$2b$12$kKiSCEiFLX0AMLSs.NI07uYBOgh7ZEmfBL7STzjHyIfg3i1p4JZ7C',
  'super_admin', TRUE, NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Subscription Plans
INSERT INTO subscription_plans
  (name, slug, description, price_monthly, price_yearly, trial_days,
   storage_limit_mb, max_pages, max_blog_posts, max_events, max_reservations,
   website_enabled, cms_enabled, blog_enabled, reservation_enabled,
   event_enabled, affiliate_enabled, marketing_enabled,
   custom_domain, priority_support, is_active, sort_order)
VALUES
  ('Starter', 'starter',
   'Perfect for small restaurants just getting started online.',
   999.00, 9990.00, 14, 512, 5, 10, 5, 50,
   TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, 1),

  ('Professional', 'professional',
   'For growing restaurants that need more features and capacity.',
   2499.00, 24990.00, 14, 2048, 20, 50, 20, 500,
   TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, 2),

  ('Enterprise', 'enterprise',
   'Full-featured plan for restaurant chains and large operations.',
   4999.00, 49990.00, 30, 10240, 100, 500, 100, 5000,
   TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 3)
ON CONFLICT (slug) DO NOTHING;

-- Website Templates
INSERT INTO website_templates (name, slug, description, category, version, is_active, is_default, config)
VALUES
  ('Modern Classic', 'modern-classic',
   'Clean and modern design suitable for any restaurant type.',
   'modern', '1.0.0', TRUE, TRUE,
   '{"colors":{"primary":"#e53e3e","secondary":"#1a202c"},"fonts":{"heading":"Playfair Display","body":"Inter"}}'),
  ('Bloom', 'bloom',
   'Fresh and elegant design for modern restaurants.',
   'modern', '1.0.0', TRUE, FALSE,
   '{"colors":{"primary":"#10b981","secondary":"#1a202c"},"fonts":{"heading":"Playfair Display","body":"Inter"}}'),
  ('Elegant Dining', 'elegant-dining',
   'Sophisticated template for fine dining restaurants.',
   'fine_dining', '1.0.0', TRUE, FALSE,
   '{"colors":{"primary":"#744210","secondary":"#1a202c"},"fonts":{"heading":"Cormorant Garamond","body":"Lato"}}'),
  ('Cafe Minimalist', 'cafe-minimalist',
   'Minimal and clean template perfect for cafes and bakeries.',
   'cafe', '1.0.0', TRUE, FALSE,
   '{"colors":{"primary":"#68d391","secondary":"#2d3748"},"fonts":{"heading":"Nunito","body":"Poppins"}}')
ON CONFLICT (slug) DO NOTHING;

-- Platform Settings
INSERT INTO platform_settings (key, value, type, "group", label, description, is_public)
VALUES
  ('platform_name',       'Restos',                      'string',  'general',  'Platform Name',         'The name of your SaaS platform',          TRUE),
  ('platform_domain',     'restos.com',                  'string',  'general',  'Platform Domain',       'Primary domain of the platform',          TRUE),
  ('platform_tagline',    'Power Your Restaurant Online','string',  'general',  'Platform Tagline',      'Short tagline shown on the platform',     TRUE),
  ('default_timezone',    'Asia/Kolkata',                'string',  'general',  'Default Timezone',      'Default timezone for new restaurants',    FALSE),
  ('default_currency',    'INR',                         'string',  'general',  'Default Currency',      'Default currency for the platform',       TRUE),
  ('maintenance_mode',    'false',                       'boolean', 'general',  'Maintenance Mode',      'Put the platform in maintenance mode',    FALSE),
  ('subdomain_suffix',    '.restos.com',                 'string',  'general',  'Subdomain Suffix',      'Suffix appended to restaurant subdomains',TRUE),
  ('max_upload_size_mb',  '10',                          'number',  'storage',  'Max Upload Size (MB)',  'Maximum file upload size in MB',          FALSE),
  ('jwt_access_expiry',   '15m',                         'string',  'security', 'JWT Access Token Expiry','How long access tokens are valid',       FALSE),
  ('jwt_refresh_expiry',  '7d',                          'string',  'security', 'JWT Refresh Token Expiry','How long refresh tokens are valid',     FALSE),
  ('login_max_attempts',  '5',                           'number',  'security', 'Login Max Attempts',    'Max failed login attempts before lockout',FALSE),
  ('login_lockout_minutes','30',                         'number',  'security', 'Login Lockout (minutes)','Account lockout duration in minutes',   FALSE)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Done! Login: admin@restos.com / Admin@123
-- ============================================================
