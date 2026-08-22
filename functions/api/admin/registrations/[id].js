import { ok, bad, clientIP, log } from '../../../_lib/util.js';

const STATUSES = ['pending', 'paid', 'cancelled'];

// PATCH /api/admin/registrations/:id  { status?, admin_memo?, amount? }
export async function onRequestPatch({ request, env, params }) {
  const db = env.DB;
  const id = parseInt(params.id, 10);
  if (!db) return bad('DB 바인딩이 없습니다', 500);
  if (!id)  return bad('잘못된 ID 입니다');

  let body;
  try { body = await request.json(); } catch { return bad('잘못된 요청입니다'); }

  const sets = [], binds = [];
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return bad('알 수 없는 상태값입니다');
    sets.push('status = ?'); binds.push(body.status);
  }
  if (body.admin_memo !== undefined) {
    sets.push('admin_memo = ?'); binds.push(String(body.admin_memo).slice(0, 500));
  }
  if (body.amount !== undefined) {
    const amt = parseInt(body.amount, 10);
    if (isNaN(amt) || amt < 0) return bad('금액을 확인해 주세요');
    sets.push('amount = ?'); binds.push(amt);
  }
  if (!sets.length) return bad('변경할 항목이 없습니다');

  sets.push("updated_at = datetime('now')");
  binds.push(id);

  const res = await db.prepare(`UPDATE conf_registrations SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
  if (!res.meta.changes) return bad('해당 신청 내역을 찾을 수 없습니다', 404);

  await log(db, 'registration_update', `#${id} ${JSON.stringify(body)}`, clientIP(request));
  return ok({ id });
}

// DELETE /api/admin/registrations/:id
export async function onRequestDelete({ request, env, params }) {
  const db = env.DB;
  const id = parseInt(params.id, 10);
  if (!db) return bad('DB 바인딩이 없습니다', 500);
  if (!id)  return bad('잘못된 ID 입니다');

  const res = await db.prepare('DELETE FROM conf_registrations WHERE id = ?').bind(id).run();
  if (!res.meta.changes) return bad('해당 신청 내역을 찾을 수 없습니다', 404);

  await log(db, 'registration_delete', `#${id}`, clientIP(request));
  return ok({ id });
}
