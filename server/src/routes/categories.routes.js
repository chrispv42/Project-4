// server/src/routes/categories.routes.js
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Categories = eras (years/ranges) for now
// GET /api/categories
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id,
              name,
              slug,
              created_at
       FROM eras
       ORDER BY id ASC`
    );

    // Shape to what the client expects: { id, name, description }
    const out = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.slug ? `slug: ${r.slug}` : null,
      created_at: r.created_at,
    }));

    res.json(out);
  } catch (err) {
    console.error('GET /api/categories failed:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

export default router;
