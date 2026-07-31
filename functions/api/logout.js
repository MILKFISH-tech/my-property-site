export async function onRequestPost({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/admin_session=([^;]+)/);
  if (match) {
    await env.LISTINGS_KV.delete('session:' + match[1]);
  }
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', 'admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return new Response(JSON.stringify({ ok: true }), { headers });
}
