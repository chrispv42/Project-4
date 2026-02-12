// server/src/index.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { pool, testDB } from './db.js';

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

// CORS for CRA (client runs on 3000)
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: false, // token auth = no cookies needed
  })
);

app.use(express.json());

// quick health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: "ol-time-muscle-api" });
});

// db test route
app.get('/api/health/db', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT CURRENT_USER() AS user, DATABASE() AS db, NOW() AS now;'
    );
    res.json({ ok: true, ...rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = Number(process.env.PORT || 5050);

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('CLIENT_ORIGIN:', CLIENT_ORIGIN);

  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);

  await testDB();
});
