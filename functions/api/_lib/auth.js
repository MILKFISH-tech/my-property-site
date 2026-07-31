export async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/admin_session=([^;]+)/);
  if (!match) return null;
  const token = match[1];
  const raw = await env.LISTINGS_KV.get('session:' + token);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.expires && data.expires < Date.now()) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: '未登入或登入已過期' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function json(data, init) {
  return new Response(JSON.stringify(data), Object.assign({
    headers: { 'Content-Type': 'application/json' }
  }, init || {}));
}
