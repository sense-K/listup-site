-- HOT 기준을 '누적 조회수 50 초과' → '최근 7일 조회수 상위 10%'로 교체. [sql]

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "recentViewCount" integer NOT NULL DEFAULT 0;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "isHot" boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "ListingView_viewedAt_idx" ON "ListingView" ("viewedAt");

-- 최근 7일 조회수 집계 후, 판매중 매물 중 상위 10%를 HOT으로.
-- 고정 임계값 대신 분위수를 쓰는 이유: 트래픽이 늘어도 HOT 비율이 유지됨.
-- 다만 조회가 뜸한 주에 1~2회짜리가 HOT이 되지 않도록 최소 3회 바닥을 둠.
CREATE OR REPLACE FUNCTION recompute_hot_listings() RETURNS TABLE(threshold integer, hot_count integer) AS $fn$
DECLARE
  v_threshold integer;
  v_hot integer;
BEGIN
  WITH v AS (
    SELECT l.id,
           (SELECT count(*) FROM "ListingView" lv
             WHERE lv."listingId" = l.id
               AND lv."viewedAt" > now() - interval '7 days')::integer AS c
    FROM "Listing" l
  )
  UPDATE "Listing" l SET "recentViewCount" = v.c
  FROM v WHERE l.id = v.id AND l."recentViewCount" IS DISTINCT FROM v.c;

  SELECT greatest(3, ceil(coalesce(
           percentile_cont(0.90) WITHIN GROUP (ORDER BY "recentViewCount"), 0))::integer)
    INTO v_threshold
  FROM "Listing" WHERE status = 'active';

  UPDATE "Listing"
     SET "isHot" = (status = 'active' AND "recentViewCount" >= v_threshold)
   WHERE "isHot" IS DISTINCT FROM (status = 'active' AND "recentViewCount" >= v_threshold);

  SELECT count(*)::integer INTO v_hot FROM "Listing" WHERE "isHot";
  RETURN QUERY SELECT v_threshold, v_hot;
END $fn$ LANGUAGE plpgsql;

-- 즉시 1회 반영
\echo '===== 즉시 반영 결과 (임계값 / HOT 개수) ====='
SELECT * FROM recompute_hot_listings();

-- 매시간 5분에 갱신
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto-hot-listings';
SELECT cron.schedule('auto-hot-listings', '5 * * * *', 'SELECT recompute_hot_listings();');

\echo '===== 최근 7일 조회수 분포 (판매중) ====='
SELECT
  count(*) AS "판매중",
  count(*) FILTER (WHERE "isHot") AS "HOT",
  max("recentViewCount") AS "최대",
  round(avg("recentViewCount"), 1) AS "평균",
  percentile_cont(0.90) WITHIN GROUP (ORDER BY "recentViewCount") AS "상위10% 경계"
FROM "Listing" WHERE status = 'active';

\echo '===== HOT 매물 (누적 조회수와 비교) ====='
SELECT left(id, 8) AS id, "recentViewCount" AS "최근7일", "viewCount" AS "누적",
       round(extract(epoch FROM (now() - "createdAt")) / 86400) AS "등록경과일"
FROM "Listing" WHERE "isHot" ORDER BY "recentViewCount" DESC;

\echo '===== 등록된 cron ====='
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
