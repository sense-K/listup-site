-- 판매자 등급 자동 승급 (pg_cron). 미리보기 [sql-dry].
\echo '===== Review 컬럼 확인 ====='
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_name='Review';

\echo '===== 등급 산정 함수 생성 ====='
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
    WHERE coalesce(u."sellerGrade", '') <> '공식파트너'   -- 운영자 직접 선정 등급은 건드리지 않음
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

\echo '===== [미리보기] 현재 데이터로 계산한 등급 변화 대상 ====='
WITH stats AS (
  SELECT u.id, u."username", u.nickname, u."sellerGrade" AS cur,
    (SELECT count(*) FROM "Trade" t WHERE t."sellerId" = u.id AND t.status = 'completed') AS done,
    (SELECT round(avg(r.rating), 2) FROM "Review" r WHERE r."sellerId" = u.id) AS rating,
    EXISTS (SELECT 1 FROM "Listing" l WHERE l."userId" = u.id
            AND (l."createdAt" > now() - interval '30 days' OR l."updatedAt" > now() - interval '30 days')) AS recent
  FROM "User" u WHERE coalesce(u."sellerGrade", '') <> '공식파트너'
)
SELECT "username", nickname, cur AS 현재등급, done AS 완료거래, rating AS 평점, recent AS 최근활동,
  CASE WHEN done >= 30 AND coalesce(rating,0) >= 4.5 AND recent THEN '파워대행'
       WHEN done >= 10 AND coalesce(rating,0) >= 4.0 THEN '우수대행' ELSE NULL END AS 새등급
FROM stats
WHERE cur IS DISTINCT FROM (CASE WHEN done >= 30 AND coalesce(rating,0) >= 4.5 AND recent THEN '파워대행'
       WHEN done >= 10 AND coalesce(rating,0) >= 4.0 THEN '우수대행' ELSE NULL END)
ORDER BY done DESC;

\echo '===== 실행 테스트 (변경 건수) ====='
SELECT recompute_seller_grades() AS changed_rows;

\echo '===== cron 등록 (매일 03:10 KST = 18:10 UTC) ====='
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto-seller-grade';
SELECT cron.schedule('auto-seller-grade', '10 18 * * *', 'SELECT recompute_seller_grades();');
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'auto-seller-grade';
