import { json, getSetting } from '../_lib/util.js';

// 공개 설정 (등록 오픈 여부 / 공지 / 포스터 존재 여부 / 잔여석)
export async function onRequestGet({ env }) {
  const db = env.DB;
  if (!db) return json({ ok: true, reg_open: true, notice: '', poster: false });

  try {
    const [regOpen, notice, posterKey, capacity, earlyFee, onsiteFee] = await Promise.all([
      getSetting(db, 'reg_open', '1'),
      getSetting(db, 'notice', ''),
      getSetting(db, 'poster_key', ''),
      getSetting(db, 'capacity', '0'),
      getSetting(db, 'early_fee', '60000'),
      getSetting(db, 'onsite_fee', '80000')
    ]);

    let remaining = null;
    const cap = parseInt(capacity, 10) || 0;
    if (cap > 0) {
      const row = await db.prepare(
        `SELECT COUNT(*) AS c FROM conf_registrations WHERE status != 'cancelled'`
      ).first();
      remaining = Math.max(cap - (row ? row.c : 0), 0);
    }

    return json({
      ok: true,
      reg_open: regOpen === '1',
      notice,
      poster: !!posterKey,
      remaining,
      early_fee: parseInt(earlyFee, 10) || 60000,
      onsite_fee: parseInt(onsiteFee, 10) || 80000
    });
  } catch (e) {
    return json({ ok: true, reg_open: true, notice: '', poster: false });
  }
}
