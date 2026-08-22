-- ═══ T.O.R.C.H 2026 Symposium — D1 schema ═══════════════
-- torchstudy-db 를 공유하므로 모든 테이블에 conf_ prefix 를 붙인다.

CREATE TABLE IF NOT EXISTS conf_registrations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  email         TEXT,
  affiliation   TEXT,                          -- 소속 (기공소/치과/학교)
  job           TEXT,                          -- 치과기공사 / 치과의사 / 학생 / 기타
  reg_type      TEXT    NOT NULL DEFAULT 'early', -- early | onsite
  depositor     TEXT,                          -- 입금자명
  memo          TEXT,                          -- 신청자 남긴 말
  admin_memo    TEXT,                          -- 관리자 메모
  status        TEXT    NOT NULL DEFAULT 'pending', -- pending | paid | cancelled
  amount        INTEGER NOT NULL DEFAULT 60000,
  agree_privacy INTEGER NOT NULL DEFAULT 1,
  ip            TEXT,
  ua            TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_conf_reg_created ON conf_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conf_reg_status  ON conf_registrations(status);

CREATE TABLE IF NOT EXISTS conf_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conf_admin_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  action     TEXT NOT NULL,
  detail     TEXT,
  ip         TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 기본 설정값
INSERT OR IGNORE INTO conf_settings (key, value) VALUES
  ('reg_open',        '1'),
  ('capacity',        '0'),          -- 0 = 제한 없음
  ('poster_key',      ''),           -- R2 object key (비어 있으면 정적 이미지 사용)
  ('notice',          ''),           -- 사이트 상단 공지 (비어 있으면 미표시)
  ('early_fee',       '60000'),
  ('onsite_fee',      '80000');
