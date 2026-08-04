-- 우마무스메: 플레이어가 보유할 수 없는 인간 스태프 8명을 도감에서 내린다. [sql]
--
-- 근거: 우마무스메 캐릭터는 전원 신장(height) 정보가 있는데 이 8명만 없고,
-- 카카오 원본 설명도 "프로듀서", "URA 트레센 학원 강화 부문 소속" 같은 스태프 소개다.
-- umapyoi(플레이 가능 우마무스메 목록)에도 없어서 이미지 자체가 존재하지 않는다.
-- 거래소는 '보유 캐릭터'로 계정을 찾는 곳이라 이들은 검색 대상이 될 수 없다.
--
-- 삭제가 아니라 isActive=false — 도감/필터/등록화면/사이트맵에서 빠지고 데이터는 남는다.
-- 되돌리려면 아래 UPDATE 를 true 로 바꿔 다시 실행하면 된다.

\echo '===== 내리기 전: 대상 확인 ====='
SELECT c."nameKo", c."nameEn", c."isActive",
       (SELECT count(*) FROM "ListingCharacter" lc WHERE lc."characterId" = c.id) AS "연결된 매물"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' AND c."imageUrl" IS NULL
ORDER BY c."sortOrder";

UPDATE "Character" c
SET "isActive" = false, "updatedAt" = now()
FROM "Game" g
WHERE g.id = c."gameId" AND g.slug = 'umamusume'
  AND c."imageUrl" IS NULL
  AND c."isActive" = true;

\echo ''
\echo '===== 내린 후: 도감에 남는 캐릭터 ====='
SELECT count(*) FILTER (WHERE c."isActive") AS "노출",
       count(*) FILTER (WHERE NOT c."isActive") AS "숨김",
       count(*) FILTER (WHERE c."isActive" AND c."imageUrl" IS NULL) AS "노출인데 이미지 없음(0이어야 함)"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume';

\echo ''
\echo '===== 숨긴 목록 ====='
SELECT c."nameKo", c."nameEn"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' AND NOT c."isActive" ORDER BY c."sortOrder";
