-- 보호 트리거 차단 검증 v2 (uuid 유저 대상). [sql-dry] 전용 — 롤백됨.
\echo '===== 검증 대상 선정 (uuid id + 미인증) ====='
SELECT id, "username", "isVerified" FROM "User"
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-' AND coalesce("isVerified", false) = false
LIMIT 1;

\echo '===== 공격 시뮬레이션: authenticated 역할 + 본인 JWT 로 isVerified=true 시도 ====='
DO $$
DECLARE tgt text; after_v boolean; after_g text;
BEGIN
  SELECT id INTO tgt FROM "User"
  WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-' AND coalesce("isVerified", false) = false
  LIMIT 1;

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', tgt, 'email', 'attacker@example.com', 'role','authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  BEGIN
    UPDATE "User" SET "isVerified" = true, "sellerGrade" = '공식파트너' WHERE id = tgt;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'UPDATE 예외(=RLS/권한 차단): %', SQLERRM;
  END;
  EXECUTE 'RESET ROLE';

  SELECT "isVerified", "sellerGrade" INTO after_v, after_g FROM "User" WHERE id = tgt;
  RAISE NOTICE '>>> 공격 후 isVerified=% sellerGrade=%  (false/NULL 이면 차단 성공)', after_v, after_g;
END $$;
