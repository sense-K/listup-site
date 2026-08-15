// 카제나 카드 데이터 탐색 — 러너 전용, DB 미변경. [find-source2] (Playwright 필요)
//
// czncompass 메뉴: 홈 / 덱 빌더 / 딜 계산기 / 출격 / 캐릭터 / 정보
// 가이드 목록:    01 덱빌더 02 딜계산기 03 출격 04 캐릭터 05 카오스정보
//                06 카드정보(중립·페르소나 각인·번뜩임) 07 몬스터정보 08 장비 09 기억의조각 10 파트너
// → 덱 빌더는 전체 카드 목록을 클라이언트에 들고 있어야 하므로 여기가 가장 유력하다.

import { chromium } from 'playwright'

const browser = await chromium.launch()

const ROUTES = [
  '/ko/deck-builder', '/ko/deck', '/ko/builder',
  '/ko/cards', '/ko/card', '/ko/info/card',
  '/ko/monsters', '/ko/equipments', '/ko/memory', '/ko/partners', '/ko/chaos',
]
console.log('========== ① 라우트 존재 확인 ==========')
const alive = []
for (const r of ROUTES) {
  const p = await browser.newPage()
  let status = 0
  p.on('response', res => { if (res.url().endsWith(r) || res.url().endsWith(r + '/')) status = res.status() })
  try {
    const resp = await p.goto(`https://www.czncompass.com${r}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    status = resp?.status() ?? status
  } catch {}
  const txt = await p.evaluate(() => document.body.innerText.slice(0, 120)).catch(() => '')
  const ok = status === 200 && !/찾을 수 없|not found|404/i.test(txt)
  console.log(`  ${status} ${r}${ok ? '  ✅' : ''}  ${txt.replace(/\n+/g, ' | ').slice(0, 90)}`)
  if (ok) alive.push(r)
  await p.close()
}

console.log(`\n========== ② 살아있는 페이지의 데이터 호출 캡처 ==========`)
for (const r of alive.slice(0, 5)) {
  const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1500, height: 1100 } })
  const calls = []
  page.on('response', res => {
    const u = res.url()
    if (/\.(png|jpg|jpeg|webp|gif|svg|woff2?|css|ico)($|\?)/i.test(u)) return
    const ct = (res.headers()['content-type'] || '').split(';')[0]
    if (/json/.test(ct) || /\.json/.test(u)) calls.push([res.status(), ct, u])
  })
  try {
    await page.goto(`https://www.czncompass.com${r}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(4000)
    for (let i = 0; i < 8; i++) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400) }
  } catch (e) { console.log(`  (${r} 로드 실패: ${e.message.slice(0, 50)})`) }

  console.log(`\n--- ${r}`)
  const uniq = [...new Map(calls.map(c => [c[2], c])).values()]
  for (const [s, ct, u] of uniq.slice(0, 20)) console.log(`  ${s} ${(ct || '-').padEnd(17)} ${u.slice(0, 140)}`)
  if (!uniq.length) console.log('  (JSON 호출 없음 → 데이터가 JS 번들에 박혀 있을 가능성)')

  // 화면에 실제로 렌더된 카드 수 / 구조
  const info = await page.evaluate(() => {
    const txt = document.body.innerText
    const imgs = [...new Set([...document.querySelectorAll('img')].map(i => i.getAttribute('src') || ''))]
    return {
      len: txt.length,
      head: txt.slice(0, 700),
      cardImgs: imgs.filter(u => /card/i.test(u)).slice(0, 8),
      imgTotal: imgs.length,
    }
  }).catch(() => ({}))
  console.log(`  본문 ${info.len}자 · img ${info.imgTotal}개 · card 이미지 예: ${(info.cardImgs || []).join(' ').slice(0, 240)}`)
  if (info.head) console.log(`  ${info.head.replace(/\n+/g, ' | ').slice(0, 600)}`)
  await page.close()
}

console.log('\n========== ③ JS 번들에 카드 데이터가 박혀있나 ==========')
{
  const page = await browser.newPage()
  const chunks = []
  page.on('response', res => { if (/_next\/static\/chunks\/.*\.js/.test(res.url())) chunks.push(res.url()) })
  try {
    await page.goto(`https://www.czncompass.com${alive[0] || '/ko'}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(2500)
  } catch {}
  await page.close()
  console.log(`  청크 ${chunks.length}개 — 큰 것부터 카드 키워드 검사`)
  const sized = []
  for (const u of chunks) {
    try {
      const r = await fetch(u); const t = await r.text()
      sized.push([t.length, u, t])
    } catch {}
  }
  sized.sort((a, b) => b[0] - a[0])
  for (const [len, u, t] of sized.slice(0, 6)) {
    const hits = ['중립', '페르소나', '번뜩임', '각인', '카드', 'cardId', 'card_id'].filter(k => t.includes(k))
    console.log(`  ${String(len).padStart(8)}B  ${u.split('/').pop()}  키워드: ${hits.join(', ') || '없음'}`)
    if (hits.includes('중립') || hits.includes('번뜩임')) {
      const i = t.indexOf('중립') >= 0 ? t.indexOf('중립') : t.indexOf('번뜩임')
      console.log(`      주변: ${t.slice(Math.max(0, i - 250), i + 250).replace(/\s+/g, ' ')}`)
    }
  }
}

console.log('\n========== ④ 스토브 공식에 카드 페이지 JSON 이 있나 ==========')
const BASE = 'https://static-pubcomm.onstove.com/live/czn'
for (const p of ['homepage_brand_card', 'homepage_brand_cards', 'homepage_brand_system',
                 'homepage_brand_battle', 'homepage_brand_feature', 'homepage_brand_deck']) {
  for (const sec of ['multilingual']) {
    const u = `${BASE}/${sec}/czn_${p}.json`
    try {
      const r = await fetch(u)
      if (r.ok) console.log(`  ✅ ${r.status} ${(await r.text()).length}B  ${u}`)
    } catch {}
  }
}
await browser.close()
