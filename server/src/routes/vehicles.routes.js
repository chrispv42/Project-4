import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/by-category/:categoryId', async (req, res) => {
  const categoryId = Number(req.params.categoryId);
  const [rows] = await pool.execute(
    `SELECT id, year, make, model, trim, horsepower, image_url, created_at
     FROM vehicles
     WHERE category_id = ?
     ORDER BY created_at DESC`,
    [categoryId]
  );
  res.json(rows);
});

export default router;
