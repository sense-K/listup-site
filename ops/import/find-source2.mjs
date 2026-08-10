// 자동 임포터가 없는 게임의 데이터 소스 탐색 — 러너 전용, DB 미변경.
// 커밋 태그 [find-source2] 로 실행. 확인할 대상이 생기면 이 파일을 바꿔서 다시 돌린다.
//
// 지금까지의 결론 (2026-08-05)
//   림버스 단빵숲(baslimbus.info) : ✅ 임포터 구축 완료 (games/limbus.mjs, Playwright 필요)
//   브라운더스트2 / 로스트소드     : 공식·팬사이트 모두 기계가 읽을 데이터 없음.
//   쿠키런킹덤                     : 영문 fandom MediaWiki API 는 열림(한국어 이름은 없음).
//
// 지금 확인 대상: 카오스 제로 나이트메어 (2026-08-10)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

async function look(name, url, { show = 0 } = {}) {
  try {
    const r = await fetch(url, { headers: H, redirect: 'follow' })
    const ct = (r.headers.get('content-type') || '').split(';')[0]
    const body = await r.text()
    console.log(`\n[${r.status}] ${name}  ${body.length}B  ${ct}`)
    console.log(`      ${url}`)
    if (!r.ok) return null
    if (/json/.test(ct)) {
      let d; try { d = JSON.parse(body) } catch { console.log('      JSON 파싱 실패'); return null }
      const arr = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : null)
      if (arr) console.log(`      배열 ${arr.length}개, 키: ${Object.keys(arr[0] || {}).join(', ')}`)
      else console.log(`      객체 키: ${Object.keys(d).slice(0, 25).join(', ')}`)
      if (show) console.log('      샘플: ' + JSON.stringify(arr ? arr.slice(0, show) : d).slice(0, 900))
      return d
    }
    const hints = []
    if (/__NEXT_DATA__/.test(body)) hints.push('__NEXT_DATA__(Next.js)')
    if (/self\.__next_f/.test(body)) hints.push('RSC 스트림')
    if (/__NUXT__/.test(body)) hints.push('__NUXT__')
    if (/window\.__INITIAL/.test(body)) hints.push('__INITIAL_STATE__')
    if (hints.length) console.log(`      ${hints.join(' | ')}`)
    const jsons = [...new Set([...body.matchAll(/["'](\/?[\w/.-]*(?:api|data|db)[\w/.-]*\.json)["']/gi)].map(m => m[1]))]
    if (jsons.length) console.log(`      json 경로 후보: ${jsons.slice(0, 8).join(' ')}`)
    const chunks = [...new Set([...body.matchAll(/["'](\/_next\/static\/chunks\/[\w./-]+\.js)["']/g)].map(m => m[1]))]
    if (chunks.length) console.log(`      청크 ${chunks.length}개 (예: ${chunks.slice(0, 3).join(' ')})`)
    const ko = [...new Set((body.match(/[가-힣]{2,}/g) || []))]
    console.log(`      한글 토큰 ${ko.length}종 ${ko.length ? '· 예: ' + ko.slice(0, 15).join(' ') : '(→ CSR)'}`)
    return body
  } catch (e) { console.log(`\n[ERR] ${name} — ${e.message}\n      ${url}`); return null }
}

console.log('================ czncompass (공략 위키) ================')
const home = await look('czncompass 홈(ko)', 'https://www.czncompass.com/ko')
await look('czncompass 캐릭터', 'https://www.czncompass.com/ko/characters')
await look('czncompass 캐릭터(en)', 'https://www.czncompass.com/en/characters')
for (const p of ['/api/characters', '/api/character', '/data/characters.json', '/ko/character']) {
  await look(`czncompass ${p}`, `https://www.czncompass.com${p}`, { show: 1 })
}
if (typeof home === 'string') {
  const m = home.match(/"buildId":"([^"]+)"/)
  if (m) {
    console.log(`\n  buildId=${m[1]}`)
    await look('czncompass page-data', `https://www.czncompass.com/_next/data/${m[1]}/ko/characters.json`, { show: 1 })
  }
}

console.log('\n\n================ 공식 (스토브) ================')
await look('스토브 공식 ko', 'https://page.onstove.com/chaoszeronightmare/kr')
await look('공식 홈 en', 'https://chaoszeronightmare.onstove.com/en')
await look('공식 홈 ko', 'https://chaoszeronightmare.onstove.com/ko')

console.log('\n\n================ 계산기/툴 (데이터 번들 가능성) ================')
await look('일본 계산기', 'https://mashiroco.github.io/chaoszeronightmare-calculator/')
for (const p of ['data/characters.json', 'data/character.json', 'assets/data/characters.json']) {
  await look(`계산기 ${p}`, `https://mashiroco.github.io/chaoszeronightmare-calculator/${p}`, { show: 1 })
}
