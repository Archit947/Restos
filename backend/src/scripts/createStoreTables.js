'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { query } = require('../config/database');

async function run() {
  console.log('🏪 Creating Store Portal tables...\n');

  // ── Add has_store column to restaurants ──────────────────────────────────────
  try {
    await query(`ALTER TABLE restaurants ADD COLUMN has_store TINYINT(1) DEFAULT 0`);
    console.log('✅ restaurants.has_store column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  restaurants.has_store already exists — skipped');
    } else throw e;
  }

  // ── Update refresh_tokens.user_type ENUM ─────────────────────────────────────
  await query(
    `ALTER TABLE refresh_tokens
     MODIFY COLUMN user_type ENUM('super_admin','restaurant','restaurant_admin','kds','store_admin') NOT NULL DEFAULT 'super_admin'`
  );
  console.log('✅ refresh_tokens.user_type ENUM updated (store_admin added)');

  // ── store_credentials ─────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS store_credentials (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      restaurant_id    INT UNSIGNED NOT NULL,
      tenant_id        VARCHAR(36)  NOT NULL,
      username         VARCHAR(100) NOT NULL,
      password_hash    VARCHAR(255) NOT NULL,
      temp_password    VARCHAR(100),
      is_active        TINYINT(1)   DEFAULT 1,
      is_first_login   TINYINT(1)   DEFAULT 1,
      login_attempts   TINYINT      DEFAULT 0,
      locked_until     DATETIME     NULL,
      last_login_at    DATETIME     NULL,
      last_login_ip    VARCHAR(45),
      created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_username (username),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_restaurant (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ store_credentials');

  // ── store_categories ──────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS store_categories (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id     VARCHAR(36)  NOT NULL,
      name          VARCHAR(100) NOT NULL,
      description   TEXT,
      sort_order    SMALLINT     DEFAULT 0,
      is_active     TINYINT(1)   DEFAULT 1,
      created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_sort (restaurant_id, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ store_categories');

  // ── store_items ───────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS store_items (
      id             INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
      restaurant_id  INT UNSIGNED  NOT NULL,
      tenant_id      VARCHAR(36)   NOT NULL,
      category_id    INT UNSIGNED  DEFAULT NULL,
      name           VARCHAR(150)  NOT NULL,
      description    TEXT,
      price          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      currency       VARCHAR(3)    DEFAULT 'INR',
      image          VARCHAR(255),
      stock_quantity INT           DEFAULT 0,
      is_available   TINYINT(1)    DEFAULT 1,
      is_featured    TINYINT(1)    DEFAULT 0,
      sort_order     SMALLINT      DEFAULT 0,
      created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
      updated_at     DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id)   REFERENCES store_categories(id) ON DELETE SET NULL,
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_category (category_id),
      INDEX idx_available (restaurant_id, is_available)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ store_items');

  // ── store_orders ──────────────────────────────────────────────────────────────
  await query(`
    CREATE TABLE IF NOT EXISTS store_orders (
      id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      restaurant_id    INT UNSIGNED NOT NULL,
      tenant_id        VARCHAR(36)  NOT NULL,
      order_number     VARCHAR(20)  NOT NULL,
      customer_name    VARCHAR(100) NOT NULL,
      customer_phone   VARCHAR(20),
      customer_email   VARCHAR(150),
      customer_address TEXT,
      items            JSON         NOT NULL,
      subtotal         DECIMAL(10,2) DEFAULT 0.00,
      total            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      currency         VARCHAR(3)   DEFAULT 'INR',
      status           ENUM('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
      payment_status   ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
      notes            TEXT,
      created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_order_number (order_number),
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_status (restaurant_id, status),
      INDEX idx_created (restaurant_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ store_orders');

  console.log('\n🎉 Store Portal tables created successfully!');
  process.exit(0);
}

run().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
