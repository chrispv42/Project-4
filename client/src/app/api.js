// client/src/app/api.js
import axios from 'axios';

const PROD_API = 'https://project-4-production-c453.up.railway.app';

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  // If someone pastes just the domain, make it valid.
  return `https://${raw}`;
}

const envBase = normalizeBaseUrl(process.env.REACT_APP_API_BASE);

const API_BASE =
  envBase || (process.env.NODE_ENV === 'production' ? PROD_API : 'http://localhost:4000');

// Shows only in browser console, not in API responses.
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[API_BASE]', API_BASE);
}

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // sends/receives auth cookie if server sets one
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// If there is also a token stored, send it too (works with server middleware).
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('otm_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Wrapper so pages can call api('/path', { method, body }) consistently.
export async function api(path, options = {}) {
  const method = String(options.method || 'GET').toLowerCase();

  let data;

  if (options.body !== undefined) {
    if (typeof options.body === 'string') {
      try {
        data = JSON.parse(options.body);
      } catch {
        data = options.body;
      }
    } else {
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

    const message = payload?.error || payload?.message || err?.message || 'Request failed';

    const e = new Error(message);
    e.status = status;
    e.data = payload;
    throw e;
  }
}
