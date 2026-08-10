// 카오스 제로 나이트메어 — czncompass(팬 공략 위키) 캐릭터 도감
//
// czncompass 는 Next.js 클라이언트 렌더라 HTML 만 받으면 안 잡힌다 → 헤드리스 브라우저로 렌더 후 수집.
// (auto-sync.yml / import-game.yml 이 이 어댑터가 돌 때 chromium 을 설치한다)
//
// 카드 DOM 에서 뽑는 것:
//   img[src*=portrait_character_crop_half_{id}] → alt=캐릭터명(한국어), id=캐릭터 번호
//   img[src*=icon_job_]                        → alt=클래스 (뱅가드/레인저/컨트롤러/사이오닉/스트라이커/헌터)
//   img[src*=/ego/]                            → alt=속성 (질서/정의/본능/공허/열정)
//   style 의 slot_rarity_ssr|sr                → 등급 (ssr=5성, sr=4성)
// 영문 이름은 /en/characters 를 같은 방식으로 읽어 캐릭터 번호로 맞춘다 (slug 용).
//
// 이미지는 핫링크하지 않고 신규분만 내려받아 img/characters/czn/ 에 저장한다.

import { mkdirSync, writeFileSync } from 'node:fs'

export const meta = {
  slug: 'czn',
  name: '카오스 제로 나이트메어',
  source: 'https://www.czncompass.com/ko/characters',
  kind: 'character',
  selfHostedImages: true,
}

const IMG_DIR = 'img/characters/czn'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const TIER = { ssr: '5성', sr: '4성', r: '3성' }

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || null

// 페이지 하나를 열어 캐릭터 카드를 전부 긁는다
async function scrape(browser, url) {
  const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1500, height: 1200 } })
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForSelector('img[src*="portrait_character_crop_half_"]', { timeout: 30000 })
    // 지연 로딩 대비 — 카드 수가 안 늘 때까지 끝까지 내린다
    let prev = 0, stable = 0
    for (let i = 0; i < 40 && stable < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(500)
      const n = await page.evaluate(() =>
        document.querySelectorAll('img[src*="portrait_character_crop_half_"]').length)
      if (n === prev) stable++; else { stable = 0; prev = n }
    }
    return await page.evaluate(() => {
      const out = []
      document.querySelectorAll('img[src*="portrait_character_crop_half_"]').forEach(img => {
        const src = img.getAttribute('src') || ''
        const id = (src.match(/crop_half_(\d+)\.webp/) || [])[1]
        const name = (img.getAttribute('alt') || '').trim()
        if (!id || !name) return
        // 클래스·속성·등급은 같은 카드 안에 있다 — 위로 올라가며 찾는다
        let card = img.parentElement
        for (let i = 0; i < 5 && card; i++) {
          if (card.querySelector('img[src*="icon_job_"]')) break
          card = card.parentElement
        }
        const job = card?.querySelector('img[src*="icon_job_"]')?.getAttribute('alt') || null
        const ego = card?.querySelector('img[src*="/ego/"]')?.getAttribute('alt') || null
        const rEl = card?.querySelector('[style*="slot_rarity_"]')
        const rarity = ((rEl?.getAttribute('style') || '').match(/slot_rarity_(\w+)\.webp/) || [])[1] || null
        out.push({ id, name, job, ego, rarity, imgUrl: src })
      })
      return out
    })
  } finally { await page.close() }
}

export async function fetchCharacters({ existing = [] } = {}) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  let ko, en
  try {
    ko = await scrape(browser, 'https://www.czncompass.com/ko/characters')
    try { en = await scrape(browser, 'https://www.czncompass.com/en/characters') }
    catch (e) { console.log(`  영문 페이지 실패(${e.message}) — slug 는 캐릭터 번호로 대체`); en = [] }
  } finally { await browser.close() }

  // id 중복 제거 (같은 캐릭터가 여러 번 잡힐 수 있음)
  const seen = new Set()
  const uniq = ko.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
  const enById = Object.fromEntries(en.map(c => [c.id, c.name]))
  console.log(`  czncompass ${uniq.length}명 (영문 이름 ${Object.keys(enById).length}명)`)
  if (uniq.length < 10) throw new Error(`수집 ${uniq.length}명 — 사이트 구조 변경 의심`)

  const rows = uniq.map(c => {
    const nameEn = enById[c.id] || null
    return {
      nameKo: c.name,
      nameEn,
      tier: TIER[c.rarity] || '',
      element: c.ego,          // 질서/정의/본능/공허/열정
      weaponType: c.job,       // 뱅가드/레인저/컨트롤러/사이오닉/스트라이커/헌터
      slug: slugify(nameEn) || `czn-${c.id}`,
      srcId: c.id,
      srcImg: c.imgUrl,
      metadata: { source: 'czncompass', srcId: c.id, job: c.job, ego: c.ego, rarity: c.rarity },
    }
  })

  const missing = rows.filter(r => !r.tier || !r.element || !r.weaponType)
  if (missing.length) console.log(`  ⚠ 속성 일부 누락 ${missing.length}명: ${missing.map(r => r.nameKo).join(', ')}`)

  // 신규분만 이미지를 내려받는다 (핫링크 금지 — 팬사이트 CDN 에 의존하지 않는다)
  const have = new Set(existing.map(e => norm(e.nameKo)))
  const news = rows.filter(r => !have.has(norm(r.nameKo)))
  console.log(`  기존 ${rows.length - news.length}명 / 신규 ${news.length}명`)
  if (news.length) {
    mkdirSync(IMG_DIR, { recursive: true })
    for (const r of news) {
      try {
        const res = await fetch(r.srcImg, { headers: { 'User-Agent': UA, Referer: meta.source } })
        if (!res.ok) { console.log(`    이미지 ${res.status}: ${r.nameKo}`); continue }
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 1000) { console.log(`    이미지 너무 작음: ${r.nameKo}`); continue }
        const path = `${IMG_DIR}/${r.srcId}.webp`
        writeFileSync(path, buf)
        r.localPath = path
        r.imageUrl = `https://resetlist.kr/${path}`
      } catch (e) { console.log(`    이미지 실패 ${r.nameKo}: ${e.message}`) }
    }
  }

  return rows.map(({ srcId, srcImg, ...r }) => r)
}
