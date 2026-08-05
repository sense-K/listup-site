-- 전 게임 현황 점검 (읽기 전용). [sql]
-- 활성 게임 중 캐릭터/서버/매물이 비어있는 곳을 찾아 자동화 대상과 대조한다.
SELECT g."sortOrder" AS ord, g.slug, g."nameKo", g."isActive",
       (SELECT count(*) FROM "Character" c WHERE c."gameId" = g.id AND c."isActive") AS chars,
       (SELECT count(*) FROM "Character" c WHERE c."gameId" = g.id AND c."isActive" AND coalesce(c."imageUrl",'') = '') AS no_img,
       (SELECT count(*) FROM "Server"    s WHERE s."gameId" = g.id) AS servers,
       (SELECT count(*) FROM "Currency"  u WHERE u."gameId" = g.id) AS currencies,
       (SELECT count(*) FROM "Listing"   l WHERE l."gameId" = g.id) AS listings
FROM "Game" g
ORDER BY g."isActive" DESC, chars ASC, g."sortOrder";
