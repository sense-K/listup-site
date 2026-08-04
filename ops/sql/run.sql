-- Game/Server 등록 규칙 파악 (우마무스메 추가 전 조사). 읽기 전용. [sql]
\echo '===== Game 테이블 컬럼 ====='
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_name = 'Game' ORDER BY ordinal_position;

\echo '===== 기존 게임 아이콘/아트 URL 규칙 ====='
SELECT "nameKo", slug, emoji, "sortOrder",
       coalesce("imageUrl", '(없음)') AS app_icon,
       coalesce("artImageUrl", '(없음)') AS art
FROM "Game" WHERE "isActive" ORDER BY "sortOrder" NULLS LAST, "nameKo";

\echo '===== Server 테이블 컬럼 ====='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns WHERE table_name = 'Server' ORDER BY ordinal_position;

\echo '===== 게임별 서버 목록 ====='
SELECT g."nameKo" AS "게임", s."nameKo" AS "서버", s.premium
FROM "Server" s JOIN "Game" g ON g.id = s."gameId"
ORDER BY g."nameKo", s."nameKo";

\echo '===== Game.id 형식 샘플 ====='
SELECT id, slug FROM "Game" LIMIT 3;
