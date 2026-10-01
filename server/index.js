// Local server for `npm run dev` / `npm start`.
// /api/* goes to the shared handler (server/api.js); everything else is served from dist/.
// Database: Turso if TURSO_DATABASE_URL is set (e.g. in .env), otherwise data/ascend.db.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiHandler } from './api.js';
import { openDb } from './open-db.js';

const PORT = Number(process.env.PORT) || 5174;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const db = await openDb();
const handleApi = createApiHandler(() => db);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
};

async function serveStatic(req, res) {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = normalize(join(DIST, url));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
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
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not built yet – run `npm run build`, or use `npm run dev`.');
  }
}

/** Node request → web Request → shared handler → Node response. */
async function proxyToApi(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(new URL(req.url, `http://${req.headers.host || 'localhost'}`), {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await handleApi(request, req.socket.remoteAddress);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

const server = createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) await proxyToApi(req, res);
    else await serveStatic(req, res);
  } catch (err) {
    console.error('[ascend]', err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }).end('{"error":"Server error."}');
  }
});

db.backupToday();
setInterval(() => db.backupToday(), 60 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`[ascend] database: ${db.label}`);
  console.log(`[ascend] API listening on http://localhost:${PORT}`);
});
