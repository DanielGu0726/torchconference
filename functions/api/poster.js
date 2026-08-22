import { getSetting } from '../_lib/util.js';

// 관리자가 올린 최신 포스터를 R2 에서 서빙. 없으면 정적 이미지로 리다이렉트.
export async function onRequestGet({ env, request }) {
  const fallback = () => Response.redirect(new URL('/images/poster.png', request.url).toString(), 302);

  if (!env.DB || !env.MEDIA) return fallback();

  let key = '';
  try { key = await getSetting(env.DB, 'poster_key', ''); } catch { return fallback(); }
  if (!key) return fallback();

  const obj = await env.MEDIA.get(key);
  if (!obj) return fallback();

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=300');
  return new Response(obj.body, { headers });
}
