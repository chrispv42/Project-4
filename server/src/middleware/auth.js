// server/src/middleware/auth.js
import jwt from 'jsonwebtoken';

function jsonError(res, status, error, extra = {}) {
  return res.status(status).json({ error, ...extra });
}

export function getAuthToken(req) {
  // Precedence: Bearer token first (SPA fetch patterns), then cookie token
  const header = req.headers?.authorization;

  if (typeof header === 'string' && header.trim()) {
    // Expected: "Bearer <token>"
    const parts = header.trim().split(/\s+/);
    if (parts.length === 2 && /^Bearer$/i.test(parts[0]) && parts[1]) {
      return parts[1].trim();
    }
  }

  const cookieToken = req.cookies?.token;
  if (typeof cookieToken === 'string' && cookieToken.trim()) return cookieToken.trim();

  return null;
}

export function requireAuth(req, res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return jsonError(res, 500, 'Server misconfigured', {
        hint: 'JWT_SECRET is not set',
      });
    }

    const token = getAuthToken(req);
    if (!token) return jsonError(res, 401, 'Not authenticated');

    // Lock down accepted algorithms (assumes you sign with HS256)
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

    const userId = Number(payload?.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      return jsonError(res, 401, 'Invalid session');
    }

    // Contract: req.user.id MUST be a finite integer
    req.user = {
      id: userId,
      username: typeof payload?.username === 'string' ? payload.username : undefined,
    };

    return next();
  } catch (_err) {
    return jsonError(res, 401, 'Invalid session');
  }
}
