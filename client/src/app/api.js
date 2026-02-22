// client/src/app/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ include auth cookie set by server
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: attach token automatically if you also support token auth.
// Safe to keep even if you're currently cookie-only.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('otm_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Backward-compatible wrapper:
 * api(path, { method, body, data, headers })
 *
 * - If `body` is provided as a string, we'll attempt to JSON.parse it.
 * - If `body` is provided as an object, we send it directly.
 * - If `data` is provided, it wins when `body` is not provided.
 */
export async function api(path, options = {}) {
  const method = String(options.method || 'GET').toLowerCase();

  let data = undefined;

  if (options.body !== undefined) {
    if (typeof options.body === 'string') {
      // Try parse JSON strings (matches old fetch style)
      try {
        data = JSON.parse(options.body);
      } catch {
        // If it's not valid JSON, send as-is (rare, but prevents hard crashes)
        data = options.body;
      }
    } else {
      // Allow passing objects directly
      data = options.body;
    }
  } else if (options.data !== undefined) {
    data = options.data;
  }

  try {
    const res = await client.request({
      url: path,
      method,
      data,
      headers: options.headers || {},
    });

    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const payload = err?.response?.data;

    const msg = payload?.error || payload?.message || err?.message || 'Request failed';

    const e = new Error(msg);
    e.status = status;
    e.data = payload;
    throw e;
  }
}
