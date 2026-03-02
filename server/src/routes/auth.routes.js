// server/src/routes/auth.routes.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { dbExecute } from '../db.js';
import { getAuthToken } from '../middleware/auth.js';

const router = Router();

function jsonError(res, status, error, extra = {}) {
  return res.status(status).json({ error, ...extra });
}

function isProduction() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function isHttpsRequest(req) {
  // Railway/most proxies set x-forwarded-proto=https
  const xfProto = String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase();
  return Boolean(req?.secure) || xfProto === 'https';
}

function cookieOptions(req) {
  const prod = isProduction();

  // Cross-site cookie rules:
  // - SameSite=None requires Secure=true (HTTPS)
  // - GitHub Pages (https) -> Railway (https) is cross-site
  const sameSite = prod ? 'none' : 'lax';

  // In production, always Secure.
  // Also secure when the request is HTTPS (covers proxy/TLS termination setups).
  const secure = prod || isHttpsRequest(req);

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  };
}

function setAuthCookie(req, res, token) {
  res.cookie('token', token, cookieOptions(req));
}

function clearAuthCookie(req, res) {
  res.clearCookie('token', cookieOptions(req));
}

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return secret;
}

function signToken({ userId, username }) {
  const secret = requireJwtSecret();

  return jwt.sign({ username }, secret, {
    subject: String(userId),
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

function verifyToken(token) {
  const secret = requireJwtSecret();
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}

router.post('/register', async (req, res) => {
  const { username, email, password, acceptTerms } = req.body || {};

  if (!acceptTerms) {
    return jsonError(res, 400, 'You must accept the terms.', { field: 'acceptTerms' });
  }

  const uname = String(username || '').trim();
  if (uname.length < 3) {
    return jsonError(res, 400, 'Username must be 3+ chars.', { field: 'username' });
  }

  const emailStr = String(email || '').trim();
  if (!emailStr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return jsonError(res, 400, 'Enter a valid email.', { field: 'email' });
  }

  const pw = String(password || '');
  if (pw.length < 8) {
    return jsonError(res, 400, 'Password must be 8+ chars.', { field: 'password' });
  }

  try {
    const password_hash = await bcrypt.hash(pw, 10);

    const [result] = await dbExecute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [uname, emailStr, password_hash]
    );

    const userId = Number(result.insertId);
    const token = signToken({ userId, username: uname });

    setAuthCookie(req, res, token);

    return res.json({
      id: userId,
      username: uname,
      email: emailStr,
      token,
    });
  } catch (err) {
    const db = err?.db;
    const msg = String(err?.message || '');

    if (db?.kind === 'conflict' || msg.includes('Duplicate entry')) {
      const lower = msg.toLowerCase();
      if (lower.includes('username')) {
        return jsonError(res, 409, 'Username already taken.', { field: 'username' });
      }
      if (lower.includes('email')) {
        return jsonError(res, 409, 'Email already in use.', { field: 'email' });
      }
      return jsonError(res, 409, 'Account already exists.');
    }

    console.error('POST /api/auth/register failed:', err);
    return jsonError(res, 500, 'Server error');
  }
});

router.post('/login', async (req, res) => {
  const { identifier, password, username, email } = req.body || {};

  const loginValue = String(identifier || username || email || '').trim();
  const pw = String(password || '');

  if (!loginValue || !pw) {
    return jsonError(res, 400, 'Username/email and password required.');
  }

  try {
    const [rows] = await dbExecute(
      'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1',
      [loginValue, loginValue]
    );

    const user = rows?.[0];
    if (!user) return jsonError(res, 401, 'Invalid username/email or password.');

    const ok = await bcrypt.compare(pw, user.password_hash);
    if (!ok) return jsonError(res, 401, 'Invalid username/email or password.');

    const token = signToken({ userId: user.id, username: user.username });
    setAuthCookie(req, res, token);

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error('POST /api/auth/login failed:', err);
    return jsonError(res, 500, 'Server error');
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(req, res);
  return res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) return res.json(null);

    const token = getAuthToken(req);
    if (!token) return res.json(null);

    const payload = verifyToken(token);

    const userId = Number(payload?.sub);
    if (!Number.isFinite(userId) || userId <= 0) return res.json(null);

    const [rows] = await dbExecute(
      'SELECT id, username, email, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    return res.json(rows?.[0] || null);
  } catch (_err) {
    return res.json(null);
  }
});

export default router;
