'use strict';
/**
 * Migration: create affiliate_products and affiliate_clicks tables.
 * Run once: node src/scripts/createAffiliateTables.js
 */

require('dotenv').config();
const { query } = require('../config/database');

async function run() {
  console.log('Creating affiliate_products table…');
  await query(`
    CREATE TABLE IF NOT EXISTS affiliate_products (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ affiliate_products created');

  console.log('Creating affiliate_clicks table…');
  await query(`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ affiliate_clicks created');

  console.log('✅ Affiliate tables ready.');
  process.exit(0);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
