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

const CLIENT_ORIGIN = String(process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .trim()
  .replace(/\/$/, '');

function parseAllowedOrigins(value) {
  const raw = String(value || '').trim();

  // If CLIENT_ORIGINS is not set, fall back to CLIENT_ORIGIN (single origin).
  const list = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [CLIENT_ORIGIN];

  // Normalize: remove trailing slash to match browser Origin format
  return [...new Set(list.map((s) => String(s).replace(/\/$/, '')))];
}

// Supports either:
// CLIENT_ORIGINS="http://localhost:3000,https://chrispv42.github.io"
// or just CLIENT_ORIGIN="http://localhost:3000"
const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN);

app.use(cookieParser());

const corsConfig = {
  origin(origin, cb) {
    // Allow requests that omit Origin (curl, server-to-server, health checks, etc.)
    if (!origin) return cb(null, true);

    const normalized = String(origin).replace(/\/$/, '');

    if (allowedOrigins.includes(normalized)) return cb(null, true);

    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsConfig));

// IMPORTANT: use regex here (Express + path-to-regexp compatibility)
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
