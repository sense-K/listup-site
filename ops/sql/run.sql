-- HOT 기준(viewCount) 실태 파악. 읽기 전용. [sql]
\echo '===== track_listing_view 함수 정의 (중복 집계 방지 여부 확인) ====='
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'track_listing_view';

\echo '===== viewCount 분포 ====='
SELECT
  count(*) AS "전체 매물",
  count(*) FILTER (WHERE "viewCount" > 50)  AS "50 초과 (현재 HOT)",
  count(*) FILTER (WHERE "viewCount" > 30)  AS "30 초과",
  count(*) FILTER (WHERE "viewCount" > 20)  AS "20 초과",
  count(*) FILTER (WHERE "viewCount" > 10)  AS "10 초과",
  max("viewCount") AS "최대",
  round(avg("viewCount"), 1) AS "평균"
FROM "Listing";

\echo '===== 판매중 매물만 (HOT이 실제 붙는 대상) ====='
SELECT
  count(*) AS "판매중 매물",
  count(*) FILTER (WHERE "viewCount" > 50) AS "HOT 표시됨",
  max("viewCount") AS "최대",
  round(avg("viewCount"), 1) AS "평균",
  percentile_cont(0.9) WITHIN GROUP (ORDER BY "viewCount") AS "상위10% 경계",
  percentile_cont(0.95) WITHIN GROUP (ORDER BY "viewCount") AS "상위5% 경계"
FROM "Listing" WHERE status = 'active';

\echo '===== 조회수 상위 10개 (등록 경과일 대비) ====='
SELECT left(id, 8) AS id, status, "viewCount",
       round(extract(epoch FROM (now() - "createdAt")) / 86400) AS "등록 경과일",
       round("viewCount" / greatest(extract(epoch FROM (now() - "createdAt")) / 86400, 1), 1) AS "하루평균 조회"
FROM "Listing" ORDER BY "viewCount" DESC LIMIT 10;

\echo '===== ListingView 원장 대비 (실제 조회 기록 수) ====='
SELECT count(*) AS "ListingView 총 기록",
       count(*) FILTER (WHERE "viewedAt" > now() - interval '30 days') AS "최근 30일"
FROM "ListingView";
