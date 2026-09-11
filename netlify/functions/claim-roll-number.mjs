import { claims, allowedRollNumbers, normalize, rollKey, newSessionToken, sessionCookie, json } from './_shared.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);
  let body;
  try { body = await request.json(); } catch (_) { return json({ message: 'Invalid request.' }, 400); }
  const rollNumber = normalize(body?.rollNumber);
  if (!/^[0-9A-Z]{10}$/.test(rollNumber) || !allowedRollNumbers.has(rollNumber)) {
    return json({ message: 'Sorry 😅 This surprise is only for our class.' }, 400);
  }
  const token = newSessionToken();
  const result = await claims.set(rollKey(rollNumber), JSON.stringify({ rollNumber, claimedAt: new Date().toISOString(), sessionToken: token }), { onlyIfNew: true });
  if (!result.modified) return json({ message: 'Looks like this roll number has already entered ❤️' }, 409);
  return json({ authorized: true }, 200, { 'set-cookie': sessionCookie(token) });
};

export const config = { path: '/.netlify/functions/claim-roll-number' };
