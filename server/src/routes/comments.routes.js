// server/src/routes/comments.routes.js
import { Router } from 'express';
import { dbExecute } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function jsonError(res, status, error, extra = {}) {
  return res.status(status).json({ error, ...extra });
}

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildThread(rows) {
  const byId = new Map();
  const roots = [];

  for (const r of rows) {
    const node = {
      id: r.id,
      post_id: r.post_id ?? null,
      vehicle_id: r.vehicle_id ?? null,
      user_id: r.user_id,
      username: r.username,
      body: r.body,
      created_at: r.created_at,
      parent_comment_id: r.parent_comment_id ?? null,
      replies: [],
    };
    byId.set(node.id, node);
  }

  for (const node of byId.values()) {
    if (node.parent_comment_id && byId.has(node.parent_comment_id)) {
      byId.get(node.parent_comment_id).replies.push(node);
    } else {
      roots.push(node);
    }
  }

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
router.get('/by-vehicle/:vehicleId', async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  if (!Number.isFinite(vehicleId)) return jsonError(res, 400, 'Invalid vehicleId');

  try {
    const [rows] = await dbExecute(
      `SELECT c.id,
              c.post_id,
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

    return res.json(rows);
  } catch (err) {
    console.error('GET /api/comments/by-vehicle failed:', err);
    return jsonError(res, 500, 'Failed to load comments');
  }
});

// GET /api/comments/thread/by-vehicle/:vehicleId
router.get('/thread/by-vehicle/:vehicleId', async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  if (!Number.isFinite(vehicleId)) return jsonError(res, 400, 'Invalid vehicleId');

  try {
    const [rows] = await dbExecute(
      `SELECT c.id,
              c.post_id,
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

    return res.json(buildThread(rows));
  } catch (err) {
    console.error('GET /api/comments/thread/by-vehicle failed:', err);
    return jsonError(res, 500, 'Failed to load comments thread');
  }
});

// GET /api/comments/:commentId/replies
router.get('/:commentId/replies', async (req, res) => {
  const commentId = Number(req.params.commentId);
  if (!Number.isFinite(commentId)) return jsonError(res, 400, 'Invalid commentId');

  try {
    const [rows] = await dbExecute(
      `SELECT c.id,
              c.post_id,
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

    return res.json(rows);
  } catch (err) {
    console.error('GET /api/comments/:commentId/replies failed:', err);
    return jsonError(res, 500, 'Failed to load replies');
  }
});

//  - vehicle thread: { vehicleId, body, parentCommentId? }
//  - posts thread:   { postId, body, parentCommentId? }
router.post('/', requireAuth, async (req, res) => {
  const { vehicleId, postId, body, parentCommentId } = req.body || {};

  const vId = toNumberOrNull(vehicleId);
  const pId = toNumberOrNull(postId);
  const parentId = toNumberOrNull(parentCommentId);
  const text = String(body ?? '').trim();

  if (!vId && !pId) return jsonError(res, 400, 'vehicleId or postId required');
  if (vId && pId) return jsonError(res, 400, 'Provide only one: vehicleId or postId');
  if (text.length < 2) return jsonError(res, 400, 'Comment must be 2+ chars');

  try {
    // Validate target exists
    if (vId) {
      const [vRows] = await dbExecute(`SELECT id FROM vehicles WHERE id = ? LIMIT 1`, [vId]);
      if (!vRows?.length) return jsonError(res, 404, 'Vehicle not found');
    }

    if (pId) {
      const [pRows] = await dbExecute(`SELECT id FROM posts WHERE id = ? LIMIT 1`, [pId]);
      if (!pRows?.length) return jsonError(res, 404, 'Post not found');
    }

    if (parentId) {
      const [parentRows] = await dbExecute(
        `SELECT id, vehicle_id, post_id FROM comments WHERE id = ? LIMIT 1`,
        [parentId]
      );

      const parent = parentRows?.[0];
      if (!parent) return jsonError(res, 404, 'Parent comment not found');

      const sameVehicle =
        (parent.vehicle_id == null && vId == null) || Number(parent.vehicle_id) === Number(vId);
      const samePost =
        (parent.post_id == null && pId == null) || Number(parent.post_id) === Number(pId);

      if (!sameVehicle || !samePost) {
        return jsonError(res, 400, 'Parent comment belongs to a different thread');
      }
    }

    const [result] = await dbExecute(
      `INSERT INTO comments (post_id, vehicle_id, user_id, parent_comment_id, body)
       VALUES (?, ?, ?, ?, ?)`,
      [pId, vId, req.user.id, parentId, text]
    );

    return res.json({ id: result.insertId });
  } catch (err) {
    console.error('POST /api/comments failed:', err);

    if (err?.db?.kind === 'fk') {
      return jsonError(res, 400, 'Invalid reference');
    }

    return jsonError(res, 500, 'Failed to post comment');
  }
});

export default router;
