-- 명일방주 / 명일방주 엔드필드 게임 등록 (없을 때만). [sql]
-- 두 게임 다 isActive=false 로 시작 — 캐릭터·이미지 채운 뒤 운영자가 활성화 결정.

\echo '===== 현재 상태 ====='
SELECT slug, "nameKo", "isActive" FROM "Game" WHERE slug IN ('arknights', 'endfield');

-- 명일방주 (auto-sync 의 arknights 어댑터가 이 행을 찾는다)
INSERT INTO "Game" (id, slug, "nameKo", "nameEn", color, emoji, "isActive", "sortOrder", "imageUrl", "artImageUrl")
VALUES ('game_arknights', 'arknights', '명일방주', 'Arknights', '#0ea5e9', '🛡️', false, 20, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

-- 명일방주 엔드필드
INSERT INTO "Game" (id, slug, "nameKo", "nameEn", color, emoji, "isActive", "sortOrder", "imageUrl", "artImageUrl")
VALUES ('game_endfield', 'endfield', '명일방주 엔드필드', 'Arknights: Endfield', '#eab308', '⚙️', false, 21, NULL, NULL)
ON CONFLICT (slug) DO NOTHING;

-- 서버 (없을 때만). 명일방주: 한국/글로벌/일본, 엔드필드: 글로벌/중국
INSERT INTO "Server" (id, "gameId", "nameKo", "nameEn", premium, "isActive", "sortOrder")
SELECT v.sid, g.id, v.ko, v.en, 1, true, v.ord
FROM (VALUES
  ('srv_ak_kr',     'arknights', '한국',   'Korea',  1),
  ('srv_ak_global', 'arknights', '글로벌', 'Global', 2),
  ('srv_ak_jp',     'arknights', '일본',   'Japan',  3),
  ('srv_ef_global', 'endfield',  '글로벌', 'Global', 1),
  ('srv_ef_cn',     'endfield',  '중국',   'China',  2)
) AS v(sid, gslug, ko, en, ord)
JOIN "Game" g ON g.slug = v.gslug
WHERE NOT EXISTS (SELECT 1 FROM "Server" x WHERE x."gameId" = g.id AND x."nameKo" = v.ko);

\echo '===== 반영 결과 ====='
SELECT g.slug, g."nameKo", g."isActive",
       (SELECT count(*) FROM "Server" s WHERE s."gameId" = g.id) AS servers,
       (SELECT count(*) FROM "Character" c WHERE c."gameId" = g.id) AS characters
FROM "Game" g WHERE g.slug IN ('arknights', 'endfield');
