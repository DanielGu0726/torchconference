import { bad, sign, safeEqual, COOKIE, clientIP, log } from '../../_lib/util.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.JWT_SECRET) return bad('서버 설정이 완료되지 않았습니다', 500);

  let body;
  try { body = await request.json(); } catch { return bad('잘못된 요청입니다'); }

  const pw = String(body.password || '');
  if (!safeEqual(pw, env.ADMIN_PASSWORD)) {
    await log(env.DB, 'login_fail', '', clientIP(request));
    return bad('비밀번호가 올바르지 않습니다', 401);
  }

  const token = await sign({ role: 'admin' }, env.JWT_SECRET, 86400);
  await log(env.DB, 'login', '', clientIP(request));

  return new Response(JSON.stringify({ ok: true, token }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    }
  });
}
