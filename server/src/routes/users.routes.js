import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';

const router = Router();

router.get('/me/garage', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, year, make, model, trim, notes, image_url, created_at
     FROM user_vehicles
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

router.post('/me/garage', requireAuth, async (req, res) => {
  const { year, make, model, trim, notes, imageUrl } = req.body || {};
  if (!year || !make || !model) return res.status(400).json({ error: 'year/make/model required' });

  const [result] = await pool.execute(
    `INSERT INTO user_vehicles (user_id, year, make, model, trim, notes, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, Number(year), make, model, trim || null, notes || null, imageUrl || null]
  );

  res.json({ id: result.insertId });
});

export default router;
