# 프로젝트 환경 셋업 (배포 · Supabase 접근)

매니저(Claude Code)가 클라우드 세션에서 직접 배포하고 Supabase에 SQL을 실행할 수 있게 하는 셋업.
이 세션은 egress 정책으로 Supabase 호스트가 차단되므로, 배포/DB 작업은 **GitHub Actions 러너를 경유**한다.

## 형이 한 번만 등록하면 되는 것 (GitHub 저장소 설정)

**Settings → Secrets and variables → Actions** 에서:

### Secrets (탭: Secrets)
| 이름 | 값 | 용도 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 토큰 (권한: *Account → Cloudflare Pages → Edit*) | 배포 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID (대시보드 우측 사이드바 / Workers & Pages 개요) | 배포 |
| `SUPABASE_DB_URL` | Supabase 연결 문자열 — **Session pooler** URI (비밀번호 포함) | SQL 실행 |

> `SUPABASE_DB_URL`은 Supabase 대시보드 → **Settings → Database → Connection string → Session pooler** 의 URI를 그대로 복사.
> GitHub 러너는 IPv4라서 반드시 *Session pooler*(IPv4 호환)를 써야 함. Direct connection(IPv6)은 안 됨.

### Variables (탭: Variables)
| 이름 | 값 | 용도 |
|---|---|---|
| `CF_PAGES_PROJECT` | Cloudflare Pages 프로젝트명 (Workers & Pages 목록의 프로젝트 이름) | 배포 대상 지정 |

## 매니저(Claude)가 쓰는 방법

### 배포
```
커밋 메시지에 [deploy] 포함해서 push
→ .github/workflows/deploy.yml 이 wrangler pages deploy 실행
```
- 일반 커밋은 배포되지 않음 (`[deploy]` 태그가 있어야만).

### Supabase SQL 실행
1. 실행할 SQL을 `ops/sql/run.sql` 에 작성
2. 커밋 메시지 태그:
   - `[sql]` → DB에 **반영**
   - `[sql-dry]` → 실행 후 **ROLLBACK** (조회/문법 검증만, 반영 안 함)
3. 결과는 GitHub Actions 실행 로그에서 확인
4. 작업 후 `ops/sql/run.sql` 은 중립 기본값(`select now()...`)으로 되돌림

> anon key로 막히는 관리자 작업(테이블 생성, RLS 정책, `Listing`/`Character` INSERT 등)은 전부 이 경로로 처리.

## 주의
- 기존에 Cloudflare Pages가 **Git 연동(main push 자동배포)** 으로 설정돼 있으면, 이 워크플로의 direct-upload 배포와 이중이 될 수 있음. 한쪽만 사용 권장.
  - Git 연동을 계속 쓰려면: 매니저가 main에 머지하면 자동 배포됨 (이 경우 `[deploy]` 워크플로는 안 써도 됨).
  - 이 워크플로로 통일하려면: Cloudflare Pages 프로젝트의 Git 연동 자동배포를 꺼도 됨.
- Supabase Edge Function(`trade-notify` / 슬러그 `quick-responder`) 코드 변경은 **Supabase 대시보드에서 수동 Deploy** 필요 (git push로 반영 안 됨).
