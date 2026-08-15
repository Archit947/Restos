import fs from 'fs';
import path from 'path';
import mysql2 from 'mysql2/promise';
import { config } from '../config';
import { logger } from '../config/logger';

/**
 * Run database migrations — creates the schema from schema.sql
 */
async function migrate(): Promise<void> {
  logger.info('🔄 Running database migration...');

  const conn = await mysql2.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    // Create database if not exists
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${config.db.database}\``);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    // Filter out the CREATE DATABASE and USE statements (already handled)
    const filtered = sql
      .replace(/CREATE DATABASE IF NOT EXISTS.*?;/gs, '')
      .replace(/USE restos_saas;/g, '');

    await conn.query(filtered);
    logger.info('✅ Database schema applied successfully');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await conn.end();
  }
}

migrate().catch((err) => {
  logger.error(err);
  process.exit(1);
});
