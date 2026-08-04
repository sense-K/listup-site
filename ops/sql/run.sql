-- 게임별 캐릭터 수급 현황 전수 조사 (읽기 전용). [sql]

\echo '===== 게임 전체 현황 ====='
SELECT g.slug, g."nameKo", g."isActive" AS "활성",
       (SELECT count(*) FROM "Character" c WHERE c."gameId"=g.id AND c."isActive") AS "캐릭터",
       (SELECT count(*) FROM "Character" c WHERE c."gameId"=g.id AND c."isActive" AND c."imageUrl" IS NOT NULL) AS "이미지",
       (SELECT count(*) FROM "Character" c WHERE c."gameId"=g.id AND c."isActive" AND c.slug IS NOT NULL AND c.slug<>'') AS "slug",
       (SELECT count(*) FROM "Server" s WHERE s."gameId"=g.id AND s."isActive") AS "서버",
       (SELECT count(*) FROM "Currency" cu WHERE cu."gameId"=g.id AND cu."isActive") AS "재화",
       (SELECT count(*) FROM "Listing" l WHERE l."gameId"=g.id) AS "매물"
FROM "Game" g ORDER BY g."isActive" DESC, g."sortOrder", g."nameKo";

\echo ''
\echo '===== 캐릭터 이미지 도메인 분포 (수급 경로 파악용) ====='
SELECT g.slug,
       split_part(split_part(c."imageUrl",'//',2),'/',1) AS "도메인",
       count(*)
FROM "Character" c JOIN "Game" g ON g.id=c."gameId"
WHERE c."isActive" AND c."imageUrl" IS NOT NULL
GROUP BY 1,2 ORDER BY 1,3 DESC;

\echo ''
\echo '===== metadata 채워진 정도 (자동 수집 여부의 지표) ====='
SELECT g.slug,
       count(*) AS "캐릭터",
       count(*) FILTER (WHERE c.metadata IS NOT NULL AND c.metadata::text <> '{}') AS "metadata 있음",
       count(*) FILTER (WHERE c."nameEn" IS NOT NULL AND c."nameEn" <> '') AS "영문명",
       count(*) FILTER (WHERE c.tier IS NOT NULL AND c.tier <> '') AS "등급"
FROM "Character" c JOIN "Game" g ON g.id=c."gameId"
WHERE c."isActive" GROUP BY 1 ORDER BY 2 DESC;
