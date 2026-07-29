-- 유저 성장/활성도 분석. [sql-dry].
\echo '===== 전체 유저 수 ====='
SELECT count(*) AS total_users FROM "User";

\echo '===== 월별 가입 추세 ====='
SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month, count(*) AS signups
FROM "User" GROUP BY 1 ORDER BY 1;

\echo '===== 최근 가입 속도 ====='
SELECT
  count(*) FILTER (WHERE "createdAt" > now() - interval '7 days')  AS last_7d,
  count(*) FILTER (WHERE "createdAt" > now() - interval '30 days') AS last_30d,
  count(*) FILTER (WHERE "createdAt" > now() - interval '90 days') AS last_90d
FROM "User";

\echo '===== 활성도: 판매/구매/후기 참여 유저 수 ====='
SELECT
  (SELECT count(DISTINCT "userId")   FROM "Listing") AS users_with_listing,
  (SELECT count(DISTINCT "buyerId")  FROM "Trade")   AS users_bought,
  (SELECT count(DISTINCT "reviewerId") FROM "Review") AS users_reviewed;

\echo '===== 휴면(아무 행동 없는 유저) 비율 ====='
SELECT count(*) AS dormant_zero_activity
FROM "User" u
WHERE NOT EXISTS (SELECT 1 FROM "Listing" l WHERE l."userId"=u.id)
  AND NOT EXISTS (SELECT 1 FROM "Trade" t WHERE t."buyerId"=u.id OR t."sellerId"=u.id)
  AND NOT EXISTS (SELECT 1 FROM "Review" r WHERE r."reviewerId"=u.id);

\echo '===== 전화인증(가입 진지도) 비율 ====='
SELECT "isPhoneVerified", count(*) FROM "User" GROUP BY 1;
