// 카오스 제로 나이트메어 — 스토브(스마일게이트) 쪽에 공개 API 가 있는지 탐색. 러너 전용, DB 미변경.
//
// 근거: 에픽세븐은 static-pubcomm.onstove.com/gameRecord/epic7/epic7_hero.json 을 공개로 서빙한다.
//       같은 퍼블리셔·같은 플랫폼이므로 카제나도 동일 규칙의 경로가 있을 수 있다.
//
// ① 스토브 정적 호스트를 게임코드 × 파일명 조합으로 훑기
// ② 공식 홈페이지 / 스토브 커뮤니티를 브라우저로 열어 실제로 호출하는 API 를 전부 캡처
// ③ __NUXT__ 페이로드에서 API 베이스 URL 추출

import { chromium } from 'playwright'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

const hit = []
async function tryUrl(url) {
  try {
    const r = await fetch(url, { headers: H, redirect: 'follow' })
    const ct = (r.headers.get('content-type') || '').split(';')[0]
    const len = Number(r.headers.get('content-length') || 0)
    if (r.ok && /json|javascript|octet/.test(ct)) {
      const body = await r.text()
      console.log(`  ✅ ${r.status} ${ct} ${body.length}B  ${url}`)
      console.log(`       앞부분: ${body.slice(0, 200).replace(/\s+/g, ' ')}`)
      hit.push(url)
      return body
    }
    if (r.ok) console.log(`  ·  ${r.status} ${ct} ${len || '?'}B  ${url}`)
    return null
  } catch { return null }
}

console.log('==================== ① 스토브 정적 호스트 규칙 대입 ====================')
console.log('(에픽세븐 실제 경로: static-pubcomm.onstove.com/gameRecord/epic7/epic7_hero.json)\n')
// 먼저 에픽세븐이 지금도 되는지 확인 — 규칙이 살아있는지 기준점
await tryUrl('https://static-pubcomm.onstove.com/gameRecord/epic7/epic7_hero.json')

const CODES = ['czn', 'chaoszeronightmare', 'chaoszero', 'chaos_zero_nightmare', 'cznm', 'nightmare']
const FILES = [
  c => `gameRecord/${c}/${c}_hero.json`,
  c => `gameRecord/${c}/${c}_character.json`,
  c => `gameRecord/${c}/character.json`,
  c => `gameRecord/${c}/hero.json`,
  c => `gameRecord/${c}/index.json`,
  c => `event/live/${c}/guide/data/character.json`,
]
for (const c of CODES) for (const f of FILES) await tryUrl(`https://static-pubcomm.onstove.com/${f(c)}`)

console.log('\n==================== ② 브라우저로 실제 호출 캡처 ====================')
const PAGES = [
  ['공식 홈(ko)', 'https://chaoszeronightmare.onstove.com/ko'],
  ['공식 캐릭터', 'https://chaoszeronightmare.onstove.com/ko/character'],
  ['스토브 커뮤니티', 'https://page.onstove.com/chaoszeronightmare/kr'],
]
const browser = await chromium.launch()
const seenApi = new Set()
for (const [name, url] of PAGES) {
  const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1400, height: 1000 } })
  const calls = []
  page.on('response', r => {
    const u = r.url()
    if (/\.(png|jpg|jpeg|webp|gif|svg|woff2?|css|mp4|ico)($|\?)/i.test(u)) return
    const ct = (r.headers()['content-type'] || '').split(';')[0]
    // 데이터로 보이는 것만
    if (/json/.test(ct) || /\/api\/|\/v\d\/|gameRecord|\.json/i.test(u)) calls.push([r.status(), ct, u])
  })
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(3500)
  } catch (e) { console.log(`  (${name} 로드 실패: ${e.message.slice(0, 60)})`) }
  console.log(`\n--- ${name}  ${url}`)
  const uniq = [...new Map(calls.map(c => [c[2], c])).values()]
  for (const [s, ct, u] of uniq.slice(0, 30)) {
    console.log(`  ${s} ${(ct || '-').padEnd(18)} ${u.slice(0, 150)}`)
    if (/json/.test(ct)) seenApi.add(u.split('?')[0])
  }
  if (!uniq.length) console.log('  (데이터 호출 없음 — 정적 페이지)')
  // 페이지에 박힌 API 베이스 URL
  const bases = await page.evaluate(() => {
    const txt = document.documentElement.innerHTML
    return [...new Set([...txt.matchAll(/https?:\/\/[a-z0-9.-]*onstove\.com[^"'\\ )]*/gi)].map(m => m[0]))]
      .filter(u => /api|record|static|data|cdn/i.test(u)).slice(0, 25)
  }).catch(() => [])
  if (bases.length) { console.log('  페이지에 박힌 onstove 주소:'); for (const b of bases) console.log(`    ${b.slice(0, 150)}`) }
  await page.close()
}
await browser.close()

console.log('\n==================== ③ 스토브 공개 API 후보 ====================')
for (const u of [
  'https://api.onstove.com/gamerecord/v1/games',
  'https://api.onstove.com/gamerecord/v1.0/games',
  'https://static-pubcomm.onstove.com/gameRecord/games.json',
  'https://static-pubcomm.onstove.com/gameRecord/index.json',
]) await tryUrl(u)

console.log('\n==================== 요약 ====================')
console.log(hit.length ? `데이터로 쓸 수 있는 응답 ${hit.length}건:\n  ${hit.join('\n  ')}`
                       : '규칙 대입으로는 카제나용 공개 JSON 을 못 찾음')
if (seenApi.size) console.log(`브라우저가 실제로 부른 JSON API:\n  ${[...seenApi].join('\n  ')}`)
