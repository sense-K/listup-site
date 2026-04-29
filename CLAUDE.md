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

## 원신 캐릭터 도감 (2026-04-28 추가)

### 페이지 구조
- `/game/genshin/characters/` — 도감 메인 (정적 HTML, Supabase 직접 쿼리, 114명)
- `/game/genshin/characters/[slug]/` — 캐릭터 상세 (Cloudflare Function 동적 SSR)

### 데이터 소스
- genshin-db API (`https://genshin-db-api.vercel.app/api/v5`)
- 한국어 데이터 fetch 후 Supabase `Character` 테이블에 캐싱
- 외부 의존도 0 (사이트 운영 중 외부 API 끊겨도 무관)
- **fetch 시 `queryLanguages=Korean` 파라미터 필수** (없으면 한국어 쿼리 빈 응답 반환)
- **JSON 파싱 안전 처리 필수**: `safeFetchJson()` 사용 — 일부 신캐릭터는 talents/constellations 응답이 비어있음

### Character 테이블 사용 컬럼 (원신 전용)
- `element`: `"불"`, `"물"`, `"바람"`, `"번개"`, `"얼음"`, `"풀"`, `"바위"` (한국어 그대로)
- `weaponType`: `"한손검"`, `"양손검"`, `"장병기"`, `"활"`, `"법구"`
- `region`: `"몬드"`, `"리월"`, `"이나즈마"`, `"수메르"`, `"폰타인"`, `"나타"`, `"노드크라이"` 등
  - DB에 컬럼 없을 시 추가: `ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS region TEXT;`
- `slug`: 영문 이름 슬러그 (예: `hu-tao`, `raiden-shogun`)
- `metadata` (JSONB):
  ```json
  {
    "title": "캐릭터 칭호",
    "description": "1-2문장 설명",
    "birthday": "7월 15일",
    "constellation": "나비자리",
    "affiliation": "왕생당",
    "substat": "치명타 피해",
    "cv": { "korean": "김하루", "japanese": "Takahashi Rie" },
    "skills": [
      { "type": "normal|skill|burst|passive1|passive2|passive3", "name": "...", "desc": "..." }
    ],
    "constellations": [
      { "rank": 1, "name": "...", "desc": "..." }
    ]
  }
  ```

### admin 페이지 운영 워크플로우 (신캐릭터 출시 시)
1. admin → **"🔄 원신 캐릭터 불러오기"** → 모달 확인 후 INSERT (신규만)
2. admin → **"🖼️ 원신 캐릭터 이미지 재동기화"** → hoyoverse 도메인으로 URL 업데이트
3. admin → **"📚 원신 캐릭터 상세정보 동기화"** → metadata 업데이트

이미지 URL 우선순위:
```
cover1 > cover2 > hoyolab-avatar > hoyowiki_icon > mihoyo_icon > null
```
- `wikia.nocookie.net` 도메인은 hotlink 차단으로 사용 불가 (`card`, `portrait` 필드)
- 여행자(아이테르, 루미네) 자동 제외

### 거래 위젯 연동
- 캐릭터 상세 페이지에서 `ListingCharacter` JOIN으로 보유 계정 수·가격 범위 표시
- SEO 메타에도 거래 데이터 반영 (`"호두 — 보유 계정 12개 거래중 · ..."`)
- 거래 0개 시 "첫 판매자 되기" CTA 위젯으로 유도
- RPC `get_character_trade_stats` 미존재 → 직접 쿼리 사용 중

### 라우팅 (_routes.json)
`/game/genshin/*` 일괄 exclude 제거 → 정적 경로만 개별 exclude:
```
/game/genshin/, /game/genshin/uid/*, /game/genshin/characters/  → 정적 파일 서빙
/game/genshin/characters/[slug]/                                  → Function 실행
```
`functions/game/genshin/characters/[slug].js` (4-depth) > `functions/game/[slug].js` (2-depth) 우선 매칭.

### 다른 게임 도감 추가 시 복제 패턴
1. admin 일괄 등록 카드 (해당 게임 데이터 소스로)
2. `/game/[gameSlug]/characters/index.html` (도감 메인)
3. `functions/game/[gameSlug]/characters/[slug].js` (상세 SSR)
4. `_routes.json`에 정적 경로 exclude 추가

## 스타레일 캐릭터 도감 (2026-04-28 추가)

### 페이지 구조
- `/game/starrail/characters/` — 도감 메인 (정적 HTML)
- `/game/starrail/characters/[slug]/` — 캐릭터 상세 (Cloudflare Function SSR)

### 데이터 소스
StarRailRes GitHub raw JSON (https://raw.githubusercontent.com/Mar-7th/StarRailRes/master)
- `index_min/kr/characters.json` — 기본 데이터 (name, rarity, path, element, icon/preview/portrait, skills[], ranks[])
- `index_min/en/characters.json` — 영문 이름
- `index_new/kr/characters.json` — description (대부분 빈 문자열)
- `index_new/kr/character_skills.json` — 스킬 상세 (728개 통합 JSON)
- `index_new/kr/character_ranks.json` — 성흔 상세 (606개 통합 JSON)
- `index_min/kr/paths.json` — path 한국어 매핑

### 매핑 테이블

**운명의 길 (path → weaponType 컬럼에 저장):**
```
Warrior→파멸, Rogue→수렵, Mage→지식, Shaman→화합,
Warlock→공허, Knight→보존, Priest→풍요, Memory→기억, Elation→환락
```

**원소 (element → element 컬럼):**
```
Physical→물리, Fire→화염, Ice→얼음, Thunder→번개,
Wind→바람, Quantum→양자, Imaginary→허수
```

**스킬 타입 (metadata.skills[].type에 한국어로 저장됨):**
```
Normal→일반 공격, BPSkill→전투 스킬, Ultra→궁극기, Talent→천부, Maze→비술
(Technique/MazeNormal 등 나머지는 필터링해서 제외)
```

### 원신과의 차이점
- `region` 없음 (필터, attrs, DB 모두)
- `weaponType` 컬럼에 path(운명의 길) 저장 (한국어)
- `metadata.description` 대부분 null (StarRailRes에 설명 미수록)
- 별자리 → **성흔(eidolons)**, "N돌파" → "N성" 라벨
- 추가 정보 표 없음 (생일/소속/성우 등 미수록)
- 스킬 type이 DB에 이미 한국어 저장 → 상세 페이지에서 직접 출력

### 제외 대상
- ID 8001~8010 (개척자/미출시)
- 빈 이름 `""` (1504, 1505, 1506 등 한국 미출시)
- `{NICKNAME}` 문자열
- 예상 INSERT 수: 91개 중 13개 제외 → **78명**

### admin 운영 워크플로우 (신캐릭터 출시 시)
1. admin → **"🔄 스타레일 캐릭터 불러오기 (메타데이터 포함)"** → INSERT
2. admin → **"🖼️ 스타레일 캐릭터 이미지 재동기화"** → portrait URL 업데이트
3. admin → **"📚 스타레일 캐릭터 상세정보 동기화"** → metadata 갱신

기존 **"🔄 스타레일 캐릭터 불러오기"** (legacy) — element/path/slug/metadata 없이 기본 필드만. 보존 중.

### 이미지 전략 (2026-04-28 갱신)
- **DB imageUrl**: `character_preview/{id}.png` (얼굴 부각 이미지) → 도감 카드/추천 카드에 사용
- **상세 페이지 hero**: `character_portrait/{id}.png` (전신샷) → `imageUrl.replace('character_preview', 'character_portrait')` 변환
- portrait 없을 시 preview로 fallback (onerror 처리)

### 라우팅 (_routes.json)
```
/game/starrail/, /game/starrail/uid/*, /game/starrail/characters/  → 정적 파일
/game/starrail/characters/[slug]/                                   → Function 실행
```

## 젠레스 존 제로 캐릭터 도감 (2026-04-28 추가)

### 페이지 구조
- `/game/zzz/characters/` — 도감 메인 (정적 HTML)
- `/game/zzz/characters/[slug]/` — 캐릭터 상세 (Cloudflare Function SSR)

### 데이터 소스
- Hakushin API (실제 호스트: `static.nanoka.cc`)
- 버전 동적 조회: `https://static.nanoka.cc/manifest.json` → `zzz.latest`
- 캐릭터 목록: `https://static.nanoka.cc/zzz/{version}/character.json`
  - 객체 (ID키), ko/en 이름 직접 포함, 총 53명
- 캐릭터 상세: `https://static.nanoka.cc/zzz/{version}/ko/character/{id}.json`
- 이미지: `https://enka.network/ui/zzz/` (CORS 허용)

### 매핑 테이블

**원소 (element):** 정수 코드 → 한국어 (5개)
```
200→물리, 201→화염, 202→얼음, 203→전기, 205→에테르
```

**전문분야 (type → weaponType 컬럼):** 정수 코드 → 한국어 (6개)
```
1→공격, 2→격파, 3→이상, 4→지원, 5→방어, 6→강탈
```

**등급 (rank → tier):** `3→A`, `4→S`

### 원신/스타레일과의 차이점
- 등급 표기: "S급" / "A급" (5성/4성 표기 없음)
- 별자리/성흔 → **마인드스케이프** (`meta.mindscapes`), rank label: "N성"
- 추가 정보: `meta.camp`(소속), `meta.hitType`(공격 타입) — birthday/cv 없음
- region 없음
- 주인공(2011/2021): character.json에 이미 없음 (사전 제외)
- character.json 1회 fetch로 충분 (ko 이름 + en 이름 모두 포함)

### metadata 구조
```json
{
  "skills": [{"type":"기본 공격","name":"...","desc":"..."}],
  "mindscapes": [{"rank":1,"name":"...","desc":"..."}],
  "camp": "교활한 토끼굴",
  "hitType": "베기"
}
```

### admin 운영 워크플로우
1. admin → **"🔄 캐릭터 등록"** (ZZZ 카드) → metadata 포함 일괄 INSERT
2. admin → **"🖼️ 이미지 동기화"** → nameEn 매핑으로 enka.network URL 갱신

### 이미지 전략
- **DB imageUrl**: `IconRoleSelect{N}.png` (얼굴 부각) → 도감 카드/추천 카드
- **상세 페이지 hero**: `IconRole{N}.webp` (전신샷) → `imageUrl.replace('IconRoleSelect', 'IconRole').replace('.png', '.webp')` 변환
- 신캐릭터(61번대 등)는 enka.network 미등록 → 404 → fallback으로 `IconRoleSelect` → 그것도 없으면 `display:none`
- 도감 카드 404 시: `.no-img` 클래스 + `?` 표시 (CSS `::after`)

### 라우팅 (_routes.json)
```
/game/zzz/, /game/zzz/uid/*, /game/zzz/characters/  → 정적 파일
/game/zzz/characters/[slug]/                          → Function 실행
```

## 니케 캐릭터 도감 (2026-04-28 추가)

### 페이지 구조
- `/game/nikke/characters/` — 도감 메인 (정적 HTML, 기존 모달 방식 → legacy.html 백업)
- `/game/nikke/characters/[slug]/` — 캐릭터 상세 (Cloudflare Function SSR)

### 주요 필터 (5개 — 원신/스타레일/젠레스와 다름)
- **등급(rarity)**: SSR / SR / R
- **속성(element)**: Fire/Water/Wind/Electric/Iron (영문 DB 값, UI는 한국어 라벨)
- **무기(weaponType)**: Shotgun/SMG/Assault Rifle/Minigun/Rocket Launcher/Sniper Rifle
- **버스트(burstType)**: "1"/"2"/"3"/"All"
- **제조사(manufacturer)**: Elysion/Missilis/Tetra/Pilgrim/Abnormal

### 한국어 라벨 매핑 (상세 페이지, 도감 필터 표시용)
```javascript
ELEM_KO:   { Fire:'화염', Water:'수속', Wind:'풍속', Electric:'전기', Iron:'철갑' }
WEAPON_KO: { Shotgun:'샷건', SMG:'SMG', 'Assault Rifle':'어설트 라이플', ... }
MFR_KO:    { Elysion:'엘리시온', Missilis:'미사일리스', Tetra:'테트라', Pilgrim:'필그림', Abnormal:'콜라보' }
```

### 애장품 캐릭터 처리
- `slug`가 `-treasure`로 끝나는 캐릭터
- 도감 카드: 보라 테두리(`#c084fc`) + 💎 뱃지
- 상세 페이지: "💎 애장품" 뱃지
- 애장품 이미지: admin에서 "🔗 애장품 이미지 복사" 버튼으로 기본 캐릭터에서 복사

### 원신/스타레일/젠레스와의 차이점
- 이미지: prydwen `fullImage` URL 그대로 사용 (변환 불필요)
- 필터: 5개 (tier 대신 rarity, + burst + manufacturer 추가)
- 스킬 섹션: metadata가 대부분 비어있어 "준비 중" 표시
- 성흔/마인드스케이프 섹션 없음
- `rarity` 컬럼 사용 (SSR/SR/R), `tier` 컬럼은 별도(SSS~C)

### 라우팅 (_routes.json)
```
/game/nikke/, /game/nikke/characters/  → 정적 파일
/game/nikke/characters/[slug]/          → Function 실행
```
(nikke는 uid 페이지 없음)

## 명조 워더링 웨이브 캐릭터 도감 (2026-04-29 추가)

### 페이지 구조
- `/game/wuwa/characters/` — 도감 메인 (정적 HTML)
- `/game/wuwa/characters/[slug]/` — 상세 (Cloudflare Function SSR)

### 데이터 소스
- **nanoka.cc** (`https://static.nanoka.cc/ww`)
- 버전: `manifest.json → ww.latest` (현재 3.3)
- 캐릭터 목록: `ww/{version}/character.json` — 53명, ko/en/rank/element/weapon/icon/background 포함
- 이미지: `https://static.nanoka.cc/assets/ww/{path}.webp` (200 OK 확인)

### 필드 매핑 (검증 완료)

**element (정수 → 속성명):**
```
1=응결(Glacio), 2=융해(Fusion), 3=전도(Electro),
4=기류(Aero), 5=회절(Spectro), 6=인멸(Havoc)
```

**weapon (정수 → 무기명):**
```
1=대검, 2=쌍검, 3=피스톨, 4=권투, 5=회수기
```

**rank → tier:** `5→S`, `4→A`

### 제외 대상
- 방랑자(Rover) 6개 ID: 1406, 1408, 1501, 1502, 1604, 1605
  (남/여 2쌍씩, slug 중복 문제)
- 빈 이름 또는 rank<4

### 이미지 전략
- icon 경로 → `imageUrl` (도감 카드 얼굴 아이콘)
- background 경로 → `metadata.fullImageUrl` (상세 페이지 전신)
- 경로 변환: `/Game/Aki/UI/{path}.{id}` → `https://static.nanoka.cc/assets/ww/{path}.webp`

### 기타 차이점 (다른 게임 대비)
- 스킬/공명 데이터 없음 (API 미제공) → "스킬·공명 정보 준비 중"
- metadata: `{ fullImageUrl, nickname, desc(영문) }`
- 거래소 gameId: `wuwa` 슬러그

### 라우팅 (_routes.json)
```
/game/wuwa/, /game/wuwa/characters/  → 정적 파일
/game/wuwa/characters/[slug]/        → Function 실행
/trade/wuwa/, /trade/wuwa/*          → 정적 파일 (exclude 필수 — functions/trade/[slug].js 우회)
```

### 주의: trade 경로 exclude 필수
`functions/trade/[slug].js`가 존재하므로 `/trade/wuwa`를 _routes.json exclude에 명시하지 않으면
정적 trade/wuwa/index.html 대신 제네릭 Function이 실행됨 → ⓘ 버튼/URL 필터 작동 안 함.

### admin 운영 워크플로우
1. admin → **"🔄 캐릭터 등록"** (wuwa 카드) → 53명 - 방랑자 6명 = 47명 INSERT
2. admin → **"🖼️ 이미지 동기화"** → icon(얼굴) + background(전신) URL 갱신

## admin 캐릭터 관리 UI (2026-04-28 리팩터)

### 게임별 통합 카드 패턴
각 게임마다 `.game-import-card[data-game="{slug}"]` 1개, 액션 버튼 2~3개:
- 🔄 캐릭터 등록 (bulk import modal)
- 🖼️ 이미지 동기화 (inline status)
- 📚 상세정보 동기화 (inline status, 스타레일만)

구현 파일: `admin/index.html` (CSS `.game-import-card` + `.action-btn` 패턴)

새 게임 추가 시: 카드 HTML 1블록 + JS 함수 3~4개 추가로 확장.

### 도감 자동화 게임별 데이터 소스

| 게임 | 데이터 소스 | 비고 |
|---|---|---|
| 원신 | genshin-db API (`genshin-db-api.vercel.app`) | `queryLanguages=Korean` 필수 |
| 스타레일 | StarRailRes GitHub raw JSON | `index_min/kr/characters.json` |
| 젠레스 | nanoka.cc (`static.nanoka.cc/zzz`) | 버전 동적 조회 |
| 니케 | prydwen.gg page-data.json | CF Function 프록시 경유 (CORS 우회) |
| 명조 | nanoka.cc (`static.nanoka.cc/ww`) | 버전 동적 조회, ko 필드 직접 포함 |

### 데이터 소스 통합 검토 결과 (2026-04-29)
원신/스타레일을 nanoka.cc로 통합 검토 → **비추천 결정**
- 이유: nanoka는 스킬/별자리 등 메타데이터 미수록, 한국어 품질 차이
- 현재 각 게임별 최적 소스 유지 (genshin-db, StarRailRes, nanoka, prydwen, nanoka)

## 니케 캐릭터 도감 운영 (2026-04-28 추가)

### Cloudflare Function 프록시 2개
- `/api/prydwen-nikke` → `functions/api/prydwen-nikke.js` (전체 목록, 1시간 캐시)
- `/api/prydwen-nikke-char/{slug}` → `functions/api/prydwen-nikke-char/[slug].js` (개별 캐릭터, 24시간 캐시)
- **직접 fetch 불가** — CORS 차단. 반드시 프록시 경유.

### 운영 워크플로우 (admin → 캐릭터 관리 → 니케 카드)

1. **🔍 신규 캐릭터 감지** (신규 출시 시)
   - prydwen 206명 fetch → DB nameEn 정규화 비교 → 신규만 모달 표시
   - 각 캐릭터에 한국어 이름 직접 입력 → 등록하기
   - nameEn 기준 정규화: `normalize(str) = str.toLowerCase().replace(/[\s_:.\-,]+/g, '')`

2. **🔄 prydwen 동기화** (정기 갱신 시)
   - 전체 캐릭터 slug 기준 매칭 → 5명씩 개별 페이지 fetch → DB UPDATE
   - 콘솔에서 매칭 실패 목록 확인: `console.warn('[니케 동기화] 매칭 실패:', nameKo, slug)`

### 필드별 동기화 정책

| 필드 | 정책 | 비고 |
|---|---|---|
| `imageUrl` | ✅ 덮어쓰기 | prydwen fullImage → 절대 URL 변환 |
| `element` | ✅ 덮어쓰기 | 영문 그대로 (Fire/Water/Wind/Iron/Electric) |
| `weaponType` | ✅ 덮어쓰기 | 영문 그대로 (Shotgun/SMG 등) |
| `rarity` | ✅ 덮어쓰기 | SSR/SR/R |
| `manufacturer` | ✅ 덮어쓰기 | Elysion/Missilis/Tetra/Pilgrim/Abnormal |
| `burstType` | ✅ 덮어쓰기 | "1"/"2"/"3"/"All" |
| `classType` | ✅ 덮어쓰기 | Attacker/Defender/Supporter |
| `isLimited` | ✅ 덮어쓰기 | `prydwen.isLimited === true` |
| `nameKo` | 🔒 보호 | 사용자 직접 입력값 |
| `nameEn` | 🔒 보호 | 최초 등록 시 prydwen name 그대로 |
| `slug` | 🔒 보호 | prydwen slug 그대로 |
| `metadata` | 🔒 보호 | 수동 정리용 |
| `basePrice`, `isActive`, `sortOrder` | 🔒 보호 | 기본값 유지 |

### nameEn 정규화 규칙
- prydwen `name` 표기 우선 (Ada Wong, Asuka Shikinami Langley 등 풀네임 그대로)
- Treasure(애장품) 캐릭터는 별개 캐릭터로 등록 — slug에 `-treasure` 접미어
- 한국어는 "이름 (애장품)" 패턴 사용

### 미해결 이슈
- prydwen 미수록 캐릭터(스킨/콜라보) → 매칭 실패 → 수동 imageUrl 입력 필요
- 애장품(Treasure) 캐릭터 일부는 prydwen fullImage가 null → 기본 캐릭터 이미지 복사 전략 (작업 예정)
- INSERT 시 중복 방지: 감지 단계 normalize 비교 + INSERT 직전 nameEn·nameKo DB 재쿼리 이중 방어

## sitemap.xml 동적 생성 (2026-04-28 추가)

- 파일: `functions/sitemap.xml.js` (Cloudflare Function)
- `_routes.json` include에 `/sitemap.xml` 추가
- 정적 URL 하드코딩 + Supabase에서 캐릭터 slug 동적 조회
- `CHAR_DETAIL_GAMES` 화이트리스트: genshin, starrail, zzz, wuwa, nikke, leehwan
- **캐릭터 등록 시 sitemap 자동 반영** (하루 캐시 후 Google에 노출)
- Cache-Control: `public, max-age=86400`

---

## 현재 상태 요약 (2026-04-29 기준)

### 도감 시스템 구축 현황

| 게임 | 도감 메인 | 상세 SSR | 거래 연동 | 캐릭터 수 | 데이터 소스 | 한국어 |
|---|---|---|---|---|---|---|
| 원신 | ✅ | ✅ | ✅ | 114명 | genshin-db API | ✅ 자동 |
| 스타레일 | ✅ | ✅ | ✅ | 78명 | StarRailRes GitHub | ✅ 자동 |
| 젠레스 | ✅ | ✅ | ✅ | 53명 | nanoka.cc/zzz | ✅ 자동 |
| 니케 | ✅ | ✅ | ✅ | 207명 | prydwen.gg (CF 프록시) | ⚠️ 수동 입력 |
| 명조 | ✅ | ✅ | ✅ | 53명 예정 | nanoka.cc/ww | ✅ 자동 |
| 이환 | ✅ | ✅ | ✅ | 27명 | 수동 등록 (자동 API 없음) | ✅ 수동 |
| 블루아카 | ✅ (모달) | ❌ | ❌ | - | SchaleDB GitHub | - |
| 나머지 6게임 | ❌ | ❌ | ❌ | - | - | - |

### 이미지 분리 정책 (도감 카드 vs 상세 hero)

| 게임 | 도감 카드 (imageUrl) | 상세 hero |
|---|---|---|
| 원신 | cover1 (hoyoverse CDN) | 동일 (변환 없음) |
| 스타레일 | preview (character_preview) | **portrait** (character_portrait) |
| 젠레스 | IconRoleSelect (얼굴) | **IconRole** (전신) |
| 니케 | cardImage (상반신) | fullImage (전신) |
| 명조 | icon (얼굴 256px) | **background** (전신/배경) |
| 이환 | imageUrl (캐릭터 일러스트) | 동일 (변환 없음) |

### 신캐릭터 출시 시 게임별 운영 워크플로우

| 게임 | 작업 |
|---|---|
| 원신 | admin "원신 캐릭터 불러오기" → 이미지·상세 동기화 |
| 스타레일 | admin "스타레일 V2 등록 (메타데이터 포함)" → 이미지·상세 동기화 |
| 젠레스 | admin "ZZZ 캐릭터 등록" (한 방에 metadata 포함) |
| 니케 | admin "신규 감지" → 한국어 입력 → 등록 → "prydwen 동기화" → "애장품 이미지 복사" |
| 명조 | admin "명조 캐릭터 등록" → "이미지 동기화" |
| 이환 | **수동 등록** (admin 자동화 없음) — Supabase Table Editor 또는 SQL INSERT |

### 미해결 / 차후 작업 목록

| 우선순위 | 항목 |
|---|---|
| 🔴 긴급 | **비밀번호 재설정 Resend 교체** — Supabase 기본 시간당 4건 제한, 유저 유입 전 필수 |
| 🟡 중요 | **시세 데이터 INSERT** — 원신/니케/쿠킹덤 SQL 준비됨, SQL Editor 실행만 남음 |
| 🟡 중요 | **니케 prydwen 미매칭 22명 imageUrl** — 수동 보강 또는 스킨 이미지 대체 |
| 🟠 보통 | **가격 범위 필터** — 구매자 예산 필터 거의 필수 |
| 🟠 보통 | **찜하기 기능** — 관심 목록, 재방문 유도 |
| 🟠 보통 | **블루아카이브 도감 거래 연동** — 기존 모달 도감에 ⓘ 버튼 + 상세 SSR |
| 🟠 보통 | **명조 Search Console 색인 요청** — 캐릭터 등록 후 URL 색인 요청 |
| 🟠 보통 | **이환 Search Console 색인 요청** — 출시 당일 등록 (trade/leehwan/, game/leehwan/characters/, 상세 5개) |
| 🟠 보통 | **이환 B급 11명 메타데이터 보강** — element/role/arkType 정보 확보 후 leehwan-metadata.sql 추가 수정 |
| 🔵 낮음 | **엔드필드 도감** — DotGG API 500 에러, 다른 소스 탐색 필요 |
| 🔵 낮음 | **신고 기능** — Report 테이블 있음, RLS 정책 추가 필요 |
| 🔵 낮음 | **판매자 프로필 (/user/)** — 반쯤 완성 |

---

## 이환(NTE) 도감 신규 구축 — 출시 당일 작업 (2026-04-29)

### 게임 정보
- gameId: `f2e27ed7-5a4f-4c3c-ab72-82ebff336374`
- slug: `leehwan`
- nameKo: `이환` / nameEn: `Neverness to Everness` (NTE)
- 캐릭터: 27명 (S 11, A 5, B 11)
- 개발: 호타 스튜디오 / 퍼블리셔: 퍼펙트월드
- 출시: 2026-04-29 글로벌 정식 출시

### 데이터 소스 — 자동 API 없음 (수동 등록)
| 소스 | 결과 |
|---|---|
| DotGG | ❌ 봇 차단 (`Hacker! Go home`, Dotgguserauth 토큰 필요) |
| nanoka.cc | ❌ 이환 미지원 |
| 이환 공식 API | ❌ 공개 없음 |
| **결론** | **수동 등록 + 나무위키/공식 참고. admin 자동화 없음** |

### 캐릭터 데이터 정리 SQL
- `scripts/leehwan-cleanup.sql` — nameKo/nameEn/slug 27명 통일
- `scripts/leehwan-metadata.sql` — element/role/arkType 13개 (S·A급 정보 있는 것만)

### 캐릭터 메타데이터 저장 방식
- `element` 컬럼: `주/빛/암/혼/상` (한국어 직접)
- `metadata.role`: `메인 딜러/스킬 딜러/서브 딜러/버퍼/탱커/힐러/주인공`
- `metadata.arkType`: `액체/기체/고체/결합/플라즈마`
- B급 11명은 정보 부족으로 NULL 유지 (추후 보강)

### S·A급 확인된 매핑 (13명)
| 캐릭터 | tier | element | role | arkType |
|---|---|---|---|---|
| 나나리 | S | 주 | 버퍼 | 기체 |
| 다포딜 | S | 암 | 메인 딜러 | 액체 |
| 백장 | S | 주 | 메인 딜러 | 결합 |
| 하토르 | S | 상 | 스킬 딜러 | 플라즈마 |
| 파디아 | S | 혼 | 탱커 | 결합 |
| 호토리 | S | 빛 | — | — |
| 라크리모사 | S | 암 | 메인 딜러 | — |
| 치즈 | S | 빛 | 메인 딜러 | 기체 |
| 이능력자 제로 | S | — | 주인공 | — |
| 아들러 | A | 주 | 탱커 | 결합 |
| 에드가 | A | 빛 | 힐러 | 액체 |
| 하니엘 | A | 혼 | 버퍼 | 고체 |
| 스키아 | A | 상 | 메인 딜러 | 기체 |

### 서버 체계 (4개)
- `smnwndo633cr6y6` (기존 "한국" → **Asia**로 UPDATE, sold 50개 데이터 유지)
- America / Europe / Southeast Asia — 신규 INSERT

### 구축한 페이지
- `game/leehwan/index.html` — 게임 허브 (wuwa 패턴, tools-grid + hub-tool-card)
- `game/leehwan/characters/index.html` — 도감 메인 (등급/속성/역할 필터, 250줄)
- `functions/game/leehwan/characters/[slug].js` — 상세 SSR (258줄)
- `trade/leehwan/index.html` — 거래소 (ⓘ 버튼 + URL 자동 필터 추가)
- `_routes.json` — `/game/leehwan` 4개 정적 경로 세분화 (기존 `/*` 와일드카드 제거)

### SEO (출시 당일 트래픽 대응)
- 3개 페이지 description/keywords 전면 교체 + 확장
- JSON-LD VideoGame 스키마 전체 추가
- og:image, twitter:image 추가 (나무위키 키아트)
- seo-intro 본문 200-300자 보강
- sitemap priority: trade/leehwan 1.0, game/leehwan* 0.9, 상세 0.7
- CHAR_DETAIL_GAMES에 leehwan 추가 → 27개 캐릭터 URL 자동 sitemap 반영

### listing 페이지 공통 버그 수정 (이환 작업 중 발견)
- `listing/index.html:25` — `.detail-banner img` → `.detail-banner > img` (CSS 명시도 충돌, 게임 아이콘 크기 버그)
- `listing/index.html:237` — 캐릭터 수량 뱃지 `top:-6px` → `top:2px` (overflow:hidden 클리핑 방지)
- 두 수정 모두 **모든 게임** listing 상세 페이지에 적용

---

## 우마무스메 도감 사전 조사 결과 (2026-04-29, 작업 예정)

### 확정된 데이터 소스

**메인: 카카오게임즈 한국 공식 JS**
- URL: `https://umamusume.kakaogames.com/assets/js/data.v5.js?v={버전}`
- 135명, 한국어 name/description/words/cv/birth/height 풍부
- 필드: `idx, eng, name, cv, color, words, description, birth, height, icon, header`
- 버전 쿼리스트링(`v=20260112`) 갱신 시 URL 변경 필요
- 응답 형식: JS 변수 (`const characterData = {...}`) — eval 또는 정규식 파싱

**이미지: umapyoi.net API**
- 목록: `https://umapyoi.net/api/v1/character` (169명, CORS ✅)
- 상세: `https://umapyoi.net/api/v1/character/{game_id}`
- 이미지 호스팅: microcms-assets.io CDN (`Access-Control-Allow-Origin: *`)
- 도감 카드: `thumb_img` (~124KB, 반신)
- 상세 hero: `sns_header` (더 큰 이미지)

**매핑 키:** 카카오 `eng` ↔ umapyoi `name_en` — 100% 일치 검증

### 검증 결과 — 폐기된 옵션

| 소스 | 결과 | 이유 |
|---|---|---|
| DotGG `api.dotgg.gg` | ❌ 봇 차단 | `Hacker! Go home` — `Dotgguserauth` 토큰 필요 |
| nanoka.cc | ❌ 미지원 | gi/hsr/ww/zzz만 지원 |
| SimpleSandman/UmaMusumeAPI | ❌ 종료 | 2025.10 archived |
| umamusume.jp 이미지 | ❌ 404 | 직접 URL 접근 불가 |
| 카카오 view*.png (CORS 없음) | ⚠️ 백업 | `<img>` 렌더링은 가능, JS fetch 불가 |

### 다음 세션 작업 순서 (4시간 예상)

1. **DB 사전 확인** (Supabase SQL Editor):
   ```sql
   SELECT id, slug, "nameKo" FROM "Game" WHERE slug IN ('umamusume','uma','uma-musume','horse-racing');
   ```
2. admin 일괄 등록 함수 (카카오 JS 파싱 + umapyoi 이미지 매핑)
3. 도감 메인 + 상세 SSR (니케 패턴 — rarity 없음, 스킬 없음)
4. 거래소 양방향 링크 + _routes.json
5. 게임 허브 카드 + sold 더미 30개 SQL

### DotGG 범용 프록시 (보존)
- 파일: `functions/api/dotgg-proxy/[[path]].js`
- cgfw/* 경로 화이트리스트, CORS 포함
- 우마무스메/엔드필드는 인증 차단으로 미사용
- 향후 다른 DotGG 지원 게임에 활용 가능
