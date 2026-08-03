-- 판매자 등급 명칭 변경: 대행 → 판매자 (개인 거래도 있으므로). [sql]
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
    WHERE coalesce(u."sellerGrade", '') <> '공식 파트너'   -- 운영자 직접 선정 등급은 자동화가 건드리지 않음
  ), target AS (
    SELECT id,
      CASE
        WHEN done >= 30 AND coalesce(rating, 0) >= 4.5 AND recent THEN '파워 판매자'
        WHEN done >= 10 AND coalesce(rating, 0) >= 4.0 THEN '우수 판매자'
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

-- 기존 등급값 마이그레이션 (대행 → 판매자)
UPDATE "User" SET "sellerGrade" = '우수 판매자' WHERE "sellerGrade" = '우수대행';
UPDATE "User" SET "sellerGrade" = '파워 판매자' WHERE "sellerGrade" = '파워대행';
UPDATE "User" SET "sellerGrade" = '공식 파트너' WHERE "sellerGrade" = '공식파트너';

-- 즉시 1회 반영 (공식 파트너는 제외됨)
SELECT recompute_seller_grades() AS changed_now;

\echo '===== 등급 분포 ====='
SELECT coalesce("sellerGrade",'(없음)') AS grade, count(*) FROM "User" GROUP BY 1 ORDER BY 2 DESC;
\echo '===== cron ====='
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
