import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = Router();

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // set true in prod w/ https
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

router.post('/register', async (req, res) => {
  const { username, email, password, acceptTerms } = req.body || {};

  if (!acceptTerms) return res.status(400).json({ field: 'acceptTerms', error: 'You must accept the terms.' });
  if (!username || username.length < 3) return res.status(400).json({ field: 'username', error: 'Username must be 3+ chars.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ field: 'email', error: 'Enter a valid email.' });
  if (!password || password.length < 8) return res.status(400).json({ field: 'password', error: 'Password must be 8+ chars.' });

  const password_hash = await bcrypt.hash(password, 10);

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { subject: String(result.insertId), expiresIn: '7d' });
    setAuthCookie(res, token);

    res.json({ id: result.insertId, username, email });
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes('users.username')) return res.status(409).json({ field: 'username', error: 'Username already taken.' });
    if (msg.includes('users.email')) return res.status(409).json({ field: 'email', error: 'Email already in use.' });
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

  const [rows] = await pool.execute('SELECT id, username, email, password_hash FROM users WHERE username = ? LIMIT 1', [username]);
  const user = rows?.[0];
  if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid username or password.' });

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: '7d' });
  setAuthCookie(res, token);

  res.json({ id: user.id, username: user.username, email: user.email });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.json(null);

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.sub);

    const [rows] = await pool.execute('SELECT id, username, email, created_at FROM users WHERE id = ? LIMIT 1', [userId]);
    res.json(rows?.[0] || null);
  } catch {
    return res.json(null);
  }
});

export default router;
