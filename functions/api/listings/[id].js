import { getSession, unauthorized, json } from '../_lib/auth.js';

export async function onRequestPut({ request, env, params }) {
  const session = await getSession(request, env);
  if (!session) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: '格式錯誤' }, { status: 400 });
  }
  const existing = await env.LISTINGS_KV.get('listing:' + params.id);
  if (!existing) return json({ error: '找不到這筆物件' }, { status: 404 });

  const listing = Object.assign({}, body, { id: params.id });
  await env.LISTINGS_KV.put('listing:' + params.id, JSON.stringify(listing));
  return json(listing);
}

export async function onRequestDelete({ request, env, params }) {
  const session = await getSession(request, env);
  if (!session) return unauthorized();

  await env.LISTINGS_KV.delete('listing:' + params.id);
  await env.LISTINGS_KV.delete('listing-video:' + params.id);

  const idxRaw = await env.LISTINGS_KV.get('listing-index');
  let ids = idxRaw ? JSON.parse(idxRaw) : [];
  ids = ids.filter((x) => x !== params.id);
  await env.LISTINGS_KV.put('listing-index', JSON.stringify(ids));

  return json({ ok: true });
}
