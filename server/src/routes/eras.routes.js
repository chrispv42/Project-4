import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/eras
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, created_at
       FROM eras
       ORDER BY created_at ASC, id ASC`
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/eras failed:', err);
    res.status(500).json({ error: 'Failed to load eras' });
  }
});

export default router;
