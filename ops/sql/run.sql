-- 정체 거래 현황 조회 (읽기전용). [sql-dry].
\echo '===== [1] 미완료 Trade 상태별 건수 + 최고령/최신 ====='
SELECT t.status, count(*) AS cnt,
  min(t."createdAt") AS oldest, max(t."createdAt") AS newest
FROM "Trade" t
WHERE t.status IN ('active','trading','seller_confirmed')
GROUP BY t.status ORDER BY 2 DESC;

\echo '===== [2] 미완료 Trade 상세 (경과일, 대응 Listing 상태) ====='
SELECT t.id, t.status AS trade_status,
  date_trunc('day', now() - t."createdAt") AS age,
  l.status AS listing_status, g.slug AS game
FROM "Trade" t
JOIN "Listing" l ON l.id = t."listingId"
LEFT JOIN "Game" g ON g.id = l."gameId"
WHERE t.status IN ('active','trading','seller_confirmed')
ORDER BY t."createdAt";

\echo '===== [3] Listing 은 trading/seller_confirmed 인데 Trade 없는 고아 ====='
SELECT l.status, count(*)
FROM "Listing" l
LEFT JOIN "Trade" t ON t."listingId" = l.id
WHERE l.status IN ('trading','seller_confirmed') AND t.id IS NULL
GROUP BY l.status;

\echo '===== [4] Trade 테이블 컬럼 (자동종결 설계용) ====='
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS trade_columns
FROM information_schema.columns WHERE table_name = 'Trade';
