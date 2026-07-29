-- 정체 거래 현황 재조회. [sql-dry].
\echo '===== 미완료 Trade (경과일 + Listing 상태) ====='
SELECT t.id, t.status AS trade, date_trunc('day', now()-t."createdAt") AS age,
       l.status AS listing, g.slug AS game
FROM "Trade" t JOIN "Listing" l ON l.id=t."listingId"
LEFT JOIN "Game" g ON g.id=l."gameId"
WHERE t.status IN ('active','trading','seller_confirmed')
ORDER BY t."createdAt";
\echo '===== Listing=trading/seller_confirmed 인데 Trade 없는 고아 ====='
SELECT l.id, l.status, g.slug, date_trunc('day', now()-l."createdAt") AS age
FROM "Listing" l LEFT JOIN "Trade" t ON t."listingId"=l.id
LEFT JOIN "Game" g ON g.id=l."gameId"
WHERE l.status IN ('trading','seller_confirmed') AND t.id IS NULL
ORDER BY l."createdAt";
\echo '===== cron 잡 확인 ====='
SELECT jobname, schedule, active FROM cron.job WHERE jobname='auto-close-stale-trades';
