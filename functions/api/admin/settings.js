import { json, ok, bad, setSetting, clientIP, log } from '../../_lib/util.js';

const KEYS = ['reg_open', 'capacity', 'notice', 'early_fee', 'onsite_fee'];

export async function onRequestGet({ env }) {
  const db = env.DB;
  if (!db) return bad('DB 바인딩이 없습니다', 500);

  const { results } = await db.prepare('SELECT key, value FROM conf_settings').all();
  const settings = Object.fromEntries((results || []).map(r => [r.key, r.value]));
  return json({ ok: true, settings });
}

export async function onRequestPut({ request, env }) {
  const db = env.DB;
  if (!db) return bad('DB 바인딩이 없습니다', 500);

  let body;
  try { body = await request.json(); } catch { return bad('잘못된 요청입니다'); }

  const changed = [];
  for (const k of KEYS) {
    if (body[k] === undefined) continue;
    let v = body[k];
    if (k === 'reg_open') v = v ? '1' : '0';
    if (['capacity', 'early_fee', 'onsite_fee'].includes(k)) {
      const n = parseInt(v, 10);
      if (isNaN(n) || n < 0) return bad(`${k} 값을 확인해 주세요`);
      v = String(n);
    }
    if (k === 'notice') v = String(v).slice(0, 300);
    await setSetting(db, k, v);
    changed.push(k);
  }
  if (!changed.length) return bad('변경할 항목이 없습니다');

  await log(db, 'settings_update', changed.join(','), clientIP(request));
  return ok({ changed });
}
