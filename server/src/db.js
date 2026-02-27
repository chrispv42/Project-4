// server/src/db.js
import mysql from 'mysql2/promise';

const {
  // Railway style, so gh pages works with mySQL without crashing for project
  DATABASE_URL,

  // Local/dev fallback style
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'ol_time_muscle',

  // Pool tuning
  DB_CONN_LIMIT = '10',
} = process.env;

const connectionLimit = Number(DB_CONN_LIMIT) || 10;

// If Railway provides a connection string, use it.
// Otherwise fall back to host/user/pass/db envs (local setup).
const poolConfig = DATABASE_URL
  ? {
      uri: DATABASE_URL,
    }
  : {
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    };

export const pool = mysql.createPool({
  ...poolConfig,

  // Pool behavior
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,

  // Small stability wins
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

function normalizeDbError(err) {
  const code = err?.code ? String(err.code) : null;
  const errno = typeof err?.errno === 'number' ? err.errno : null;
  const message = err?.message ? String(err.message) : 'Database error';

  // Duplicate key (unique index)
  if (code === 'ER_DUP_ENTRY') {
    return { kind: 'conflict', code, errno, message };
  }

  // Foreign key violations
  if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_ROW_IS_REFERENCED_2') {
    return { kind: 'fk', code, errno, message };
  }

  return { kind: 'unknown', code, errno, message };
}

export async function dbExecute(sql, params = []) {
  try {
    return await pool.execute(sql, params);
  } catch (err) {
    err.db = normalizeDbError(err);
    throw err;
  }
}

export async function dbQuery(sql, params = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    err.db = normalizeDbError(err);
    throw err;
  }
}

export async function testDB() {
  try {
    const [rows] = await dbQuery('SELECT CURRENT_USER() AS user, DATABASE() AS db, NOW() AS now');

    const mode = DATABASE_URL ? 'DATABASE_URL' : 'DB_HOST/DB_USER';
    console.log(`✅ MySQL Connected (${mode}):`, rows[0]);
  } catch (err) {
    console.error('❌ MySQL Connection Failed:', err?.db?.message || err?.message || err);
  }
}
