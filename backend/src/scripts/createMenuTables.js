'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { query } = require('../config/database');

async function run() {
  console.log('Creating restaurant admin tables...\n');

  // ── menu_categories ──────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id   VARCHAR(36) NOT NULL,
      name        VARCHAR(100) NOT NULL,
      description TEXT,
      image       VARCHAR(255),
      sort_order  SMALLINT DEFAULT 0,
      is_active   TINYINT(1) DEFAULT 1,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_sort (restaurant_id, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ menu_categories');

  // ── menu_items ───────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id     VARCHAR(36) NOT NULL,
      category_id   INT UNSIGNED,
      name          VARCHAR(150) NOT NULL,
      description   TEXT,
      price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      currency      VARCHAR(3) DEFAULT 'INR',
      image         VARCHAR(255),
      is_veg        TINYINT(1) DEFAULT 1,
      spiciness_level TINYINT DEFAULT 0 COMMENT '0=mild,1=medium,2=hot,3=extra hot',
      is_available  TINYINT(1) DEFAULT 1,
      is_featured   TINYINT(1) DEFAULT 0,
      sort_order    SMALLINT DEFAULT 0,
      tags          VARCHAR(500),
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_category (restaurant_id, category_id),
      INDEX idx_available (restaurant_id, is_available)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ menu_items');

  // ── operating_hours ──────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS operating_hours (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id     VARCHAR(36) NOT NULL,
      day_of_week   TINYINT NOT NULL COMMENT '0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat',
      is_open       TINYINT(1) DEFAULT 1,
      open_time     TIME,
      close_time    TIME,
      UNIQUE KEY uq_rest_day (restaurant_id, day_of_week),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ operating_hours');

  console.log('\nAll tables ready.');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
