-- 공략(게임공략) 사용량을 볼 수 있는 데이터가 DB에 있는지 확인 (읽기 전용). [sql]

\echo '===== 1) 전체 테이블 목록 ====='
SELECT table_name,
       (SELECT count(*) FROM information_schema.columns c
        WHERE c.table_name = t.table_name AND c.table_schema='public') AS cols
FROM information_schema.tables t
WHERE table_schema='public' AND table_type='BASE TABLE'
ORDER BY table_name;

\echo '===== 2) 조회/방문/로그 성격의 테이블·컬럼 ====='
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public'
  AND (column_name ILIKE '%view%' OR column_name ILIKE '%visit%'
       OR column_name ILIKE '%page%' OR column_name ILIKE '%path%'
       OR column_name ILIKE '%hit%'  OR column_name ILIKE '%log%')
ORDER BY table_name, column_name;

\echo '===== 3) 조회수 집계 함수/RPC ====='
SELECT p.proname AS func, pg_get_function_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND (p.proname ILIKE '%view%' OR p.proname ILIKE '%track%' OR p.proname ILIKE '%hot%')
ORDER BY p.proname;

\echo '===== 4) 공략 페이지가 읽는 데이터: 게임별 캐릭터 수 (도감 규모) ====='
SELECT g.slug, g."nameKo",
       count(*) FILTER (WHERE c.kind='character' AND c."isActive") AS 캐릭터,
       count(*) FILTER (WHERE c.kind='character' AND c."isActive" AND c.slug IS NOT NULL) AS 상세페이지있음
FROM "Game" g LEFT JOIN "Character" c ON c."gameId"=g.id
GROUP BY g.slug, g."nameKo", g."sortOrder"
ORDER BY 상세페이지있음 DESC NULLS LAST;
