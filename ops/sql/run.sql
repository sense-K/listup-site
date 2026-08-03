-- 판매글 끌어올리기(bump) 기반 마련. [sql]

-- 1) bumpedAt 컬럼 (없으면 추가) — 정렬 기준. 기본값은 등록 시각.
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "bumpedAt" timestamptz;
UPDATE "Listing" SET "bumpedAt" = "createdAt" WHERE "bumpedAt" IS NULL;
ALTER TABLE "Listing" ALTER COLUMN "bumpedAt" SET DEFAULT now();
CREATE INDEX IF NOT EXISTS "Listing_bumpedAt_idx" ON "Listing" ("bumpedAt" DESC);

-- 2) 5분 쿨다운을 DB에서 강제 (클라이언트 우회 차단)
CREATE OR REPLACE FUNCTION enforce_bump_cooldown() RETURNS trigger AS $fn$
BEGIN
  IF NEW."bumpedAt" IS DISTINCT FROM OLD."bumpedAt" THEN
    IF OLD."bumpedAt" IS NOT NULL AND OLD."bumpedAt" > now() - interval '5 minutes' THEN
      RAISE EXCEPTION '끌어올리기는 5분에 한 번만 가능해요';
    END IF;
    -- 미래 시각으로 올려치기 방지
    IF NEW."bumpedAt" > now() + interval '1 minute' THEN
      NEW."bumpedAt" := now();
    END IF;
  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_cooldown ON "Listing";
CREATE TRIGGER trg_bump_cooldown BEFORE UPDATE ON "Listing"
  FOR EACH ROW EXECUTE FUNCTION enforce_bump_cooldown();

\echo '===== 컬럼 확인 ====='
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Listing' AND column_name IN ('bumpedAt','createdAt');

\echo '===== bumpedAt 백필 결과 ====='
SELECT count(*) AS total, count("bumpedAt") AS filled FROM "Listing";
