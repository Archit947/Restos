'use strict';

/**
 * PostgreSQL (Supabase) database adapter.
 *
 * Provides a mysql2-compatible API so existing route files work unchanged:
 *   query()     → returns [rows, fields]  (SELECT) or [header, []]  (DML)
 *   queryOne()  → returns rows[0] || null
 *   transaction() → passes a pg Client with an .execute() shim
 *
 * Automatic dialect conversions applied to every SQL string:
 *   "word"        → 'word'          (MySQL double-quoted strings → single-quoted)
 *   DATE_FORMAT() → TO_CHAR()       (MySQL date format → PostgreSQL)
 *   <=>           → IS NOT DISTINCT FROM
 *   ?             → $1, $2, …       (MySQL placeholders → PostgreSQL)
 */

const { Pool, types } = require('pg');
const env    = require('./env');
const logger = require('../utils/logger');

// ── Type parsers: return numeric DB types as JS numbers, not strings ──────────
// BIGINT (OID 20)  – returned as string by default; used for COUNT(*), SERIAL ids
// NUMERIC (OID 1700) – price, total, subtotal, etc.
types.setTypeParser(20,   parseFloat);
types.setTypeParser(1700, parseFloat);

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.IS_PRODUCTION ? { rejectUnauthorized: false } : false,
      max:                  env.DB.POOL_MAX || 10,
      idleTimeoutMillis:    30_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on('error', (err) =>
      logger.error(`[PG Pool] ${err.message}`)
    );
  }
  return pool;
}

// ── SQL dialect: MySQL → PostgreSQL ──────────────────────────────────────────
function pgify(sql) {
  let i = 0;
  return sql
    // 1. MySQL double-quoted string literals → PostgreSQL single-quoted
    //    e.g.  status = "active"  →  status = 'active'
    .replace(/"([^"\n\\]+)"/g, "'$1'")

    // 2. MySQL DATE_FORMAT() → PostgreSQL TO_CHAR()
    //    DATE_FORMAT(created_at, '%Y-%m') → TO_CHAR(created_at, 'YYYY-MM')
    .replace(/DATE_FORMAT\(([^,]+),\s*'([^']+)'\)/gi, (_, col, fmt) => {
      const pgFmt = fmt
        .replace(/%Y/g, 'YYYY').replace(/%y/g, 'YY')
        .replace(/%m/g, 'MM') .replace(/%d/g, 'DD')
        .replace(/%H/g, 'HH24').replace(/%i/g, 'MI').replace(/%s/g, 'SS')
        .replace(/%b/g, 'Mon') .replace(/%M/g, 'Month');
      return `TO_CHAR(${col.trim()}, '${pgFmt}')`;
    })

    // 3. MySQL date arithmetic → PostgreSQL interval arithmetic
    //    DATE_SUB(expr, INTERVAL N UNIT) → expr - INTERVAL 'N unit'
    //    DATE_ADD(expr, INTERVAL N UNIT) → expr + INTERVAL 'N unit'
    .replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+(\w+)\)/gi, (_, expr, n, unit) =>
      `(${expr.trim()} - INTERVAL '${n} ${unit.toLowerCase()}')`
    )
    .replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s+(\d+)\s+(\w+)\)/gi, (_, expr, n, unit) =>
      `(${expr.trim()} + INTERVAL '${n} ${unit.toLowerCase()}')`
    )

    // 4. MySQL date/time functions → PostgreSQL equivalents
    .replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE')
    .replace(/\bCURTIME\(\)/gi, 'CURRENT_TIME')

    // 5. MySQL DATE(col) → PostgreSQL col::date  (extract date portion from timestamp)
    //    Must come AFTER DATE_FORMAT/DATE_SUB/DATE_ADD replacements above
    .replace(/\bDATE\(([^)]+)\)/gi, (_, expr) => `(${expr.trim()})::date`)

    // 6. MySQL YEAR(col) / MONTH(col) → PostgreSQL EXTRACT()
    .replace(/\bYEAR\(([^)]+)\)/gi,  (_, expr) => `EXTRACT(YEAR  FROM ${expr.trim()})`)
    .replace(/\bMONTH\(([^)]+)\)/gi, (_, expr) => `EXTRACT(MONTH FROM ${expr.trim()})`)

    // 7. MySQL NULL-safe equality  <=>  → PostgreSQL  IS NOT DISTINCT FROM
    .replace(/<=> /g, 'IS NOT DISTINCT FROM ')
    .replace(/<=>/g,  'IS NOT DISTINCT FROM')

    // 8. ? placeholders → $1, $2, …
    .replace(/\?/g, () => `$${++i}`);
}

// ── Wrap a pg QueryResult into a mysql2-compatible tuple ─────────────────────
//
//  SELECT / other  → [ rowsArray,  fields ]
//  INSERT/UPDATE/DELETE → [ ResultSetHeader, [] ]
//
//  ResultSetHeader = { affectedRows, insertId, changedRows }
//  insertId is only populated when the SQL includes RETURNING id.
//
function wrapResult(pgResult) {
  const cmd = pgResult.command; // 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | …
  if (cmd === 'INSERT' || cmd === 'UPDATE' || cmd === 'DELETE') {
    return [
      {
        affectedRows: pgResult.rowCount,
        insertId:     pgResult.rows[0]?.id ?? null,
        changedRows:  pgResult.rowCount,
      },
      [],
    ];
  }
  return [pgResult.rows, pgResult.fields || []];
}

// ── query() ───────────────────────────────────────────────────────────────────
async function query(sql, params = []) {
  const pg    = getPool();
  const pgSql = pgify(sql);
  try {
    const result = await pg.query(pgSql, params);
    return wrapResult(result);
  } catch (err) {
    logger.error(`[DB Error] ${err.message}\nSQL: ${pgSql}\nParams: ${JSON.stringify(params)}`);
    throw err;
  }
}

// ── queryOne() ────────────────────────────────────────────────────────────────
async function queryOne(sql, params = []) {
  const [rows] = await query(sql, params);
  return (Array.isArray(rows) ? rows[0] : null) || null;
}

// ── transaction() ─────────────────────────────────────────────────────────────
//
// Passes a pg Client to the callback.  The client is augmented with an
// .execute() method that has the same signature as mysql2 connection.execute(),
// so restaurant.service.js and tenant.service.js work unchanged.
//
async function transaction(callback) {
  const pg  = getPool();
  const cli = await pg.connect();
  await cli.query('BEGIN');
  try {
    // mysql2-style shim
    cli.execute = async (sql, params = []) => {
      const pgSql = pgify(sql);
      const result = await cli.query(pgSql, params);
      return wrapResult(result);
    };

    const out = await callback(cli);
    await cli.query('COMMIT');
    return out;
  } catch (err) {
    await cli.query('ROLLBACK');
    throw err;
  } finally {
    cli.release();
  }
}

// ── testConnection() ──────────────────────────────────────────────────────────
async function testConnection() {
  try {
    const [rows] = await query('SELECT 1 AS ok');
    if (Number(rows[0]?.ok) === 1) {
      logger.info('✅ PostgreSQL (Supabase) connected');
      return true;
    }
    return false;
  } catch (err) {
    logger.error(`❌ Database connection failed: ${err.message}`);
    return false;
  }
}

module.exports = { getPool, query, queryOne, transaction, testConnection };
