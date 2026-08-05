-- Character.kind — 캐릭터 / 서포트 카드 구분. [sql]
-- 우마무스메는 육성 우마무스메(캐릭터)와 서포트 카드가 별개 수집 대상이라 한 테이블에서 구분한다.
--   'character' (기본) : 도감·상세 페이지 대상
--   'support'          : 판매 등록 선택지에만 노출, 도감에는 안 나옴
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'character';
CREATE INDEX IF NOT EXISTS "Character_gameId_kind_idx" ON "Character" ("gameId", kind);

-- 등록 화면에서 그룹 머리말이 '기타'로 나오지 않도록 우마무스메 캐릭터에 tier 부여
UPDATE "Character" c SET tier = '우마무스메'
FROM "Game" g
WHERE c."gameId" = g.id AND g.slug = 'umamusume'
  AND c.kind = 'character' AND coalesce(c.tier, '') = '';

\echo '===== 결과 ====='
SELECT g.slug, c.kind, coalesce(c.tier,'(빈값)') AS tier, count(*)
FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug = 'umamusume'
GROUP BY 1,2,3 ORDER BY 2,3;
