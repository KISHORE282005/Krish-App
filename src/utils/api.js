// Client for the local database server (server/index.js).
// Writes go through a small persistent queue: if the server is briefly unreachable,
// they are kept in localStorage and re-sent automatically.

const TOKEN_KEY = 'ascend-token';
const QUEUE_KEY = 'ascend-pending';
const RETRY_MS = 5000;

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the database server. Is it running (npm run dev)?', 0);
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/login') { setToken(null); onUnauthorized(); }
  if (!res.ok) throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  return json;
}

/* ── auth ── */
export async function login(username, password) {
  const { token, user } = await request('POST', '/api/login', { username, password });
  setToken(token);
  return user;
}

export async function logout() {
  try { await request('POST', '/api/logout'); } catch { /* token is dropped either way */ }
  setToken(null);
  write(QUEUE_KEY, {});
}

export const me = () => request('GET', '/api/me').then(r => r.user);
export const fetchAll = () => request('GET', '/api/data');
export const importData = (payload) => request('POST', '/api/import', payload);

/* ── write queue ── */
let pending = read(QUEUE_KEY, {}); // { "entry|kind|date" | "setting|key": { path, body } }
let flushing = null;
let retryTimer = null;
const listeners = new Set();

export const pendingCount = () => Object.keys(pending).length;
export const onPendingChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach(fn => fn(pendingCount()));

function enqueue(id, path, body) {
  pending = { ...pending, [id]: { path, body } };
  write(QUEUE_KEY, pending);
  notify();
  return flush();
}

export function flush() {
  if (flushing) return flushing.then(() => (pendingCount() ? flush() : true));
  flushing = (async () => {
    for (const [id, { path, body }] of Object.entries(pending)) {
      try {
        await request('PUT', path, body);
        if (pending[id]?.body === body) { const { [id]: _, ...rest } = pending; pending = rest; }
      } catch (err) {
        if (err.status && err.status !== 401 && err.status < 500) { const { [id]: _, ...rest } = pending; pending = rest; } // bad request: drop
        else { clearTimeout(retryTimer); retryTimer = setTimeout(flush, RETRY_MS); break; }
      }
    }
    write(QUEUE_KEY, pending);
    notify();
    return pendingCount() === 0;
  })().finally(() => { flushing = null; });
  return flushing;
}

export const saveEntry = (kind, date, data) =>
  enqueue(`entry|${kind}|${date}`, `/api/entries/${kind}/${date}`, { data });

export const saveSetting = (key, value) =>
  enqueue(`setting|${key}`, `/api/settings/${key}`, { value });
