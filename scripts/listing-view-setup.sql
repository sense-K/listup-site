-- ============================================================
-- Listing 조회수 트래킹 시스템 초기화
-- Supabase SQL Editor에서 한 번 실행
-- ============================================================

-- 1. ListingView 테이블 (조회 이력)
CREATE TABLE IF NOT EXISTS "ListingView" (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "listingId" UUID        NOT NULL REFERENCES "Listing"(id) ON DELETE CASCADE,
  "gameId"    UUID        NOT NULL REFERENCES "Game"(id),
  "userId"    UUID        REFERENCES auth.users(id),
  ip_hash     TEXT        NOT NULL,
  "viewedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lv_listing  ON "ListingView"("listingId");
CREATE INDEX IF NOT EXISTS idx_lv_game     ON "ListingView"("gameId");
CREATE INDEX IF NOT EXISTS idx_lv_at       ON "ListingView"("viewedAt");
CREATE INDEX IF NOT EXISTS idx_lv_dedup    ON "ListingView"(ip_hash, "listingId", "viewedAt");

-- 2. RLS: 일반 사용자 접근 차단, 어드민만 SELECT
ALTER TABLE "ListingView" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_listing_view" ON "ListingView";
CREATE POLICY "admin_select_listing_view" ON "ListingView"
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'zzabhm@gmail.com');

-- 3. 조회 트래킹 RPC (SECURITY DEFINER = RLS 우회, anon 키로 호출 가능)
--    1시간 내 같은 IP+게시글 조합이면 무시 (중복 방지)
CREATE OR REPLACE FUNCTION track_listing_view(
  p_listing_id UUID,
  p_game_id    UUID,
  p_user_id    UUID,
  p_ip_hash    TEXT
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "ListingView"
    WHERE ip_hash     = p_ip_hash
      AND "listingId" = p_listing_id
      AND "viewedAt"  > NOW() - INTERVAL '1 hour'
  ) THEN
    INSERT INTO "ListingView" ("listingId", "gameId", "userId", ip_hash)
    VALUES (p_listing_id, p_game_id, p_user_id, p_ip_hash);

    UPDATE "Listing"
    SET "viewCount" = COALESCE("viewCount", 0) + 1
    WHERE id = p_listing_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
