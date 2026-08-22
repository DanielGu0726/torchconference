import { ok, bad, getSetting, setSetting, clientIP, log } from '../../_lib/util.js';

const ALLOWED = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

// POST /api/admin/poster  (multipart/form-data, field: file)
export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) return bad('R2 바인딩이 없습니다', 500);
  if (!env.DB)    return bad('DB 바인딩이 없습니다', 500);

  let form;
  try { form = await request.formData(); } catch { return bad('업로드 데이터를 읽을 수 없습니다'); }

  const file = form.get('file');
  if (!file || typeof file === 'string') return bad('파일을 선택해 주세요');

  const ext = ALLOWED[file.type];
  if (!ext) return bad('PNG, JPG, WEBP 이미지만 업로드할 수 있습니다');
  if (file.size > MAX_BYTES) return bad('파일 용량은 10MB 이하여야 합니다');

  const key = `poster/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });

  const prev = await getSetting(env.DB, 'poster_key', '');
  await setSetting(env.DB, 'poster_key', key);
  if (prev && prev !== key) {
    try { await env.MEDIA.delete(prev); } catch { /* 이전 파일 삭제 실패는 무시 */ }
  }

  await log(env.DB, 'poster_upload', key, clientIP(request));
  return ok({ key, url: '/api/poster?v=' + Date.now() });
}

// DELETE /api/admin/poster — 업로드 포스터 제거 (정적 이미지로 복귀)
export async function onRequestDelete({ request, env }) {
  if (!env.DB) return bad('DB 바인딩이 없습니다', 500);

  const prev = await getSetting(env.DB, 'poster_key', '');
  if (prev && env.MEDIA) {
    try { await env.MEDIA.delete(prev); } catch { /* 무시 */ }
  }
  await setSetting(env.DB, 'poster_key', '');
  await log(env.DB, 'poster_delete', prev, clientIP(request));
  return ok({});
}
