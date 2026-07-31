import { getSession, unauthorized, json } from './_lib/auth.js';

async function readAll(env) {
  const idxRaw = await env.LISTINGS_KV.get('listing-index');
  const ids = idxRaw ? JSON.parse(idxRaw) : [];
  const items = [];
  for (const id of ids) {
    const raw = await env.LISTINGS_KV.get('listing:' + id);
    if (raw) items.push(JSON.parse(raw));
  }
  return items;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const wantAll = url.searchParams.get('all') === '1';
  const items = await readAll(env);

  if (wantAll) {
    const session = await getSession(request, env);
    if (!session) return unauthorized();
    return json(items);
  }
  return json(items.filter((l) => l.status !== 'done'));
}

export async function onRequestPost({ request, env }) {
  const session = await getSession(request, env);
  if (!session) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: '格式錯誤' }, { status: 400 });
  }
  const id = body.id || crypto.randomUUID();
  const listing = Object.assign({}, body, { id });
  await env.LISTINGS_KV.put('listing:' + id, JSON.stringify(listing));

  const idxRaw = await env.LISTINGS_KV.get('listing-index');
  const ids = idxRaw ? JSON.parse(idxRaw) : [];
  if (ids.indexOf(id) === -1) {
    ids.unshift(id);
    await env.LISTINGS_KV.put('listing-index', JSON.stringify(ids));
  }
  return json(listing, { status: 201 });
}
