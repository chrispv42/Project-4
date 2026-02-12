import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, description FROM categories ORDER BY sort_order ASC, name ASC'
  );
  res.json(rows);
});

export default router;
