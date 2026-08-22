# T.O.R.C.H 2026 Symposium

2026.12.13 (일) 10:00–17:00 · 서울시 중구 청파로 450 신흥빌딩 11층

- **사이트**: https://torchconference-cu2.pages.dev
- **관리자**: https://torchconference-cu2.pages.dev/admin/

## 스택
- 정적 HTML/CSS/JS (프레임워크 없음) + Cloudflare Pages Functions
- **D1**: `torchstudy-db` 공유 (계정 D1 개수 제한). 테이블은 모두 `conf_` prefix
- **R2**: `torchconf-media` (포스터 `poster/` prefix)
- **Secrets**: `ADMIN_PASSWORD`, `JWT_SECRET` (Pages secret)
- CF 계정: Tjmds99@gmail.com (`d542d8c5cbfb3917ee7e615e980c1892`)

## 구조
```
index.html            메인 (히어로 · 개요 · 연자 4섹션 · 프로그램 · 참가신청 · 오시는 길)
teaser.html           이전 티저 페이지
admin/index.html      관리자 (신청 관리 · 포스터 업로드 · 설정)
css/style.css  js/main.js
functions/
  _middleware.js              /api/admin/* JWT 가드
  _lib/util.js                JWT · 쿠키 · settings 헬퍼
  api/register.js             POST 참가 신청
  api/config.js               GET 공개 설정 (접수 여부/공지/참가비/잔여석)
  api/poster.js               GET 포스터 (R2 → 없으면 images/poster.png)
  api/admin/login.js|logout.js|me.js
  api/admin/registrations.js  GET 목록 · CSV
  api/admin/registrations/[id].js  PATCH 상태·메모 / DELETE
  api/admin/poster.js         POST 업로드 / DELETE
  api/admin/settings.js       GET · PUT
schema.sql            D1 스키마 (conf_registrations / conf_settings / conf_admin_logs)
```

## 운영
```bash
export CLOUDFLARE_ACCOUNT_ID=d542d8c5cbfb3917ee7e615e980c1892

# 배포
npx wrangler pages deploy . --project-name torchconference --branch master

# 스키마 재적용
npx wrangler d1 execute torchstudy-db --remote --file=schema.sql

# 비밀번호 변경 (줄바꿈 들어가지 않게 printf 사용!)
printf '새비밀번호' | npx wrangler pages secret put ADMIN_PASSWORD --project-name torchconference
```
비밀번호·설정 변경 후에는 **재배포해야** 반영됩니다 (Pages secret은 새 배포부터 적용).

## 콘텐츠 수정 포인트
- 연자/시간 변경 → `index.html`의 `<section class="speaker">` 4개 + `<ol class="timeline">` 두 곳
- 포스터 교체 → 관리자 「포스터」 탭에서 업로드 (정적 fallback은 `images/poster.png`)
- 참가비·정원·공지·접수 마감 → 관리자 「설정」 탭
