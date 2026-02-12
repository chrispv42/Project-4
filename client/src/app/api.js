const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include'
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(data?.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
