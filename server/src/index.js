// server/src/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';

import { testDB } from './db.js';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import vehiclesRoutes from './routes/vehicles.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import erasRoutes from './routes/eras.routes.js';

const app = express();

const PORT = Number(process.env.PORT || 4000);
const NODE_ENV = String(process.env.NODE_ENV || 'development').trim();

function normalizeOrigin(value) {
  return String(value || '')
    .trim()
    .replace(/\/$/, '');
}

function parseAllowedOrigins() {
  const rawList = String(process.env.CLIENT_ORIGINS || '').trim();
  const single = normalizeOrigin(process.env.CLIENT_ORIGIN || 'http://localhost:3000');

  const list = rawList
    ? rawList
        .split(',')
        .map((s) => normalizeOrigin(s))
        .filter(Boolean)
    : [single];

  // Ensure unique
  return [...new Set(list)];
}

const allowedOrigins = parseAllowedOrigins();

// Must be registered before any route that reads req.cookies
app.use(cookieParser());

const corsConfig = {
  origin(origin, cb) {
    // Requests without Origin (curl/health checks) should pass
    if (!origin) return cb(null, true);

    const normalized = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalized)) return cb(null, true);

    // Helpful debug: shows exactly what the browser sent
    // eslint-disable-next-line no-console
    console.warn('CORS blocked origin:', normalized, 'Allowed:', allowedOrigins);

    // Returning false means no CORS headers will be set (browser will block)
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsConfig));

// Express + path-to-regexp safe preflight handler
app.options(/.*/, cors(corsConfig));

app.use(express.json({ limit: '1mb' }));

// Static hosting for uploaded vehicle images/files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health endpoints
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ol-time-muscle-api',
    env: NODE_ENV,
  });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await testDB();
    res.json({ ok: true });
  } catch (err) {
    console.error('DB health check failed:', err);
    res.status(500).json({ ok: false, error: 'DB check failed' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/eras', erasRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/categories', categoriesRoutes);

app.listen(PORT, async () => {
  console.log(`✅ API listening on port ${PORT}`);
  console.log('ENV:', NODE_ENV);
  console.log('Allowed origins:', allowedOrigins.join(', '));
  console.log('Uploads dir:', uploadsDir);

  await testDB();
});
