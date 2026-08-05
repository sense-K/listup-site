// 림버스 단빵숲(baslimbus.info) — 브라우저로 띄우면 인격 데이터를 가져올 수 있는지 확인.
// HTML/RSC 에는 필터 버튼만 있고 목록은 클라이언트에서 그려진다(CSR).
// 러너에서 Playwright 로 실제 렌더 + 네트워크 요청을 관찰해 "데이터를 어디서 받는지" 찾는다.
// DB 미변경.

import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ locale: 'ko-KR' })

const calls = []
page.on('response', r => {
  const u = r.url()
  if (/baslimbus\.info/.test(u) && !/\.(css|js|png|webp|jpg|svg|ico|woff2?)($|\?)/.test(u)) {
    calls.push([r.status(), r.request().method(), u])
  }
  // 외부 API(수퍼베이스/파이어베이스 등)로 나가는 것도 잡는다
  if (!/baslimbus\.info/.test(u) && /api|supabase|firestore|googleapis|json/.test(u)) {
    calls.push([r.status(), r.request().method(), '(외부) ' + u])
  }
})

console.log('페이지 로드 중...')
await page.goto('https://baslimbus.info/identity', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3000)

console.log('\n== 네트워크 요청 ==')
for (const [s, m, u] of calls) console.log(`  ${s} ${m} ${u.slice(0, 160)}`)

console.log('\n== 렌더된 인격 카드 ==')
// 링크/이미지 기준으로 목록 아이템 탐색
const info = await page.evaluate(() => {
  const out = { links: [], imgs: [], sample: '' }
  document.querySelectorAll('a[href*="/identity/"]').forEach(a => {
    out.links.push({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 60) })
  })
  document.querySelectorAll('img').forEach(i => {
    const s = i.getAttribute('src') || ''
    if (/identity|character|person|인격/i.test(s)) out.imgs.push(s)
  })
  const first = document.querySelector('a[href*="/identity/"]')
  if (first) out.sample = (first.closest('div')?.outerHTML || first.outerHTML).slice(0, 600)
  return out
})
console.log(`  /identity/ 링크 ${info.links.length}개`)
for (const l of info.links.slice(0, 15)) console.log(`   · ${l.href}  "${l.text}"`)
console.log(`  이미지 ${info.imgs.length}개: ${info.imgs.slice(0, 5).join(' ')}`)
if (info.sample) console.log(`\n  카드 HTML 샘플:\n  ${info.sample.replace(/\s+/g, ' ')}`)

// 페이지 전체 텍스트에서 인격 이름처럼 보이는 것
const txt = await page.evaluate(() => document.body.innerText)
console.log(`\n  본문 길이 ${txt.length}자`)
console.log('  앞부분: ' + txt.slice(0, 600).replace(/\n+/g, ' | '))

await browser.close()
