-- ============================================================
-- leehwan-cleanup.sql
-- 이환(Leehwan) 데이터 정리
-- 작성일: 2026-04-29
-- ⚠️  이 파일은 읽기 전용입니다. Supabase SQL Editor에서 직접 실행하세요.
-- ============================================================

BEGIN;

-- ============================================================
-- 작업 1: 서버 정리 (1 UPDATE + 3 INSERT)
-- ============================================================

-- 기존 "한국" 서버 → "Asia"로 변경 (sold 50개 데이터 그대로 유지)
UPDATE "Server"
SET "nameKo" = 'Asia', "nameEn" = 'Asia', "sortOrder" = 1
WHERE id = 'smnwndo633cr6y6';

-- 신규 서버 3개 추가
INSERT INTO "Server" (id, "gameId", "nameKo", "nameEn", premium, "isActive", "sortOrder")
VALUES
  (gen_random_uuid()::TEXT, 'f2e27ed7-5a4f-4c3c-ab72-82ebff336374', 'America',        'America',        1, true, 2),
  (gen_random_uuid()::TEXT, 'f2e27ed7-5a4f-4c3c-ab72-82ebff336374', 'Europe',         'Europe',         1, true, 3),
  (gen_random_uuid()::TEXT, 'f2e27ed7-5a4f-4c3c-ab72-82ebff336374', 'Southeast Asia', 'Southeast Asia', 1, true, 4);

-- ============================================================
-- 작업 2: 캐릭터 27명 한국어 통일 + nameEn 채우기 + slug 생성
-- ⚠️  일부 한국 공식 표기는 게임 내 정식 표기 확인 후 추가 수정 필요
-- ============================================================

-- 1. 호토리 (Hotori)
UPDATE "Character"
SET "nameKo" = '호토리', "nameEn" = 'Hotori', slug = 'hotori'
WHERE id = 'fcaa2ef3-0af0-43d5-ae78-2bd1b682d03d';

-- 2. 라크리모사 (Lacrimosa)
UPDATE "Character"
SET "nameKo" = '라크리모사', "nameEn" = 'Lacrimosa', slug = 'lacrimosa'
WHERE id = '77fa0447-38a0-45bc-b071-9ca50f573d15';

-- 3. 구원 (Salvation)
UPDATE "Character"
SET "nameKo" = '구원', "nameEn" = 'Salvation', slug = 'salvation'
WHERE id = 'b647c0c6-d62b-417b-a331-5a1d75355de6';

-- 4. 나나리 (Nanari)
UPDATE "Character"
SET "nameKo" = '나나리', "nameEn" = 'Nanari', slug = 'nanari'
WHERE id = '6887c7ae-d187-4f12-98b4-105a58a97d58';

-- 5. 다포딜 (Daffodil)
UPDATE "Character"
SET "nameKo" = '다포딜', "nameEn" = 'Daffodil', slug = 'daffodil'
WHERE id = 'd275fe56-b04a-466c-bdd4-33a0b3595950';

-- 6. 백장 (Baekjang)
UPDATE "Character"
SET "nameKo" = '백장', "nameEn" = 'Baekjang', slug = 'baekjang'
WHERE id = '9c9ea5d9-0115-415e-bcdd-afb3ea344fe3';

-- 7. 사키리 (Sakiri)
UPDATE "Character"
SET "nameKo" = '사키리', "nameEn" = 'Sakiri', slug = 'sakiri'
WHERE id = '602001ef-799a-48e5-9f53-604428ded8b5';

-- 8. 이능력자 제로 (Esper Zero)
UPDATE "Character"
SET "nameKo" = '이능력자 제로', "nameEn" = 'Esper Zero', slug = 'esper-zero'
WHERE id = '337b47d7-df5f-402f-b1b4-9f8985b5571e';

-- 9. 치즈 (Cheese)
UPDATE "Character"
SET "nameKo" = '치즈', "nameEn" = 'Cheese', slug = 'cheese'
WHERE id = 'f65ada6f-8240-4d61-8635-92dbf1714b3c';

-- 10. 파디아 (Fadia)
UPDATE "Character"
SET "nameKo" = '파디아', "nameEn" = 'Fadia', slug = 'fadia'
WHERE id = 'f877be58-4612-483b-9511-8ffe2559c2e6';

-- 11. 하토르 (Hathor)
UPDATE "Character"
SET "nameKo" = '하토르', "nameEn" = 'Hathor', slug = 'hathor'
WHERE id = '9835038b-4f0d-46fb-920a-27edb632c913';

-- 12. 아들러 (Adler)
UPDATE "Character"
SET "nameKo" = '아들러', "nameEn" = 'Adler', slug = 'adler'
WHERE id = '75ec4fc6-32a5-43d7-a314-a4da8be2fa14';

-- 13. 에드가 (Edgar)
UPDATE "Character"
SET "nameKo" = '에드가', "nameEn" = 'Edgar', slug = 'edgar'
WHERE id = '26465b0c-ee05-4e5c-808b-995d3272e48b';

-- 14. 하니엘 (Haniel)
UPDATE "Character"
SET "nameKo" = '하니엘', "nameEn" = 'Haniel', slug = 'haniel'
WHERE id = '448295b2-e32a-4048-b16c-fa56b423a474';

-- 15. 스키아 (Skia)
UPDATE "Character"
SET "nameKo" = '스키아', "nameEn" = 'Skia', slug = 'skia'
WHERE id = 'c12a78cf-69bb-4dab-bec2-de4561311e60';

-- 16. 민트 (Mint)
UPDATE "Character"
SET "nameKo" = '민트', "nameEn" = 'Mint', slug = 'mint'
WHERE id = '5c536a6d-01ab-447a-8d5c-083bb95504e3';

-- 17. 아카네 (Akane)
UPDATE "Character"
SET "nameKo" = '아카네', "nameEn" = 'Akane', slug = 'akane'
WHERE id = '158db737-866a-4a3c-b7be-92f495cd28cb';

-- 18. 알파드 (Alphard)
UPDATE "Character"
SET "nameKo" = '알파드', "nameEn" = 'Alphard', slug = 'alphard'
WHERE id = '9974b25b-a288-4443-ae43-be5ba65ffa8f';

-- 19. 아우렐리아 (Aurelia)
UPDATE "Character"
SET "nameKo" = '아우렐리아', "nameEn" = 'Aurelia', slug = 'aurelia'
WHERE id = 'a84ebcf6-c35d-4721-94f5-a937fb877a4e';

-- 20. 블랙 버드 (Black Bird)
UPDATE "Character"
SET "nameKo" = '블랙 버드', "nameEn" = 'Black Bird', slug = 'black-bird'
WHERE id = '6a4fd261-7d33-4298-a692-caa76cfbd285';

-- 21. 카오스 (Chaos)
UPDATE "Character"
SET "nameKo" = '카오스', "nameEn" = 'Chaos', slug = 'chaos'
WHERE id = 'e5222ad9-13dc-4bfc-97d9-ebd3a5ac2429';

-- 22. 엘림스 (Elyms)
UPDATE "Character"
SET "nameKo" = '엘림스', "nameEn" = 'Elyms', slug = 'elyms'
WHERE id = 'd8a4c2b9-16c7-4ee7-9574-dcb0447b9fb3';

-- 23. 엑세 (Exe)
UPDATE "Character"
SET "nameKo" = '엑세', "nameEn" = 'Exe', slug = 'exe'
WHERE id = 'f927507e-cf0a-4732-97ef-a3b6cb27fb92';

-- 24. 이로이 (Iroi)
UPDATE "Character"
SET "nameKo" = '이로이', "nameEn" = 'Iroi', slug = 'iroi'
WHERE id = 'c659a5ed-eeb1-4f96-ab66-badba6a502ab';

-- 25. 링코 (Lingko)
UPDATE "Character"
SET "nameKo" = '링코', "nameEn" = 'Lingko', slug = 'lingko'
WHERE id = 'a0e2846c-8884-4de5-85cb-7a788cd33409';

-- 26. 니차 (Nitsa)
UPDATE "Character"
SET "nameKo" = '니차', "nameEn" = 'Nitsa', slug = 'nitsa'
WHERE id = 'fea0f873-6aba-4e19-b366-ab26b42f3667';

-- 27. 신쿠 (Shinku)
UPDATE "Character"
SET "nameKo" = '신쿠', "nameEn" = 'Shinku', slug = 'shinku'
WHERE id = '420b5cff-a5a8-4d7b-9f61-a50495e202d8';

-- ============================================================
-- 작업 3: 검증 쿼리 (COMMIT 전 결과 확인용)
-- ============================================================

-- [검증 1] 서버 4개 등록 확인
SELECT "nameKo", "nameEn", "sortOrder"
FROM "Server"
WHERE "gameId" = 'f2e27ed7-5a4f-4c3c-ab72-82ebff336374'
ORDER BY "sortOrder";

-- [검증 2] 캐릭터 27명 한국어/영문/slug 확인
SELECT "nameKo", "nameEn", slug, tier
FROM "Character"
WHERE "gameId" = 'f2e27ed7-5a4f-4c3c-ab72-82ebff336374'
ORDER BY
  CASE tier WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 ELSE 4 END,
  "nameKo";

-- [검증 3] slug 중복 확인 (결과 없어야 정상)
SELECT slug, COUNT(*)
FROM "Character"
WHERE "gameId" = 'f2e27ed7-5a4f-4c3c-ab72-82ebff336374'
GROUP BY slug
HAVING COUNT(*) > 1;

-- [검증 4] sold 50개 Asia 서버에 묶여있는지 확인
SELECT s."nameKo" AS server, COUNT(*) AS sold_count
FROM "Listing" l
JOIN "Server" s ON l."serverId" = s.id
WHERE l."gameId" = 'f2e27ed7-5a4f-4c3c-ab72-82ebff336374'
  AND l.status = 'sold'
GROUP BY s."nameKo";

-- ============================================================
-- 검증 결과 이상 없으면 COMMIT, 문제 있으면 ROLLBACK으로 교체
-- ============================================================
COMMIT;
-- ROLLBACK;
