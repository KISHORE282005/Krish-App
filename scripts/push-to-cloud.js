// Copies your local data/ascend.db (journals, planner, notes, settings) into Turso.
// Never overwrites anything already in Turso. Safe to run more than once.
//   1. put TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env
//   2. npm run db:push
import { openDb } from '../server/open-db.js';
import { createStore, ENTRY_KINDS, SETTING_KEYS } from '../server/store.js';

if (!process.env.TURSO_DATABASE_URL) {
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env first.');
  process.exit(1);
}

const local = await openDb({ local: true });
const cloud = await createStore(await openDb());
console.log(`from ${local.label}\nto   ${cloud.db.label}`);

let total = 0;
for (const { id, username } of await local.all('SELECT id, username FROM users')) {
  const target = await cloud.db.get('SELECT id FROM users WHERE username = ?', [username]);
  if (!target) { console.log(`skip "${username}": no such user in Turso`); continue; }

  const entries = Object.fromEntries(ENTRY_KINDS.map(k => [k, {}]));
  for (const r of await local.all('SELECT kind, date, data FROM entries WHERE user_id = ?', [id])) {
    if (entries[r.kind]) entries[r.kind][r.date] = JSON.parse(r.data);
  }
  const settings = {};
  for (const r of await local.all('SELECT key, value FROM settings WHERE user_id = ?', [id])) {
    if (SETTING_KEYS.includes(r.key)) settings[r.key] = JSON.parse(r.value);
  }
  const added = await cloud.importData(Number(target.id), { entries, settings }, () => true);
  console.log(`${username}: ${added} new rows copied`);
  total += added;
}
console.log(`done – ${total} rows added`);
