// 카오스 제로 나이트메어 — czncompass 캐릭터 카드 구조 확인. 러너 전용, DB 미변경.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1500, height: 1200 } })
await page.goto('https://www.czncompass.com/ko/characters', { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(4000)
for (let i = 0; i < 10; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(400)
}

// 캐릭터 이름 하나를 기준으로 그 카드(조상 요소)의 HTML 을 통째로 본다
const dump = await page.evaluate(() => {
  const NAMES = ['힐데', '테네브리아', '니아', '트리사']
  const out = { cards: [], allImgs: [] }
  out.allImgs = [...new Set([...document.querySelectorAll('img')]
    .map(i => i.getAttribute('src') || '').filter(Boolean))]
  for (const n of NAMES) {
    const el = [...document.querySelectorAll('*')].find(
      e => e.childElementCount === 0 && e.textContent.trim() === n)
    if (!el) { out.cards.push({ name: n, html: '(못 찾음)' }); continue }
    let card = el
    for (let up = 0; up < 5 && card.parentElement; up++) {
      card = card.parentElement
      if (card.querySelector('img')) break
    }
    out.cards.push({ name: n, html: card.outerHTML.slice(0, 1400) })
  }
  return out
})

console.log(`== 이미지 ${dump.allImgs.length}종 ==`)
for (const u of dump.allImgs.slice(0, 45)) console.log('  ' + u)

console.log('\n== 캐릭터 카드 HTML ==')
for (const c of dump.cards) {
  console.log(`\n---- ${c.name}\n${c.html.replace(/\s+/g, ' ')}`)
}

// 상세 페이지가 따로 있는지 (카드 클릭 시 URL 변화)
const first = await page.$('img[src*="char"], img[alt]')
if (first) {
  const before = page.url()
  await first.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(2500)
  console.log(`\n클릭 후 URL: ${page.url()}${page.url() === before ? ' (변화 없음 → 모달)' : ''}`)
  const t = await page.evaluate(() => document.body.innerText.slice(0, 700))
  console.log('클릭 후 본문: ' + t.replace(/\n+/g, ' | '))
}

await browser.close()
