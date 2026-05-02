-- ============================================================
-- Listing 조회수 트래킹 시스템 초기화
-- Supabase SQL Editor에서 한 번 실행
-- ※ 이 DB는 Prisma 컨벤션으로 모든 ID가 TEXT 타입
-- ============================================================

-- 1. ListingView 테이블 (조회 이력)
CREATE TABLE IF NOT EXISTS "ListingView" (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "listingId"  TEXT        NOT NULL REFERENCES "Listing"(id) ON DELETE CASCADE,
  "gameId"     TEXT        NOT NULL REFERENCES "Game"(id),
  "userId"     TEXT        REFERENCES "User"(id),  -- 비로그인 시 NULL
  ip_hash      TEXT        NOT NULL,
  "viewedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_view_listing   ON "ListingView"("listingId");
CREATE INDEX IF NOT EXISTS idx_listing_view_game      ON "ListingView"("gameId");
CREATE INDEX IF NOT EXISTS idx_listing_view_viewed_at ON "ListingView"("viewedAt");
CREATE INDEX IF NOT EXISTS idx_listing_view_dedup     ON "ListingView"(ip_hash, "listingId", "viewedAt");

-- 2. RLS: 일반 사용자 전면 차단, 어드민만 SELECT
ALTER TABLE "ListingView" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_listing_view" ON "ListingView";
CREATE POLICY "admin_select_listing_view" ON "ListingView"
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'zzabhm@gmail.com');

-- 3. 조회 트래킹 RPC
--    SECURITY DEFINER = RLS 우회 → anon 키로 호출 가능
--    1시간 내 같은 IP+게시글 조합이면 FALSE 반환 (중복 차단)
CREATE OR REPLACE FUNCTION track_listing_view(
  p_listing_id TEXT,
  p_game_id    TEXT,
  p_user_id    TEXT,   -- NULL 가능 (비로그인)
  p_ip_hash    TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  recent_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM "ListingView"
    WHERE ip_hash     = p_ip_hash
      AND "listingId" = p_listing_id
      AND "viewedAt"  > NOW() - INTERVAL '1 hour'
  ) INTO recent_exists;

  IF recent_exists THEN
    RETURN FALSE;
  END IF;

  INSERT INTO "ListingView" (id, "listingId", "gameId", "userId", ip_hash)
  VALUES (gen_random_uuid()::text, p_listing_id, p_game_id, p_user_id, p_ip_hash);

  UPDATE "Listing"
  SET "viewCount" = COALESCE("viewCount", 0) + 1
  WHERE id = p_listing_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_listing_view TO anon, authenticated;
