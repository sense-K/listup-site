# TODO: 부위/세트/주옵션 칩 UI 공용 컴포넌트화
- 현재 위치: gear-recommend, enhance-assist 에 동일 코드 중복
- 3번째 페이지 추가 시 공용 컴포넌트(/components/gear-selector.js)로 추출
- 함께 추출: MAIN_STAT_RULES, SETS, SLOTS, STAT 아이콘 경로, SET_IMG_BASE

---

# TODO: my-heroes 토글 컴포넌트 분리
- 현재 위치: rta/, gear-recommend/ 에 동일 코드 중복
- 3번째 페이지 추가 시 공용 컴포넌트(/components/my-heroes-toggle.js)로 추출

---

## 도메인 이전 (리세리스트) 시 처리할 항목

### 이메일 알림
- [ ] Resend Dashboard → Domains → Add Domain → 새 도메인
- [ ] DKIM/SPF/DMARC DNS 레코드 추가 (Cloudflare DNS)
- [ ] `supabase/functions/trade-notify/index.ts` 수정:
  - `FROM` 상수: `'리세리스트 <onboarding@resend.dev>'` → `'리세리스트 <noreply@<new-domain>>'`
  - `SITE_URL` 상수: `'https://resetlist.kr'` → 새 도메인
  - 메일 템플릿 내 "리세리스트" 텍스트 → "리세리스트"
  - 메일 템플릿 푸터 도메인 변경
- [ ] quick-responder 재배포

### 사이트 전체
- [ ] 사이트 내부 링크/og:url/canonical 일괄 변경 (`resetlist.kr` → 새 도메인)
- [ ] sitemap.xml 도메인 변경
- [ ] CF Pages 도메인 추가 + `resetlist.kr` 301 리디렉션 설정
- [ ] Google Search Console 새 속성 등록 + "주소 변경" 도구 실행
- [ ] 이환 백링크 캠페인 신도메인 전환

---

## 알림 시스템 현황 (2026-05-02 기준)

### 작동 상태
- quick-responder Edge Function: 정상 작동 ✅
- 구매 신청 / 전달 완료 / 거래 완료 / 거래 취소 알림: 코드 정상 ✅
- nudge (연락 요청) 백엔드: 정상 작동, **프론트 버튼만 제거됨** ✅
- /api/nudge CF Function 프록시: 정상 ✅

### 알려진 제약
- Resend 발신: `onboarding@resend.dev` (무료 공용 도메인)
- 미인증 도메인 제약 → Resend 가입 이메일(`zzabhm@gmail.com`)에만 발송 가능
- 다른 사용자(`hjzos@naver.com` 등)에게는 Resend가 차단 → **도메인 이전 시 일괄 해결**

### 진단 이력 (참고)
- 1차 오진단: stub이라고 잘못 판단 (테스트 페이로드에 `record` 필드 없어서 `if (!record) return ok()` 가드에 걸림)
- 2차 오진단: `hjzos@naver.com` 계정을 더미로 잘못 판단 (실제 정상 가입자)
- 3차 확정: Resend 미인증 도메인 제약

---

## Dead Code 보존 목록 (재사용 자산)

| 파일 | 현황 | 재활용 예정 |
|---|---|---|
| `functions/api/nudge.js` | 프론트 버튼 없음, 백엔드 살아있음 | 카톡 양방향 / 메시지 시스템 |
| `supabase/functions/trade-notify/index.ts` nudge 처리 | 동일 | 동일 |

---

## ListingView 트래킹 시스템 (2026-05-02 구현)

### 배포 상태
- `ListingView` 테이블: **Supabase에 존재 확인** ✅
- `track_listing_view` RPC: **존재 확인** ✅
- `/api/track-view` CF Function: **정상 작동** ✅ (400 → 빈 body, 200 → 정상 payload)
- listing 상세 페이지 조회 시 자동 호출 중

### 미완료
- [ ] 실제 viewCount 데이터 쌓이고 있는지 1주일 후 어드민 통계 탭 확인
- [ ] 어드민 통계 탭: `listing-view-setup.sql` 실행 완료됐는지 확인 버튼 있음

---

## 2026-05-07 작업 이력

### 완료
- **캐릭터 추가 요청 기능** (STEP 1~3 완료)
  - DB: `CharacterRequest` 테이블 + RLS (스크립트: `scripts/character-request-setup.sql`)
  - UI: `/trade/register/` 2단계 — 검색창 아래 보라 버튼 → 모달 (게임 선택 + 이름 입력)
  - 알림: `trade-notify` Edge Function에 `action: 'char-request'` 분기 추가
  - CF 프록시: `functions/api/char-request-notify.js` (nudge.js 패턴 그대로)
- **이메일 알림 브랜드명 통일** — 제목·본문·발신자 '리세리스트' → '리세리스트' 일괄 변경
  - `supabase/functions/trade-notify/index.ts` 10곳 치환 (도메인 이전 시 FROM 주소만 추가 수정 필요)
- **등록 페이지 UX 개선**
  - '캐릭터 추가 요청하기' + '여러 계정 한번에 올리기' 버튼 → 보라 실선 스타일 통일
  - 대량 등록 안내 문구 추가 (`/contact/` 링크)
- **거래소 게임 선택 칩 레이아웃 변경** — 세로 카드 6열 → 가로 컴팩트 행 PC 4열 / 모바일 2열

### 디버깅 기록 (재발 방지)
- **구글 OAuth 신규 가입자 `public.User` 미생성**
  - `loginWithGoogle()` 콜백에 User INSERT 없음 → `initNavbarAuth()` 에만 의존
  - 임시 해결: `submitCharRequest()` 에서 `requireAuth()` 경유 (자동 생성 포함)
  - 근본 해결(DB 트리거) 미적용 → 아래 미해결 항목 참조
- **CharacterRequest INSERT RLS 42501** — 위 User 미생성이 원인, requireAuth() 로 해결
- **/trade/price/ → /trade/ 이슈** — 서버 정상, 브라우저 캐시된 옛 301이 원인. 디버깅 중 추가한 코드 전부 원복 완료

### 추가 완료 (오후)
- **SEO 메타 태그 일괄 개선**
  - `/trade/{game}/` 14개: `functions/trade/[slug].js` 1파일 수정 → 전 게임 자동 반영
    - title 패턴: `리세리스트 - {게임명} 리세계 직거래 플랫폼`
    - description 패턴: 수수료·직거래·1:1 거래 키워드 포함 통일 문구
    - twitter:card 3태그 신규 추가
  - `/trade/price/{game}/` 12개: description·og:description·twitter:description 일괄 통일
  - starrail 시세 페이지 og:title/twitter:title 불일치 발견 → 수정

### ⚠️ 운영 주의
- Supabase Edge Function(`trade-notify`, 슬러그 `quick-responder`) 코드 변경 시 **Supabase 대시보드에서 수동 Deploy 필수**. `git push`로는 반영되지 않음.
- **어드민 통계 timezone 이중 오프셋** — KST 통일 작업 중 `+ 9 * 3600000` 추가했으나 브라우저가 이미 KST라 UTC+18이 됨. 수정: `new Date(v.viewedAt)` 그대로 사용 (브라우저 로컬 `.getDate()`에 맡김). **향후 timezone 헬퍼는 "브라우저 환경 가정" 명시 필수.**

### 미해결 (오늘 발생)
- [ ] **DB 트리거 `handle_new_user`** — auth.users INSERT 시 public.User 자동 생성 (ON CONFLICT DO NOTHING)
  - 이메일 가입 클라이언트 INSERT와 충돌 없음 확인 필요
  - SQL은 이전 대화에 준비됨
- [ ] **누락 User 백필** — auth에만 있고 public.User 없는 계정 (오늘 가입한 sense 계정 등)
- [ ] **문의하기 이메일 경로** — 현재 Formspree 단독, 도메인 이전 시 trade-notify 통합 검토

---

## 미해결 / 차후 작업

### og:image 미설정
- [ ] 게임별 거래소·시세 페이지 og:image 미설정 — 카톡/트위터 공유 시 카드 이미지 빈 상태
  - 각 게임별 1200×630 OG 이미지 제작 후 `functions/trade/[slug].js` + 시세 정적 HTML에 `og:image` 추가 필요

### 중요도 높음
- [ ] 비밀번호 재설정 이메일 → Resend SMTP 교체 (도메인 인증 후)
- [ ] 시세 데이터 Supabase INSERT (원신/니케/쿠킹덤 SQL 준비됨)
- [ ] Supabase CASCADE FK 설정 (판매글 삭제 안정성)

### 중요도 중간
- [ ] 가격 범위 필터
- [ ] 찜하기 기능
- [ ] 신고 기능 (Report 테이블 존재, RLS 차단 상태)
- [ ] 에픽세븐 강화 어시스트 (계산기 + SEO 가이드 + 장비주인찾기 연결)

### 도감 보강
- [ ] 니케 prydwen 매칭 실패 22명 imageUrl 수동 보강
- [ ] 이환 B급 11명 element/role 정보 보강
- [ ] 엔드필드 / 우마무스메 도감 (신규)

### SEO
- [ ] 명조 캐릭터 페이지 서치콘솔 색인 요청
- [ ] 이환 SEO 키워드 보강 (게임 오픈 후)
- [ ] 준비중 시세 페이지 데이터 채우기 (블루아카이브, ZZZ, 림버스 등)

---

## 다음 작업 큐
1. **에픽세븐 강화 어시스트** — 계산기 + SEO 가이드 + 장비주인찾기 연결
2. **ListingView 1주일 후 분석** — 게임별 조회 패턴, 전환율 확인
