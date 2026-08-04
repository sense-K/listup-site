-- 우마무스메 캐릭터 slug 생성 (상세 페이지 URL용). [sql]
-- nameEn 기반: "Special Week" → "special-week", 중복 시 뒤에 일련번호

WITH base AS (
  SELECT c.id,
         regexp_replace(
           regexp_replace(lower(coalesce(c."nameEn", c."nameKo")), '[^a-z0-9]+', '-', 'g'),
           '(^-+|-+$)', '', 'g') AS s
  FROM "Character" c
  JOIN "Game" g ON g.id = c."gameId"
  WHERE g.slug = 'umamusume' AND (c.slug IS NULL OR c.slug = '')
), numbered AS (
  SELECT id, s,
         row_number() OVER (PARTITION BY s ORDER BY id) AS rn
  FROM base
)
UPDATE "Character" c
SET slug = CASE WHEN n.rn = 1 THEN n.s ELSE n.s || '-' || n.rn END
FROM numbered n
WHERE c.id = n.id AND n.s <> '';

\echo '===== slug 생성 결과 ====='
SELECT count(*) AS "전체", count(slug) AS "slug 있음",
       count(*) FILTER (WHERE slug IS NULL OR slug = '') AS "slug 없음"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId" WHERE g.slug = 'umamusume';

\echo '===== 중복 slug (0이어야 함) ====='
SELECT slug, count(*) FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' GROUP BY slug HAVING count(*) > 1;

\echo '===== 샘플 10건 ====='
SELECT c."nameKo", c."nameEn", c.slug, c."imageUrl" IS NOT NULL AS "이미지",
       c.metadata->>'cv' AS "성우", c.metadata->>'birthday' AS "생일"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' ORDER BY c."sortOrder" LIMIT 10;
