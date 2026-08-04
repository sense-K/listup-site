-- 이환(leehwan) 뽑기 재화 추가 + 재화 현황 점검. [sql]
-- 이환 프리미엄 뽑기 재화 = 환석 (160개 = 1뽑, 스카버러 마켓)

\echo '===== 기존 importance 값 (제약 확인용) ====='
SELECT DISTINCT importance FROM "Currency";

\echo '===== 이환 gameId 확인 ====='
SELECT id, "nameKo", slug FROM "Game" WHERE slug = 'leehwan';

-- 환석 INSERT (이미 있으면 건너뜀)
INSERT INTO "Currency" (id, "gameId", "nameKo", unit, "ratePerUnit", importance, "isActive", "sortOrder", "imageUrl")
SELECT 'cur_leehwan_hwanseok', g.id, '환석', NULL, 160,
       (SELECT importance FROM "Currency" WHERE "nameKo" = '원석' LIMIT 1),
       true, 0, NULL
FROM "Game" g
WHERE g.slug = 'leehwan'
  AND NOT EXISTS (
    SELECT 1 FROM "Currency" c WHERE c."gameId" = g.id AND c."nameKo" = '환석'
  );

\echo '===== 반영 결과: 이환 재화 ====='
SELECT c."nameKo" AS "재화", c."ratePerUnit" AS "1연당", c."isActive" AS "활성",
       coalesce(c."imageUrl",'(이미지 없음)') AS "이미지"
FROM "Currency" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'leehwan' ORDER BY c."sortOrder";

\echo '===== 전체 게임 재화 보유 현황 ====='
SELECT g."nameKo" AS "게임", g.slug,
       (SELECT count(*) FROM "Currency" c WHERE c."gameId" = g.id AND c."isActive") AS "재화수",
       (SELECT count(*) FROM "Listing" l WHERE l."gameId" = g.id) AS "매물수"
FROM "Game" g WHERE g."isActive" = true
ORDER BY 4 DESC, 1;
