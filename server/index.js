// Ascend API server – stores everything in data/ascend.db.
//   GET  /api/health
//   POST /api/login            { username, password } → { token, user }
//   POST /api/logout
//   GET  /api/me
//   GET  /api/data             → { entries: { kind: { date: data } }, settings }
//   PUT  /api/entries/:kind/:date   { data }
//   PUT  /api/settings/:key         { value }
//   POST /api/import           { entries, settings }  (insert-only, never overwrites)
// Anything else is served from dist/ so `npm start` runs the whole app from one port.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as store from './db.js';

const PORT = Number(process.env.PORT) || 5174;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const SETTING_KEYS = ['dailyFocus', 'lifeGoals', 'missionStatement', 'userName'];
const MAX_BODY = 5 * 1024 * 1024;

const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

/* ── Login throttling: 5 wrong passwords → 1 minute lockout per IP ── */
const failures = new Map();
const LOCK_AFTER = 5, LOCK_MS = 60_000;
const lockedFor = (ip) => {
  const f = failures.get(ip);
  return f && f.count >= LOCK_AFTER ? Math.max(0, f.until - Date.now()) : 0;
};
const recordFailure = (ip) => {
  const f = failures.get(ip) || { count: 0, until: 0 };
  f.count = f.until && Date.now() > f.until ? 1 : f.count + 1;
  if (f.count >= LOCK_AFTER) f.until = Date.now() + LOCK_MS;
  failures.set(ip, f);
};

/* ── helpers ── */
const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

const readJson = (req) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', c => {
    size += c.length;
    if (size > MAX_BODY) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); }
    else chunks.push(c);
  });
  req.on('end', () => {
    try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
    catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
  });
  req.on('error', reject);
});

const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
};

async function serveStatic(req, res) {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(DIST, url));
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'Forbidden' });
  try {
    if (!(await stat(file)).isFile()) throw new Error();
  } catch {
    file = join(DIST, 'index.html'); // SPA fallback
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    send(res, 404, { error: 'Not built yet – run `npm run build`, or use `npm run dev`.' });
  }
}

/* ── routes ── */
async function handleApi(req, res, path) {
  const ip = req.socket.remoteAddress;

  if (path === '/api/health') return send(res, 200, { ok: true });

  if (path === '/api/login' && req.method === 'POST') {
    const wait = lockedFor(ip);
    if (wait) return send(res, 429, { error: `Too many attempts. Try again in ${Math.ceil(wait / 1000)}s.` });
    const { username = '', password = '' } = await readJson(req);
    const session = store.login(username, password);
    if (!session) { recordFailure(ip); return send(res, 401, { error: 'Wrong username or password.' }); }
    failures.delete(ip);
    return send(res, 200, session);
  }

  const token = bearer(req);
  const user = store.userForToken(token);
  if (!user) return send(res, 401, { error: 'Not logged in.' });

  if (path === '/api/logout' && req.method === 'POST') { store.logout(token); return send(res, 200, { ok: true }); }
  if (path === '/api/me' && req.method === 'GET') return send(res, 200, { user });
  if (path === '/api/data' && req.method === 'GET') return send(res, 200, store.getAllData(user.id));

  let m = path.match(/^\/api\/entries\/([a-z_]+)\/(\d{4}-\d{2}-\d{2})$/);
  if (m && req.method === 'PUT') {
    const [, kind, date] = m;
    if (!store.ENTRY_KINDS.includes(kind)) return send(res, 400, { error: `Unknown kind "${kind}".` });
    const { data } = await readJson(req);
    if (data === undefined) return send(res, 400, { error: 'Missing "data".' });
    store.saveEntry(user.id, kind, date, data);
    return send(res, 200, { ok: true });
  }

  m = path.match(/^\/api\/settings\/([A-Za-z]+)$/);
  if (m && req.method === 'PUT') {
    if (!SETTING_KEYS.includes(m[1])) return send(res, 400, { error: `Unknown setting "${m[1]}".` });
    const { value } = await readJson(req);
    store.saveSetting(user.id, m[1], value);
    return send(res, 200, { ok: true });
  }

  if (path === '/api/import' && req.method === 'POST') {
    const body = await readJson(req);
    const settings = Object.fromEntries(Object.entries(body.settings || {}).filter(([k]) => SETTING_KEYS.includes(k)));
    const added = store.importData(user.id, { entries: body.entries, settings }, isValidDate);
    return send(res, 200, { ok: true, added });
  }

  return send(res, 404, { error: 'Not found.' });
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  try {
    if (path.startsWith('/api/')) await handleApi(req, res, path);
    else await serveStatic(req, res);
  } catch (err) {
    console.error('[ascend]', err);
    if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : 'Server error.' });
  }
});

store.backupToday();
setInterval(() => store.backupToday(), 60 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`[ascend] database: ${store.DB_PATH}`);
  console.log(`[ascend] API listening on http://localhost:${PORT}`);
});
