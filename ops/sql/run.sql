-- cron 실행 이력 확인 (자동 종결이 실제로 도는지). [sql-dry].
\echo '===== auto-close-stale-trades 최근 실행 이력 ====='
SELECT r.status, r.return_message, r.start_time, r.end_time
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname = 'auto-close-stale-trades'
ORDER BY r.start_time DESC
LIMIT 10;
\echo '===== 실행 횟수/최근 성공 ====='
SELECT count(*) AS runs,
       count(*) FILTER (WHERE r.status='succeeded') AS succeeded,
       max(r.start_time) AS last_run
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname = 'auto-close-stale-trades';
