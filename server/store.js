// Database logic shared by the local server and the Netlify function.
// `db` is an adapter from ./adapters (node-sqlite locally, Turso in the cloud).
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

// Default account. Only the salted scrypt hash is stored here, never the password.
const SEED_USER = {
  username: 'krish',
  displayName: 'Krish',
  passwordHash: 'c3e63c85c5af47013d221e979aac9fe3:3564f409a85d55f81d7b0146e9e5cbb2c20080cb67e3c3a29365a3e7487a154ab1842ed2c98b0bf2e5bbafbc1f0f3e27f87eeb9d6656fb99e64415a9121d8316',
};

// What a client may store per day. Anything else is rejected.
export const ENTRY_KINDS = ['journal', 'tasks', 'notes', 'habits_legacy'];
export const SETTING_KEYS = ['dailyFocus', 'lifeGoals', 'missionStatement', 'userName'];

const LOCK_AFTER = 5;          // wrong passwords in a row…
const LOCK_SECONDS = 60;       // …lock that IP for a minute

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name  TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  )`,
  // One row per (user, kind, day): journal entry, planner ticks, planner notes…
  `CREATE TABLE IF NOT EXISTS entries (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    date       TEXT NOT NULL,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, kind, date)
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key        TEXT NOT NULL,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, key)
  )`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    ip           TEXT PRIMARY KEY,
    failures     INTEGER NOT NULL,
    locked_until INTEGER NOT NULL DEFAULT 0
  )`,
];

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

const publicUser = (u) => ({ id: Number(u.id), username: u.username, displayName: u.display_name });

/** Creates tables, seeds the default user and returns the store API. */
export async function createStore(db) {
  await db.batch(SCHEMA.map(sql => ({ sql })));
  if (!(await db.get('SELECT 1 AS x FROM users LIMIT 1'))) {
    await db.run('INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)',
      [SEED_USER.username, SEED_USER.displayName, SEED_USER.passwordHash]);
  }
  await db.run("DELETE FROM sessions WHERE expires_at < datetime('now')");

  return {
    db,

    /* ── login throttling ── */
    async lockedSeconds(ip) {
      const row = await db.get('SELECT failures, locked_until FROM login_attempts WHERE ip = ?', [ip]);
      const now = Math.floor(Date.now() / 1000);
      return row && Number(row.failures) >= LOCK_AFTER && Number(row.locked_until) > now ? Number(row.locked_until) - now : 0;
    },
    async recordFailure(ip) {
      const now = Math.floor(Date.now() / 1000);
      // After a lockout has expired, start counting again from 1.
      await db.run(`
        INSERT INTO login_attempts (ip, failures, locked_until) VALUES (?, 1, 0)
        ON CONFLICT (ip) DO UPDATE SET
          failures = CASE WHEN locked_until > 0 AND locked_until <= ? THEN 1 ELSE failures + 1 END,
          locked_until = CASE
            WHEN locked_until > 0 AND locked_until <= ? THEN 0
            WHEN failures + 1 >= ? THEN ?
            ELSE locked_until END`,
        [ip, now, now, LOCK_AFTER, now + LOCK_SECONDS]);
    },
    async clearFailures(ip) { await db.run('DELETE FROM login_attempts WHERE ip = ?', [ip]); },

    /* ── auth ── */
    async login(username, password) {
      const user = await db.get('SELECT * FROM users WHERE username = ?', [String(username).trim()]);
      if (!user || !verifyPassword(String(password), user.password_hash)) return null;
      const token = randomBytes(32).toString('hex');
      await db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+90 days'))", [token, user.id]);
      return { token, user: publicUser(user) };
    },
    async userForToken(token) {
      if (!token) return null;
      const user = await db.get(`
        SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > datetime('now')`, [token]);
      return user ? publicUser(user) : null;
    },
    async logout(token) { await db.run('DELETE FROM sessions WHERE token = ?', [token]); },
    async setPassword(username, password) {
      return (await db.run('UPDATE users SET password_hash = ? WHERE username = ?', [hashPassword(password), username])).changes > 0;
    },

    /* ── data ── */
    async getAllData(userId) {
      const entries = Object.fromEntries(ENTRY_KINDS.map(k => [k, {}]));
      for (const row of await db.all('SELECT kind, date, data FROM entries WHERE user_id = ?', [userId])) {
        if (entries[row.kind]) entries[row.kind][row.date] = JSON.parse(row.data);
      }
      const settings = {};
      for (const row of await db.all('SELECT key, value FROM settings WHERE user_id = ?', [userId])) {
        settings[row.key] = JSON.parse(row.value);
      }
      return { entries, settings };
    },
    async saveEntry(userId, kind, date, data) {
      await db.run(`
        INSERT INTO entries (user_id, kind, date, data) VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, kind, date) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`,
        [userId, kind, date, JSON.stringify(data)]);
    },
    async saveSetting(userId, key, value) {
      await db.run(`
        INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
        ON CONFLICT (user_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
        [userId, key, JSON.stringify(value)]);
    },
    /** Bulk import that never overwrites what the database already has. Returns rows added. */
    async importData(userId, { entries = {}, settings = {} }, isValidDate) {
      const stmts = [];
      for (const kind of ENTRY_KINDS) {
        for (const [date, data] of Object.entries(entries[kind] || {})) {
          if (isValidDate(date) && data != null) {
            stmts.push({ sql: 'INSERT OR IGNORE INTO entries (user_id, kind, date, data) VALUES (?, ?, ?, ?)', args: [userId, kind, date, JSON.stringify(data)] });
          }
        }
      }
      for (const [key, value] of Object.entries(settings)) {
        if (SETTING_KEYS.includes(key) && value != null) {
          stmts.push({ sql: 'INSERT OR IGNORE INTO settings (user_id, key, value) VALUES (?, ?, ?)', args: [userId, key, JSON.stringify(value)] });
        }
      }
      if (!stmts.length) return 0;
      return (await db.batch(stmts)).reduce((a, b) => a + b, 0);
    },
  };
}
