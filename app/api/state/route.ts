import { env } from 'cloudflare:workers';

// Keep the existing gala record so the shared board retains all saved tasks.
const GALA_KEY = 'nWOFERISRWhCvNvI0CDvNjRd6BfNf2f9EN4QTH7SKJB5QECYbMPbhG';
const EDITORS = new Set(['justine.stv@gmail.com', 'kemie.stv@gmail.com']);
export const dynamic = 'force-dynamic';
function identity(req: Request) {
  const signedIn = Boolean(req.headers.get('oai-authenticated-user-id'));
  const email = (req.headers.get('oai-authenticated-user-email') || '').trim().toLowerCase();
  return { signedIn, canEdit: signedIn && EDITORS.has(email) };
}
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: Request) {
  const access = identity(req);
  const row = await env.DB!.prepare('SELECT data, revision FROM gala_state WHERE owner = ?').bind(GALA_KEY).first();
  const data = row ? JSON.parse(row.data as string) : null;
  // Volunteer availability and personal notes remain visible to coordinators only.
  if (data && !access.canEdit) data.volunteers = [];
  return Response.json({data, revision: row?.revision || 0, ...access}, {headers});
}
export async function PUT(req: Request) {
  const access = identity(req);
  if (!access.signedIn) return new Response('Connectez-vous pour modifier le gala.', {status:401, headers});
  if (!access.canEdit) return new Response('La modification est réservée à Justine et Kémie.', {status:403, headers});
  if (req.headers.get('origin') !== new URL(req.url).origin) return new Response('Origine refusée', {status:403, headers});
  let body: any;
  try { body = await req.json(); } catch { return new Response('Données invalides', {status:400, headers}); }
  if (!body?.data || !Array.isArray(body.data.tasks) || !Array.isArray(body.data.volunteers) || !Number.isInteger(body.revision) || body.revision < 0)
    return new Response('Données invalides', {status:400, headers});
  const data = JSON.stringify(body.data);
  if (data.length > 1000000) return new Response('Données trop volumineuses', {status:413, headers});
  const statement = body.revision === 0
    ? env.DB!.prepare('INSERT OR IGNORE INTO gala_state (owner,data,revision) VALUES (?,?,1)').bind(GALA_KEY,data)
    : env.DB!.prepare('UPDATE gala_state SET data=?, revision=revision+1 WHERE owner=? AND revision=?').bind(data,GALA_KEY,body.revision);
  const result = await statement.run();
  if (!result.meta.changes) return new Response('Kémie ou Justine a modifié le projet entre-temps. Fermez cette fenêtre puis rechargez avant de reprendre votre modification.', {status:409, headers});
  return Response.json({revision:body.revision+1}, {headers});
}
