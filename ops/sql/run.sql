-- 게임공략(도감) 사용량 점검. [sql]  ※ 읽기 전용
--
-- 주의: 공략/도감 페이지 조회수는 이 DB에 쌓이지 않는다 (GA4에만 있음).
--       DB 로 알 수 있는 것은 ① 공략 콘텐츠 규모 ② 공략이 거래로 이어질 여지
--       ③ 비교 기준이 되는 '거래소 실제 조회수'(ListingView) 세 가지다.

\echo '════════ ① 공략 콘텐츠 규모 — 게임별 도감/상세 페이지 수 ════════'
-- 상세페이지 = slug 가 있어야 /game/{slug}/characters/{slug}/ 이 열린다 (sitemap 에도 이만큼 나감)
SELECT g.slug AS 게임,
       g."nameKo" AS 이름,
       count(*) FILTER (WHERE c.kind='character' AND c."isActive")                          AS 캐릭터,
       count(*) FILTER (WHERE c.kind='character' AND c."isActive" AND c.slug IS NOT NULL)   AS 상세페이지,
       count(*) FILTER (WHERE c.kind='character' AND c."isActive" AND c."imageUrl" IS NULL) AS 이미지없음,
       CASE WHEN count(*) FILTER (WHERE c.kind='character' AND c."isActive" AND c.slug IS NOT NULL) > 0
            THEN '도감 있음' ELSE '도감 없음' END AS 상태
FROM "Game" g
LEFT JOIN "Character" c ON c."gameId" = g.id
WHERE g."isActive"
GROUP BY g.slug, g."nameKo", g."sortOrder"
ORDER BY 상세페이지 DESC, g.slug;

\echo ''
\echo '════════ ② 공략 → 거래 연결도 — 도감에서 "보유 계정 N개" 가 뜨는 비율 ════════'
-- 캐릭터 상세 페이지는 그 캐릭터를 가진 판매중 매물 수를 보여준다.
-- 이 값이 0 이면 상세 페이지가 "첫 판매자 되기" 만 노출된다 = 거래로 이어질 여지 없음.
WITH ch AS (
  SELECT c.id, c."gameId", c.slug
  FROM "Character" c
  WHERE c.kind='character' AND c."isActive" AND c.slug IS NOT NULL
), lc AS (
  SELECT lc."characterId", count(DISTINCT l.id) AS n
  FROM "ListingCharacter" lc
  JOIN "Listing" l ON l.id = lc."listingId" AND l.status IN ('active','trading')
  GROUP BY lc."characterId"
)
SELECT g.slug AS 게임,
       count(*)                                   AS 상세페이지,
       count(*) FILTER (WHERE coalesce(lc.n,0) > 0) AS "매물있는 캐릭터",
       round(100.0 * count(*) FILTER (WHERE coalesce(lc.n,0) > 0) / nullif(count(*),0), 1) AS "연결률(%)",
       coalesce(sum(lc.n),0)                      AS "총 연결 매물수"
FROM ch
JOIN "Game" g ON g.id = ch."gameId"
LEFT JOIN lc ON lc."characterId" = ch.id
GROUP BY g.slug
ORDER BY "연결률(%)" DESC NULLS LAST, 상세페이지 DESC;

\echo ''
\echo '════════ ③ 실제로 측정되는 사용량 — 거래소 매물 조회 (ListingView) ════════'
\echo '   (공략 페이지에는 이런 기록이 없다. 비교 기준으로만 본다)'
SELECT g.slug AS 게임,
       count(*)                                                              AS "총 조회",
       count(*) FILTER (WHERE v."viewedAt" >= now() - interval '7 days')     AS "최근7일",
       count(*) FILTER (WHERE v."viewedAt" >= now() - interval '30 days')    AS "최근30일",
       max(v."viewedAt")                                                     AS "마지막 조회"
FROM "ListingView" v
JOIN "Listing" l ON l.id = v."listingId"
JOIN "Game" g    ON g.id = l."gameId"
GROUP BY g.slug
ORDER BY "최근30일" DESC, "총 조회" DESC;

\echo ''
\echo '════════ ④ 전체 요약 ════════'
SELECT
  (SELECT count(*) FROM "Character" WHERE kind='character' AND "isActive" AND slug IS NOT NULL) AS "도감 상세페이지 총합",
  (SELECT count(DISTINCT g.id) FROM "Game" g JOIN "Character" c ON c."gameId"=g.id
    WHERE g."isActive" AND c.kind='character' AND c."isActive" AND c.slug IS NOT NULL)          AS "도감 있는 게임",
  (SELECT count(*) FROM "Game" WHERE "isActive")                                                AS "활성 게임",
  (SELECT count(*) FROM "ListingView")                                                          AS "매물조회 기록 총합",
  (SELECT count(*) FROM "ListingView" WHERE "viewedAt" >= now() - interval '30 days')           AS "최근30일 매물조회";
