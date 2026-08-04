-- 우마무스메 도감 데이터 검증 (읽기 전용). [sql]
-- 직전 slug 생성은 UPDATE 144로 성공했고, 확인 SELECT만 "slug is ambiguous"로 실패했다.

\echo '===== slug 현황 ====='
SELECT count(*) AS "전체",
       count(c.slug) AS "slug 있음",
       count(*) FILTER (WHERE c.slug IS NULL OR c.slug = '') AS "slug 없음",
       count(*) FILTER (WHERE c."imageUrl" IS NOT NULL) AS "이미지 있음",
       count(*) FILTER (WHERE c.metadata->>'fullImageUrl' IS NOT NULL) AS "배너 있음",
       count(*) FILTER (WHERE c.metadata->>'cv' IS NOT NULL) AS "성우 있음",
       count(*) FILTER (WHERE c.metadata->>'birthday' IS NOT NULL) AS "생일 있음"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId" WHERE g.slug = 'umamusume';

\echo '===== 중복 slug (0행이어야 함) ====='
SELECT c.slug, count(*) FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' GROUP BY c.slug HAVING count(*) > 1;

\echo '===== 샘플 10건 ====='
SELECT c."nameKo", c."nameEn", c.slug,
       c.metadata->>'cv' AS "성우", c.metadata->>'birthday' AS "생일",
       left(coalesce(c.metadata->>'catchphrase',''), 20) AS "캐치프레이즈"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' ORDER BY c."sortOrder" LIMIT 10;

\echo '===== 이미지 없는 캐릭터 ====='
SELECT c."nameKo", c."nameEn", c.slug
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' AND c."imageUrl" IS NULL ORDER BY c."sortOrder";
