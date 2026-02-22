// server/src/routes/comments.routes.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildThread(rows) {
  // rows are expected to include: id, parent_comment_id, body, created_at, username, user_id
  const byId = new Map();
  const roots = [];

  // normalize + init replies array
  for (const r of rows) {
    const node = {
      id: r.id,
      vehicle_id: r.vehicle_id,
      user_id: r.user_id,
      username: r.username,
      body: r.body,
      created_at: r.created_at,
      parent_comment_id: r.parent_comment_id ?? null,
      replies: [],
    };
    byId.set(node.id, node);
  }

  // attach to parent if exists
  for (const node of byId.values()) {
    if (node.parent_comment_id && byId.has(node.parent_comment_id)) {
      byId.get(node.parent_comment_id).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  // sort newest-first for root + replies (feel free to flip if you want oldest-first)
  const sortDesc = (a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  };

  function sortTree(list) {
    list.sort(sortDesc);
    for (const n of list) sortTree(n.replies);
  }

  sortTree(roots);
  return roots;
}

// GET /api/comments/by-vehicle/:vehicleId
// Backward-friendly: returns a FLAT array including parent_comment_id (so client can thread if desired)
router.get('/by-vehicle/:vehicleId', async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  if (!Number.isFinite(vehicleId)) return res.status(400).json({ error: 'Invalid vehicleId' });

  try {
    const [rows] = await pool.execute(
      `SELECT c.id,
              c.vehicle_id,
              c.user_id,
              c.parent_comment_id,
              c.body,
              c.created_at,
              u.username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.vehicle_id = ?
       ORDER BY c.created_at DESC`,
      [vehicleId]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/comments/by-vehicle failed:', err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// GET /api/comments/thread/by-vehicle/:vehicleId
// Returns nested structure: [{...comment, replies:[...]}]
router.get('/thread/by-vehicle/:vehicleId', async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  if (!Number.isFinite(vehicleId)) return res.status(400).json({ error: 'Invalid vehicleId' });

  try {
    const [rows] = await pool.execute(
      `SELECT c.id,
              c.vehicle_id,
              c.user_id,
              c.parent_comment_id,
              c.body,
              c.created_at,
              u.username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.vehicle_id = ?`,
      [vehicleId]
    );

    res.json(buildThread(rows));
  } catch (err) {
    console.error('GET /api/comments/thread/by-vehicle failed:', err);
    res.status(500).json({ error: 'Failed to load comments thread' });
  }
});

// GET /api/comments/:commentId/replies
router.get('/:commentId/replies', async (req, res) => {
  const commentId = Number(req.params.commentId);
  if (!Number.isFinite(commentId)) return res.status(400).json({ error: 'Invalid commentId' });

  try {
    const [rows] = await pool.execute(
      `SELECT c.id,
              c.vehicle_id,
              c.user_id,
              c.parent_comment_id,
              c.body,
              c.created_at,
              u.username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.parent_comment_id = ?
       ORDER BY c.created_at ASC`,
      [commentId]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/comments/:commentId/replies failed:', err);
    res.status(500).json({ error: 'Failed to load replies' });
  }
});

// POST /api/comments
// Supports:
//  - top-level comment: { vehicleId, body }
//  - reply: { vehicleId, body, parentCommentId }
router.post('/', requireAuth, async (req, res) => {
  const { vehicleId, body, parentCommentId } = req.body || {};
  const vId = Number(vehicleId);
  const text = String(body ?? '').trim();
  const parentId = toNumberOrNull(parentCommentId);

  if (!Number.isFinite(vId)) return res.status(400).json({ error: 'vehicleId required' });
  if (text.length < 2) return res.status(400).json({ error: 'Comment must be 2+ chars' });

  try {
    // If replying, ensure parent exists + is on same vehicle (prevents cross-vehicle thread corruption)
    if (parentId) {
      const [parentRows] = await pool.execute(
        `SELECT id, vehicle_id FROM comments WHERE id = ? LIMIT 1`,
        [parentId]
      );

      const parent = parentRows?.[0];
      if (!parent) return res.status(400).json({ error: 'Parent comment not found' });
      if (Number(parent.vehicle_id) !== vId)
        return res.status(400).json({ error: 'Parent comment belongs to a different vehicle' });
    }

    const [result] = await pool.execute(
      `INSERT INTO comments (vehicle_id, user_id, parent_comment_id, body)
       VALUES (?, ?, ?, ?)`,
      [vId, req.user.id, parentId, text]
    );

    res.json({ id: result.insertId });
  } catch (err) {
    console.error('POST /api/comments failed:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

export default router;
