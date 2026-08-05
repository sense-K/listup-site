// 캐릭터 0명 게임(로스트소드·브라운더스트2)의 공개 데이터 소스 탐색 — 러너 전용, DB 미변경.
// 컨테이너는 egress 차단이라 여기서만 확인 가능. 결과는 Actions 로그로 본다.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const TARGETS = [
  // 로스트소드 (위메이드커넥트)
  ['로스트소드 공식', 'https://lostsword.wemadeconnect.com/'],
  ['로스트소드 공식 캐릭터', 'https://lostsword.wemadeconnect.com/character'],
  ['로스트소드 공식 kr', 'https://lostsword.wemadeconnect.com/ko/character'],
  // 브라운더스트2
  ['BD2 공식', 'https://www.browndust2.com/'],
  ['BD2 공식 캐릭터', 'https://www.browndust2.com/ko-kr/character'],
  ['BD2DB', 'https://bd2.souseha.com/'],
  ['BD2DB api', 'https://bd2.souseha.com/api/characters'],
  ['BD2 gitbook', 'https://browndust2.gitbook.io/'],
  // 위키 계열 (MediaWiki API 가 열려있으면 자동 수집 가능)
  ['BD2 fandom api', 'https://browndust2.fandom.com/api.php?action=query&meta=siteinfo&format=json'],
  ['BD2 wiki.gg api', 'https://browndust2.wiki.gg/api.php?action=query&meta=siteinfo&format=json'],
  ['로스트소드 fandom api', 'https://lostsword.fandom.com/api.php?action=query&meta=siteinfo&format=json'],
  // 쿠킹덤 (지난 조사에서 403, 러너에서 재확인)
  ['쿠킹덤 fandom ko api', 'https://cookierunkingdom.fandom.com/ko/api.php?action=query&meta=siteinfo&format=json'],
  ['쿠킹덤 fandom en api', 'https://cookierunkingdom.fandom.com/api.php?action=query&meta=siteinfo&format=json'],
]

for (const [name, url] of TARGETS) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }, redirect: 'follow' })
    const ct = r.headers.get('content-type') || ''
    const body = await r.text()
    let note = `${body.length}B ${ct.split(';')[0]}`
    if (/json/.test(ct)) {
      try { note += ` · keys=${Object.keys(JSON.parse(body)).slice(0, 6).join(',')}` } catch {}
    } else {
      // HTML 이면 캐릭터 데이터를 실어나르는 흔적을 찾는다
      const hints = []
      if (/__NEXT_DATA__/.test(body)) hints.push('NEXT_DATA(Next.js SSG — page-data 추출 가능)')
      if (/__NUXT__/.test(body)) hints.push('NUXT')
      if (/window\.__INITIAL/.test(body)) hints.push('INITIAL_STATE')
      const apis = [...body.matchAll(/["'](\/[a-z0-9/_-]*(?:api|data)[a-z0-9/_.-]*\.json)["']/gi)].map(m => m[1])
      if (apis.length) hints.push(`json경로: ${[...new Set(apis)].slice(0, 4).join(' ')}`)
      if (hints.length) note += ` · ${hints.join(' | ')}`
    }
    console.log(`${String(r.status).padEnd(4)} ${name.padEnd(22)} ${note}`)
  } catch (e) {
    console.log(`ERR  ${name.padEnd(22)} ${e.message}`)
  }
}
