-- 거래완료 RLS 수정: 구매자가 자신의 거래를 완료할 때 Listing seller_confirmed→sold 허용.
-- + 이미 Trade=completed 인데 Listing 이 sold 아닌 것 백필.
-- 미리보기: [sql-dry] → 문제없으면 [sql].

\echo '===== 적용 전: Listing UPDATE 정책 목록 ====='
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'Listing' AND cmd = 'UPDATE' ORDER BY policyname;

-- 구매자 완료 정책 (없으면 생성, 있으면 재생성)
DROP POLICY IF EXISTS "buyer can complete listing" ON "Listing";
CREATE POLICY "buyer can complete listing" ON "Listing"
  FOR UPDATE TO authenticated
  USING (
    status = 'seller_confirmed'
    AND EXISTS (SELECT 1 FROM "Trade" t WHERE t."listingId" = "Listing".id AND t."buyerId" = (auth.uid())::text)
  )
  WITH CHECK (status = 'sold');

\echo '===== 백필 대상: Trade=completed 인데 Listing!=sold (적용 전) ====='
SELECT count(*) AS to_backfill
FROM "Trade" t JOIN "Listing" l ON l.id = t."listingId"
WHERE t.status = 'completed' AND l.status <> 'sold';

UPDATE "Listing" SET status = 'sold'
WHERE id IN (SELECT t."listingId" FROM "Trade" t WHERE t.status = 'completed')
  AND status <> 'sold';

\echo '===== 적용 후 확인: 새 정책 존재 + 잔여 불일치(0이어야) ====='
SELECT policyname FROM pg_policies WHERE tablename = 'Listing' AND policyname = 'buyer can complete listing';
SELECT count(*) AS remaining_mismatch
FROM "Trade" t JOIN "Listing" l ON l.id = t."listingId"
WHERE t.status = 'completed' AND l.status <> 'sold';
