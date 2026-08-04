-- 니케 캐릭터 이미지 출처 분포 확인 (읽기 전용). [sql]
-- 크라운의 imageUrl 이 128x128 스프라이트라 랜딩 카드에 쓰면 뭉개진다.
-- 큰 원본(prydwen fullImage)을 쓰는 캐릭터가 있는지 본다.

\echo '===== 니케 이미지 도메인 분포 ====='
SELECT split_part(split_part(c."imageUrl", '//', 2), '/', 1) AS "도메인", count(*)
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'nikke' AND c."imageUrl" IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC;

\echo ''
\echo '===== 스프라이트가 아닌 니케 캐릭터 (상위 12) ====='
SELECT c."nameKo", c."imageUrl"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'nikke' AND c."imageUrl" IS NOT NULL
  AND c."imageUrl" NOT LIKE '%Nikke-db%'
ORDER BY c."sortOrder" LIMIT 12;

\echo ''
\echo '===== 원신 자백 이미지 도메인 (참고) ====='
SELECT split_part(split_part(c."imageUrl", '//', 2), '/', 1) AS "도메인", count(*)
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'genshin' AND c."imageUrl" IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC;
