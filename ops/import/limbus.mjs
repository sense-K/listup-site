// 림버스 컴퍼니 인격 임포터 — 단테의 빵과 수프(baslimbus.info)
//
// 단빵숲은 목록을 클라이언트에서 그리는 사이트라 HTML 만 받아선 안 잡힌다.
// 러너에서 헤드리스 브라우저로 한 번 띄워 전부 긁고 → 우리 DB 에 저장 → 이후엔 DB 만 쓴다.
// (매번 부를 필요 없음. 새 인격 나왔을 때만 다시 돌리면 된다)
//
// MODE=probe  : 무엇이 잡히는지 / DB 와 뭐가 다른지만 출력 (DB 미변경)  [limbus-probe]
// MODE=import : 신규 인격만 INSERT                                      [limbus-import]

import { chromium } from 'playwright'
import { execSync, execFileSync } from 'node:child_process'

const MODE = process.env.MODE === 'import' ? 'import' : 'probe'
const DB = process.env.SUPABASE_DB_URL
const LIST_URL = 'https://baslimbus.info/identity'

const esc = v => (v === null || v === undefined) ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
function q(sql) {
  // 셸을 거치지 않는다 (execSync 는 /bin/sh=dash 라 $'\\t' 를 리터럴로 넘겨 컬럼 분리가 깨졌었다)
  const out = execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-At', '-F', '\t', '-c', sql],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return out.trim() ? out.trim().split('\n').map(l => l.split('\t')) : []
}
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '')

console.log(`MODE=${MODE}`)

// ── 1. 브라우저로 목록 전체 수집
const browser = await chromium.launch()
const page = await browser.newPage({ locale: 'ko-KR', viewport: { width: 1400, height: 1000 } })
await page.goto(LIST_URL, { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForSelector('a[href*="/identity/"]', { timeout: 30000 })

// 무한스크롤/지연로딩 대비 — 링크 수가 안 늘 때까지 끝까지 내린다
let prev = 0, stable = 0
for (let i = 0; i < 60 && stable < 3; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(700)
  const n = await page.evaluate(() => document.querySelectorAll('a[href*="/identity/"]').length)
  if (n === prev) stable++; else { stable = 0; prev = n }
  if (i % 10 === 0) console.log(`  스크롤 ${i}회 · 인격 ${n}개`)
}
console.log(`스크롤 완료 · 인격 링크 ${prev}개`)

const scraped = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('a[href*="/identity/"]').forEach(a => {
    const href = a.getAttribute('href') || ''
    const id = (href.match(/\/identity\/(\d+)/) || [])[1]
    if (!id) return
    const card = a.querySelector('div') || a
    // 카드 안 텍스트 노드를 순서대로: [인격명, 수감자명]
    const texts = [...card.querySelectorAll('div,span,p')]
      .map(e => e.childElementCount === 0 ? e.textContent.trim() : '')
      .filter(t => t && t.length <= 40)
    const imgs = [...a.querySelectorAll('img')].map(i => ({
      src: i.getAttribute('src') || '', alt: i.getAttribute('alt') || '',
    }))
    out.push({ id, href, texts, imgs, raw: a.textContent.trim().slice(0, 80) })
  })
  return out
})
await browser.close()

console.log(`\n수집 ${scraped.length}건 (중복 제거 전)`)
// 같은 인격이 여러 번 잡힐 수 있으니 id 기준 유일화
const seen = new Set()
const uniq = scraped.filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true })
console.log(`id 유일화 후 ${uniq.length}건`)
const ids = uniq.map(s => Number(s.id)).sort((a, b) => a - b)
console.log(`  id 범위 ${ids[0]} ~ ${ids[ids.length - 1]}`)
const missing = []
for (let n = ids[0]; n <= ids[ids.length - 1]; n++) if (!seen.has(String(n))) missing.push(n)
console.log(`  중간에 빠진 id ${missing.length}개${missing.length ? ': ' + missing.slice(0, 30).join(',') : ''}`)
if (MODE === 'probe') {
  console.log('\n샘플 5건 (구조 확인):')
  for (const s of uniq.slice(0, 5)) {
    console.log(`  id=${s.id}  raw="${s.raw}"`)
    console.log(`     texts: ${JSON.stringify(s.texts)}`)
    console.log(`     imgs : ${JSON.stringify(s.imgs)}`)
  }
}

// ── 2. 정규화: 인격명 / 수감자 / 등급
const GRADE = { 1: '1성', 2: '2성', 3: '3성' }
const rows = uniq.map(s => {
  // 등급: <img alt="grade-3"> 또는 /assets/common/3.webp
  let grade = null
  for (const im of s.imgs) {
    const m = im.alt.match(/grade-(\d)/) || im.src.match(/\/assets\/common\/(\d)\.webp/)
    if (m) { grade = Number(m[1]); break }
  }
  // 초상: grade 아이콘이 아닌 이미지
  const portrait = s.imgs.find(im => !/grade-\d/.test(im.alt) && !/\/assets\/common\/\d\.webp/.test(im.src))
  const [title, sinner] = s.texts
  return {
    srcId: s.id,
    title: (title || '').trim(),          // 인격명 예: "새벽 사무소 대표"
    sinner: (sinner || '').trim(),        // 수감자 예: "그레고르"
    tier: GRADE[grade] || '',
    portrait: portrait?.src || null,
    detail: `https://baslimbus.info${s.href}`,
  }
}).filter(r => r.title && r.sinner)

console.log(`정규화 ${rows.length}건 (인격명·수감자 둘 다 있는 것)`)
const byTier = {}
rows.forEach(r => { byTier[r.tier || '(없음)'] = (byTier[r.tier || '(없음)'] || 0) + 1 })
console.log(`등급별: ${Object.entries(byTier).map(([k, v]) => `${k} ${v}`).join(' / ')}`)
console.log(`초상 이미지 있는 것 ${rows.filter(r => r.portrait).length}건`)
console.log('\n앞 12건:')
for (const r of rows.slice(0, 12)) console.log(`  ${(r.tier || '-').padEnd(4)} ${r.sinner} · ${r.title}`)

if (!rows.length) throw new Error('수집 0건 — 사이트 구조가 바뀌었을 수 있음')

// ── 3. DB 대조
const g = q(`SELECT id FROM "Game" WHERE slug = 'limbus';`)
if (!g.length) throw new Error('limbus Game 없음')
const gameId = g[0][0]

const existing = q(`SELECT "nameKo", coalesce("nameEn",''), coalesce(tier,''), coalesce("imageUrl",'') FROM "Character" WHERE "gameId" = ${esc(gameId)} AND kind = 'character' ORDER BY "sortOrder"`)
console.log(`\nDB 림버스 인격 ${existing.length}명`)
console.log('  컬럼 규칙 확인 (nameKo | nameEn | tier | 이미지있음):')
for (const r of existing.slice(0, 6)) {
  console.log(`   · ${r[0]} | ${r[1]} | ${r[2]} | ${r[3] ? 'Y' : 'N'}`)
}
const tiers = [...new Set(existing.map(r => r[2]))]
console.log(`  DB tier 값 ${tiers.length}종: ${tiers.slice(0, 20).join(', ')}`)
console.log(`  이미지 있는 인격 ${existing.filter(r => r[3]).length}명`)

// 우리 DB 는 nameKo = 인격명 하나로 식별된다. 인격명으로 대조한다.
const haveTitle = new Set(existing.map(r => norm(r[0])))
const news = rows.filter(r => !haveTitle.has(norm(r.title)))
console.log(`\n신규 후보 ${news.length}건 / 이미 있음 ${rows.length - news.length}건`)
for (const r of news.slice(0, 60)) console.log(`  + [${r.tier}] ${r.sinner} · ${r.title}`)

if (MODE === 'probe') { console.log('\n>>> probe 종료 (DB 미변경)'); process.exit(0) }

if (!news.length) { console.log('추가할 인격 없음'); process.exit(0) }
if (news.length > rows.length * 0.5) {
  throw new Error(`신규가 ${news.length}/${rows.length} — 이름 대조가 깨진 듯. 중단`)
}

// ── 4. INSERT (신규만)
// 기존 DB 규칙을 그대로 따른다: nameKo = 인격명, nameEn = 수감자, tier = 수감자(등록 화면 그룹)
// 이미지는 단빵숲 핫링크를 쓰지 않고 비워둔다 (기존 인격들은 우리 스토리지에 있음)
const maxOrder = Number(q(`SELECT coalesce(max("sortOrder"),0) FROM "Character" WHERE "gameId" = ${esc(gameId)}`)[0][0] || 0)
const sql = news.map((r, i) => `
INSERT INTO "Character" (id, "gameId", "nameKo", "nameEn", tier, "isLimited", "basePrice",
                         "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt", metadata, kind)
VALUES (gen_random_uuid()::text, ${esc(gameId)}, ${esc(r.title)}, ${esc(r.sinner)},
        ${esc(r.sinner)}, false, 0, NULL, true, ${maxOrder + 1 + i}, now(), now(),
        ${esc(JSON.stringify({ source: 'baslimbus', srcId: r.srcId, sinner: r.sinner, grade: r.tier, detail: r.detail }))}::jsonb,
        'character');`).join('\n')

execSync(`psql "${DB}" -v ON_ERROR_STOP=1 -q -f -`, { input: sql, stdio: ['pipe', 'inherit', 'inherit'] })
console.log(`\n→ ${news.length}건 INSERT 완료 (이미지는 비어있음 — 별도로 채울 것)`)
