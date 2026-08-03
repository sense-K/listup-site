-- ops/sql/run.sql — Supabase SQL Runner가 실행할 SQL.
-- 사용 후에는 이 중립 기본값으로 되돌려 둔다(실수로 [sql] 재실행돼도 무해하도록).
-- 실제 SQL 작업 시: 여기에 내용을 채우고 커밋 메시지에 [sql](반영) 또는 [sql-dry](검증) 태그.
select now() as checked_at, current_user as run_as;
