import { COOKIE, getCookie, verify, json } from './_lib/util.js';

// /api/admin/* 보호 (login 제외)
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/admin/')) return next();
  if (url.pathname === '/api/admin/login') return next();

  const secret = env.JWT_SECRET;
  if (!secret) return json({ ok: false, error: 'JWT_SECRET 미설정' }, 500);

  const bearer = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const token = bearer || getCookie(request, COOKIE);
  const payload = await verify(token, secret);
  if (!payload) return json({ ok: false, error: '인증이 필요합니다' }, 401);

  context.data.admin = payload;
  return next();
}
