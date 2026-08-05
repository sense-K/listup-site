// 자동 임포터가 없는 게임의 데이터 소스 탐색 — 러너 전용, DB 미변경.
// 커밋 태그 [find-source2] 로 실행. 확인할 대상이 생기면 이 파일을 바꿔서 다시 돌린다.
//
// 지금까지의 결론 (2026-08-05)
//   림버스 단빵숲(baslimbus.info) : HTML·RSC 에는 필터 UI 만, 목록은 클라이언트 렌더.
//                                   Playwright 로 띄우면 /identity/{id} 링크 + 인격명 + 등급이 잡힌다.
//                                   → 수집 가능하지만 헤드리스 브라우저가 필요하고 페이지네이션을 타야 함.
//   브라운더스트2 / 로스트소드     : 공식·팬사이트 모두 기계가 읽을 데이터 없음.
//   쿠키런킹덤                     : 영문 fandom MediaWiki API 는 열림(한국어 이름은 없음).

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

const TARGETS = [
  ['쿠킹덤 fandom en api', 'https://cookierunkingdom.fandom.com/api.php?action=query&meta=siteinfo&format=json'],
]

for (const [name, url] of TARGETS) {
  try {
    const r = await fetch(url, { headers: H, redirect: 'follow' })
    console.log(`[${r.status}] ${name}  ${(await r.text()).length}B\n      ${url}`)
  } catch (e) {
    console.log(`[ERR] ${name} — ${e.message}`)
  }
}
