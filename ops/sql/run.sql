-- 니케 이미지 진단 + 매칭용 목록. [sql-dry].
\echo '===== 요약 ====='
SELECT count(*) AS total,
  count(*) FILTER (WHERE c."imageUrl" LIKE '%prydwen%') AS prydwen_img,
  count(*) FILTER (WHERE c."imageUrl" IS NULL OR c."imageUrl"='') AS null_img,
  count(*) FILTER (WHERE c."imageUrl" LIKE '%githubusercontent%') AS github_img,
  count(*) FILTER (WHERE c.slug LIKE '%-treasure%') AS treasures
FROM "Character" c JOIN "Game" g ON g.id=c."gameId" WHERE g.slug='nikke';
\echo '===== NIKKE_LIST_START ====='
SELECT c."nameEn" || E'\t' || COALESCE(c.slug,'') AS row
FROM "Character" c JOIN "Game" g ON g.id=c."gameId" WHERE g.slug='nikke'
ORDER BY c."nameEn";
\echo '===== NIKKE_LIST_END ====='
