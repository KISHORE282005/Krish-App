// Change a user's password:  npm run set-password -- krish NEWPASSWORD
// Updates Turso when TURSO_DATABASE_URL is set (e.g. in .env), otherwise data/ascend.db.
import { openDb } from './open-db.js';
import { createStore } from './store.js';

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: npm run set-password -- <username> <new password>');
  process.exit(1);
}
const db = await openDb();
const store = await createStore(db);
console.log(await store.setPassword(username, password)
  ? `Password updated for "${username}" in ${db.label}.`
  : `No user named "${username}".`);
