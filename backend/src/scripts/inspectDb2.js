'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'restos_platform'
  });
  const [sc] = await conn.query('DESCRIBE store_credentials');
  console.log('store_credentials:', sc.map(r => r.Field + ':' + r.Type).join(', '));
  const [si] = await conn.query('DESCRIBE store_items');
  console.log('store_items:', si.map(r => r.Field).join(', '));
  const [rc] = await conn.query('DESCRIBE restaurant_credentials');
  console.log('restaurant_credentials:', rc.map(r => r.Field + ':' + r.Type).join(', '));
  await conn.end();
}
run().catch(e => console.error(e.message));
