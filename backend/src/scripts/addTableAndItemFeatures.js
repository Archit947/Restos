'use strict';
/**
 * Migration: add item_number, table management, order table fields.
 * Run once: node src/scripts/addTableAndItemFeatures.js
 */
require('dotenv').config();
const { query } = require('../config/database');

async function run() {
  // 1. item_number on menu_items
  console.log('Adding item_number to menu_items...');
  try {
    await query('ALTER TABLE menu_items ADD COLUMN item_number INT DEFAULT NULL AFTER id');
    console.log('✅ item_number column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('  (already exists)');
    else throw e;
  }

  // Auto-assign item_numbers to existing items per restaurant
  const [restaurants] = await query('SELECT DISTINCT restaurant_id FROM menu_items WHERE item_number IS NULL');
  for (const { restaurant_id } of restaurants) {
    const [items] = await query(
      'SELECT id FROM menu_items WHERE restaurant_id = ? AND item_number IS NULL ORDER BY sort_order ASC, id ASC',
      [restaurant_id]
    );
    for (let i = 0; i < items.length; i++) {
      await query('UPDATE menu_items SET item_number = ? WHERE id = ?', [i + 1, items[i].id]);
    }
    console.log(`  ✓ Assigned item_numbers to ${items.length} items for restaurant ${restaurant_id}`);
  }

  // 2. table_id / table_number / area_name on customer_orders
  console.log('Adding table fields to customer_orders...');
  const addCols = [
    ['table_id', 'ADD COLUMN table_id INT UNSIGNED DEFAULT NULL AFTER order_type'],
    ['table_number', 'ADD COLUMN table_number VARCHAR(20) DEFAULT NULL AFTER table_id'],
    ['area_name', 'ADD COLUMN area_name VARCHAR(100) DEFAULT NULL AFTER table_number'],
    ['discount', 'ADD COLUMN discount DECIMAL(10,2) DEFAULT 0 AFTER total'],
    ['tax', 'ADD COLUMN tax DECIMAL(10,2) DEFAULT 0 AFTER discount'],
    ['payment_method', 'ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER tax'],
    ['payment_status', "ADD COLUMN payment_status ENUM('pending','paid','partial','refunded') NOT NULL DEFAULT 'pending' AFTER payment_method"],
    ['notes', 'ADD COLUMN notes TEXT DEFAULT NULL AFTER special_instructions'],
    ['source', "ADD COLUMN source ENUM('online','pos','table','walkin') NOT NULL DEFAULT 'online' AFTER notes"],
  ];
  for (const [col, ddl] of addCols) {
    try {
      await query(`ALTER TABLE customer_orders ${ddl}`);
      console.log(`  ✅ Added ${col}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log(`  (${col} already exists)`);
      else throw e;
    }
  }

  // 3. restaurant_areas
  console.log('Creating restaurant_areas...');
  await query(`
    CREATE TABLE IF NOT EXISTS restaurant_areas (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id   VARCHAR(36) NOT NULL,
      name        VARCHAR(100) NOT NULL,
      description VARCHAR(300) DEFAULT NULL,
      sort_order  INT NOT NULL DEFAULT 0,
      is_active   TINYINT(1) NOT NULL DEFAULT 1,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_restaurant (restaurant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ restaurant_areas ready');

  // 4. restaurant_tables
  console.log('Creating restaurant_tables...');
  await query(`
    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      restaurant_id INT UNSIGNED NOT NULL,
      tenant_id     VARCHAR(36) NOT NULL,
      area_id       INT UNSIGNED DEFAULT NULL,
      table_number  INT NOT NULL,
      label         VARCHAR(50) DEFAULT NULL,
      capacity      INT NOT NULL DEFAULT 4,
      status        ENUM('available','occupied','reserved') NOT NULL DEFAULT 'available',
      is_active     TINYINT(1) NOT NULL DEFAULT 1,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_restaurant (restaurant_id),
      INDEX idx_area (area_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✅ restaurant_tables ready');

  console.log('\n✅ All migrations complete.');
  process.exit(0);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
