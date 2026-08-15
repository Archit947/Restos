'use strict';
/**
 * Fix: Drop old affiliate_products table (wrong schema) and recreate both tables
 * with the correct super-admin global affiliate schema.
 * Run once: node src/scripts/fixAffiliateTables.js
 */

require('dotenv').config();
const { query } = require('../config/database');

async function run() {
  // Drop old tables (in correct FK order)
  console.log('Dropping old affiliate tables if they exist...');
  try {
    await query('DROP TABLE IF EXISTS affiliate_clicks');
    console.log('✅ affiliate_clicks dropped');
  } catch (e) {
    console.log('  (affiliate_clicks skip:', e.message, ')');
  }

  try {
    await query('DROP TABLE IF EXISTS affiliate_products');
    console.log('✅ affiliate_products dropped');
  } catch (e) {
    console.log('  (affiliate_products skip:', e.message, ')');
  }

  // Recreate affiliate_products with correct schema
  console.log('Creating affiliate_products...');
  await query(`
    CREATE TABLE affiliate_products (
      id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
      affiliate_url VARCHAR(2000)   NOT NULL,
      asin          VARCHAR(100)    DEFAULT NULL,
      title         VARCHAR(500)    NOT NULL,
      description   TEXT            DEFAULT NULL,
      image_url     VARCHAR(1000)   DEFAULT NULL,
      price         DECIMAL(10,2)   DEFAULT NULL,
      currency      VARCHAR(10)     NOT NULL DEFAULT '₹',
      rating        DECIMAL(3,1)    DEFAULT NULL,
      brand         VARCHAR(200)    DEFAULT NULL,
      placement     ENUM(
        'homepage_hero','homepage_section','menu_page',
        'blog_page','sidebar','footer','between_sections'
      ) NOT NULL DEFAULT 'homepage_section',
      status        ENUM('draft','active','inactive','scheduled')
                    NOT NULL DEFAULT 'draft',
      priority      INT             NOT NULL DEFAULT 10,
      start_date    DATE            DEFAULT NULL,
      end_date      DATE            DEFAULT NULL,
      click_count   INT UNSIGNED    NOT NULL DEFAULT 0,
      created_by    INT UNSIGNED    DEFAULT NULL,
      created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_placement_status (placement, status),
      INDEX idx_status (status),
      INDEX idx_priority (priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ affiliate_products created');

  // Recreate affiliate_clicks
  console.log('Creating affiliate_clicks...');
  await query(`
    CREATE TABLE affiliate_clicks (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_id  INT UNSIGNED NOT NULL,
      placement   VARCHAR(50)  DEFAULT NULL,
      ip_address  VARCHAR(45)  DEFAULT NULL,
      user_agent  VARCHAR(500) DEFAULT NULL,
      clicked_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_product (product_id),
      INDEX idx_clicked_at (clicked_at),
      FOREIGN KEY (product_id) REFERENCES affiliate_products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ affiliate_clicks created');

  console.log('');
  console.log('✅ All affiliate tables recreated with correct schema.');
  process.exit(0);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
