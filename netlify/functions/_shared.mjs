import { getStore } from '@netlify/blobs';
import { createHash, randomBytes } from 'node:crypto';

export const claims = getStore({ name: 'm7-roll-claims', consistency: 'strong' });
export const allowedRollNumbers = new Set([
  ...Array.from({ length: 60 }, (_, i) => `23F61A05${String.fromCharCode(73 + Math.floor(i / 10))}${i % 10}`),
  '24F65A0519', '24F65A0520', '24F65A0521', '24F65A0522', '24F65A0523', '24F65A0524'
]);
export const normalize = (value) => String(value || '').trim().toUpperCase();
export const rollKey = (rollNumber) => `roll:${createHash('sha256').update(`m7-roll:${rollNumber}`).digest('hex')}`;
export const newSessionToken = () => randomBytes(32).toString('base64url');
export const sessionCookie = (token) => `m7_session=${encodeURIComponent(token)}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`;
export const readSessionCookie = (cookie = '') => {
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('m7_session='));
  return match ? decodeURIComponent(match.slice('m7_session='.length)) : '';
};
export const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
