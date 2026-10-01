// Local database: a SQLite file via Node's built-in node:sqlite. Used by `npm run dev` / `npm start`.
// Never imported by the Netlify function (Netlify's runtime may not have node:sqlite).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEEP_BACKUPS = 14;

export function openLocalDb(dataDir = process.env.ASCEND_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data')) {
  const backupDir = join(dataDir, 'backups');
  mkdirSync(backupDir, { recursive: true });
  const path = join(dataDir, 'ascend.db');
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  return {
    label: path,
    async all(sql, args = []) { return db.prepare(sql).all(...args); },
    async get(sql, args = []) { return db.prepare(sql).get(...args) ?? null; },
    async run(sql, args = []) { return { changes: Number(db.prepare(sql).run(...args).changes) }; },
    /** Runs statements in one transaction; returns each statement's changes. */
    async batch(stmts) {
      db.exec('BEGIN');
      try {
        const out = stmts.map(({ sql, args = [] }) => Number(db.prepare(sql).run(...args).changes));
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    async exec(sql) { db.exec(sql); },

    /** Daily copy to data/backups/ascend-YYYY-MM-DD.db, keeping the last 14. */
    backupToday() {
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const file = join(backupDir, `ascend-${stamp}.db`);
      if (existsSync(file)) return;
      db.exec(`VACUUM INTO '${file.replaceAll("'", "''")}'`);
      readdirSync(backupDir).filter(f => /^ascend-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().slice(0, -KEEP_BACKUPS)
        .forEach(f => rmSync(join(backupDir, f)));
    },
  };
}
