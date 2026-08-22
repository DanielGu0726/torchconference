import { json, bad } from '../../_lib/util.js';

// GET /api/admin/registrations?status=&q=&format=csv
export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return bad('DB 바인딩이 없습니다', 500);

  const url    = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  const q      = (url.searchParams.get('q') || '').trim();
  const format = url.searchParams.get('format') || 'json';

  const where = [];
  const binds = [];
  if (status && ['pending', 'paid', 'cancelled'].includes(status)) {
    where.push('status = ?'); binds.push(status);
  }
  if (q) {
    where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR affiliation LIKE ? OR depositor LIKE ?)');
    for (let i = 0; i < 5; i++) binds.push(`%${q}%`);
  }
  const sql = `SELECT * FROM conf_registrations
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY created_at DESC, id DESC`;

  const { results } = await db.prepare(sql).bind(...binds).all();
  const rows = results || [];

  if (format === 'csv') {
    const head = ['ID', '성함', '연락처', '이메일', '소속', '직군', '입금자명', '금액', '상태', '메모', '관리자메모', '신청일시'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = rows.map(r => [
      r.id, r.name, r.phone, r.email, r.affiliation, r.job, r.depositor,
      r.amount, r.status, r.memo, r.admin_memo, r.created_at
    ].map(esc).join(','));
    const csv = '﻿' + [head.map(esc).join(','), ...body].join('\r\n');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="torch2026_registrations_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  }

  const stats = rows.reduce((a, r) => {
    a.total++;
    a[r.status] = (a[r.status] || 0) + 1;
    if (r.status === 'paid') a.revenue += r.amount || 0;
    return a;
  }, { total: 0, pending: 0, paid: 0, cancelled: 0, revenue: 0 });

  return json({ ok: true, rows, stats });
}
