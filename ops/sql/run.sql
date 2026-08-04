-- createdAt / bumpedAt 타입·값 비교 (끌올 오판정 원인 확인). 읽기 전용. [sql]
\echo '===== Listing 시각 컬럼 타입 ====='
SELECT column_name, data_type, datetime_precision
FROM information_schema.columns
WHERE table_name = 'Listing' AND column_name IN ('createdAt','updatedAt','bumpedAt')
ORDER BY column_name;

\echo '===== 실제 값 비교 (상위 8건) ====='
SELECT left(id, 8) AS id,
       "createdAt"::text AS created_raw,
       "bumpedAt"::text  AS bumped_raw,
       ("bumpedAt" - "createdAt") AS diff
FROM "Listing" ORDER BY "bumpedAt" DESC LIMIT 8;

\echo '===== 두 값이 실제로 다른 매물 수 ====='
SELECT count(*) AS "전체",
       count(*) FILTER (WHERE "bumpedAt" IS DISTINCT FROM "createdAt") AS "다름",
       count(*) FILTER (WHERE abs(extract(epoch FROM ("bumpedAt" - "createdAt"))) > 60) AS "1분 이상 차이"
FROM "Listing";

\echo '===== PostgREST가 내보내는 JSON 형태 (타임존 표기 유무 확인) ====='
SELECT to_jsonb(t) AS json_row
FROM (SELECT "createdAt", "bumpedAt" FROM "Listing" ORDER BY "bumpedAt" DESC LIMIT 1) t;
