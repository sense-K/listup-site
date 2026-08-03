-- 게임별 재화(Currency) 설정 현황 조회. [sql]
\echo '===== 게임별 재화 설정 ====='
SELECT g."nameKo" AS "게임", g.slug AS "슬러그",
       coalesce(c."nameKo",'(없음)') AS "재화",
       c."ratePerUnit" AS "1연당",
       c."isActive" AS "활성",
       c."sortOrder" AS "순서"
FROM "Game" g
LEFT JOIN "Currency" c ON c."gameId" = g.id
WHERE g."isActive" = true
ORDER BY g."sortOrder" NULLS LAST, g."nameKo", c."sortOrder";

\echo '===== 재화 미설정 게임 (돌계 등록 불가) ====='
SELECT g."nameKo", g.slug
FROM "Game" g
WHERE g."isActive" = true
  AND NOT EXISTS (SELECT 1 FROM "Currency" c WHERE c."gameId" = g.id AND c."isActive" = true)
ORDER BY g."sortOrder" NULLS LAST, g."nameKo";

\echo '===== 재화가 실제 쓰인 판매글 수 ====='
SELECT g."nameKo", count(DISTINCT lc."listingId") AS "재화 등록 판매글"
FROM "ListingCurrency" lc
JOIN "Currency" c ON c.id = lc."currencyId"
JOIN "Game" g ON g.id = c."gameId"
GROUP BY 1 ORDER BY 2 DESC;
