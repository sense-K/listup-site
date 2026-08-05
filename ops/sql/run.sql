-- 엔드필드 서버 정리. [sql]
-- 기존에 등록돼 있던 Asia / Americas & Europe 가 실제 글로벌 서비스 리전 구조와 일치 →
-- 한국어로 이름만 바꾸고, 방금 임시로 넣었던 '글로벌'(중복)은 제거. 중국은 유지.
-- (엔드필드 매물 0건이라 서버 삭제 안전)

UPDATE "Server" SET "nameKo" = '아시아', "nameEn" = 'Asia', "sortOrder" = 1
WHERE id = 'smog16ue6mczc83';

UPDATE "Server" SET "nameKo" = '아메리카·유럽', "nameEn" = 'Americas & Europe', "sortOrder" = 2
WHERE id = 'smog175193xd0qp';

UPDATE "Server" SET "sortOrder" = 3 WHERE id = 'srv_ef_cn';

DELETE FROM "Server" s
USING "Game" g
WHERE s.id = 'srv_ef_global' AND s."gameId" = g.id AND g.slug = 'endfield'
  AND NOT EXISTS (SELECT 1 FROM "Listing" l WHERE l."serverId" = s.id);

\echo '===== 정리 결과 ====='
SELECT g.slug, s.id, s."nameKo", s."sortOrder"
FROM "Server" s JOIN "Game" g ON g.id = s."gameId"
WHERE g.slug = 'endfield' ORDER BY s."sortOrder";
