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
  const [o] = await conn.query('DESCRIBE customer_orders');
  console.log('customer_orders:', o.map(r => r.Field).join(', '));
  const [m] = await conn.query('DESCRIBE menu_items');
  console.log('menu_items:', m.map(r => r.Field).join(', '));
  const [allTables] = await conn.query('SHOW TABLES');
  console.log('all tables:', allTables.map(r => Object.values(r)[0]).join(', '));
  await conn.end();
}
run().catch(e => console.error(e.message));
