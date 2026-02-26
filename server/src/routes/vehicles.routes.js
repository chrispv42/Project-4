// server/src/routes/vehicles.routes.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanStr(v, max = 255) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}

function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ============================
   Uploads (multer)
   ============================ */

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const vehicleId = String(req.params.id || 'unknown');
    const dir = path.join(process.cwd(), 'uploads', 'vehicles', vehicleId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const base = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    cb(null, `${base}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    const ok = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
    ].includes(file.mimetype);

    if (!ok) return cb(new Error('Only image files are allowed.'));
    cb(null, true);
  },
});

/* ============================
   Routes
   ============================ */

// GET /api/vehicles/by-era/:eraId
router.get('/by-era/:eraId', async (req, res) => {
  const eraId = Number(req.params.eraId);
  if (!Number.isFinite(eraId)) return res.status(400).json({ error: 'Invalid eraId' });

  try {
    const [rows] = await pool.execute(
      `SELECT
         v.id,
         v.year,
         v.make,
         v.model,
         v.trim,
         v.engine,
         v.horsepower,
         v.transmission,
         v.color,
         v.created_at,
         (
           SELECT vp.url
           FROM vehicle_photos vp
           WHERE vp.vehicle_id = v.id
           ORDER BY vp.created_at DESC, vp.id DESC
           LIMIT 1
         ) AS image_url
       FROM vehicles v
       WHERE v.era_id = ?
       ORDER BY v.created_at DESC`,
      [eraId]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /api/vehicles/by-era failed:', err);
    res.status(500).json({ error: 'Failed to load vehicles' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid vehicle id' });

  try {
    const [rows] = await pool.execute(
      `SELECT
         v.id,
         v.user_id,
         v.era_id,
         v.year,
         v.make,
         v.model,
         v.trim,
         v.engine,
         v.horsepower,
         v.transmission,
         v.color,
         v.notes,
         v.created_at,
         (
           SELECT vp.url
           FROM vehicle_photos vp
           WHERE vp.vehicle_id = v.id
           ORDER BY vp.created_at DESC, vp.id DESC
           LIMIT 1
         ) AS image_url
       FROM vehicles v
       WHERE v.id = ?
       LIMIT 1`,
      [id]
    );

    const vehicle = rows?.[0];
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    res.json(vehicle);
  } catch (err) {
    console.error('GET /api/vehicles/:id failed:', err);
    res.status(500).json({ error: 'Failed to load vehicle' });
  }
});

/**
 * POST /api/vehicles
 * Create a vehicle (auth required)
 * Body:
 *  { eraId, year, make, model, trim?, engine?, horsepower?, transmission?, color?, notes? }
 */
router.post('/', requireAuth, async (req, res) => {
  const eraId = Number(req.body?.eraId);
  const year = Number(req.body?.year);

  const make = cleanStr(req.body?.make, 64);
  const model = cleanStr(req.body?.model, 64);
  const trim = cleanStr(req.body?.trim, 64) || null;
  const engine = cleanStr(req.body?.engine, 80) || null;
  const horsepower = toNumberOrNull(req.body?.horsepower);
  const transmission = cleanStr(req.body?.transmission, 60) || null;
  const color = cleanStr(req.body?.color, 40) || null;
  const notesRaw = String(req.body?.notes ?? '').trim();
  const notes = notesRaw ? notesRaw.slice(0, 5000) : null;

  if (!Number.isFinite(eraId)) return res.status(400).json({ error: 'eraId required' });
  if (!Number.isFinite(year) || year < 1800 || year > 2200)
    return res.status(400).json({ error: 'year required (valid)' });
  if (!make || make.length < 2) return res.status(400).json({ error: 'make required' });
  if (!model || model.length < 1) return res.status(400).json({ error: 'model required' });

  try {
    // ensure era exists (clean error)
    const [eraRows] = await pool.execute(`SELECT id FROM eras WHERE id = ? LIMIT 1`, [eraId]);
    if (!eraRows?.length) return res.status(400).json({ error: 'Invalid eraId' });

    const [result] = await pool.execute(
      `INSERT INTO vehicles
        (user_id, era_id, year, make, model, trim, engine, horsepower, transmission, color, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, eraId, year, make, model, trim, engine, horsepower, transmission, color, notes]
    );

    res.json({ id: result.insertId });
  } catch (err) {
    console.error('POST /api/vehicles failed:', err);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

/**
 * POST /api/vehicles/:id/photos
 * Add a photo URL to vehicle_photos (auth required)
 * Body: { url, caption? }
 */
router.post('/:id/photos', requireAuth, async (req, res) => {
  const vehicleId = Number(req.params.id);
  if (!Number.isFinite(vehicleId)) return res.status(400).json({ error: 'Invalid vehicle id' });

  const url = cleanStr(req.body?.url, 500);
  const caption = cleanStr(req.body?.caption, 255) || null;

  if (!url) return res.status(400).json({ error: 'url required' });
  if (!isHttpUrl(url)) return res.status(400).json({ error: 'url must be http(s)' });

  try {
    // only allow owner to attach photos (simple rule)
    const [vRows] = await pool.execute(`SELECT id, user_id FROM vehicles WHERE id = ? LIMIT 1`, [
      vehicleId,
    ]);
    const v = vRows?.[0];
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    if (Number(v.user_id) !== Number(req.user.id))
      return res.status(403).json({ error: 'Not allowed' });

    const [result] = await pool.execute(
      `INSERT INTO vehicle_photos (vehicle_id, url, caption)
       VALUES (?, ?, ?)`,
      [vehicleId, url, caption]
    );

    res.json({ id: result.insertId, url });
  } catch (err) {
    console.error('POST /api/vehicles/:id/photos failed:', err);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

/**
 * POST /api/vehicles/:id/photos/upload
 * Multipart upload endpoint (auth required)
 * FormData:
 *  - file (image/*)
 *  - caption? (string)
 */
router.post('/:id/photos/upload', requireAuth, upload.single('file'), async (req, res) => {
  const vehicleId = Number(req.params.id);
  if (!Number.isFinite(vehicleId)) return res.status(400).json({ error: 'Invalid vehicle id' });
  if (!req.file) return res.status(400).json({ error: 'file required' });

  const caption = cleanStr(req.body?.caption, 255) || null;

  try {
    // only allow owner to attach photos (simple rule)
    const [vRows] = await pool.execute(`SELECT id, user_id FROM vehicles WHERE id = ? LIMIT 1`, [
      vehicleId,
    ]);
    const v = vRows?.[0];
    if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    if (Number(v.user_id) !== Number(req.user.id))
      return res.status(403).json({ error: 'Not allowed' });

    // public URL served by server/src/index.js
    const publicUrl = `/uploads/vehicles/${vehicleId}/${req.file.filename}`;

    const [result] = await pool.execute(
      `INSERT INTO vehicle_photos (vehicle_id, url, caption)
       VALUES (?, ?, ?)`,
      [vehicleId, publicUrl, caption]
    );

    res.json({ id: result.insertId, url: publicUrl });
  } catch (err) {
    console.error('POST /api/vehicles/:id/photos/upload failed:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

export default router;
