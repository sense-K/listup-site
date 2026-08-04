-- 재화 설정 + 이미지 URL 전수 조사. 읽기 전용. [sql]
\echo '===== 등록된 재화 전체 (이미지 URL 포함) ====='
SELECT g."nameKo" AS "게임", g.slug,
       c."nameKo" AS "재화", c."ratePerUnit" AS "1연당",
       c."sortOrder" AS "순서", c."isActive" AS "활성",
       coalesce(c."imageUrl", '(없음)') AS "이미지"
FROM "Currency" c
JOIN "Game" g ON g.id = c."gameId"
ORDER BY g."sortOrder" NULLS LAST, g."nameKo", c."sortOrder";

\echo '===== 이미지 없는 재화 ====='
SELECT g."nameKo" AS "게임", c."nameKo" AS "재화"
FROM "Currency" c JOIN "Game" g ON g.id = c."gameId"
WHERE c."imageUrl" IS NULL OR c."imageUrl" = ''
ORDER BY 1, 2;

\echo '===== 활성 게임 전체 (재화 유무 / 캐릭터 수 / 매물 수) ====='
SELECT g."nameKo" AS "게임", g.slug,
       (SELECT count(*) FROM "Currency" c WHERE c."gameId" = g.id AND c."isActive") AS "재화수",
       (SELECT count(*) FROM "Character" ch WHERE ch."gameId" = g.id AND ch."isActive") AS "캐릭터수",
       (SELECT count(*) FROM "Listing" l WHERE l."gameId" = g.id) AS "매물수",
       (SELECT count(*) FROM "Server" s WHERE s."gameId" = g.id) AS "서버수"
FROM "Game" g WHERE g."isActive" = true
ORDER BY 5 DESC, 1;

\echo '===== Currency 테이블 컬럼 구조 ====='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Currency' ORDER BY ordinal_position;
