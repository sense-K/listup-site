-- 판매자 등급 자동 승급 적용 + 운영자 계정 예외 처리. [sql]
CREATE OR REPLACE FUNCTION recompute_seller_grades() RETURNS integer AS $fn$
DECLARE changed integer;
BEGIN
  WITH stats AS (
    SELECT u.id,
      (SELECT count(*) FROM "Trade" t WHERE t."sellerId" = u.id AND t.status = 'completed') AS done,
      (SELECT avg(r.rating) FROM "Review" r WHERE r."sellerId" = u.id) AS rating,
      EXISTS (SELECT 1 FROM "Listing" l WHERE l."userId" = u.id
              AND (l."createdAt" > now() - interval '30 days' OR l."updatedAt" > now() - interval '30 days')) AS recent
    FROM "User" u
    WHERE coalesce(u."sellerGrade", '') <> '공식파트너'   -- 운영자 직접 선정 등급은 자동화가 건드리지 않음
  ), target AS (
    SELECT id,
      CASE
        WHEN done >= 30 AND coalesce(rating, 0) >= 4.5 AND recent THEN '파워대행'
        WHEN done >= 10 AND coalesce(rating, 0) >= 4.0 THEN '우수대행'
        ELSE NULL
      END AS new_grade
    FROM stats
  )
  UPDATE "User" u SET "sellerGrade" = t.new_grade
  FROM target t
  WHERE u.id = t.id AND u."sellerGrade" IS DISTINCT FROM t.new_grade;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END $fn$ LANGUAGE plpgsql;

-- 운영자 본인 상점은 공식파트너로 (자동 강등 대상에서 제외)
UPDATE "User" SET "sellerGrade" = '공식파트너' WHERE "username" = 'shop0002';

-- 즉시 1회 반영
SELECT recompute_seller_grades() AS changed_now;

-- 매일 03:10 KST 자동 실행
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto-seller-grade';
SELECT cron.schedule('auto-seller-grade', '10 18 * * *', 'SELECT recompute_seller_grades();');

\echo '===== 등록된 cron ====='
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
\echo '===== 등급 분포 ====='
SELECT coalesce("sellerGrade",'(없음)') AS grade, count(*) FROM "User" GROUP BY 1 ORDER BY 2 DESC;
