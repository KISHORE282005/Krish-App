// Netlify Function serving /api/* with the same handler the local server uses.
// Needs TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Netlify → Site configuration → Environment variables.
import { createApiHandler } from '../../server/api.js';
import { openTursoDb } from '../../server/adapters/turso.js';

const handle = createApiHandler(() => openTursoDb());

export default async (request, context) => handle(request, context.ip || request.headers.get('x-nf-client-connection-ip') || 'unknown');

export const config = { path: '/api/*' };
