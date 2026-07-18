-- 진단 조회 (읽기 전용). [sql-dry] 로 실행.
\echo '===== [1] Trade 상태 분포 ====='
SELECT status, count(*) FROM "Trade" GROUP BY status ORDER BY 2 DESC;

\echo '===== [2] Listing 상태 분포 ====='
SELECT status, count(*) FROM "Listing" GROUP BY status ORDER BY 2 DESC;

\echo '===== [3] Trade / Listing RLS 정책 (거래완료 무음실패 확정용) ====='
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('Trade','Listing')
ORDER BY tablename, cmd;

\echo '===== [4] Review 있는데 Trade!=completed (완료 무음실패 흔적) 건수 ====='
SELECT count(*) AS mismatch
FROM "Review" r
LEFT JOIN "Trade" t ON t."listingId" = r."listingId" AND t."buyerId" = r."reviewerId"
WHERE t.status IS DISTINCT FROM 'completed';

\echo '===== [5] seller_confirmed 에 고여있는 Trade 건수 ====='
SELECT count(*) AS stuck_seller_confirmed FROM "Trade" WHERE status = 'seller_confirmed';

\echo '===== [6] 더미(A) description-풀 기반: 게임/유저별 건수 ====='
SELECT g.slug, l."userId", COUNT(*) AS cnt
FROM "Listing" l JOIN "Game" g ON g.id = l."gameId"
WHERE l.status = 'sold'
  AND l."userId" IN ('cmniojabx0000j8cv7mdy7nvv','d0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000011','6ebbc246-ddb6-40c8-ad35-4c194f8e361f','2e7ce614-615e-4df3-9cba-4c1a133ae99c')
  AND l.description IN (
    '초기 30연 5성 캐릭 풀돌 계정 판매합니다. 자세한 정보는 톡 주세요.',
    '메인 딜러 + 서포터 풀템 세팅 완료. 즉시 사용 가능.',
    '장기 미접속 정리합니다. 캐릭터 다양함.',
    '휴면 계정 정리. 메인 캐릭 만렙.',
    '이벤트 캐릭터 다수 보유. 카카오톡으로 문의.',
    '서브계정 정리. 리세 추천.',
    '원석/재화 보유. 신규 시작용으로 좋아요.',
    '복귀 유저용 추천. 컨텐츠 진입 가능.',
    '쿨거래 가능. 네고 불가.',
    '인기 한정 캐릭 다수 보유. 급처합니다.',
    '인기 5성 캐릭 다수 보유. 급처합니다.',
    '시작 단계부터 육성한 계정. 메인 컨텐츠 클리어.',
    '이벤트 재화 다수 보유. 즉시 사용 가능한 계정입니다.')
GROUP BY g.slug, l."userId" ORDER BY g.slug;

\echo '===== [7] 더미(B) 넓은그물: sold + 카톡URL없음 + Trade없음 (게임/유저별) ====='
SELECT g.slug, l."userId", COUNT(*) AS cnt
FROM "Listing" l JOIN "Game" g ON g.id = l."gameId"
LEFT JOIN "Trade" t ON t."listingId" = l.id
WHERE l.status = 'sold'
  AND (l."kakaoOpenChatUrl" IS NULL OR l."kakaoOpenChatUrl" = '')
  AND t.id IS NULL
GROUP BY g.slug, l."userId" ORDER BY g.slug, cnt DESC;

\echo '===== [8] 더미 유저 후보 5명 실유저 검증 ====='
SELECT u.id, u.nickname, u.email, u."tradeCount",
       (SELECT COUNT(*) FROM "Listing" li WHERE li."userId" = u.id) AS listings_total,
       (SELECT COUNT(*) FROM "Trade" tb WHERE tb."buyerId" = u.id) AS buys,
       (SELECT COUNT(*) FROM "Review" rv WHERE rv."reviewerId" = u.id) AS reviews_written
FROM "User" u
WHERE u.id IN ('cmniojabx0000j8cv7mdy7nvv','d0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000011','6ebbc246-ddb6-40c8-ad35-4c194f8e361f','2e7ce614-615e-4df3-9cba-4c1a133ae99c');

\echo '===== [9] Listing 을 참조하는 FK 자식 테이블 (안전삭제 순서 확인) ====='
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'Listing'
ORDER BY tc.table_name;
