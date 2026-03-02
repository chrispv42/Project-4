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
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

function parseAllowedOrigins(value) {
  // Supports:
  // - single origin: "https://example.com"
  // - multiple origins: "https://a.com,https://b.com"
  // - empty/undefined (falls back to CLIENT_ORIGIN)
  const raw = String(value || '').trim();
  if (!raw) return [CLIENT_ORIGIN];

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(process.env.CLIENT_ORIGINS);

// Must be registered before any route that reads req.cookies
app.use(cookieParser());

const corsConfig = {
  origin(origin, cb) {
    // Allow server-to-server requests or tools that omit Origin
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsConfig));
app.options(/.*/, cors(corsConfig));

app.use(express.json());

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
