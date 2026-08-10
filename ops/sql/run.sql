-- 카오스 제로 나이트메어가 이미 등록돼 있는지 확인 (읽기 전용). [sql]
SELECT g."sortOrder" AS ord, g.slug, g."nameKo", g."isActive",
       (SELECT count(*) FROM "Character" c WHERE c."gameId" = g.id) AS chars,
       (SELECT count(*) FROM "Server"   s WHERE s."gameId" = g.id) AS servers,
       (SELECT count(*) FROM "Currency" u WHERE u."gameId" = g.id) AS currencies
FROM "Game" g
WHERE g.slug ILIKE '%chaos%' OR g.slug ILIKE '%czn%' OR g."nameKo" LIKE '%카오스%'
   OR g."nameEn" ILIKE '%chaos%';

\echo '===== 현재 등록된 게임 전체 ====='
SELECT g."sortOrder" AS ord, g.slug, g."nameKo", g."isActive" FROM "Game" g ORDER BY g."sortOrder", g.slug;

\echo '===== Currency 컬럼 (돌계 재화 추가용) ====='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns WHERE table_name = 'Currency' ORDER BY ordinal_position;

\echo '===== Game 컬럼 ====='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns WHERE table_name = 'Game' ORDER BY ordinal_position;
