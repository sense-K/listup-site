-- 랜딩 상점 미리보기에 넣을 실제 캐릭터 이미지 URL 조회 (읽기 전용). [sql]

\echo '===== 자백 (원신) ====='
SELECT c."nameKo", c."nameEn", c."imageUrl"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'genshin' AND c."nameKo" = '자백';

\echo ''
\echo '===== 크라운 (니케) ====='
SELECT c."nameKo", c."nameEn", c."imageUrl"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'nikke' AND c."nameKo" LIKE '크라운%';

\echo ''
\echo '===== 돌계 카드용: 스타레일 게임 이미지 + 성옥 재화 이미지 ====='
SELECT g.slug, g."nameKo", g."imageUrl" AS "앱아이콘", g."artImageUrl" AS "키아트"
FROM "Game" g WHERE g.slug = 'starrail';
SELECT cur."nameKo", cur."imageUrl"
FROM "Currency" cur JOIN "Game" g ON g.id = cur."gameId"
WHERE g.slug = 'starrail';

\echo ''
\echo '===== 대안 후보: 각 게임 대표 캐릭터 (이미지 있는 것) ====='
SELECT g.slug, c."nameKo", c."imageUrl"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug IN ('genshin','nikke','starrail')
  AND c."imageUrl" IS NOT NULL AND c."isActive"
  AND c."nameKo" IN ('자백','푸리나','크라운','레드후드','성옥','캐스토리스','아케론')
ORDER BY g.slug, c."sortOrder";
