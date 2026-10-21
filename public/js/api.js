// Shared fetch helper for the PHP backend (backend/*.php).
// Endpoints return JSON like { success: true, data: ... }.
// Adjust API_BASE to match how the site is served.
const API_BASE = '/backend/';

async function apiRequest(method, endpoint, body) {
  // Show the spinner only if the request takes a moment
  const timer = typeof setLoading === 'function'
    ? setTimeout(() => setLoading(true), 150)
    : null;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      data = null;
    }

    if (!res.ok || !data || data.success !== true) {
      throw new Error((data && data.message) || `Request failed (${res.status})`);
    }

    return data;
  } finally {
    if (timer) {
      clearTimeout(timer);
      setLoading(false);
    }
  }
}

const api = {
  get: (endpoint) => apiRequest('GET', endpoint),
  post: (endpoint, body) => apiRequest('POST', endpoint, body),
  put: (endpoint, body) => apiRequest('PUT', endpoint, body),
  del: (endpoint) => apiRequest('DELETE', endpoint)
};
