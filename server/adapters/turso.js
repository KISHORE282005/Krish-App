// Cloud database: Turso (libSQL) over HTTP. Used on Netlify, and locally when TURSO_DATABASE_URL is set.
import { createClient } from '@libsql/client/web';

export function openTursoDb(url = process.env.TURSO_DATABASE_URL?.trim(), authToken = process.env.TURSO_AUTH_TOKEN?.trim()) {
  if (!url) {
    // Names only (never values), so a typo or missing scope is easy to spot in the error.
    const seen = Object.keys(process.env).filter(k => /turso|libsql|database_url|auth_token/i.test(k));
    throw new Error(`TURSO_DATABASE_URL is not set. Variables the function can see: ${seen.length ? seen.map(k => JSON.stringify(k)).join(', ') : 'none matching TURSO'}.`);
  }
  if (!authToken) throw new Error('TURSO_AUTH_TOKEN is not set.');
  // libsql:// works over websockets only in Node; the web client needs https://
  const client = createClient({ url: url.replace(/^libsql:\/\//, 'https://'), authToken });
  const rows = (rs) => rs.rows.map(r => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])));

  return {
    label: url,
    async all(sql, args = []) { return rows(await client.execute({ sql, args })); },
    async get(sql, args = []) { return rows(await client.execute({ sql, args }))[0] ?? null; },
    async run(sql, args = []) { return { changes: (await client.execute({ sql, args })).rowsAffected }; },
    async batch(stmts) {
      const results = await client.batch(stmts.map(({ sql, args = [] }) => ({ sql, args })), 'write');
      return results.map(r => r.rowsAffected);
    },
    async exec(sql) { await client.executeMultiple(sql); },
    backupToday() { /* Turso keeps its own point-in-time backups */ },
  };
}
