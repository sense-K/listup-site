// 소스 탐색 — 러너 전용, DB 미변경. 결과는 Actions 로그로 본다.
//  ① 림버스: 단테의 빵과 수프(baslimbus.info) 인격 데이터
//  ② 우마무스메: 서포트 카드 (umapyoi API / GameTora)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

async function grab(name, url, { json = false, show = 0 } = {}) {
  try {
    const r = await fetch(url, { headers: H, redirect: 'follow' })
    const ct = (r.headers.get('content-type') || '').split(';')[0]
    const body = await r.text()
    console.log(`\n[${r.status}] ${name}  ${body.length}B  ${ct}`)
    console.log(`      ${url}`)
    if (!r.ok) return null
    if (json || /json/.test(ct)) {
      let d
      try { d = JSON.parse(body) } catch { console.log('      JSON 파싱 실패'); return null }
      const arr = Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : null)
      if (arr) {
        console.log(`      배열 ${arr.length}개, 첫 항목 키: ${Object.keys(arr[0] || {}).join(', ')}`)
        if (show) console.log('      샘플: ' + JSON.stringify(arr.slice(0, show)).slice(0, 900))
      } else {
        console.log(`      객체 키: ${Object.keys(d).slice(0, 20).join(', ')}`)
        if (show) console.log('      샘플: ' + JSON.stringify(d).slice(0, 900))
      }
      return d
    }
    // HTML — 데이터를 실어나르는 흔적 탐색
    const hints = []
    if (/__NEXT_DATA__/.test(body)) hints.push('__NEXT_DATA__(Next.js)')
    if (/__NUXT__/.test(body)) hints.push('__NUXT__')
    if (/window\.__INITIAL/.test(body)) hints.push('__INITIAL_STATE__')
    const js = [...body.matchAll(/["'](\/[^"']*\.(?:json|js))["']/g)].map(m => m[1])
    const dataish = [...new Set(js)].filter(p => /data|api|chunk|main|index|app/i.test(p)).slice(0, 8)
    if (hints.length) console.log(`      ${hints.join(' | ')}`)
    if (dataish.length) console.log(`      정적파일: ${dataish.join(' ')}`)
    // 한국어 캐릭터명이 HTML 안에 직접 있는지 (SSR 여부 판정)
    const ko = body.match(/[가-힣]{2,}/g) || []
    console.log(`      한글 토큰 ${ko.length}개 ${ko.length ? '· 예: ' + [...new Set(ko)].slice(0, 12).join(' ') : '(→ CSR, HTML엔 데이터 없음)'}`)
    return body
  } catch (e) {
    console.log(`\n[ERR] ${name} — ${e.message}\n      ${url}`)
    return null
  }
}

console.log('==================== ① 림버스: 단테의 빵과 수프 ====================')
const home = await grab('단빵숲 홈', 'https://baslimbus.info/')
await grab('단빵숲 인격 목록', 'https://baslimbus.info/identity')
await grab('단빵숲 인격(다른 경로)', 'https://baslimbus.info/identities')
for (const p of ['/api/identity', '/api/identities', '/data/identity.json', '/identity.json']) {
  await grab(`단빵숲 ${p}`, `https://baslimbus.info${p}`)
}
// Next.js 라면 빌드ID 로 page-data 를 직접 뽑을 수 있다
if (typeof home === 'string') {
  const m = home.match(/"buildId":"([^"]+)"/)
  if (m) {
    console.log(`\n  buildId=${m[1]}`)
    await grab('단빵숲 page-data', `https://baslimbus.info/_next/data/${m[1]}/identity.json`, { show: 1 })
  }
}

console.log('\n\n==================== ② 우마무스메 서포트 카드 ====================')
await grab('umapyoi 서포트 목록', 'https://umapyoi.net/api/v1/support', { show: 2 })
await grab('umapyoi 서포트(복수형)', 'https://umapyoi.net/api/v1/supports', { show: 2 })
await grab('umapyoi 카드', 'https://umapyoi.net/api/v1/card', { show: 2 })
const gt = await grab('GameTora 서포트(ko)', 'https://gametora.com/ko/umamusume/supports')
if (typeof gt === 'string') {
  const m = gt.match(/"buildId":"([^"]+)"/)
  if (m) {
    console.log(`\n  GameTora buildId=${m[1]}`)
    await grab('GameTora page-data',
      `https://gametora.com/_next/data/${m[1]}/ko/umamusume/supports.json`, { show: 1 })
  }
}
