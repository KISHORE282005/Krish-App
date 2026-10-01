// Ascend API – one handler for both the local server and the Netlify function.
//   GET  /api/health
//   POST /api/login            { username, password } → { token, user }
//   POST /api/logout
//   GET  /api/me
//   GET  /api/data             → { entries: { kind: { date: data } }, settings }
//   PUT  /api/entries/:kind/:date   { data }
//   PUT  /api/settings/:key         { value }
//   POST /api/import           { entries, settings }  (insert-only, never overwrites)
import { createStore, ENTRY_KINDS, SETTING_KEYS } from './store.js';

const MAX_BODY = 5 * 1024 * 1024;
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

async function readJson(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) throw new HttpError(413, 'Body too large');
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Invalid JSON'); }
}

/**
 * @param openDb () => adapter   – called once, lazily (keeps cold starts cheap and lets
 *                                 a missing-config error surface as a clear JSON message)
 * @returns (request: Request, ip: string) => Promise<Response>
 */
export function createApiHandler(openDb) {
  let storePromise = null;
  const getStore = () => {
    storePromise ??= Promise.resolve().then(openDb).then(createStore);
    storePromise.catch(() => { storePromise = null; }); // retry init on next request
    return storePromise;
  };

  async function route(request, ip) {
    const path = new URL(request.url).pathname.replace(/\/+$/, '');
    const method = request.method;

    if (path === '/api/health') {
      await getStore();
      return json(200, { ok: true });
    }

    const store = await getStore();

    if (path === '/api/login' && method === 'POST') {
      const wait = await store.lockedSeconds(ip);
      if (wait) return json(429, { error: `Too many attempts. Try again in ${wait}s.` });
      const { username = '', password = '' } = await readJson(request);
      const session = await store.login(username, password);
      if (!session) { await store.recordFailure(ip); return json(401, { error: 'Wrong username or password.' }); }
      await store.clearFailures(ip);
      return json(200, session);
    }

    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || null;
    const user = await store.userForToken(token);
    if (!user) return json(401, { error: 'Not logged in.' });

    if (path === '/api/logout' && method === 'POST') { await store.logout(token); return json(200, { ok: true }); }
    if (path === '/api/me' && method === 'GET') return json(200, { user });
    if (path === '/api/data' && method === 'GET') return json(200, await store.getAllData(user.id));

    let m = path.match(/^\/api\/entries\/([a-z_]+)\/(\d{4}-\d{2}-\d{2})$/);
    if (m && method === 'PUT') {
      const [, kind, date] = m;
      if (!ENTRY_KINDS.includes(kind)) return json(400, { error: `Unknown kind "${kind}".` });
      const { data } = await readJson(request);
      if (data === undefined) return json(400, { error: 'Missing "data".' });
      await store.saveEntry(user.id, kind, date, data);
      return json(200, { ok: true });
    }

    m = path.match(/^\/api\/settings\/([A-Za-z]+)$/);
    if (m && method === 'PUT') {
      if (!SETTING_KEYS.includes(m[1])) return json(400, { error: `Unknown setting "${m[1]}".` });
      const { value } = await readJson(request);
      await store.saveSetting(user.id, m[1], value);
      return json(200, { ok: true });
    }

    if (path === '/api/import' && method === 'POST') {
      const added = await store.importData(user.id, await readJson(request), isValidDate);
      return json(200, { ok: true, added });
    }

    return json(404, { error: 'Not found.' });
  }

  return async (request, ip = 'unknown') => {
    try {
      return await route(request, ip);
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.message });
      console.error('[ascend]', err);
      if (/TURSO_(DATABASE_URL|AUTH_TOKEN) is not set/.test(err.message)) {
        return json(500, { error: `Database not configured. ${err.message} Add both in Netlify (Functions scope), then redeploy.` });
      }
      // Turso reachable but rejected the token / database missing: say so instead of a generic error.
      if (/401|403|unauthori[sz]ed|forbidden/i.test(err.message)) {
        return json(500, { error: 'Turso rejected the auth token. Create a new token (read & write) and update TURSO_AUTH_TOKEN, then redeploy.' });
      }
      if (/\b404\b|not found/i.test(err.message)) {
        return json(500, { error: 'Turso database not found. Check TURSO_DATABASE_URL (libsql://<db>-<org>.turso.io), then redeploy.' });
      }
      return json(500, { error: 'Server error.' });
    }
  };
}
