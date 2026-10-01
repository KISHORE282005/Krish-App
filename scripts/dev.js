// `npm run dev`: starts the database server and Vite together; Ctrl+C stops both.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const node = process.execPath;
const vite = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));

const procs = [
  spawn(node, ['--disable-warning=ExperimentalWarning', '--watch-path=server', 'server/index.js'], { stdio: 'inherit' }),
  spawn(node, [vite], { stdio: 'inherit' }),
];

const stop = () => { procs.forEach(p => p.kill()); process.exit(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach(p => p.on('exit', code => { if (code) { console.error(`[dev] a process exited with code ${code}`); stop(); } }));
