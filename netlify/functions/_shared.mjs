import { createHash, randomBytes } from 'node:crypto';

export const allowedRollNumbers = new Set([
  '24F65A0519', '24F65A0520', '24F65A0521', '24F65A0522', '24F65A0523', '24F65A0524',
  ...['I', 'J', 'K', 'L', 'M', 'N'].flatMap((letter) => Array.from({ length: 10 }, (_, index) => `23F61A05${letter}${index}`))
]);

export const normalize = (value) => String(value || '').trim().toUpperCase();
export const newSessionToken = () => randomBytes(32).toString('base64url');
export const hashSessionToken = (token) => createHash('sha256').update(token).digest('hex');
export const sessionCookie = (token) => `m7_session=${encodeURIComponent(token)}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`;
export const readSessionCookie = (cookie = '') => {
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('m7_session='));
  return match ? decodeURIComponent(match.slice('m7_session='.length)) : '';
};

export const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});

export const supabaseRequest = async (path, init = {}) => {
  const runtimeEnv = typeof Netlify !== 'undefined' && Netlify.env ? Netlify.env : undefined;
  const baseUrl = String((await runtimeEnv?.get('SUPABASE_URL')) || '').replace(/\/$/, '');
  const secretKey = await runtimeEnv?.get('SUPABASE_SECRET_KEY');
  if (!baseUrl || !secretKey) throw new Error('Supabase configuration is missing.');
  return fetch(`${baseUrl}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: secretKey,
      'content-type': 'application/json',
      ...(init.headers || {})
    }
  });
};
