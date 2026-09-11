import { hashSessionToken, json, readSessionCookie, supabaseRequest } from './_shared.mjs';

export default async (request) => {
  if (request.method !== 'GET') return json({ authorized: false, message: 'Method not allowed.' }, 405);
  const rawToken = readSessionCookie(request.headers.get('cookie') || '');
  if (!rawToken) return json({ authorized: false }, 401);
  try {
    const response = await supabaseRequest(`/rolls?select=roll_number&session_token_hash=eq.${encodeURIComponent(hashSessionToken(rawToken))}&claimed_at=not.is.null&limit=1`, { method: 'GET' });
    if (!response.ok) return json({ authorized: false }, 503);
    const rows = await response.json();
    return rows.length ? json({ authorized: true }) : json({ authorized: false }, 401);
  } catch (_) {
    return json({ authorized: false }, 503);
  }
};

export const config = { path: '/.netlify/functions/check-access' };
