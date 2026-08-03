-- ★ 대행(상점) 모델 스키마 확정 — 미리보기 [sql-dry] (BEGIN…ROLLBACK).
-- User = 상점(1:1). 상점명=기존 nickname(수정가능). 아이디(영문 URL)=신규 username.

-- ===== 1) User(=상점)에 상점 필드 추가 =====
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username"        text;      -- 영문 아이디(URL /shop/{username})
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shopBio"         text;      -- 상점 소개
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified"      boolean NOT NULL DEFAULT false; -- 인증 배지
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sellerGrade"     text;      -- 등급(뉴비/파워대행/공식파트너)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliveryTime"    text;      -- 전달 정책
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "refundPolicy"    text;      -- 환불 정책
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "supportRecovery" boolean NOT NULL DEFAULT false; -- 계정복구 지원
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessHours"   text;      -- 영업시간

-- username 백필: shop0001, shop0002 … (가입순, 유니크·영문). 이후 유저가 변경 가능.
WITH numbered AS (
  SELECT id, 'shop' || lpad((row_number() OVER (ORDER BY "createdAt"))::text, 4, '0') AS uname
  FROM "User" WHERE "username" IS NULL
)
UPDATE "User" u SET "username" = n.uname FROM numbered n WHERE u.id = n.id;

-- username 유니크 인덱스 (null 허용 → 신규가입은 앱에서 발급)
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- ===== 2) Listing에 유형/재고 필드 추가 =====
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "type"       text    NOT NULL DEFAULT 'reroll';  -- reroll(리세계)/currency(돌계)
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "stock"      integer NOT NULL DEFAULT 1;          -- 재고 수량
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "isAlwaysOn" boolean NOT NULL DEFAULT false;      -- 상시판매

-- 기존 매물(전부 캐릭터 보유) → 리세계로 backfill (default가 이미 reroll이지만 명시)
UPDATE "Listing" SET "type" = 'reroll' WHERE "type" IS NULL OR "type" = '';
-- 캐릭터 없고 재화만 있는 매물이 있으면 돌계로 (현재 0건이나 안전차원)
UPDATE "Listing" l SET "type" = 'currency'
WHERE NOT EXISTS (SELECT 1 FROM "ListingCharacter" lc WHERE lc."listingId" = l.id)
  AND EXISTS (SELECT 1 FROM "ListingCurrency" cu WHERE cu."listingId" = l.id);

-- 유형 값 제약
ALTER TABLE "Listing" DROP CONSTRAINT IF EXISTS "Listing_type_check";
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_type_check" CHECK ("type" IN ('reroll','currency'));

-- ===== 3) 검증 =====
\echo '===== User 신규 컬럼 확인 ====='
SELECT column_name FROM information_schema.columns
WHERE table_name='User' AND column_name IN
('username','shopBio','isVerified','sellerGrade','deliveryTime','refundPolicy','supportRecovery','businessHours')
ORDER BY 1;
\echo '===== username 백필 샘플 ====='
SELECT "username", nickname FROM "User" ORDER BY "createdAt" LIMIT 5;
\echo '===== username 유니크/개수 ====='
SELECT count(*) AS total, count(DISTINCT "username") AS distinct_uname, count(*) FILTER (WHERE "username" IS NULL) AS null_uname FROM "User";
\echo '===== Listing 유형 분포 ====='
SELECT "type", count(*) FROM "Listing" GROUP BY 1;
