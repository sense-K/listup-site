# 리세리스트 (resetlist.kr)

모바일 게임 리세계 계정 직거래 플랫폼. 원신, 블루아카이브, 니케, 쿠키런킹덤, 젠레스 존 제로, 세븐나이츠 리버스, 이환, 트릭컬 리바이브 지원.

## 기술 스택
- 바닐라 HTML/CSS/JS (프레임워크 없음)
- Supabase (DB + Auth)
- Cloudflare Pages (배포) — GitHub `sense-K/listup-site` main 브랜치 push 시 자동 배포
- Cloudflare Pages Functions — 동적 OG 태그 주입 (`functions/` 폴더)
- 도메인: resetlist.kr

## 프로젝트 구조
```
listup-site/
├── index.html              # 홈 (게임카드 + 최신 판매계정)
├── js/
│   ├── config.js           # Supabase 클라이언트, 공용 함수 (navbar, footer, gameUI 등)
│   └── listings.js         # 판매계정 카드 렌더링 + loadListings()
├── css/style.css
├── genshin/                # 원신 리세계
├── bluearchive/            # 블루아카이브 리세계
├── nikke/                  # 니케 리세계
├── cookierunkingdom/       # 쿠키런킹덤 리세계
├── zzz/                    # 젠레스 존 제로 리세계
├── sevenknightsre/         # 세븐나이츠 리버스 리세계
├── leehwan/                # 이환 리세계
├── trickcal/               # 트릭컬 리바이브 리세계
├── limbus/                 # 림버스 컴퍼니 리세계
├── stardive/               # 몬길 스타다이브 리세계
├── listing/                # 판매계정 상세 (/listing/?id=xxx)
├── functions/
│   └── listing/index.js    # Cloudflare Pages Function (동적 OG 태그)
├── trade/
│   ├── index.html          # 거래소 메인 (게임 탭 + 전체 최신 판매글)
│   ├── register.html       # 판매계정 등록 (3단계: 게임→캐릭터→가격)
│   ├── bulk.html           # 일괄 등록
│   ├── genshin/            # 원신 거래소
│   ├── bluearchive/        # 블루아카이브 거래소
│   ├── nikke/              # 니케 거래소
│   ├── cookierunkingdom/   # 쿠키런킹덤 거래소
│   ├── zzz/                # 젠레스 존 제로 거래소
│   ├── sevenknightsre/     # 세븐나이츠 리버스 거래소
│   ├── leehwan/            # 이환 거래소
│   ├── trickcal/           # 트릭컬 리바이브 거래소
│   ├── limbus/             # 림버스 컴퍼니 거래소
│   ├── stardive/           # 몬길 스타다이브 거래소
│   ├── epic7/              # 에픽세븐 거래소
│   └── price/              # 시세 섹션
│       ├── index.html      # 시세 메인 (게임별 시세 카드)
│       ├── genshin/        # 원신 시세 (실제 데이터 있음)
│       ├── nikke/          # 니케 시세 (실제 데이터 있음)
│       ├── cookierunkingdom/ # 쿠킹덤 시세 (실제 데이터 있음)
│       ├── epic7/          # 에픽세븐 시세 (준비중)
│       ├── bluearchive/    # 블루아카이브 시세 (준비중)
│       ├── zzz/            # 젠레스 시세 (준비중)
│       ├── sevenknightsre/ # 세나리 시세 (준비중)
│       ├── leehwan/        # 이환 시세 (준비중)
│       ├── trickcal/       # 트릭컬 시세 (준비중)
│       ├── limbus/         # 림버스 시세 (준비중)
│       └── stardive/       # 몬길 시세 (준비중)
├── auth/                   # 로그인/회원가입
├── mypage/                 # 마이페이지
├── user/                   # 판매자 프로필
├── review/                 # 후기 작성
├── admin/                  # 관리자 페이지
├── contact/                # 문의하기 (Formspree)
├── sitemap.xml             # Google Search Console용
└── robots.txt              # 크롤러 설정
```

## 주요 규칙
- `listup` 폴더는 버린 Next.js 프로젝트, 무시할 것
- 수정 후 항상 git push (자동 배포됨)
- git config: user.email=zzabhm@gmail.com, user.name=sense-K
- git 커밋 시 `git config windows.appendAtomically false` 필요 (Windows 이슈)

## git 작업 방식
- **작업 폴더**: `C:\Users\혁문\OneDrive\Desktop\vibe coding\리세계\listup-site` (OneDrive 동기화, 노트북 공유됨)
- push → GitHub `sense-K/listup-site` main → Cloudflare Pages 자동 배포
- git config: user.email=zzabhm@gmail.com, user.name=sense-K

## 용어 통일
- 사이트명: **리세리스트** (로고/네비바), **리세 리스트** (본문/SEO)
- "매물" → **판매계정**
- "판매글" → **판매계정** (상세 페이지 등)
- "거래소" → **리세계** (게임 페이지 명칭)

## Supabase 테이블 주요 구조
- `Game` — 게임 목록 (slug, nameKo, emoji, imageUrl, artImageUrl)
- `Server` — 서버 (gameId, nameKo, premium)
- `Character` — 캐릭터 (gameId, nameKo, tier, imageUrl)
- `Listing` — 판매계정 (userId, gameId, serverId, price, status, kakaoOpenChatUrl)
- `ListingCharacter` — 판매계정-캐릭터 연결
- `Trade` — 거래 (listingId, buyerId, sellerId, status)
- `Review` — 후기 (listingId, reviewerId, sellerId, rating, content)
- `User` — 사용자 (nickname, tradeCount, avgRating)

## DB 슬러그 주의사항
- 원신: `genshin`
- 블루아카이브: `bluearchive` (DB slug), URL 경로도 `/bluearchive/`
- 니케: `nikke`
- 쿠키런킹덤: `cookie-run` (DB slug) ← URL 경로는 `/cookierunkingdom/`
  - GRADE_ORDER_MAP 키는 반드시 `'cookie-run'` 사용 (register.html, bulk.html)
- 트릭컬 리바이브: `trickcal` (DB slug), URL 경로 `/trickcal/`
  - 티어 없음 (tier = ''), GRADE_ORDER_MAP 키 없음 → 캐릭터 전체 '캐릭터' 그룹으로 표시
  - 캐릭터 104개, 이미지 Supabase storage `characters/trickcal/trickcal_XXX.png`

## 거래 플로우
`active` → (구매신청) → `trading` → (판매자 전달완료) → `seller_confirmed` → (구매자 후기작성 = 수령확인) → `completed` + Listing `sold`

- 후기작성(`/review/`) = 수령확인. 후기 제출 시 Trade→completed, Listing→sold 처리
- RLS로 buyer가 Trade/Listing 업데이트 못 막히는 경우 있음 → listing 상세 페이지 진입 시 auto-recovery (Review 존재 여부로 완료 판단)

## GRADE_ORDER_MAP (register.html, bulk.html 동일하게 유지)
```js
const GRADE_ORDER_MAP = {
  'nikke':       ['SSS','SS','S','A','B','C'],
  'genshin':     ['SS','S','A','B','C','D','E','F'],
  'bluearchive': ['아비도스','게헨나','밀레니엄 사이언스','트리니티','백귀야행','산해경','붉은겨울','발키리','SRT','아리우스','하이랜더','와일드헌트','사쿠가와','토키와다이','기타'],
  'cookie-run':  ['위치','비스트','에인션트 각성','에인션트','레전더리','드래곤','슈퍼에픽','에픽','레어','커먼'],
}
```

## 히어로 캐러셀 (config.js)
- 대각선 3행 무한스크롤: 1행·3행 우→좌, 2행 좌→우
- CSS: `.hero-diagonal-rows` > `.hero-drow` > `.hero-drow-track` > `.hero-dcard`
- 애니메이션: `hero-scroll-right` 48s, `hero-scroll-left` 40s (linear infinite)
- 카드 배경: `artImageUrl` 이미지

## SEO 현황 (2026-04-16 업데이트)
- 전 페이지 title / description / keywords / canonical / og / twitter card 적용
- JSON-LD: 메인(WebSite+SearchAction), 게임 페이지(CollectionPage+BreadcrumbList)
- Google Search Console 등록 완료, 색인 생성 요청 완료
- sitemap.xml, robots.txt 배포 완료
- 게임별 주요 키워드:
  - 원신: 자백, 콜롬비나, 스커크, 푸리나, 린네아
  - 블루아카이브: 호시노, 와카모, 시로코, 스나코, 아코
  - 니케: 크라운, 세이렌, 라피, 레드후드, 나유타, 목단
  - 쿠키런킹덤: 어둠마녀, 미스틱플라워, 버닝스파이스, 사일런트솔트, 쉐도우밀크, 이터널슈가
- **판매 페이지**: "xx 시세" 키워드 제거 (시세 페이지와 중복 방지)
- **시세 페이지**: "xx 리세계 시세"를 첫 번째 키워드로 설정
- 시세 페이지들 sitemap.xml 추가 완료 (lastmod: 2026-04-16)

## 공유 기능 (listing/index.html + functions/listing/index.js)
- 판매계정 상세 우측 상단에 `🔗 공유하기` 버튼 → 클립보드 복사 + 토스트 방식
- Cloudflare Pages Function이 `/listing/?id=xxx` 요청 시 Supabase에서 데이터 조회 후 OG 태그 동적 주입
- 카카오톡·디스코드 붙여넣기 시: 게임명·서버·가격·캐릭터 목록 미리보기 표시

## 구매 신청 / 거래 중 처리 (listing/index.html)
- 구매 신청 시 Trade 테이블 insert + Listing status → `trading` 업데이트
- Listing 업데이트가 RLS로 막힐 수 있음 → Trade 테이블 직접 조회로 거래 중 여부 판단
- RLS 정책 "buyer can set listing to trading" 이미 적용 완료 ✅
- 판매글 삭제 시: ListingCharacter → Trade → Listing 순으로 삭제 (FK 제약 때문)
- Supabase CASCADE FK 설정하면 더 안정적 (선택사항, 아래 남은 작업 참고)

## 보안 (2026-04-13 완료)
- register.html, bulk.html: onclick 인라인 JSON 제거 → gameStore/charStore 객체로 교체 (XSS 수정) ✅
- RLS 정책 확인 완료 ✅

## 캐릭터 필터 (2026-04-14 완료)
- 기존 텍스트 검색 제거 → 각 게임 페이지 사이드바에 캐릭터 필터 기능으로 교체
- 사이드바에 "캐릭터 선택 →" 버튼 → 모달 열림 (티어별 그룹, 이미지 7열 그리드)
- 모달 내 실시간 텍스트 검색 (nameKo 기준, 결과 없으면 "검색 결과가 없어요")
- 여러 캐릭터 AND 교집합 필터링 + 개수 필터링 — listings.js의 `characterFilter` 파라미터로 처리
- 선택된 캐릭터는 selected bar + 사이드바 태그 목록으로 표시
- 캐릭터 필터 섹션: 보라색 그라디언트 카드 형태로 시각적 강조 (`.char-filter-section`)
- GRADE_ORDER_MAP / GRADE_DOT_COLOR 각 게임 페이지마다 정의

## 캐릭터 다중 선택 + 개수 필터 (2026-04-15 완료)
- ListingCharacter 테이블에 `count` 컬럼 추가 (SQL: `ALTER TABLE "ListingCharacter" ADD COLUMN count integer NOT NULL DEFAULT 1;`)
- 판매 등록 시 같은 캐릭터를 여러 번 클릭하면 ×N 개수로 등록됨
- 게임 페이지 필터에서 캐릭터를 여러 번 클릭 → ×N 이상 보유 계정만 필터링
- `filterChars` 구조: `{ charId: { char, count } }` (배열 → 맵으로 변경)
- `characterFilter` 파라미터 → listings.js에서 클라이언트 사이드 count 필터링
  - PostgREST URL 파라미터에서 `count`는 예약어 → `.gte('count', N)` 안 됨 → 클라이언트에서 필터
- 선택 시 항상 어두운 오버레이+체크 표시, count>1이면 숫자 뱃지 추가 표시

## 더보기·가격포맷팅 (2026-04-13 완료)
- loadListings()에 `append`, `moreBtn`, `characterIds` 파라미터 추가 (listings.js)
- 게임 페이지 더보기 버튼 추가 (9개씩 append 로드)
- 판매 등록 가격 입력 실시간 쉼표 포맷팅 (register.html, bulk.html)

## 마이페이지 (mypage/index.html)
- 탭 기반 UI: 판매 탭 / 구매 탭
- 판매 탭: 판매 중 + 판매 완료 (아코디언)
- 구매 탭: 거래 진행중 + 거래 완료 + 취소된 거래 (있을 때만)
- 섹션 바디 흰색 배경, 구매 탭 빈 화면 푸터 위치 수정

## 이메일 알림 시스템 (2026-04-16 완료)
- Resend API + Supabase Edge Function `trade-notify` 로 거래 단계별 이메일 발송
- **Edge Function 슬러그 주의**: 대시보드에서 만들면 슬러그가 표시명과 다를 수 있음
  - 현재 실제 슬러그: `quick-responder` (표시명: trade-notify)
  - DB 웹훅 URL: `https://ltcibadxwkupwjikqzik.supabase.co/functions/v1/quick-responder`
  - Verify JWT: OFF (웹훅은 JWT 없이 호출)
- DB 웹훅: `Database → Webhooks → trade-notify` (Trade 테이블 INSERT+UPDATE)
- 발송 시나리오:
  - Trade INSERT (status=active) → 판매자에게 "새 구매 신청이 들어왔어요"
  - active → seller_confirmed → 구매자에게 "판매자가 계정을 전달했어요"
  - seller_confirmed → completed → 판매자에게 "거래가 완료됐어요 🎉"
  - any → cancelled → 판매자에게 "거래가 취소됐어요"
  - nudge 액션 → 구매자에게 "판매자가 연락을 기다리고 있어요"
- FROM: `리세리스트 <onboarding@resend.dev>` (Resend 무료 도메인, 검증 불필요)
- Resend API 키: Supabase Edge Function 환경변수 `RESEND_API_KEY` 에 저장

## 판매자 → 구매자 연락 요청 (2026-04-16 완료)
- 마이페이지 판매 탭 거래중 상태 판매글에 **연락 요청** 버튼(보라색) 표시
- 버튼 클릭 → Edge Function에 `{ action: 'nudge', tradeId }` POST (JWT 포함)
- Edge Function이 발신자가 실제 판매자인지 검증 후 구매자 이메일 발송
- 전송 후 30초간 버튼 비활성화 (스팸 방지)

## 시세 페이지 (2026-04-16 완료, 구조 개편 2026-04-22)
- URL: `/trade/price/` (이전: `/price/` → 301 리다이렉트로 유지)
- `price_data` Supabase 테이블 설계: `game_slug, account_type, price_min, price_max, description, sort_order, updated_at`
  - RLS: public read 정책 필요
  - 쿠킹덤 DB slug는 `cookie-run` (URL은 `/cookierunkingdom/`) → PRICE_PATH_MAP으로 처리
- 실제 시세 데이터: 원신, 니케, 쿠킹덤 (헝그리앱 분석 완료, **Supabase INSERT 아직 미실행**)
- 나머지 게임 시세 페이지: "준비 중" 상태 (renderComingSoon() 패턴)
- CTA 문구: "수수료 없는 직거래 계정 보러가기" / 버튼: "판매계정 보러가기 →"

## 에픽세븐 공략 도구 (2026-04-21~22 완료)

### 장비 주인 찾기 (`/epic7/gear-recommend/`)
- 세트 선택 → 부위 선택 → 주옵션 → 보조옵션 순서
- 매칭 로직: 완전일치 score >= min(3, validKeys), 일치 score >= min(2, validKeys)
- 완전일치 카드: 보라색 테두리 + 그림자 강조 (모드 토글 버튼 없음, 항상 전체 표시)
- 영웅 분석 API: `grade_code=emperor` 사용 (champion·warlord·emperor만 equip 데이터 있음, legend는 equip null)
- 캐시 키: `e7-hero-data-v4-${currentSeason}`
- 세트 이미지: `set_attack`은 CDN 403 → namu wiki URL 사용, 상처세트 키는 `set_scar`

### 아티팩트 도감 (`/epic7/artifacts/`)
- 도적 직업 필터: `data-job="assassin"` (JSON의 job_code가 "assassin"이므로 "thief" 쓰면 안 됨)

### 영웅 도감 상세 (`/epic7/heroes/detail/`)
- 유효스탯·착용세트 데이터: `grade_code=emperor`

## 애널리틱스 (2026-04-22 완료)
- GTM `GTM-N4LHKZKZ` + GA4 `G-SQDKTZQYCW` 연결
- config.js 맨 앞에 삽입 → 전체 39개 페이지 자동 적용
- GTM noscript는 DOMContentLoaded 시 body 최상단에 동적 삽입

## 원신 UID 조회 (`/genshin/uid/`) — 2026-04-22 신규
- Enka.Network API로 쇼케이스 캐릭터 빌드 조회 (성유물·무기·스탯)
- 한국어 캐릭터 이름: `https://gi.yatta.moe/api/v2/KR/avatar` (언어코드 `KR` 또는 `kr`)
- CORS 문제로 직접 호출 불가 → Cloudflare Pages Function 프록시 사용
  - `functions/api/enka/[[uid]].js` → `/api/enka/{uid}` 경로
- 캐릭터 데이터 sessionStorage 캐시: `gi-char-map-v1`

## 네비바 구조 (2026-04-22 기준)
```
게임공략 ▾ | 거래소 | 시세 | 문의하기
```
- **게임공략 ▾** → 드롭다운: 각 게임 공략 허브 (`/game/[slug]/`)
- **거래소** → `/trade/` (plain link)
- **시세** → `/trade/price/` (plain link)
- **문의하기** → `/contact/`

### 주의사항
- 모든 페이지 script에서 `loadAndRenderGameUI(null)` 또는 `loadAndRenderGameUI(GAME_SLUG)` 호출 필수
- 빠뜨리면 게임공략 드롭다운이 "불러오는 중..." 상태로 멈춤
- 새 페이지 만들 때 반드시 포함할 것

## 거래소/시세 페이지 구조 (2026-04-22 개편)
- `/trade/` — 거래소 메인: 상단 게임 탭(가로 스크롤 pill) + 전체 최신 판매글
  - 게임 탭 클릭 → `/trade/[game]/` 이동
  - "전체" 탭이 active인 상태가 이 페이지
- `/trade/[game]/` — 게임별 거래소: 서버/캐릭터 필터 + 해당 게임 판매글
- `/trade/price/` — 시세 메인: 게임별 시세 카드 그리드
- `/trade/price/[game]/` — 게임별 상세 시세
- `/game/[slug]/` — 게임 공략 허브 (에픽세븐 공략 도구 등) → 거래소/시세 버튼 연결

### 페이지 간 연동 흐름
```
헤더 "거래소" → /trade/ → 게임 탭 → /trade/[game]/
헤더 "시세"   → /trade/price/ → 게임 카드 → /trade/price/[game]/
/trade/[game]/ 상단 → 시세 보기 링크
/game/[slug]/ → 거래소 바로가기 + 시세 확인
```

## 붕괴: 스타레일 지원 (2026-04-23 추가)

### 추가된 페이지
- `/game/starrail/` — 공략 허브 (정적 페이지, `_routes.json` exclude)
- `/game/starrail/uid/` — UID 캐릭터 조회 (MiHoMo API 프록시)
- `/trade/price/starrail/` — 시세 페이지 (현재 "수집 중" 상태, 정적 페이지)

### API 프록시
- `functions/api/starrail/[[uid]].js` → `https://api.mihomo.me/sr_info_parsed/{uid}?lang=kr`
- 응답: 한국어 이름 + rarity + icon 경로 (StarRailRes CDN 패턴)
- 캐릭터 이미지: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/{icon}`

### 관리자 캐릭터 일괄 등록
- 관리자 → 캐릭터 관리 탭 상단에 "스타레일 캐릭터 불러오기" 버튼
- StarRailRes `index_min/kr/characters.json` + `index_min/en/characters.json` 동시 fetch
- rarity 5 → tier `S`, rarity 4 → tier `A` 자동 변환
- 개척자(id 8001~8008) 자동 제외, 이미 등록된 캐릭터 skip

### Character 테이블 insert 시 필수 필드 (모두 포함해야 함)
```js
{
  id: crypto.randomUUID(),
  gameId, nameKo, nameEn,   // nameEn NOT NULL
  tier,
  isLimited: false,          // Boolean NOT NULL
  basePrice: 0,              // Int NOT NULL
  imageUrl,
  isActive: true,
  sortOrder: 0,
  createdAt: now,
  updatedAt: now,            // @updatedAt — Prisma 자동처리지만 직접 insert 시 수동 필요
}
```

### 판매 등록 UID 조회
- `trade/register/index.html`의 `isUidGame` / `lookupUid()` 에 `starrail` 추가
- MiHoMo 응답 직접 사용 (charMap 불필요)

## 거래소 목록 정렬 (2026-04-23 개선)
- **판매중(active/trading) → 판매완료(sold) 그룹 우선 정렬**
- `js/listings.js`에서 두 쿼리 병렬 fetch 후 합산 → 클라이언트 페이지네이션
  ```js
  // active/trading 먼저, sold 나중 (각 그룹 내 최신순 또는 가격순)
  const [activeData, soldData] = await Promise.all([
    buildBase(['active', 'trading']).limit(200),
    buildBase(['sold']).limit(200),
  ])
  const allListings = [...activeData, ...soldData]
  ```
- 그룹 내에서는 기존 최신순/가격순 정렬 그대로 적용

## DB 직접 조작 (Python + psycopg2)
- anon key는 RLS로 Listing INSERT 불가 → psycopg2로 직접 INSERT 가능
- 연결 문자열은 Supabase 대시보드 → Settings → Database → Connection string에서 확인
- 스타레일 더미 sold 글 30개 생성 완료 (userId: zzabhm, 서버 4개 순환)

## 게임 도감 (2026-04-23 추가)

### 블루아카이브 학생 도감 (`/game/bluearchive/students/`)
- SchaleDB GitHub 공개 JSON 데이터 사용
  - `https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/students.json`
  - 이미지: `https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/icon/{Id}.webp`
  - 전신: `https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/images/student/collection/{Id}.webp`
- KR 서버 출시 학생만 표시 (`IsReleased[0] === true`)
- 필터: 학교(15개) / 속성(폭발·관통·신비·진동) / 역할(딜러·탱커·힐러·서포터) / 등급(1~3성)
- 카드 클릭 → 모달 (전신 이미지, 배치/무기/생일/신장/성우)
- SchaleDB는 2025년 6월 아카이브됨 (데이터는 여전히 접근 가능, 신규 캐릭터 누락 가능)

### 니케 캐릭터 도감 (`/game/nikke/characters/`)
- Supabase `Character` 테이블 데이터 사용 (182개, 이미지 전원 포함)
- 필터: 티어(SSS/SS/S/A/B/C) / 이름 검색
- 카드 클릭 → 모달 (이미지, 등급, 제조사, 속성, 클래스, 버스트 타입, 무기)
- **Character 테이블 추가 컬럼** (니케 전용):
  - `rarity` TEXT — SSR/SR/R (prydwen 기준)
  - `manufacturer` TEXT — Elysion/Missilis/Tetra/Pilgrim/Abnormal
  - `weaponType` TEXT — Assault Rifle/SMG/Shotgun 등
  - `element` TEXT — Fire/Water/Wind/Electric/Iron
  - `classType` TEXT — Attacker/Defender/Supporter
  - `burstType` TEXT — 1/2/3
  - `slug` TEXT — 영문 URL slug (prydwen.gg 기준)
  - `metadata` JSONB — 스킬 데이터 등 추가 정보
- **prydwen.gg 데이터 import**: `https://www.prydwen.gg/page-data/nikke/characters/page-data.json`
  - Gatsby SSG 정적 JSON → 203개 캐릭터 데이터
  - Supabase nameEn으로 매칭 (182개 중 178개 자동 매칭)
  - 스킬 설명은 Contentful Rich Text 형식 → parse_contentful() 함수로 파싱
  - 스킬 데이터는 **영어만 제공** (한국어 소스 없음)
- **매칭 방법**: `nameEn` ↔ prydwen `name` (직접 매칭 + 수동 보정)
- 콜라보 캐릭터 일부 prydwen 미수록 → 기본 정보만 표시

### 보안 수정 (2026-04-23)
- `Report` 테이블 RLS 활성화 (psycopg2로 직접 실행)
- DB 비밀번호 유출 사고: CLAUDE.md에 연결 문자열 포함했다가 GitHub에 노출됨
  - 즉시 비밀번호 변경 + CLAUDE.md에서 제거
  - 앞으로 DB 연결 문자열을 문서에 절대 기록하지 말 것

## 현재 상태 (2026-04-23)
- 핵심 기능 + 보안 + UX 개선 완료
- resetlist.kr 도메인 연결 완료
- SEO + Google Search Console 등록 완료
- 거래 전 플로우 완성, 이메일 알림 시스템 완성
- 시세 페이지 13개 (원신/니케/쿠킹덤 데이터 있음, 스타레일 포함 나머지 수집 중)
- GTM + GA4 연결 완료
- 에픽세븐 공략 도구 4종 서비스 중
- 원신/ZZZ/스타레일 UID 조회 서비스 중
- 거래소 목록 판매중 우선 정렬 적용
- 블루아카이브 학생 도감 서비스 중 (`/game/bluearchive/students/`)
- 니케 캐릭터 도감 서비스 중 (`/game/nikke/characters/`)
- 작업 폴더: OneDrive (`C:\Users\혁문\OneDrive\Desktop\vibe coding\리세계\listup-site`)

## 남은 작업 목록
### 중요도 높음
- [ ] **시세 데이터 Supabase INSERT** — 원신/니케/쿠킹덤 SQL 준비됨, 실행만 하면 됨
  - Supabase → SQL Editor에서 실행
  - price_data 테이블 + RLS public read 정책 먼저 생성 필요
- [ ] **비밀번호 재설정 이메일 Resend로 교체** — 현재 Supabase 기본 발송(시간당 4건 제한), 유저 생기기 전에 교체해야 함
  - Supabase → Authentication → SMTP Settings에서 Resend SMTP 연결
- [ ] **서치콘솔 색인 요청** — 시세 페이지 우선순위: `/trade/price/`, `/trade/price/genshin/`, `/trade/price/nikke/`, `/trade/price/cookierunkingdom/`
- [ ] Supabase CASCADE FK 설정 (판매글 삭제 안정성):
  ```sql
  ALTER TABLE "Trade" DROP CONSTRAINT "Trade_listingId_fkey";
  ALTER TABLE "Trade" ADD CONSTRAINT "Trade_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"(id) ON DELETE CASCADE;
  ALTER TABLE "ListingCharacter" DROP CONSTRAINT "ListingCharacter_listingId_fkey";
  ALTER TABLE "ListingCharacter" ADD CONSTRAINT "ListingCharacter_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "Listing"(id) ON DELETE CASCADE;
  ```

### 중요도 중간
- [ ] 가격 범위 필터 (구매자 입장에서 예산 필터 거의 필수)
- [ ] 찜하기 기능 (관심 목록, 재방문 유도)
- [ ] 신고 기능 (Report 테이블 이미 존재, RLS는 현재 차단 상태 → 기능 구현 시 RLS 정책 추가 필요)
- [ ] 이환 SEO 키워드 보강 (게임 오픈 후)

### 중요도 낮음
- [ ] 준비중 시세 페이지 데이터 채우기 (블루아카이브, 젠레스, 림버스 등)
- [ ] 거래 분쟁 처리 메커니즘
- [ ] 판매자 프로필 페이지 완성 (/user/)
