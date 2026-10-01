// Picks the database for local scripts: Turso when configured, otherwise the local SQLite file.
// Reads .env (if present) so TURSO_* can be kept out of the shell.
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

export async function openDb({ local = false } = {}) {
  if (process.env.TURSO_DATABASE_URL && !local) {
    const { openTursoDb } = await import('./adapters/turso.js');
    return openTursoDb();
  }
  const { openLocalDb } = await import('./adapters/node-sqlite.js');
  return openLocalDb();
}
