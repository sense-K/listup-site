-- 항목1: 정체 거래 일괄 종결 + pg_cron 자동 타임아웃. 미리보기 [sql-dry].
-- seller_confirmed → completed(+Listing sold),  active → cancelled(+Listing active 복귀)

CREATE TEMP TABLE sc_listings AS SELECT "listingId" FROM "Trade" WHERE status = 'seller_confirmed';
CREATE TEMP TABLE ac_listings AS SELECT "listingId" FROM "Trade" WHERE status = 'active';

\echo '===== [before] 종결 예정 ====='
SELECT (SELECT count(*) FROM sc_listings) AS seller_confirmed_to_complete,
       (SELECT count(*) FROM ac_listings) AS active_to_cancel;

-- 1) seller_confirmed → completed + 매물 sold
UPDATE "Trade"   SET status = 'completed', "completedAt" = now() WHERE status = 'seller_confirmed';
UPDATE "Listing" SET status = 'sold' WHERE id IN (SELECT "listingId" FROM sc_listings);

-- 2) active → cancelled + 매물 active 복귀
UPDATE "Listing" SET status = 'active' WHERE id IN (SELECT "listingId" FROM ac_listings) AND status = 'trading';
UPDATE "Trade"   SET status = 'cancelled' WHERE status = 'active';

\echo '===== [after] 남은 미완료 Trade (0 이어야) ====='
SELECT status, count(*) FROM "Trade" WHERE status IN ('active','trading','seller_confirmed') GROUP BY status;
\echo '===== [after] Listing 상태 분포 ====='
SELECT status, count(*) FROM "Listing" GROUP BY status ORDER BY 2 DESC;

-- 3) pg_cron 자동 타임아웃 (재발 방지)
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 기존 동일 잡 있으면 제거 후 재등록
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto-close-stale-trades';
SELECT cron.schedule('auto-close-stale-trades', '0 18 * * *', $job$
  -- seller_confirmed 7일 경과 → 자동 수령확인(완료)
  UPDATE "Trade" SET status='completed', "completedAt"=now()
    WHERE status='seller_confirmed' AND "createdAt" < now() - interval '7 days';
  UPDATE "Listing" SET status='sold'
    WHERE status='seller_confirmed'
      AND id IN (SELECT "listingId" FROM "Trade" WHERE status='completed');
  -- active 14일 경과 → 자동 취소 + 매물 복귀
  UPDATE "Listing" SET status='active'
    WHERE status='trading'
      AND id IN (SELECT "listingId" FROM "Trade" WHERE status='active' AND "createdAt" < now() - interval '14 days');
  UPDATE "Trade" SET status='cancelled'
    WHERE status='active' AND "createdAt" < now() - interval '14 days';
$job$);

\echo '===== 등록된 cron 잡 확인 ====='
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'auto-close-stale-trades';
