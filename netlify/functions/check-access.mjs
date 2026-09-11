import { claims, readSessionCookie, json } from './_shared.mjs';

export default async (request) => {
  if (request.method !== 'GET') return json({ message: 'Method not allowed.' }, 405);
  const token = readSessionCookie(request.headers.get('cookie') || '');
  if (!token) return json({ authorized: false }, 401);
  const listed = await claims.list({ prefix: 'roll:' });
  for (const blob of listed.blobs || []) {
    const claim = await claims.get(blob.key, { type: 'json', consistency: 'strong' });
    if (claim?.sessionToken === token) return json({ authorized: true });
  }
  return json({ authorized: false }, 401);
};

export const config = { path: '/.netlify/functions/check-access' };
