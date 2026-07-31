export async function onRequestGet({ env, params }) {
  if (!env.LISTINGS_R2) {
    return new Response('R2 未設定', { status: 500 });
  }
  const obj = await env.LISTINGS_R2.get(params.key);
  if (!obj) {
    return new Response('Not found', { status: 404 });
  }
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}
