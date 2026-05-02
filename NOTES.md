# TODO: my-heroes 토글 컴포넌트 분리
- 현재 위치: rta/, gear-recommend/ 에 동일 코드 중복
- 3번째 페이지 추가 시 공용 컴포넌트(/components/my-heroes-toggle.js)로 추출

---

## 도메인 이전 (플레이센스) 시 처리할 항목

### 이메일 알림
- [ ] Resend Dashboard → Domains → Add Domain → 새 도메인
- [ ] DKIM/SPF/DMARC DNS 레코드 추가 (Cloudflare DNS)
- [ ] `supabase/functions/trade-notify/index.ts` 수정:
  - `FROM` 상수: `'리세리스트 <onboarding@resend.dev>'` → `'플레이센스 <noreply@<new-domain>>'`
  - `SITE_URL` 상수: `'https://resetlist.kr'` → 새 도메인
  - 메일 템플릿 내 "리세리스트" 텍스트 → "플레이센스"
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

## 미해결 / 차후 작업

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
