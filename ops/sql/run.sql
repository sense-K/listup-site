-- 이미지가 없는 우마무스메 8명의 정체 확인 (읽기 전용). [sql]
-- umapyoi(플레이 가능 우마무스메 목록)에 아예 없는 캐릭터들이라
-- 실제로 '보유할 수 있는 캐릭터'인지 카카오 원본 설명으로 판단한다.

\echo '===== 이미지 없는 캐릭터의 원본 설명 ====='
SELECT c."nameKo", c."nameEn",
       c.metadata->>'cv' AS "성우",
       coalesce(c.metadata->>'birthday','-') AS "생일",
       coalesce(c.metadata->>'height','-') AS "신장",
       left(coalesce(c.metadata->>'description',''), 90) AS "설명"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume' AND c."imageUrl" IS NULL
ORDER BY c."sortOrder";

\echo ''
\echo '===== 참고: 신장 정보 유무 (우마무스메는 신장이 있고, 인간 스태프는 대개 없다) ====='
SELECT (c.metadata->>'height' IS NOT NULL) AS "신장 있음",
       (c."imageUrl" IS NOT NULL) AS "이미지 있음",
       count(*)
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume'
GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC;
