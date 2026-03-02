// server/src/db.js
import mysql from 'mysql2/promise';

const {
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

function parseDatabaseUrl(urlStr) {
  const raw = String(urlStr || '').trim();
  if (!raw) return null;

  // Railway should resolve ${{MySQL.MYSQL_URL}} into a real URL at runtime.
  // If you still see "${{...}}" here, it means the env var did not resolve.
  if (raw.includes('${{')) {
    throw new Error(
      'DATABASE_URL was not resolved by Railway. Set DATABASE_URL to a Railway reference like ${{MySQL.MYSQL_URL}} (not quoted), then redeploy.'
    );
  }

  const u = new URL(raw);

  const host = u.hostname;
  const port = u.port ? Number(u.port) : 3306;
  const user = decodeURIComponent(u.username || '');
  const password = decodeURIComponent(u.password || '');
  const database = u.pathname ? u.pathname.replace(/^\//, '') : '';

  // Optional SSL support via querystring if provided (ex: ?ssl=true)
  const sslParam = (u.searchParams.get('ssl') || '').toLowerCase();
  const useSSL = sslParam === 'true' || sslParam === '1' || sslParam === 'required';

  return {
    host,
    port,
    user,
    password,
    database,
    ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

function buildPoolConfig() {
  if (DATABASE_URL && String(DATABASE_URL).trim()) {
    return parseDatabaseUrl(DATABASE_URL);
  }

  return {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  };
}

const poolConfig = buildPoolConfig();

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

  if (code === 'ER_DUP_ENTRY') {
    return { kind: 'conflict', code, errno, message };
  }

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
  const [rows] = await dbQuery('SELECT CURRENT_USER() AS user, DATABASE() AS db, NOW() AS now');
  const mode = DATABASE_URL ? 'DATABASE_URL' : 'DB_HOST/DB_USER';
  console.log(`✅ MySQL Connected (${mode}):`, rows[0]);
}
