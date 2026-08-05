-- 명일방주/엔드필드 서버 구성 확인 (읽기 전용). [sql]
-- 두 게임이 이미 등록돼 있었음 → 기존 서버와 방금 넣은 서버가 겹치는지 점검.
SELECT g.slug, s.id, s."nameKo", s."nameEn", s."isActive", s."sortOrder"
FROM "Server" s JOIN "Game" g ON g.id = s."gameId"
WHERE g.slug IN ('arknights', 'endfield')
ORDER BY g.slug, s."sortOrder";
