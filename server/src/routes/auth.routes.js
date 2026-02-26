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

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd, // true in prod w/ https
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie('token', token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie('token', cookieOptions());
}

function signToken({ userId, username }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');

  return jwt.sign({ username }, secret, {
    subject: String(userId),
    expiresIn: '7d',
  });
}

router.post('/register', async (req, res) => {
  const { username, email, password, acceptTerms } = req.body || {};

  if (!acceptTerms) {
    return jsonError(res, 400, 'You must accept the terms.', {
      field: 'acceptTerms',
    });
  }

  if (!username || String(username).trim().length < 3) {
    return jsonError(res, 400, 'Username must be 3+ chars.', {
      field: 'username',
    });
  }

  const emailStr = String(email || '').trim();
  if (!emailStr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return jsonError(res, 400, 'Enter a valid email.', { field: 'email' });
  }

  if (!password || String(password).length < 8) {
    return jsonError(res, 400, 'Password must be 8+ chars.', {
      field: 'password',
    });
  }

  try {
    const password_hash = await bcrypt.hash(String(password), 10);

    const [result] = await dbExecute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [String(username).trim(), emailStr, password_hash]
    );

    const userId = Number(result.insertId);
    const token = signToken({ userId, username: String(username).trim() });

    setAuthCookie(res, token);

    // Return token too (does not break cookie clients; enables Bearer clients)
    return res.json({
      id: userId,
      username: String(username).trim(),
      email: emailStr,
      token,
    });
  } catch (err) {
    const db = err?.db;
    const msg = String(err?.message || '');

    // Best-effort: unique constraint messages can vary by schema/index name
    if (db?.kind === 'conflict' || msg.includes('Duplicate entry')) {
      if (msg.toLowerCase().includes('username')) {
        return jsonError(res, 409, 'Username already taken.', { field: 'username' });
      }
      if (msg.toLowerCase().includes('email')) {
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

  // Accept identifier OR username OR email
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
    setAuthCookie(res, token);

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
  clearAuthCookie(res);
  return res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.json(null);

    const token = getAuthToken(req);
    if (!token) return res.json(null);

    const payload = jwt.verify(token, secret);
    const userId = Number(payload?.sub);
    if (!Number.isFinite(userId) || userId <= 0) return res.json(null);

    const [rows] = await dbExecute(
      'SELECT id, username, email, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    return res.json(rows?.[0] || null);
  } catch (err) {
    return res.json(null);
  }
});

export default router;
