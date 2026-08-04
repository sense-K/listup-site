-- public 스키마의 timestamp(타임존 없음) 컬럼을 전부 timestamptz로 변환.
-- 저장값은 UTC 기준이므로 AT TIME ZONE 'UTC'로 재해석한다.
-- [sql-dry] 로 먼저 검증 → 문제 없으면 [sql] 로 반영.

\echo '===== DB 타임존 설정 ====='
SHOW TimeZone;

\echo '===== 변환 대상 (timestamp without time zone) ====='
SELECT c.table_name AS "테이블", c.column_name AS "컬럼",
       c.is_nullable AS "널허용", c.column_default AS "기본값"
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.data_type = 'timestamp without time zone'
  AND t.table_type = 'BASE TABLE'
ORDER BY c.table_name, c.ordinal_position;

\echo '===== 이미 timestamptz인 컬럼 (참고) ====='
SELECT c.table_name AS "테이블", c.column_name AS "컬럼"
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.data_type = 'timestamp with time zone'
  AND t.table_type = 'BASE TABLE'
ORDER BY c.table_name, c.ordinal_position;

\echo '===== 해당 컬럼에 의존하는 뷰 (있으면 ALTER가 막힘) ====='
SELECT DISTINCT dependent.relname AS "뷰", source.relname AS "원본 테이블"
FROM pg_depend d
JOIN pg_rewrite r     ON r.oid = d.objid
JOIN pg_class dependent ON dependent.oid = r.ev_class
JOIN pg_class source    ON source.oid = d.refobjid
JOIN pg_attribute a     ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
JOIN pg_type ty         ON ty.oid = a.atttypid
WHERE dependent.relkind IN ('v','m')
  AND ty.typname = 'timestamp'
  AND source.relnamespace = 'public'::regnamespace;

\echo '===== 변환 실행 ====='
DO $mig$
DECLARE
  r record;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.data_type = 'timestamp without time zone'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I TYPE timestamptz USING %I AT TIME ZONE ''UTC''',
      r.table_name, r.column_name, r.column_name);
    n := n + 1;
    RAISE NOTICE '  변환 완료: %.%', r.table_name, r.column_name;
  END LOOP;
  RAISE NOTICE '총 % 개 컬럼 변환', n;
END $mig$;

\echo '===== 변환 후: 남은 timestamp 컬럼 (0건이어야 함) ====='
SELECT count(*) AS "남은 timestamp 컬럼"
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE c.table_schema = 'public'
  AND c.data_type = 'timestamp without time zone'
  AND t.table_type = 'BASE TABLE';

\echo '===== 값 검증: 변환 후에도 시각이 그대로인지 (Listing 상위 5건) ====='
SELECT left(id, 8) AS id,
       "createdAt"::text AS created,
       "bumpedAt"::text  AS bumped,
       ("bumpedAt" - "createdAt") AS diff
FROM "Listing" ORDER BY "bumpedAt" DESC LIMIT 5;

\echo '===== PostgREST JSON 형태 (양쪽 다 +00:00 이어야 함) ====='
SELECT to_jsonb(t) AS json_row
FROM (SELECT "createdAt", "updatedAt", "bumpedAt" FROM "Listing" ORDER BY "bumpedAt" DESC LIMIT 1) t;
