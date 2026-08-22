import { ok, bad, clientIP, getSetting } from '../_lib/util.js';

const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return bad('DB 바인딩이 없습니다', 500);

  let body;
  try { body = await request.json(); } catch { return bad('잘못된 요청입니다'); }

  const name        = clean(body.name, 40);
  const phone       = clean(body.phone, 30);
  const email       = clean(body.email, 120);
  const affiliation = clean(body.affiliation, 80);
  const job         = clean(body.job, 30);
  const depositor   = clean(body.depositor, 40) || name;
  const memo        = clean(body.memo, 500);
  const agree       = body.agree_privacy ? 1 : 0;

  if (!name)  return bad('성함을 입력해 주세요');
  if (!phone) return bad('연락처를 입력해 주세요');
  if (!/^[0-9+\-\s()]{8,20}$/.test(phone)) return bad('연락처 형식을 확인해 주세요');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('이메일 형식을 확인해 주세요');
  if (!agree) return bad('개인정보 수집·이용에 동의해 주세요');

  const regOpen = await getSetting(db, 'reg_open', '1');
  if (regOpen !== '1') return bad('현재 온라인 사전등록이 마감되었습니다', 403);

  const ip = clientIP(request);

  // 같은 IP 로 5분 내 3건 이상이면 차단 (스팸 방지)
  const recent = await db.prepare(
    `SELECT COUNT(*) AS c FROM conf_registrations
     WHERE ip = ? AND created_at > datetime('now', '-5 minutes')`
  ).bind(ip).first();
  if (recent && recent.c >= 3) return bad('잠시 후 다시 시도해 주세요', 429);

  // 동일 연락처 중복 신청 방지
  const dup = await db.prepare(
    `SELECT id FROM conf_registrations WHERE phone = ? AND status != 'cancelled'`
  ).bind(phone).first();
  if (dup) return bad('이미 동일한 연락처로 신청된 내역이 있습니다', 409);

  const capacity = parseInt(await getSetting(db, 'capacity', '0'), 10) || 0;
  if (capacity > 0) {
    const cnt = await db.prepare(
      `SELECT COUNT(*) AS c FROM conf_registrations WHERE status != 'cancelled'`
    ).first();
    if (cnt && cnt.c >= capacity) return bad('정원이 모두 마감되었습니다', 403);
  }

  const amount = parseInt(await getSetting(db, 'early_fee', '60000'), 10) || 60000;

  const res = await db.prepare(
    `INSERT INTO conf_registrations
       (name, phone, email, affiliation, job, reg_type, depositor, memo, agree_privacy, amount, ip, ua)
     VALUES (?, ?, ?, ?, ?, 'early', ?, ?, ?, ?, ?, ?)`
  ).bind(
    name, phone, email, affiliation, job, depositor, memo, agree, amount,
    ip, (request.headers.get('User-Agent') || '').slice(0, 200)
  ).run();

  return ok({ id: res.meta.last_row_id, amount });
}

export const onRequestGet = () => bad('POST 로 요청해 주세요', 405);
