-- 랜딩 돌계 카드 배경으로 쓸 게임 아트 확인 (읽기 전용). [sql]
-- 실제 매물 카드(renderListingCard)는 캐릭터가 없는 돌계 매물일 때
-- artImageUrl → imageUrl 순으로 폴백하므로, 미리보기도 같은 이미지를 써야 진짜와 같아진다.
SELECT g.slug, g."nameKo", g."artImageUrl", g."imageUrl"
FROM "Game" g WHERE g.slug IN ('starrail','genshin','nikke') ORDER BY g.slug;
