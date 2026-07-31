import { getSession, unauthorized, json, tenantKey } from './_lib/auth.js';

export async function onRequestPut({ request, env, data }) {
  const tenant = data.tenant;
  if (!tenant) return json({ error: '找不到這個網址對應的業務帳號' }, { status: 404 });

  const session = await getSession(request, env);
  if (!session || session.tenantId !== tenant.tenantId) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: '格式錯誤' }, { status: 400 });
  }
  if (!Array.isArray(body.order)) {
    return json({ error: '格式錯誤，需要 order 陣列' }, { status: 400 });
  }

  const idxKey = tenantKey(tenant.tenantId, 'listing-index');
  const idxRaw = await env.LISTINGS_KV.get(idxKey);
  const current = idxRaw ? JSON.parse(idxRaw) : [];
  const currentSet = new Set(current);

  const newOrder = body.order.filter((id) => currentSet.has(id));
  current.forEach((id) => {
    if (newOrder.indexOf(id) === -1) newOrder.push(id);
  });

  await env.LISTINGS_KV.put(idxKey, JSON.stringify(newOrder));
  return json({ ok: true, order: newOrder });
}
