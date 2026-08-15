import mysql2 from 'mysql2/promise';
import { config } from '../config';
import { logger } from '../config/logger';

// Create a connection pool for efficient concurrent connections
const pool = mysql2.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
});

export const db = pool;

/**
 * Test the database connection on startup
 */
export async function testConnection(): Promise<void> {
  try {
    const conn = await pool.getConnection();
    logger.info('✅ MySQL database connected successfully');
    conn.release();
  } catch (error) {
    logger.error('❌ MySQL connection failed:', error);
    process.exit(1);
  }
}

/**
 * Helper: format params (convert numbers to strings to bypass mysql2 mysqld_stmt_execute issue with LIMIT)
 */
function formatParams(params?: any[]): any[] | undefined {
  return params?.map(p => typeof p === 'number' ? p.toString() : p);
}

/**
 * Helper: execute a query with named params and return rows
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute(sql, formatParams(params));
  return rows as T[];
}

/**
 * Helper: execute a single query returning one row or null
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

/**
 * Helper: execute INSERT/UPDATE/DELETE and return ResultSetHeader
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<mysql2.ResultSetHeader> {
  const [result] = await pool.execute(sql, formatParams(params));
  return result as mysql2.ResultSetHeader;
}

export default pool;
