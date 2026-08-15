// 카제나 카드 DB — 실제 메뉴 링크를 읽어 카드 페이지를 찾는다. 러너 전용, DB 미변경. [find-source2]
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1500, height: 1100 } })
await page.goto('https://www.czncompass.com/ko', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(2500)

console.log('========== ① 사이트의 실제 링크 전부 ==========')
const links = await page.evaluate(() =>
  [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))]
    .filter(h => h && h.startsWith('/')))
console.log(links.join('\n'))

// 메뉴를 눌러야 나오는 드롭다운(정보 등)도 열어본다
const more = await page.evaluate(async () => {
  const out = []
  for (const el of [...document.querySelectorAll('button,[role=button],summary')]) {
    const t = (el.textContent || '').trim()
    if (/정보|가이드|메뉴|더보기/.test(t)) { el.click(); out.push(t) }
  }
  await new Promise(r => setTimeout(r, 800))
  return { clicked: out, links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))].filter(h => h && h.startsWith('/')) }
})
console.log(`\n메뉴 클릭 후 추가 링크: ${more.links.filter(l => !links.includes(l)).join(', ') || '없음'}`)
const all = [...new Set([...links, ...more.links])]
await page.close()

// 카드/덱 관련 경로만 골라 방문
const targets = all.filter(h => /card|deck|build|info|db|neutral|persona|epiphany|번뜩/i.test(h))
console.log(`\n========== ② 카드/덱 관련 경로 방문 (${targets.length}개) ==========`)
console.log(targets.join('  '))

for (const t of targets.slice(0, 6)) {
  const p = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1500, height: 1100 } })
  const chunks = []
  p.on('response', r => { if (/_next\/static\/chunks\/.*\.js/.test(r.url())) chunks.push(r.url()) })
  let status = 0
  try {
    const resp = await p.goto(`https://www.czncompass.com${t}`, { waitUntil: 'networkidle', timeout: 60000 })
    status = resp?.status() ?? 0
    await p.waitForTimeout(3500)
    for (let i = 0; i < 6; i++) { await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(400) }
  } catch (e) { console.log(`  (${t} 실패: ${e.message.slice(0, 50)})`) }

  const txt = await p.evaluate(() => document.body.innerText).catch(() => '')
  console.log(`\n--- [${status}] ${t}  본문 ${txt.length}자`)
  console.log(`  ${txt.slice(0, 800).replace(/\n+/g, ' | ')}`)

  // 이 페이지에서만 새로 로드된 청크에서 카드 레코드를 찾는다
  for (const u of chunks) {
    let s = ''
    try { s = await (await fetch(u)).text() } catch { continue }
    if (s.length < 200000) continue
    const cardIds = [...new Set([...s.matchAll(/"id":"((?:nt|ps|uq|bs|fb|card)_[\w-]+)"/g)].map(x => x[1]))]
    const koNames = [...s.matchAll(/"ko":"([^"]{1,24})"/g)].length
    if (cardIds.length > 20) {
      console.log(`  ★ ${u.split('/').pop()} (${s.length}B) — 카드형 id ${cardIds.length}종, ko 문자열 ${koNames}건`)
      console.log(`     예: ${cardIds.slice(0, 12).join(', ')}`)
      const i = s.indexOf(`"${cardIds[0]}"`)
      console.log(`     레코드: ${s.slice(Math.max(0, i - 300), i + 700).replace(/\s+/g, ' ')}`)
      break
    }
  }
  await p.close()
}
await browser.close()
