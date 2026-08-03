-- 상점모델 2차: RLS 점검 + username 자동발급 트리거 + 돌계 재화 시드. [sql-dry]
\echo '===== [A] User / ListingCurrency / Currency RLS 정책 현황 ====='
SELECT tablename, policyname, cmd, roles, qual, with_check FROM pg_policies
WHERE tablename IN ('User','ListingCurrency','Currency') ORDER BY tablename, cmd;

\echo '===== [B] username 자동발급 트리거 생성 ====='
CREATE SEQUENCE IF NOT EXISTS user_username_seq START 300;
CREATE OR REPLACE FUNCTION set_default_username() RETURNS trigger AS $fn$
BEGIN
  IF NEW."username" IS NULL OR NEW."username" = '' THEN
    NEW."username" := 'shop' || lpad(nextval('user_username_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_user_default_username ON "User";
CREATE TRIGGER trg_user_default_username BEFORE INSERT ON "User"
FOR EACH ROW EXECUTE FUNCTION set_default_username();

\echo '===== [C] 돌계 재화 시드 (있으면 스킵) ====='
INSERT INTO "Currency"(id, "gameId", "nameKo", "ratePerUnit", "isActive", "sortOrder")
SELECT gen_random_uuid(), g.id, v.nm, v.rate, true, 0
FROM (VALUES
  ('genshin','원석',160),
  ('starrail','성옥',160),
  ('zzz','폴리크롬',160),
  ('wuwa','성성석',160),
  ('nikke','쥬얼',300),
  ('bluearchive','청휘석',120)
) AS v(slug,nm,rate)
JOIN "Game" g ON g.slug = v.slug
WHERE NOT EXISTS (SELECT 1 FROM "Currency" c WHERE c."gameId"=g.id AND c."nameKo"=v.nm);

\echo '===== [D] 시드 결과 ====='
SELECT g.slug, c."nameKo", c."ratePerUnit" FROM "Currency" c JOIN "Game" g ON g.id=c."gameId" ORDER BY g.slug, c."sortOrder";

\echo '===== [E] 트리거 동작 테스트 (롤백됨) ====='
INSERT INTO "User"(id, nickname, "createdAt") VALUES ('zz-trigger-test','트리거테스트', now());
SELECT id, "username" FROM "User" WHERE id='zz-trigger-test';
