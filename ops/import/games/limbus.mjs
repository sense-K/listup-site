// 림버스 컴퍼니 인격 — 단테의 빵과 수프(baslimbus.info)
//
// 단빵숲은 목록을 클라이언트에서 그려서 HTML 만 받으면 안 잡힌다 → 헤드리스 브라우저로 렌더 후 수집.
// (auto-sync.yml / import-game.yml 이 이 어댑터가 돌 때 chromium 을 설치한다)
//
// DB 표기 규칙 — 기존 172명이 쓰던 방식을 그대로 따른다:
//   nameKo = 인격명("N사 E.G.O::흉탄")   tier = 수감자명("이상")   성(1/2/3성)은 metadata.grade
// 이미지는 핫링크하지 않고 신규분만 내려받아 img/characters/limbus/ 에 저장한다.

import { mkdirSync, writeFileSync } from 'node:fs'

export const meta = {
  slug: 'limbus',
  name: '림버스 컴퍼니',
  source: 'https://baslimbus.info/identity',
  kind: 'character',
  selfHostedImages: true,   // 이 실행에서 받아 repo 에 쓴다 → HTTP 표본검사 대신 파일 존재로 확인
}

const LIST_URL = 'https://baslimbus.info/identity'
const IMG_DIR = 'img/characters/limbus'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// 단빵숲 표기 → 우리 DB 표기. 어긋나면 등록 화면 수감자 그룹이 쪼개진다.
const SINNER_ALIAS = { '로쟈': '로디온' }
const GRADE = { 1: '1성', 2: '2성', 3: '3성' }

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '')

export async function fetchCharacters({ existing = [] } = {}) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  let scraped
  try {
    const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1400, height: 1000 } })
    await page.goto(LIST_URL, { waitUntil: 'networkidle', timeout: 90000 })
    await page.waitForSelector('a[href*="/identity/"]', { timeout: 30000 })

    let prev = 0, stable = 0
    for (let i = 0; i < 60 && stable < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(700)
      const n = await page.evaluate(() => document.querySelectorAll('a[href*="/identity/"]').length)
      if (n === prev) stable++; else { stable = 0; prev = n }
    }

    scraped = await page.evaluate(() => {
      const out = []
      document.querySelectorAll('a[href*="/identity/"]').forEach(a => {
        const id = (a.getAttribute('href')?.match(/\/identity\/(\d+)/) || [])[1]
        if (!id) return
        const card = a.querySelector('div') || a
        const texts = [...card.querySelectorAll('div,span,p')]
          .map(e => e.childElementCount === 0 ? e.textContent.trim() : '')
          .filter(t => t && t.length <= 40)
        const imgs = [...a.querySelectorAll('img')]
          .map(i => ({ src: i.getAttribute('src') || '', alt: i.getAttribute('alt') || '' }))
        out.push({ id, texts, imgs })
      })
      return out
    })
  } finally { await browser.close() }

  const seen = new Set()
  const uniq = scraped.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true })
  console.log(`  단빵숲 ${uniq.length}건 수집`)

  const rows = uniq.map(s => {
    let grade = null
    for (const im of s.imgs) {
      const m = im.alt.match(/grade-(\d)/) || im.src.match(/\/assets\/common\/(\d)\.webp/)
      if (m) { grade = Number(m[1]); break }
    }
    const portrait = s.imgs.find(im => !/grade-\d/.test(im.alt) && !/\/assets\/common\/\d\.webp/.test(im.src))
    const [title, sinnerRaw] = s.texts
    const sinner = SINNER_ALIAS[(sinnerRaw || '').trim()] || (sinnerRaw || '').trim()
    return {
      srcId: s.id,
      nameKo: (title || '').trim(),          // 인격명
      nameEn: sinner,
      tier: sinner,                          // 등록 화면 그룹 = 수감자
      portraitUrl: portrait?.src || null,
      metadata: { source: 'baslimbus', srcId: s.id, sinner, grade: GRADE[grade] || null },
    }
  }).filter(r => r.nameKo && r.tier)

  // 수감자 표기가 DB tier 와 어긋나면 그룹이 쪼개진다 → 사전 차단
  const dbTiers = [...new Set(existing.map(e => e.tier).filter(Boolean))]

  // 신규분만 이미지를 내려받는다
  const have = new Set(existing.map(e => norm(e.nameKo)))
  const news = rows.filter(r => !have.has(norm(r.nameKo)))
  console.log(`  기존 ${rows.length - news.length}건 / 신규 ${news.length}건`)
  // 신규 인격의 수감자 표기가 DB 와 어긋나면 등록 화면 그룹이 쪼개진다 → 사전 차단
  if (dbTiers.length) {
    const unknown = [...new Set(news.map(r => r.tier))].filter(t => !dbTiers.includes(t))
    if (unknown.length) throw new Error(`DB 에 없는 수감자 표기: ${unknown.join(', ')} — SINNER_ALIAS 에 매핑 추가 필요`)
  }

  if (news.length) {
    mkdirSync(IMG_DIR, { recursive: true })
    console.log(`  신규 ${news.length}건 — 이미지 내려받는 중`)
    for (const r of news) {
      if (!r.portraitUrl) continue
      const url = r.portraitUrl.startsWith('http') ? r.portraitUrl : `https://baslimbus.info${r.portraitUrl}`
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: LIST_URL } })
        if (!res.ok) { console.log(`    이미지 ${res.status}: ${r.nameKo}`); continue }
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 1000) { console.log(`    이미지 너무 작음: ${r.nameKo}`); continue }
        const ext = (url.match(/\.(webp|png|jpg|jpeg)(\?|$)/i) || [, 'webp'])[1].toLowerCase()
        const path = `${IMG_DIR}/${r.srcId}.${ext}`
        writeFileSync(path, buf)
        r.localPath = path
        r.imageUrl = `https://resetlist.kr/${path}`
      } catch (e) { console.log(`    이미지 실패 ${r.nameKo}: ${e.message}`) }
    }
  }

  // 기존 인격은 이름만 돌려준다 — 갱신 대상에서 빼기 위함.
  // 단빵숲 카드가 수감자를 잘못 집는 경우가 있어(첫 프로브에서 tier 17건 불일치) 기존 값을 덮지 않는다.
  const newSet = new Set(news.map(r => r.nameKo))
  return rows.map(({ srcId, portraitUrl, ...r }) => newSet.has(r.nameKo) ? r : { nameKo: r.nameKo })
}
