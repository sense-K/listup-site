-- 니케 이미지 진단 + 매칭용 목록. [sql-dry].
\echo '===== 요약 ====='
SELECT count(*) AS total,
  count(*) FILTER (WHERE "imageUrl" LIKE '%prydwen%') AS prydwen_img,
  count(*) FILTER (WHERE "imageUrl" IS NULL OR "imageUrl"='') AS null_img,
  count(*) FILTER (WHERE "imageUrl" LIKE '%githubusercontent%') AS github_img,
  count(*) FILTER (WHERE slug LIKE '%-treasure%') AS treasures
FROM "Character" c JOIN "Game" g ON g.id=c."gameId" WHERE g.slug='nikke';
\echo '===== NIKKE_LIST_START ====='
SELECT "nameEn" || E'\t' || COALESCE(slug,'') AS row
FROM "Character" c JOIN "Game" g ON g.id=c."gameId" WHERE g.slug='nikke'
ORDER BY "nameEn";
\echo '===== NIKKE_LIST_END ====='
