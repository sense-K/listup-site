// 니케 — 저해상도 캐릭터 이미지를 prydwen 원본으로 교체
//
// 문제: 일부 캐릭터의 imageUrl 이 Nikke-db 스프라이트(128x128)라 도감/매물 카드에서 뭉개진다.
// (랜딩 상점 미리보기에 크라운을 넣으려다 발견)
//
// 하는 일
//   1. DB 니케 캐릭터 전원의 imageUrl 실제 픽셀 크기를 잰다 (PNG/WebP/JPEG 헤더 파싱)
//   2. 기준 미달(가로 < MIN_W)인 캐릭터를 prydwen 에서 다시 찾는다
//   3. fullImage → cardImage 순으로 후보를 잡고, 실제로 더 큰 이미지일 때만 교체
//
// 추출 경로는 admin/index.html 의 syncNikkePrydwen() 과 동일하게 맞췄다.
//   목록:   page-data/nikke/characters/page-data.json → result.data.allCharacters.nodes
//   개별:   page-data/nikke/characters/{slug}/page-data.json → result.data.currentUnit.nodes[0]
//   이미지: node[field].localFile.childImageSharp.gatsbyImageData.images.fallback.src
//
// MODE=probe  → 측정·후보만 출력, DB 미변경
// MODE=import → UPDATE 실행

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const MODE = process.env.MODE || 'probe'
const DB = process.env.SUPABASE_DB_URL
const MIN_W = 250          // 카드 히어로가 218px 이므로 이보다 작으면 확대되어 뭉개진다
// prydwen 은 러너의 직접 요청에 403(Cloudflare 봇 차단)을 준다.
// 우리 사이트에 이미 있는 CF Pages Function 프록시를 경유한다 (admin 도 이 경로를 쓴다).
const PROXY = 'https://resetlist.kr/api'
const PRYDWEN = 'https://www.prydwen.gg'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const log = (...a) => console.log(...a)
const out = []
const say = s => { out.push(s); log(s) }

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

// ---------------------------------------------------------------- 이미지 크기 측정
// 헤더만 있으면 되므로 앞부분만 받는다 (Range 무시하는 서버면 전체가 오지만 파싱은 동일)
function dimsOf(buf) {
  const b = Buffer.from(buf)
  // PNG
  if (b.length > 24 && b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), fmt: 'png' }
  }
  // WebP (VP8 / VP8L / VP8X)
  if (b.length > 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const chunk = b.toString('latin1', 12, 16)
    if (chunk === 'VP8X') return { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1, fmt: 'webp' }
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21)
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1, fmt: 'webp' }
    }
    if (chunk === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, fmt: 'webp' }
  }
  // JPEG — SOF 마커까지 스캔
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue }
      const m = b[i + 1]
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), fmt: 'jpeg' }
      }
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  return null
}

async function measure(url) {
  if (!url) return { err: 'URL 없음' }
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Range: 'bytes=0-65535', Referer: 'https://resetlist.kr/' } })
    if (!r.ok && r.status !== 206) return { err: `HTTP ${r.status}` }
    const d = dimsOf(await r.arrayBuffer())
    return d ?? { err: '크기 파싱 실패' }
  } catch (e) { return { err: e.message.slice(0, 50) } }
}

// 동시 N개
async function pool(items, n, fn) {
  const res = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; res[k] = await fn(items[k], k) }
  }))
  return res
}

// ---------------------------------------------------------------- DB
function q(sql) {
  return execFileSync('psql', [DB, '-t', '-A', '-F', '\t', '-c', sql], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(l => l.split('\t'))
}

// ---------------------------------------------------------------- main
if (!DB) { console.error('::error::SUPABASE_DB_URL 없음'); process.exit(1) }

log('=== 1) DB 니케 캐릭터 ===')
const rows = q(`SELECT c.id, c."nameKo", coalesce(c.slug,''), coalesce(c."imageUrl",'')
  FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
  WHERE g.slug='nikke' AND c."isActive" ORDER BY c."sortOrder";`)
  .map(([id, nameKo, slug, imageUrl]) => ({ id, nameKo, slug, imageUrl }))
log(`${rows.length}명`)

log('\n=== 2) 현재 이미지 크기 측정 ===')
const sized = await pool(rows, 8, async r => ({ ...r, dim: await measure(r.imageUrl) }))
const bad = sized.filter(r => !r.dim || r.dim.err || r.dim.w < MIN_W)
const good = sized.filter(r => r.dim && !r.dim.err && r.dim.w >= MIN_W)
say(`정상(가로 ${MIN_W}px 이상): ${good.length}명 / 문제: ${bad.length}명`)
const byDomain = {}
sized.forEach(r => {
  const d = (r.imageUrl.split('//')[1] || '').split('/')[0] || '(없음)'
  byDomain[d] = byDomain[d] || { n: 0, bad: 0 }
  byDomain[d].n++
  if (!r.dim || r.dim.err || r.dim.w < MIN_W) byDomain[d].bad++
})
say('도메인별: ' + Object.entries(byDomain).map(([d, v]) => `${d} ${v.n}건(문제 ${v.bad})`).join(' / '))
bad.forEach(r => say(`  ✗ ${r.nameKo} [${r.slug}] ${r.dim?.err ?? `${r.dim.w}x${r.dim.h}`}`))

if (!bad.length) { say('\n>>> 고칠 것 없음'); process.exit(0) }

log('\n=== 3) prydwen 재조회 ===')
const list = await getJson(`${PROXY}/prydwen-nikke`)
const nodes = list?.result?.data?.allCharacters?.nodes ?? []
log(`prydwen 목록 ${nodes.length}명`)
const bySlug = new Map(nodes.map(n => [n.slug, n]))
const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const byName = new Map(nodes.map(n => [norm(n.name), n]))

const abs = s => s ? (s.startsWith('http') ? s : PRYDWEN + s) : null
const pick = (node, f) => abs(node?.[f]?.localFile?.childImageSharp?.gatsbyImageData?.images?.fallback?.src ?? null)

const plan = []
for (const r of bad) {
  const hit = bySlug.get(r.slug) || byName.get(norm(r.nameKo))
  if (!hit) { say(`  – ${r.nameKo}: prydwen 미수록`); continue }
  let detail = null
  try { detail = await getJson(`${PROXY}/prydwen-nikke-char/${hit.slug}`) }
  catch (e) { say(`  – ${r.nameKo}: 개별 조회 실패 ${e.message.slice(0, 40)}`); continue }
  const node = detail?.result?.data?.currentUnit?.nodes?.[0]
  if (!node) { say(`  – ${r.nameKo}: 상세 노드 없음`); continue }

  let chosen = null
  for (const f of ['fullImage', 'cardImage']) {
    const u = pick(node, f)
    if (!u) continue
    const d = await measure(u)
    if (d.err) { say(`  – ${r.nameKo}: ${f} ${d.err}`); continue }
    if (d.w < MIN_W) { say(`  – ${r.nameKo}: ${f} 도 작음 ${d.w}x${d.h}`); continue }
    // 지금 것보다 확실히 커야 교체한다
    const nowW = r.dim && !r.dim.err ? r.dim.w : 0
    if (d.w <= nowW) { say(`  – ${r.nameKo}: ${f} 가 더 크지 않음 ${d.w} ≤ ${nowW}`); continue }
    chosen = { url: u, field: f, ...d }
    break
  }
  if (!chosen) continue
  say(`  ✓ ${r.nameKo}: ${r.dim?.err ?? r.dim.w + 'px'} → ${chosen.w}x${chosen.h} (${chosen.field})`)
  plan.push({ ...r, newUrl: chosen.url })
}

say(`\n=== 4) 교체 대상 ${plan.length}/${bad.length}명 ===`)

if (MODE !== 'import') {
  log('\n=== 요약 재출력 ===')
  out.forEach(l => log(l))
  log('>>> probe 모드 — DB 변경 없이 종료')
  process.exit(0)
}
if (!plan.length) { log('\n>>> 교체할 것 없음'); process.exit(0) }

const esc = s => `'${String(s).replace(/'/g, "''")}'`
const sql = ['\\set ON_ERROR_STOP on', 'BEGIN;']
for (const p of plan) {
  sql.push(`UPDATE "Character" SET "imageUrl" = ${esc(p.newUrl)}, "updatedAt" = now() WHERE id = ${esc(p.id)};`)
}
sql.push('COMMIT;')
sql.push(`\\echo '===== 결과 ====='`)
sql.push(`SELECT split_part(split_part(c."imageUrl",'//',2),'/',1) AS "도메인", count(*)
FROM "Character" c JOIN "Game" g ON g.id=c."gameId"
WHERE g.slug='nikke' AND c."isActive" GROUP BY 1 ORDER BY 2 DESC;`)

writeFileSync('/tmp/nikke-img.sql', sql.join('\n'))
log(`\n=== 5) SQL 실행 (${plan.length}명) ===`)
execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-f', '/tmp/nikke-img.sql'], { stdio: 'inherit' })

log('\n=== 6) 요약 재출력 ===')
out.forEach(l => log(l))
log('>>> 완료')
