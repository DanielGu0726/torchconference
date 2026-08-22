// ═══ 공용 유틸 ═══════════════════════════════════════════
export const COOKIE = 'torchconf_admin';

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });

export const bad  = (msg, status = 400) => json({ ok: false, error: msg }, status);
export const ok   = (data = {}) => json({ ok: true, ...data });

export const clientIP = (req) => req.headers.get('CF-Connecting-IP') || '';

/* ── JWT (HS256, WebCrypto) ───────────────────────────── */
const enc = new TextEncoder();
const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = (s) => b64u(enc.encode(s));
const fromB64u = (s) => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(pad + '='.repeat((4 - pad.length % 4) % 4));
};

async function key(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function sign(payload, secret, ttlSec = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body   = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttlSec };
  const data   = `${b64uStr(JSON.stringify(header))}.${b64uStr(JSON.stringify(body))}`;
  const sig    = await crypto.subtle.sign('HMAC', await key(secret), enc.encode(data));
  return `${data}.${b64u(sig)}`;
}

export async function verify(token, secret) {
  if (!token || token.split('.').length !== 3) return null;
  const [h, p, s] = token.split('.');
  const valid = await crypto.subtle.verify(
    'HMAC',
    await key(secret),
    Uint8Array.from(fromB64u(s), c => c.charCodeAt(0)),
    enc.encode(`${h}.${p}`)
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(fromB64u(p));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

export function getCookie(req, name) {
  const raw = req.headers.get('Cookie') || '';
  const hit = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

/* 타이밍 안전 비교 */
export function safeEqual(a = '', b = '') {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ── settings 헬퍼 ────────────────────────────────────── */
export async function getSetting(db, k, fallback = '') {
  const row = await db.prepare('SELECT value FROM conf_settings WHERE key = ?').bind(k).first();
  return row && row.value != null ? row.value : fallback;
}

export async function setSetting(db, k, v) {
  await db.prepare(
    `INSERT INTO conf_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).bind(k, String(v)).run();
}

export async function log(db, action, detail, ip) {
  try {
    await db.prepare('INSERT INTO conf_admin_logs (action, detail, ip) VALUES (?, ?, ?)')
      .bind(action, detail || '', ip || '').run();
  } catch { /* 로깅 실패는 무시 */ }
}
