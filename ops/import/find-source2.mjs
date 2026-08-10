// 카오스 제로 나이트메어 — czncompass 캐릭터 목록을 브라우저로 확인. 러너 전용, DB 미변경.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1500, height: 1000 } })

const calls = []
page.on('response', r => {
  const u = r.url()
  if (/\.(css|png|webp|jpg|jpeg|svg|ico|woff2?|gif)($|\?)/.test(u)) return
  if (/czncompass\.com/.test(u) || /api|\.json/.test(u)) calls.push([r.status(), u])
})

await page.goto('https://www.czncompass.com/ko/characters', { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(4000)
// 지연 로딩 대비
for (let i = 0; i < 12; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
}

console.log('== 네트워크 (데이터 후보) ==')
for (const [s, u] of calls.slice(0, 40)) console.log(`  ${s} ${u.slice(0, 170)}`)

console.log('\n== 렌더된 캐릭터 ==')
const info = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a[href*="/character"]')].map(a => ({
    href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 50),
    img: a.querySelector('img')?.getAttribute('src') || null,
  }))
  const imgs = [...document.querySelectorAll('img')].map(i => i.getAttribute('src') || '').filter(Boolean)
  const first = document.querySelector('a[href*="/character"]')
  return { links, imgCount: imgs.length, imgSample: imgs.slice(0, 6),
           cardHtml: first ? (first.outerHTML || '').slice(0, 900) : '' }
})
console.log(`  /character 링크 ${info.links.length}개`)
for (const l of info.links.slice(0, 25)) console.log(`   · ${l.href}  "${l.text}"  img=${(l.img || '').slice(0, 80)}`)
console.log(`  img 태그 ${info.imgCount}개: ${info.imgSample.join(' ').slice(0, 400)}`)
if (info.cardHtml) console.log(`\n  카드 HTML:\n  ${info.cardHtml.replace(/\s+/g, ' ')}`)

const txt = await page.evaluate(() => document.body.innerText)
console.log(`\n  본문 ${txt.length}자`)
console.log('  ' + txt.slice(0, 900).replace(/\n+/g, ' | '))

await browser.close()
