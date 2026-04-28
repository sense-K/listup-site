-- ============================================================
-- 명조 워더링 웨이브 sold 더미 매물 30개
-- gameId: 902fe427-47d2-4a3c-88e5-04218bad66c6
-- 실행 전: 검토 후 ROLLBACK 또는 COMMIT 선택
-- ⚠️  기존 active 매물은 건드리지 않음 (INSERT only)
-- ============================================================

BEGIN;

DO $$
DECLARE
  WUWA_ID CONSTANT TEXT := '902fe427-47d2-4a3c-88e5-04218bad66c6';

  users TEXT[] := ARRAY[
    'cmniojabx0000j8cv7mdy7nvv',
    'd0000000-0000-0000-0000-000000000010',
    'd0000000-0000-0000-0000-000000000011',
    '6ebbc246-ddb6-40c8-ad35-4c194f8e361f',
    '2e7ce614-615e-4df3-9cba-4c1a133ae99c'
  ];

  prices INT[] := ARRAY[
    9800, 14800, 19800, 24800, 29800, 34800,
    39800, 49800, 59800, 69800, 79800, 89800,
    99800, 119800, 139800, 149800, 179800, 199800,
    249800, 299800
  ];

  descs TEXT[] := ARRAY[
    '초기 30연 5성 캐릭 풀돌 계정 판매합니다. 자세한 정보는 톡 주세요.',
    '메인 딜러 + 서포터 풀템 세팅 완료. 즉시 사용 가능.',
    '장기 미접속 정리합니다. 캐릭터 다양함.',
    '휴면 계정 정리. 메인 캐릭 만렙.',
    '이벤트 캐릭터 다수 보유. 카카오톡으로 문의.',
    '서브계정 정리. 리세 추천.',
    '원석/재화 보유. 신규 시작용으로 좋아요.',
    '복귀 유저용 추천. 컨텐츠 진입 가능.',
    '쿨거래 가능. 네고 불가.',
    '인기 5성 캐릭 다수 보유. 급처합니다.',
    '시작 단계부터 육성한 계정. 메인 컨텐츠 클리어.',
    '이벤트 재화 다수 보유. 즉시 사용 가능한 계정입니다.'
  ];

  -- Asia 60%, America 25%, Europe 10%, TW 5%
  wuwa_servers TEXT[] := ARRAY[
    'smog1e38tvbtrns','smog1e38tvbtrns','smog1e38tvbtrns',  -- Asia ×6
    'smog1e38tvbtrns','smog1e38tvbtrns','smog1e38tvbtrns',
    'smog1e1ggyp2qok','smog1e1ggyp2qok','smog1e1ggyp2qok',  -- America ×3
    'smog1e4zojvlx8v',                                        -- Europe ×1
    'smog1e6tza933to'                                         -- TW ×1
  ];

  v_listing_id TEXT;
  v_char_ids   TEXT[];
  v_char_id    TEXT;
  v_i          INT;
  v_n          INT;
  v_created    TIMESTAMPTZ;
  v_cnt        INT;

BEGIN
  FOR v_i IN 1..30 LOOP
    v_listing_id := gen_random_uuid()::TEXT;
    v_created    := NOW() - (((30.0 - 1) * (v_i - 1) / 29.0 + random() * 2 - 1) * INTERVAL '1 day')::INTERVAL;
    v_created    := GREATEST(v_created, NOW() - INTERVAL '30 days');
    v_n          := 7 + floor(random() * 9)::INT;

    INSERT INTO "Listing" (id, "userId", "gameId", "serverId", price, status, description, "createdAt", "updatedAt")
    VALUES (
      v_listing_id,
      users[1 + ((v_i - 1) % 5)],
      WUWA_ID,
      wuwa_servers[1 + floor(random() * array_length(wuwa_servers, 1))::INT],
      prices[1 + floor(random() * array_length(prices, 1))::INT],
      'sold',
      descs[1 + floor(random() * array_length(descs, 1))::INT],
      v_created,
      v_created + (INTERVAL '1 day' + (random() * INTERVAL '6 days'))
    );

    -- S급 우선, 부족하면 전체 fallback
    SELECT ARRAY(
      SELECT id FROM "Character"
      WHERE "gameId" = WUWA_ID AND tier = 'S' AND "isActive" = true
      ORDER BY RANDOM() LIMIT v_n
    ) INTO v_char_ids;

    SELECT COALESCE(array_length(v_char_ids, 1), 0) INTO v_cnt;
    IF v_cnt < 5 THEN
      SELECT ARRAY(
        SELECT id FROM "Character"
        WHERE "gameId" = WUWA_ID AND "isActive" = true
        ORDER BY RANDOM() LIMIT v_n
      ) INTO v_char_ids;
    END IF;

    IF v_char_ids IS NOT NULL THEN
      FOREACH v_char_id IN ARRAY v_char_ids LOOP
        INSERT INTO "ListingCharacter" ("listingId", "characterId", count)
        VALUES (v_listing_id, v_char_id, 1)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;

  END LOOP;

  RAISE NOTICE '✅ 명조 더미 매물 30개 생성 완료';
END $$;

-- 검증
SELECT COUNT(DISTINCT l.id) AS listings, COUNT(lc."characterId") AS total_chars,
       ROUND(AVG(l.price)) AS avg_price, MIN(l.price) AS min_price, MAX(l.price) AS max_price
FROM "Listing" l
LEFT JOIN "ListingCharacter" lc ON lc."listingId" = l.id
WHERE l."gameId" = '902fe427-47d2-4a3c-88e5-04218bad66c6'
  AND l.status = 'sold' AND l."createdAt" > NOW() - INTERVAL '35 days';

SELECT s."nameKo", COUNT(*) AS cnt
FROM "Listing" l JOIN "Server" s ON l."serverId" = s.id
WHERE l."gameId" = '902fe427-47d2-4a3c-88e5-04218bad66c6'
  AND l.status = 'sold' AND l."createdAt" > NOW() - INTERVAL '35 days'
GROUP BY s."nameKo" ORDER BY cnt DESC;

-- ROLLBACK;
COMMIT;
