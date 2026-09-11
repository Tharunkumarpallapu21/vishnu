export default async () => new Response(JSON.stringify({ message: 'Secure claim service is being configured. No roll number was claimed.' }), {
  status: 503,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export const config = { path: '/.netlify/functions/claim-roll-number' };
