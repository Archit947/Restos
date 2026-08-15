'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restos_saas',
  });

  // Add 'kds' to the user_type ENUM
  await conn.query(
    "ALTER TABLE refresh_tokens MODIFY COLUMN user_type ENUM('super_admin','restaurant','restaurant_admin','kds') NOT NULL DEFAULT 'super_admin'"
  );
  console.log('✅ refresh_tokens.user_type ENUM updated — kds added.');
  await conn.end();
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
