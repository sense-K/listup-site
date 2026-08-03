-- zzabhm 계정 인증 배지 + 등급 부여. [sql]
UPDATE "User" SET "isVerified" = true, "sellerGrade" = '파워대행'
WHERE "username" = 'shop0002';

\echo '===== 결과 확인 ====='
SELECT "username", nickname, "isVerified", "sellerGrade"
FROM "User" WHERE "username" = 'shop0002';
