# TODO: my-heroes 토글 컴포넌트 분리
- 현재 위치: rta/, gear-recommend/ 에 동일 코드 중복
- 3번째 페이지 추가 시 공용 컴포넌트(/components/my-heroes-toggle.js)로 추출

## 알림 시스템 현황 (2026-05-02 기준)

### 작동 상태
- quick-responder Edge Function: 정상 작동
- 구매 신청 / 전달 완료 / 거래 완료 / 거래 취소 알림: 코드 정상
- nudge (연락 요청) 알림: 코드 정상
- /api/nudge CF Function 프록시: 정상

### 알려진 제약
- Resend 발신 도메인이 onboarding@resend.dev (Resend 무료 공용 도메인)
- 미인증 도메인 제약으로 Resend 가입 이메일(zzabhm@gmail.com)에만 발송됨
- 다른 사용자(hjzos@naver.com 등)에게는 Resend가 차단

### 진단 (이전 흐름)
- 진단 1차: stub이라고 잘못 판단 (테스트 페이로드에 record 없어서)
- 진단 2차: hjzos를 더미 계정이라고 잘못 판단 (실제로는 정상 가입자)
- 진단 3차: Resend 발신 도메인 제약으로 확정

### 해결 (도메인 이전 시 일괄)
1. Resend Dashboard → Domains → Add Domain → 새 도메인
2. DKIM/SPF/DMARC DNS 레코드 추가
3. quick-responder의 FROM 상수 변경:
   '리세리스트 <onboarding@resend.dev>' → '플레이센스 <noreply@new-domain>'
4. quick-responder 재배포
