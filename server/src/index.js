// server/src/index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

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

// ✅ cookies must be parsed before routes that read req.cookies
app.use(cookieParser());

// ✅ CORS (must allow credentials because client uses withCredentials:true)
const corsConfig = {
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsConfig));

// ✅ Preflight
app.options(/.*/, cors(corsConfig));

app.use(express.json());

// quick sanity checks
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: "Ol' Time Muscle API is alive" });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await testDB();
    res.json({ ok: true });
  } catch (err) {
    console.error('DB health check failed:', err);
    res.status(500).json({ ok: false, error: err?.message || 'DB check failed' });
  }
});

// mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// eras = left dropdown (1960s, 1970s, etc)
app.use('/api/eras', erasRoutes);

// vehicles list + detail
app.use('/api/vehicles', vehiclesRoutes);

// comments + replies thread
app.use('/api/comments', commentsRoutes);

// keep categories ONLY if you still use it anywhere.
// if you fully switched to eras, you can remove this later.
app.use('/api/categories', categoriesRoutes);

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('CLIENT_ORIGIN:', CLIENT_ORIGIN);
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);

  await testDB();
});
