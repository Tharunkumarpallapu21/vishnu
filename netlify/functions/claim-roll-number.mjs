import { allowedRollNumbers, hashSessionToken, json, newSessionToken, normalize, sessionCookie, supabaseRequest } from './_shared.mjs';

export default async (request) => {
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed.' }, 405);
  let body;
  try { body = await request.json(); } catch (_) { return json({ success: false, message: 'Invalid request.' }, 400); }
  const rollNumber = normalize(body?.rollNumber);
  if (!allowedRollNumbers.has(rollNumber)) return json({ success: false, message: 'Invalid roll number.' }, 400);

  const sessionToken = newSessionToken();
  try {
    const response = await supabaseRequest('/rpc/claim_roll', {
      method: 'POST',
      body: JSON.stringify({ p_roll_number: rollNumber, p_session_token_hash: hashSessionToken(sessionToken) })
    });
    if (!response.ok) return json({ success: false, message: 'Secure claim service is temporarily unavailable.' }, 503);
    const result = await response.json();
    const claim = Array.isArray(result) ? result[0] : result;
    if (claim?.status === 'success' && claim.claimed === true) {
      return json({ success: true, authorized: true }, 200, { 'set-cookie': sessionCookie(sessionToken) });
    }
    if (claim?.status === 'invalid') return json({ success: false, message: 'Invalid roll number.' }, 400);
    if (claim?.status === 'claimed') return json({ success: false, message: 'This roll number has already been claimed.' }, 409);
    return json({ success: false, message: 'Secure claim service is temporarily unavailable.' }, 503);
  } catch (_) {
    return json({ success: false, message: 'Secure claim service is temporarily unavailable.' }, 503);
  }
};

export const config = { path: '/.netlify/functions/claim-roll-number' };
