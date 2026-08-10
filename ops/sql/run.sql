-- 카오스 제로 나이트메어 등록 (Game + Server). [sql]
-- 서버는 ASIA / GLOBAL 두 개. 재화(돌계)는 정보 확보 후 별도로 추가한다.
INSERT INTO "Game" (id, slug, "nameKo", "nameEn", color, emoji, "isActive", "sortOrder", "imageUrl", "artImageUrl")
VALUES ('game_czn', 'czn', '카오스 제로 나이트메어', 'Chaos Zero Nightmare',
        '#7c3aed', '🌑', true, 13, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "Server" (id, "gameId", "nameKo", "nameEn", premium, "isActive", "sortOrder")
SELECT v.sid, g.id, v.ko, v.en, 1, true, v.ord
FROM (VALUES
  ('srv_czn_asia',   '아시아', 'ASIA',   1),
  ('srv_czn_global', '글로벌', 'GLOBAL', 2)
) AS v(sid, ko, en, ord)
JOIN "Game" g ON g.slug = 'czn'
WHERE NOT EXISTS (SELECT 1 FROM "Server" x WHERE x."gameId" = g.id AND x."nameKo" = v.ko);

\echo '===== 반영 결과 ====='
SELECT g.slug, g."nameKo", g."isActive", g."sortOrder",
       (SELECT count(*) FROM "Server" s WHERE s."gameId" = g.id) AS servers,
       (SELECT count(*) FROM "Character" c WHERE c."gameId" = g.id) AS characters
FROM "Game" g WHERE g.slug = 'czn';
SELECT s.id, s."nameKo", s."nameEn", s."sortOrder"
FROM "Server" s JOIN "Game" g ON g.id = s."gameId" WHERE g.slug = 'czn' ORDER BY s."sortOrder";
