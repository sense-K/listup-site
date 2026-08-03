-- 보호 트리거 실제 차단 검증 (공격 시뮬레이션). [sql-dry] 전용 — 반드시 롤백됨.
\echo '===== 대상 유저(shop0001) 현재 상태 ====='
SELECT id, "username", "isVerified", "sellerGrade" FROM "User" WHERE "username"='shop0001';

\echo '===== 시뮬레이션: 일반 로그인 유저가 자기 isVerified=true 시도 ====='
DO $$
DECLARE tgt text; res boolean;
BEGIN
  SELECT id INTO tgt FROM "User" WHERE "username"='shop0001';
  -- PostgREST 인증 유저 요청 흉내: role=authenticated + 본인 JWT(관리자 아님)
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', tgt, 'email', 'attacker@example.com')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  UPDATE "User" SET "isVerified" = true, "sellerGrade" = '공식파트너' WHERE id = tgt;
  EXECUTE 'RESET ROLE';
  SELECT "isVerified" INTO res FROM "User" WHERE id = tgt;
  RAISE NOTICE '공격 후 isVerified = % (false 여야 차단 성공)', res;
END $$;

\echo '===== 최종 확인 (false면 차단 정상) ====='
SELECT "username", "isVerified", "sellerGrade" FROM "User" WHERE "username"='shop0001';
