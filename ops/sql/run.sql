-- 스키마 확정 전 정찰. [sql-dry].
\echo '===== User 컬럼 ====='
SELECT column_name FROM information_schema.columns WHERE table_name='User' ORDER BY ordinal_position;
\echo '===== Listing 컬럼 ====='
SELECT column_name FROM information_schema.columns WHERE table_name='Listing' ORDER BY ordinal_position;
\echo '===== Currency 테이블 행수 ====='
SELECT count(*) AS currency_rows FROM "Currency";
\echo '===== Currency 샘플 ====='
SELECT * FROM "Currency" ORDER BY "sortOrder" NULLS LAST LIMIT 15;
\echo '===== ListingCurrency 사용 건수 ====='
SELECT count(*) AS listingcurrency_rows FROM "ListingCurrency";
\echo '===== 매물 캐릭터 유무 (type backfill 판단) ====='
SELECT count(*) AS total,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM "ListingCharacter" lc WHERE lc."listingId"=l.id)) AS with_char,
  count(*) FILTER (WHERE NOT EXISTS(SELECT 1 FROM "ListingCharacter" lc WHERE lc."listingId"=l.id)) AS no_char
FROM "Listing" l;
\echo '===== 이미 있는 상점 관련 컬럼? ====='
SELECT column_name FROM information_schema.columns
WHERE table_name='User' AND column_name IN ('username','shopBio','isVerified','sellerGrade','deliveryTime');
