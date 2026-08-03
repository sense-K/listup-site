-- 보안: 인증배지 셀프부여 차단 트리거 + phase2 반영 확인. [sql-dry] 먼저.
\echo '===== phase2 반영 확인 (트리거/시드가 실DB에 있는지) ====='
SELECT tgname FROM pg_trigger WHERE tgname='trg_user_default_username';
SELECT count(*) AS seeded_currencies FROM "Currency" c JOIN "Game" g ON g.id=c."gameId"
WHERE (g.slug,c."nameKo") IN (('genshin','원석'),('starrail','성옥'),('zzz','폴리크롬'),('wuwa','성성석'),('nikke','쥬얼'),('bluearchive','청휘석'));

\echo '===== 관리자 전용 컬럼 보호 트리거 생성 ====='
CREATE OR REPLACE FUNCTION protect_user_admin_columns() RETURNS trigger AS $fn$
BEGIN
  -- PostgREST 경유 요청(anon/authenticated)에서 관리자 이메일이 아니면 민감 컬럼 변경 무시
  IF current_setting('role', true) IN ('anon','authenticated')
     AND coalesce(auth.email(),'') <> 'zzabhm@gmail.com' THEN
    NEW."isVerified"  := OLD."isVerified";
    NEW."sellerGrade" := OLD."sellerGrade";
    NEW."role"        := OLD."role";
    NEW."trustScore"  := OLD."trustScore";
  END IF;
  RETURN NEW;
END $fn$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_protect_user_admin_cols ON "User";
CREATE TRIGGER trg_protect_user_admin_cols BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION protect_user_admin_columns();

\echo '===== 트리거 존재 확인 ====='
SELECT tgname FROM pg_trigger WHERE tgname IN ('trg_protect_user_admin_cols','trg_user_default_username');

\echo '===== psql(관리자 경로) 업데이트는 통과하는지 테스트 (롤백됨) ====='
UPDATE "User" SET "isVerified" = true WHERE "username" = 'shop0002' RETURNING "username","isVerified";
