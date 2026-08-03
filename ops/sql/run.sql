-- 최근 30일 조회 데이터. [sql-dry]
\echo '===== ListingView 컬럼 ====='
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_name='ListingView';
\echo '===== 전체/최근 조회 건수 ====='
SELECT count(*) AS total_views,
  count(*) FILTER (WHERE "viewedAt" > now() - interval '30 days') AS last_30d,
  count(*) FILTER (WHERE "viewedAt" > now() - interval '7 days')  AS last_7d,
  min("viewedAt") AS first_view, max("viewedAt") AS last_view
FROM "ListingView";
\echo '===== 최근 30일 게임별 매물 조회수 ====='
SELECT g.slug, count(*) AS views
FROM "ListingView" v JOIN "Listing" l ON l.id=v."listingId" JOIN "Game" g ON g.id=l."gameId"
WHERE v."viewedAt" > now() - interval '30 days'
GROUP BY g.slug ORDER BY views DESC;
\echo '===== 매물 자체 viewCount 합계 (게임별, 누적) ====='
SELECT g.slug, sum(l."viewCount") AS total_viewcount, count(*) AS listings
FROM "Listing" l JOIN "Game" g ON g.id=l."gameId"
GROUP BY g.slug ORDER BY total_viewcount DESC NULLS LAST;
