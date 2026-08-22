import { COOKIE } from '../../_lib/util.js';

export const onRequestPost = () => new Response(JSON.stringify({ ok: true }), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  }
});
