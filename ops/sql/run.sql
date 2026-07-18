-- 더미 정리 (미리보기: [sql-dry] 로 먼저 실행 → 롤백). 문제 없으면 [sql] 로 반영.
-- 삭제 대상: status='sold' Listing 전부(전부 더미로 확인됨) + 자식 레코드
--           + 더미 유저(d0000000-* 15명 + 2e7ce614)  [cmniojabx/6ebbc246 계정은 보존]

\echo '===== Listing 참조 FK 자식 테이블 (누락 방지 확인) ====='
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'Listing' ORDER BY 1;

\echo '===== User 참조 FK 자식 테이블 ====='
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'User' ORDER BY 1;

-- 삭제 대상 집합
CREATE TEMP TABLE del_listings AS SELECT id FROM "Listing" WHERE status = 'sold';
CREATE TEMP TABLE del_users(id text);
INSERT INTO del_users
  SELECT id FROM "User" WHERE id LIKE 'd0000000-%'
  UNION SELECT '2e7ce614-615e-4df3-9cba-4c1a133ae99c';

\echo '===== [before] 삭제 예정 건수 ====='
SELECT (SELECT count(*) FROM del_listings) AS sold_listings_to_delete,
       (SELECT count(*) FROM del_users) AS users_to_delete;

\echo '===== 안전점검: 삭제할 유저가 실(real) 데이터에 얽혔는지 (0이어야 안전) ====='
SELECT
 (SELECT count(*) FROM "Listing" l WHERE l."userId" IN (SELECT id FROM del_users) AND l.status <> 'sold') AS delusers_nonsold_listings,
 (SELECT count(*) FROM "Trade" t WHERE (t."buyerId" IN (SELECT id FROM del_users) OR t."sellerId" IN (SELECT id FROM del_users))
        AND t."listingId" NOT IN (SELECT id FROM del_listings)) AS delusers_trades_on_real_listings;

-- 자식 → 부모 순서 삭제 (sold listing 기준)
DELETE FROM "ListingView"      WHERE "listingId" IN (SELECT id FROM del_listings);
DELETE FROM "Review"           WHERE "listingId" IN (SELECT id FROM del_listings);
DELETE FROM "Trade"            WHERE "listingId" IN (SELECT id FROM del_listings);
DELETE FROM "ListingCharacter" WHERE "listingId" IN (SELECT id FROM del_listings);
DELETE FROM "Listing"          WHERE id IN (SELECT id FROM del_listings);

-- 삭제할 더미 유저에 남은 참조 정리 후 유저 삭제
DELETE FROM "Review" WHERE "reviewerId" IN (SELECT id FROM del_users) OR "sellerId" IN (SELECT id FROM del_users);
DELETE FROM "Trade"  WHERE "buyerId" IN (SELECT id FROM del_users) OR "sellerId" IN (SELECT id FROM del_users);
DELETE FROM "Listing" WHERE "userId" IN (SELECT id FROM del_users);
DELETE FROM "User"   WHERE id IN (SELECT id FROM del_users);

\echo '===== [after] 남은 수치 (sold=0, del_users=0 이어야 성공) ====='
SELECT (SELECT count(*) FROM "Listing" WHERE status = 'sold') AS remaining_sold,
       (SELECT count(*) FROM "User" WHERE id LIKE 'd0000000-%' OR id = '2e7ce614-615e-4df3-9cba-4c1a133ae99c') AS remaining_delusers,
       (SELECT count(*) FROM "Listing") AS remaining_listings_total,
       (SELECT count(*) FROM "User") AS remaining_users_total;
