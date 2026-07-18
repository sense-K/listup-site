-- 진단 조회 2차 (읽기 전용). [sql-dry] 로 실행.
\echo '===== [A] User 테이블 컬럼 목록 ====='
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS user_columns
FROM information_schema.columns WHERE table_name = 'User';

\echo '===== [B] 의심 더미유저 검증 (nickname + 활동내역) ====='
SELECT u.id, u.nickname, u."tradeCount",
  (SELECT COUNT(*) FROM "Listing" li WHERE li."userId" = u.id) AS listings_all,
  (SELECT COUNT(*) FROM "Listing" li WHERE li."userId" = u.id AND li.status <> 'sold') AS listings_not_sold,
  (SELECT COUNT(*) FROM "Trade" tb WHERE tb."buyerId" = u.id) AS buys,
  (SELECT COUNT(*) FROM "Trade" ts WHERE ts."sellerId" = u.id) AS sells,
  (SELECT COUNT(*) FROM "Review" rv WHERE rv."reviewerId" = u.id) AS reviews_written
FROM "User" u
WHERE u.id LIKE 'd0000000-%'
   OR u.id IN ('cmniojabx0000j8cv7mdy7nvv','6ebbc246-ddb6-40c8-ad35-4c194f8e361f','2e7ce614-615e-4df3-9cba-4c1a133ae99c')
ORDER BY u.id;

\echo '===== [C] 전체 sold 를 userId 별로 (모든 더미 유저 포착) ====='
SELECT l."userId", COUNT(*) AS sold_cnt,
  COUNT(*) FILTER (WHERE l."kakaoOpenChatUrl" IS NULL OR l."kakaoOpenChatUrl" = '') AS no_kakao,
  COUNT(t.id) AS with_trade
FROM "Listing" l LEFT JOIN "Trade" t ON t."listingId" = l.id
WHERE l.status = 'sold'
GROUP BY l."userId" ORDER BY sold_cnt DESC;

\echo '===== [D] 완료 불일치: Trade=completed 인데 Listing!=sold ====='
SELECT count(*) AS trade_done_listing_not_sold
FROM "Trade" t JOIN "Listing" l ON l.id = t."listingId"
WHERE t.status = 'completed' AND l.status <> 'sold';

\echo '===== [E] Listing=seller_confirmed 인데 대응 Trade 상태 분포 ====='
SELECT t.status AS trade_status, count(*)
FROM "Listing" l JOIN "Trade" t ON t."listingId" = l.id
WHERE l.status = 'seller_confirmed' GROUP BY t.status;

\echo '===== [F] 전체 유저 수 / 더미 아닌 실유저 sold 여부 감 잡기 ====='
SELECT COUNT(*) AS total_users FROM "User";
