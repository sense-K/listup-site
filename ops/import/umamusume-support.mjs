// 우마무스메 서포트 카드 임포터 — 러너 전용.
//   목록·등급: umapyoi.net/api/v1/support  (id 앞자리 = 레어도, 검증 후 사용)
//   한국어 카드명: gametora.com/ko/umamusume/supports/{slug}  (SSR 페이지에 한국어 SSR)
//   이미지: gametora.com/images/umamusume/supports/tex_support_card_{id}.png
//
// 캐릭터(우마무스메)와 서포트 카드는 같은 Character 테이블에 넣되 `kind` 로 구분한다.
//   kind='character' → 도감·상세 페이지 대상 (기존 136명)
//   kind='support'   → 판매 등록 선택지에만 노출, 도감에는 안 나옴
//
// MODE=probe  : 구조 확인만 (DB 미변경)   [uma-sup-probe]
// MODE=import : 실제 INSERT               [uma-sup-import]

import { execSync } from 'node:child_process'

const MODE = process.env.MODE === 'import' ? 'import' : 'probe'
const DB = process.env.SUPABASE_DB_URL
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

const IMG = id => `https://gametora.com/images/umamusume/supports/tex_support_card_${id}.png`
const RARITY = { 3: 'SSR', 2: 'SR', 1: 'R' }
const TIER = { SSR: 'SSR 서포트', SR: 'SR 서포트', R: 'R 서포트' }
const TYPE_KO = {
  Speed: '스피드', Stamina: '스태미나', Power: '파워', Guts: '근성',
  Wisdom: '지능', Intelligence: '지능', Friend: '친구', Group: '그룹',
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const esc = v => v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`

function q(sql) {
  const out = execSync(`psql "${DB}" -v ON_ERROR_STOP=1 -At -F $'\\t' -c ${JSON.stringify(sql)}`,
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return out.trim() ? out.trim().split('\n').map(l => l.split('\t')) : []
}

async function getText(url) {
  const r = await fetch(url, { headers: H, redirect: 'follow' })
  return { ok: r.ok, status: r.status, text: r.ok ? await r.text() : '' }
}

// GameTora 한국어 카드 페이지에서 카드명을 뽑는다.
// 페이지 구조: <title>{카드명} {캐릭터명} - 서포트 카드 | GameTora</title> 형태를 우선 시도하고,
// 실패하면 h1/h2 계열에서 한국어 대괄호 제목을 찾는다.
function parseKoTitle(html) {
  const cands = []
  const t = html.match(/<title>([^<]+)<\/title>/)
  if (t) cands.push(['title', t[1]])
  for (const m of html.matchAll(/<h[12][^>]*>([\s\S]{1,120}?)<\/h[12]>/g)) {
    cands.push(['h', m[1].replace(/<[^>]+>/g, '').trim()])
  }
  const og = html.match(/<meta property="og:title" content="([^"]+)"/)
  if (og) cands.push(['og', og[1]])
  return cands
}

console.log(`MODE=${MODE}\n`)

// ── 1. 목록
const listRes = await fetch('https://umapyoi.net/api/v1/support', { headers: H })
if (!listRes.ok) throw new Error(`목록 ${listRes.status}`)
const list = await listRes.json()
console.log(`umapyoi 서포트 카드 ${list.length}장`)

// ── 2. id 앞자리 = 레어도 규칙 검증 (표본 16장)
const step = Math.max(1, Math.floor(list.length / 16))
const sample = list.filter((_, i) => i % step === 0).slice(0, 16)
let agree = 0
const details = []
for (const s of sample) {
  const r = await fetch(`https://umapyoi.net/api/v1/support/${s.id}`, { headers: H })
  if (!r.ok) continue
  const d = await r.json()
  details.push(d)
  const derived = RARITY[Math.floor(d.id / 10000)]
  if (derived === d.rarity_string) agree++
  else console.log(`  ✗ id=${d.id} 유도=${derived} 실제=${d.rarity_string}`)
  await sleep(120)
}
console.log(`레어도 규칙(id 앞자리) 일치 ${agree}/${details.length}`)
const typeSet = [...new Set(details.map(d => d.type))]
console.log(`타입 표본: ${typeSet.join(', ')}`)
const unmapped = typeSet.filter(t => !TYPE_KO[t])
if (unmapped.length) console.log(`  ⚠ 매핑 없는 타입: ${unmapped.join(', ')}`)

// ── 3. GameTora 한국어 이름 추출 방법 확인
console.log('\n한국어 이름 추출 시험:')
for (const s of sample.slice(0, 3)) {
  const { ok, status, text } = await getText(`https://gametora.com/ko/umamusume/supports/${s.gametora}`)
  console.log(`  [${status}] ${s.gametora}`)
  if (!ok) continue
  for (const [where, v] of parseKoTitle(text).slice(0, 4)) console.log(`      ${where}: ${v}`)
  await sleep(200)
}

// ── 4. 이미지 표본
let imgOk = 0
for (const s of sample.slice(0, 6)) {
  const r = await fetch(IMG(s.id), { headers: H, method: 'HEAD' }).catch(() => null)
  if (r?.ok) imgOk++
  else console.log(`  이미지 실패 ${s.id} ${r?.status}`)
}
console.log(`\n이미지 표본 ${imgOk}/6 정상`)

if (MODE === 'probe') {
  console.log('\n>>> probe 종료 (DB 미변경)')
  process.exit(0)
}

// ── 5. 실제 수집 + INSERT
if (agree < details.length) throw new Error('레어도 규칙이 깨짐 — 수동 확인 필요')
if (imgOk === 0) throw new Error('이미지 전멸 — URL 규칙 변경 의심')

const g = q(`SELECT id FROM "Game" WHERE slug = 'umamusume';`)
if (!g.length) throw new Error('umamusume Game 없음')
const gameId = g[0][0]

// 우리 DB 의 우마무스메 캐릭터 (slug → nameKo) — 카드명 앞에 붙일 캐릭터 한국어명
const charRows = q(`SELECT coalesce(slug,''), "nameKo" FROM "Character"
                    WHERE "gameId" = ${esc(gameId)} AND kind = 'character';`)
const bySlug = Object.fromEntries(charRows.filter(r => r[0]).map(r => [r[0], r[1]]))
console.log(`\nDB 우마무스메 캐릭터 ${charRows.length}명`)

const existing = q(`SELECT coalesce(slug,'') FROM "Character"
                    WHERE "gameId" = ${esc(gameId)} AND kind = 'support';`)
const have = new Set(existing.map(r => r[0]))
console.log(`이미 등록된 서포트 카드 ${have.size}장`)

const rows = []
let noKo = 0, noChar = 0
for (const [i, s] of list.entries()) {
  const slug = `sup-${s.gametora}`
  if (have.has(slug)) continue
  const rarity = RARITY[Math.floor(s.id / 10000)]
  if (!rarity) continue

  // gametora 슬러그: "30028-kitasan-black" → 캐릭터 슬러그 "kitasan-black"
  const charSlug = String(s.gametora).replace(/^\d+-/, '')
  const charKo = bySlug[charSlug]
  if (!charKo) noChar++

  const { ok, text } = await getText(`https://gametora.com/ko/umamusume/supports/${s.gametora}`)
  let koTitle = null
  if (ok) {
    const t = text.match(/<title>([^<]+)<\/title>/)
    if (t) {
      // "{카드명} {캐릭터명} - 서포트 카드 | GameTora" 형태에서 앞부분만
      const head = t[1].split(/\s+[-|]\s+/)[0].trim()
      if (/[가-힣]/.test(head)) koTitle = head
    }
  }
  if (!koTitle) noKo++

  const base = charKo || s.gametora.replace(/^\d+-/, '')
  const nameKo = koTitle && charKo && !koTitle.includes(charKo)
    ? `${charKo} [${koTitle.replace(new RegExp(`\\s*${charKo}\\s*`), '').trim()}]`
    : (koTitle || `${base} ${rarity}`)

  rows.push({
    slug, nameKo: nameKo.slice(0, 120),
    nameEn: `${s.title_en || ''} ${charSlug}`.trim(),
    tier: TIER[rarity], rarity,
    weaponType: null,   // 타입은 상세 fetch 를 안 하므로 비움 (추후 필요 시 보강)
    imageUrl: IMG(s.id),
    metadata: { kind: 'support', supportId: s.id, gametora: s.gametora, charSlug },
  })
  if (i % 50 === 0) console.log(`  ...${i}/${list.length}`)
  await sleep(180)
}

console.log(`\n신규 ${rows.length}장 (한국어명 실패 ${noKo}, 캐릭터 매칭 실패 ${noChar})`)
for (const r of rows.slice(0, 12)) console.log(`  ${r.tier} · ${r.nameKo}`)
if (!rows.length) { console.log('추가할 카드 없음'); process.exit(0) }

const maxOrder = Number(q(`SELECT coalesce(max("sortOrder"),0) FROM "Character" WHERE "gameId" = ${esc(gameId)};`)[0][0] || 0)
const sql = rows.map((r, i) => `
INSERT INTO "Character" (id, "gameId", "nameKo", "nameEn", tier, rarity, "isLimited", "basePrice",
                         "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt", slug, metadata, kind)
VALUES (gen_random_uuid()::text, ${esc(gameId)}, ${esc(r.nameKo)}, ${esc(r.nameEn)}, ${esc(r.tier)},
        ${esc(r.rarity)}, false, 0, ${esc(r.imageUrl)}, true, ${maxOrder + 1000 + i}, now(), now(),
        ${esc(r.slug)}, ${esc(JSON.stringify(r.metadata))}::jsonb, 'support');`).join('\n')

execSync(`psql "${DB}" -v ON_ERROR_STOP=1 -q -f -`, { input: sql, stdio: ['pipe', 'inherit', 'inherit'] })
console.log(`\n→ ${rows.length}장 INSERT 완료`)
