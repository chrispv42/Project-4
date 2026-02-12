import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/by-vehicle/:vehicleId', async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);

  const [questions] = await pool.execute(
    `SELECT q.id, q.title, q.body, q.created_at, u.username
     FROM questions q
     JOIN users u ON u.id = q.user_id
     WHERE q.vehicle_id = ?
     ORDER BY q.created_at DESC`,
    [vehicleId]
  );

  res.json(questions);
});

router.post('/', requireAuth, async (req, res) => {
  const { vehicleId, title, body } = req.body || {};
  if (!vehicleId) return res.status(400).json({ error: 'vehicleId required' });
  if (!title || title.length < 4) return res.status(400).json({ error: 'Title must be 4+ chars' });
  if (!body || body.length < 10) return res.status(400).json({ error: 'Body must be 10+ chars' });

  const [result] = await pool.execute(
    'INSERT INTO questions (vehicle_id, user_id, title, body) VALUES (?, ?, ?, ?)',
    [Number(vehicleId), req.user.id, title, body]
  );

  res.json({ id: result.insertId });
});

router.get('/:questionId/answers', async (req, res) => {
  const questionId = Number(req.params.questionId);
  const [rows] = await pool.execute(
    `SELECT a.id, a.body, a.created_at, u.username
     FROM answers a
     JOIN users u ON u.id = a.user_id
     WHERE a.question_id = ?
     ORDER BY a.created_at ASC`,
    [questionId]
  );
  res.json(rows);
});

router.post('/:questionId/answers', requireAuth, async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { body } = req.body || {};
  if (!body || body.length < 2) return res.status(400).json({ error: 'Answer required' });

  const [result] = await pool.execute(
    'INSERT INTO answers (question_id, user_id, body) VALUES (?, ?, ?)',
    [questionId, req.user.id, body]
  );

  res.json({ id: result.insertId });
});

export default router;
