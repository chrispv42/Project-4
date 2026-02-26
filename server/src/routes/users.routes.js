// server/src/routes/users.routes.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { dbExecute } from '../db.js';

const router = Router();

function jsonError(res, status, error, extra = {}) {
  return res.status(status).json({ error, ...extra });
}

router.get('/me/garage', requireAuth, async (req, res) => {
  try {
    const [rows] = await dbExecute(
      `SELECT id, year, make, model, trim, notes, image_url, created_at
       FROM user_vehicles
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/users/me/garage failed:', err);
    return jsonError(res, 500, 'Failed to load garage');
  }
});

router.post('/me/garage', requireAuth, async (req, res) => {
  try {
    const { year, make, model, trim, notes, imageUrl } = req.body || {};

    const y = Number(year);
    const mk = String(make || '').trim();
    const md = String(model || '').trim();

    if (!Number.isFinite(y) || y < 1886 || y > 3000) {
      return jsonError(res, 400, 'year/make/model required', { field: 'year' });
    }
    if (!mk) return jsonError(res, 400, 'year/make/model required', { field: 'make' });
    if (!md) return jsonError(res, 400, 'year/make/model required', { field: 'model' });

    const [result] = await dbExecute(
      `INSERT INTO user_vehicles (user_id, year, make, model, trim, notes, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        y,
        mk,
        md,
        trim ? String(trim).trim() : null,
        notes ? String(notes) : null,
        imageUrl ? String(imageUrl) : null,
      ]
    );

    return res.json({ id: result.insertId });
  } catch (err) {
    console.error('POST /api/users/me/garage failed:', err);
    return jsonError(res, 500, 'Failed to add vehicle');
  }
});

export default router;
