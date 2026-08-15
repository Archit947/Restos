/**
 * Database Setup Script
 * Run: node src/scripts/setup.js
 *
 * This script:
 * 1. Creates the database if it doesn't exist
 * 2. Runs the schema (creates all tables)
 * 3. Seeds default data (super admin, plans, templates, settings)
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_NAME = process.env.DB_NAME || 'restos_platform';

async function runSQLFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  // Split on semicolon, filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await connection.query(stmt);
    } catch (err) {
      // Ignore "table already exists" and similar harmless errors
      if (!['ER_TABLE_EXISTS_ERROR', 'ER_DUP_ENTRY', 'ER_DUP_FIELDNAME'].includes(err.code)) {
        console.warn(`  ⚠️  Statement warning: ${err.message.substring(0, 80)}`);
      }
    }
  }
}

async function setup() {
  console.log('');
  console.log('🚀 Restos Platform — Database Setup');
  console.log('=====================================');

  let connection;

  try {
    // Connect without selecting a database first
    connection = await mysql.createConnection(DB_CONFIG);
    console.log(`✅ Connected to MySQL @ ${DB_CONFIG.host}:${DB_CONFIG.port}`);

    // Create database
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database "${DB_NAME}" ready`);

    // Switch to our database
    await connection.query(`USE \`${DB_NAME}\``);

    // Run schema
    console.log('📐 Running schema...');
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    await runSQLFile(connection, schemaPath);
    console.log('✅ Schema applied');

    // Run seeds
    console.log('🌱 Seeding default data...');
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');
    await runSQLFile(connection, seedPath);
    console.log('✅ Seed data inserted');

    // Hash the super admin password (Admin@123)
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('Admin@123', 12);
    await connection.query(
      'UPDATE super_admins SET password_hash = ? WHERE email = ?',
      [hash, 'admin@restos.com']
    );
    console.log('✅ Super admin password hashed');

    console.log('');
    console.log('🎉 Setup complete!');
    console.log('');
    console.log('  📧 Login Email   : admin@restos.com');
    console.log('  🔐 Login Password: Admin@123');
    console.log('');
    console.log('  Start the server: npm run dev');
    console.log('');

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setup();
