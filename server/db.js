// SQLite storage for Ascend (Node's built-in node:sqlite – no native deps).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const DATA_DIR = process.env.ASCEND_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const KEEP_BACKUPS = 14;

// Default account. Only the salted scrypt hash is stored here, never the password.
const SEED_USER = {
  username: 'krish',
  displayName: 'Krish',
  passwordHash: 'c3e63c85c5af47013d221e979aac9fe3:3564f409a85d55f81d7b0146e9e5cbb2c20080cb67e3c3a29365a3e7487a154ab1842ed2c98b0bf2e5bbafbc1f0f3e27f87eeb9d6656fb99e64415a9121d8316',
};

// What a client may store per day. Anything else is rejected.
export const ENTRY_KINDS = ['journal', 'tasks', 'notes', 'habits_legacy'];

mkdirSync(BACKUP_DIR, { recursive: true });
export const DB_PATH = join(DATA_DIR, 'ascend.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  -- One row per (user, kind, day): journal entry, planner ticks, planner notes…
  CREATE TABLE IF NOT EXISTS entries (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    date       TEXT NOT NULL,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, kind, date)
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key        TEXT NOT NULL,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, key)
  );
`);

if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  db.prepare('INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)')
    .run(SEED_USER.username, SEED_USER.displayName, SEED_USER.passwordHash);
}
db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();

/* ── Daily backup: data/backups/ascend-YYYY-MM-DD.db, keeps the last 14 ── */
export function backupToday() {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const file = join(BACKUP_DIR, `ascend-${stamp}.db`);
  if (existsSync(file)) return;
  db.exec(`VACUUM INTO '${file.replaceAll("'", "''")}'`);
  const old = readdirSync(BACKUP_DIR).filter(f => /^ascend-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().slice(0, -KEEP_BACKUPS);
  old.forEach(f => rmSync(join(BACKUP_DIR, f)));
}

/* ── Auth ── */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function login(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!user || !verifyPassword(String(password), user.password_hash)) return null;
  const token = randomBytes(32).toString('hex');
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+90 days'))").run(token, user.id);
  return { token, user: publicUser(user) };
}

export function userForToken(token) {
  if (!token) return null;
  const user = db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')`).get(token);
  return user ? publicUser(user) : null;
}

export function logout(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function setPassword(username, password) {
  return db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hashPassword(password), username).changes > 0;
}

const publicUser = (u) => ({ id: u.id, username: u.username, displayName: u.display_name });

/* ── Data ── */
export function getAllData(userId) {
  const entries = Object.fromEntries(ENTRY_KINDS.map(k => [k, {}]));
  for (const row of db.prepare('SELECT kind, date, data FROM entries WHERE user_id = ?').all(userId)) {
    if (entries[row.kind]) entries[row.kind][row.date] = JSON.parse(row.data);
  }
  const settings = {};
  for (const row of db.prepare('SELECT key, value FROM settings WHERE user_id = ?').all(userId)) {
    settings[row.key] = JSON.parse(row.value);
  }
  return { entries, settings };
}

const upsertEntry = db.prepare(`
  INSERT INTO entries (user_id, kind, date, data) VALUES (?, ?, ?, ?)
  ON CONFLICT (user_id, kind, date) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`);
const insertEntryIfMissing = db.prepare('INSERT OR IGNORE INTO entries (user_id, kind, date, data) VALUES (?, ?, ?, ?)');
const upsertSetting = db.prepare(`
  INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
  ON CONFLICT (user_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`);
const insertSettingIfMissing = db.prepare('INSERT OR IGNORE INTO settings (user_id, key, value) VALUES (?, ?, ?)');

export function saveEntry(userId, kind, date, data) {
  upsertEntry.run(userId, kind, date, JSON.stringify(data));
}

export function saveSetting(userId, key, value) {
  upsertSetting.run(userId, key, JSON.stringify(value));
}

// Bulk import of browser data. Never overwrites what the database already has.
export function importData(userId, { entries = {}, settings = {} }, isValidDate) {
  let added = 0;
  db.exec('BEGIN');
  try {
    for (const kind of ENTRY_KINDS) {
      for (const [date, data] of Object.entries(entries[kind] || {})) {
        if (isValidDate(date) && data != null) added += insertEntryIfMissing.run(userId, kind, date, JSON.stringify(data)).changes;
      }
    }
    for (const [key, value] of Object.entries(settings)) {
      if (value != null) added += insertSettingIfMissing.run(userId, key, JSON.stringify(value)).changes;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return added;
}
