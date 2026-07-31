import { json } from './_lib/auth.js';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: '格式錯誤' }, { status: 400 });
  }

  if (!env.ADMIN_PASSWORD) {
    return json({ error: '網站尚未設定管理密碼（ADMIN_PASSWORD），請先在 Cloudflare Pages 設定環境變數。' }, { status: 500 });
  }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return json({ error: '密碼錯誤' }, { status: 401 });
  }

  const token = crypto.randomUUID();
  const expires = Date.now() + THIRTY_DAYS * 1000;
  await env.LISTINGS_KV.put('session:' + token, JSON.stringify({ expires }), {
    expirationTtl: THIRTY_DAYS
  });

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS}`
  );
  return new Response(JSON.stringify({ ok: true }), { headers });
}
