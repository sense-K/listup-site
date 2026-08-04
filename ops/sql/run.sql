-- 자동 캐릭터 동기화 결과 기록 테이블. [sql]
-- 매일 새벽 auto-sync 워크플로가 게임별 결과(신규/갱신/오류)를 남기고,
-- admin 캐릭터 관리 탭 상단 카드가 이걸 읽어 보여준다.

CREATE TABLE IF NOT EXISTS "ImportLog" (
  id      TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ranAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  game    TEXT        NOT NULL,
  added   INT         NOT NULL DEFAULT 0,
  updated INT         NOT NULL DEFAULT 0,
  error   TEXT,                          -- NULL 이면 성공
  detail  JSONB                          -- 실행 로그 발췌
);

CREATE INDEX IF NOT EXISTS idx_importlog_ranat ON "ImportLog"("ranAt" DESC);

ALTER TABLE "ImportLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "importlog_public_read" ON "ImportLog";
CREATE POLICY "importlog_public_read" ON "ImportLog" FOR SELECT USING (true);
-- INSERT 는 psql(러너) 경로로만 — PostgREST 쓰기 정책 없음

\echo '===== 확인 ====='
SELECT count(*) AS "행수" FROM "ImportLog";
