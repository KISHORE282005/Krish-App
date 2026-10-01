// Change a user's password:  npm run set-password -- krish NEWPASSWORD
import { setPassword } from './db.js';

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: npm run set-password -- <username> <new password>');
  process.exit(1);
}
console.log(setPassword(username, password) ? `Password updated for "${username}".` : `No user named "${username}".`);
