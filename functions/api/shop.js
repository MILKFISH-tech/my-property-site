import { getSession, unauthorized, json } from './_lib/auth.js';

const DEFAULT_SHOP = { name: '我的物件簿', tagline: '', role: '', avatar: '', contacts: [] };

export async function onRequestGet({ env }) {
  const raw = await env.LISTINGS_KV.get('shop-settings');
  const shop = raw ? Object.assign({}, DEFAULT_SHOP, JSON.parse(raw)) : DEFAULT_SHOP;
  return json(shop);
}

export async function onRequestPut({ request, env }) {
  const session = await getSession(request, env);
  if (!session) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: '格式錯誤' }, { status: 400 });
  }
  const shop = Object.assign({}, DEFAULT_SHOP, body);
  await env.LISTINGS_KV.put('shop-settings', JSON.stringify(shop));
  return json(shop);
}
