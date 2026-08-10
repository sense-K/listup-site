-- 카오스 제로 나이트메어 돌계 재화 등록: 크리스탈, 1연 = 130개. [sql]
-- unit / importance 는 기존 게임들이 쓰는 값을 그대로 따라간다 (최빈값)
\echo '===== 기존 재화 설정 (규칙 확인) ====='
SELECT g.slug, c."nameKo", c.unit, c."ratePerUnit", c.importance, c."sortOrder"
FROM "Currency" c JOIN "Game" g ON g.id = c."gameId"
ORDER BY g.slug, c."sortOrder";

INSERT INTO "Currency" (id, "gameId", "nameKo", unit, "ratePerUnit", importance, "isActive", "sortOrder", "imageUrl")
SELECT 'cur_czn_crystal', g.id, '크리스탈',
       (SELECT unit FROM "Currency" WHERE unit IS NOT NULL GROUP BY unit ORDER BY count(*) DESC LIMIT 1),
       130,
       (SELECT importance FROM "Currency" GROUP BY importance ORDER BY count(*) DESC LIMIT 1),
       true, 1, NULL
FROM "Game" g
WHERE g.slug = 'czn'
  AND NOT EXISTS (SELECT 1 FROM "Currency" c WHERE c."gameId" = g.id AND c."nameKo" = '크리스탈');

\echo '===== 반영 결과 ====='
SELECT g.slug, g."nameKo" AS game, c."nameKo" AS 재화, c.unit, c."ratePerUnit" AS "1연당", c.importance, c."isActive"
FROM "Currency" c JOIN "Game" g ON g.id = c."gameId" WHERE g.slug = 'czn';
