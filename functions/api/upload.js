import { getSession, unauthorized, json } from './_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const session = await getSession(request, env);
  if (!session) return unauthorized();

  if (!env.LISTINGS_R2) {
    return json({ error: '網站尚未綁定 R2（LISTINGS_R2），請先在 Cloudflare Pages 設定。' }, { status: 500 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return json({ error: '沒有收到檔案' }, { status: 400 });
  }

  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = crypto.randomUUID() + '-' + safeName;

  await env.LISTINGS_R2.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' }
  });

  const base = env.R2_PUBLIC_BASE_URL ? env.R2_PUBLIC_BASE_URL.replace(/\/$/, '') : '/r2';
  const url = base + '/' + key;

  return json({ url, key });
}
