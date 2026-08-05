// 우마무스메 서포트 카드 임포터 — 러너 전용.
//
//   목록      : umapyoi.net/api/v1/support (547장). id 앞자리 = 레어도 (3=SSR/2=SR/1=R, 표본 16/16 검증)
//   한국어    : gametora.com/ko/umamusume/supports/{slug} 한 페이지에서 전부 나온다
//                 og:title    "스페셜 위크 (SSR) 서포트 카드 - …"  → 캐릭터명 + 등급
//                 description "스페셜 위크 (SSR, 근성) 서포트 …"   → 타입
//                 <div>[일본 최고의 무대를]</div>                   → 카드 고유명
//   이미지    : gametora.com/images/umamusume/supports/tex_support_card_{id}.png
//
// 캐릭터(육성 우마무스메)와 서포트 카드는 같은 Character 테이블에 넣되 `kind` 로 구분한다.
//   kind='character' → 도감·상세 페이지 대상        tier='우마무스메'
//   kind='support'   → 판매 등록 선택지에만 노출     tier='SSR 서포트' / 'SR 서포트' / 'R 서포트'
//
// MODE=probe  : 앞 12장만 수집해 결과만 출력 (DB 미변경)   [uma-sup-probe]
// MODE=import : 전량 수집 후 신규만 INSERT                  [uma-sup-import]

import { execSync, execFileSync } from 'node:child_process'

const MODE = process.env.MODE === 'import' ? 'import' : 'probe'
const DB = process.env.SUPABASE_DB_URL
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

const IMG = id => `https://gametora.com/images/umamusume/supports/tex_support_card_${id}.png`
const RARITY = { 3: 'SSR', 2: 'SR', 1: 'R' }
const TIER = { SSR: 'SSR 서포트', SR: 'SR 서포트', R: 'R 서포트' }

const sleep = ms => new Promise(r => setTimeout(r, ms))
const esc = v => (v === null || v === undefined) ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`

function q(sql) {
  // 셸을 거치지 않는다 (execSync 는 /bin/sh=dash 라 $'\\t' 를 리터럴로 넘겨 컬럼 분리가 깨졌었다)
  const out = execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-At', '-F', '\t', '-c', sql],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return out.trim() ? out.trim().split('\n').map(l => l.split('\t')) : []
}

// GameTora 한국어 페이지 → { charKo, rarity, typeKo, cardKo }
function parseCard(html) {
  const og = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || ''
  const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1] || ''
  // "스페셜 위크 (SSR) 서포트 카드 - UmaMusume | GameTora"
  const m1 = og.match(/^(.+?)\s*\((SSR|SR|R)\)/)
  // "스페셜 위크 (SSR, 근성) 서포트 카드의 서포트 효과"
  const m2 = desc.match(/\((?:SSR|SR|R),\s*([^)]+)\)/)
  // 카드 고유명: 대괄호로 감싼 짧은 div (본문 첫 번째)
  const m3 = html.match(/<div[^>]*>\s*(\[[^[\]<>]{1,40}\])\s*<\/div>/)
  return {
    charKo: m1?.[1]?.trim() || null,
    rarity: m1?.[2] || null,
    typeKo: m2?.[1]?.trim() || null,
    cardKo: m3?.[1]?.trim() || null,
  }
}

async function fetchCard(slug) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(`https://gametora.com/ko/umamusume/supports/${slug}`, { headers: H })
      if (r.ok) return parseCard(await r.text())
      if (r.status === 404) return null
    } catch { /* 재시도 */ }
    await sleep(500 * (a + 1))
  }
  return null
}

console.log(`MODE=${MODE}\n`)

const listRes = await fetch('https://umapyoi.net/api/v1/support', { headers: H })
if (!listRes.ok) throw new Error(`목록 ${listRes.status}`)
const list = await listRes.json()
console.log(`umapyoi 서포트 카드 ${list.length}장`)
if (list.length < 100) throw new Error('목록이 비정상적으로 적음 — 소스 변경 의심')

let gameId = null, bySlug = {}, have = new Set()
if (MODE === 'import') {
  const g = q(`SELECT id FROM "Game" WHERE slug = 'umamusume';`)
  if (!g.length) throw new Error('umamusume Game 없음')
  gameId = g[0][0]
  const charRows = q(`SELECT coalesce(slug,''), "nameKo" FROM "Character"
                      WHERE "gameId" = ${esc(gameId)} AND kind = 'character';`)
  bySlug = Object.fromEntries(charRows.filter(r => r[0]).map(r => [r[0], r[1]]))
  have = new Set(q(`SELECT coalesce(slug,'') FROM "Character"
                    WHERE "gameId" = ${esc(gameId)} AND kind = 'support';`).map(r => r[0]))
  console.log(`DB: 캐릭터 ${charRows.length}명 / 이미 등록된 서포트 카드 ${have.size}장`)
}

const targets = MODE === 'probe' ? list.slice(0, 12) : list
const rows = []
const fail = { page: [], name: [], rarity: [] }

for (const [i, s] of targets.entries()) {
  const slug = `sup-${s.gametora}`
  if (have.has(slug)) continue

  const derived = RARITY[Math.floor(s.id / 10000)]
  const c = await fetchCard(s.gametora)
  if (!c) { fail.page.push(s.gametora); await sleep(150); continue }

  const rarity = c.rarity || derived
  if (!rarity) { fail.rarity.push(s.gametora); await sleep(150); continue }
  if (c.rarity && derived && c.rarity !== derived) {
    console.log(`  ⚠ 등급 불일치 ${s.gametora}: 페이지=${c.rarity} id유도=${derived} → 페이지 값 사용`)
  }

  // 이름: "스페셜 위크 [일본 최고의 무대를]" — 캐릭터명은 우리 DB 표기를 우선
  const charSlug = String(s.gametora).replace(/^\d+-/, '')
  const charKo = bySlug[charSlug] || c.charKo
  if (!charKo || !c.cardKo) fail.name.push(s.gametora)
  const nameKo = charKo && c.cardKo ? `${charKo} ${c.cardKo}`
    : charKo ? `${charKo} (${rarity})`
    : `${c.cardKo || s.title_en || charSlug} (${rarity})`

  rows.push({
    slug,
    nameKo: nameKo.slice(0, 140),
    nameEn: `${s.title_en || ''} ${charSlug}`.trim(),
    tier: TIER[rarity],
    rarity,
    weaponType: c.typeKo,          // 스피드/스태미나/파워/근성/지능/친구
    imageUrl: IMG(s.id),
    metadata: { kind: 'support', supportId: s.id, gametora: s.gametora, charSlug, titleEn: s.title_en || null },
  })
  if (i % 50 === 0 && i) console.log(`  ...${i}/${targets.length}`)
  await sleep(180)
}

console.log(`\n수집 ${rows.length}장`)
console.log(`  페이지 없음 ${fail.page.length}${fail.page.length ? ' — ' + fail.page.slice(0, 8).join(', ') : ''}`)
console.log(`  이름 일부 실패 ${fail.name.length}${fail.name.length ? ' — ' + fail.name.slice(0, 8).join(', ') : ''}`)
const byTier = {}
rows.forEach(r => { byTier[r.tier] = (byTier[r.tier] || 0) + 1 })
console.log(`  등급별: ${Object.entries(byTier).map(([k, v]) => `${k} ${v}`).join(' / ')}`)
console.log('\n샘플:')
for (const r of rows.slice(0, 12)) console.log(`  ${r.tier.padEnd(10)} ${(r.weaponType || '-').padEnd(6)} ${r.nameKo}`)

if (MODE === 'probe') { console.log('\n>>> probe 종료 (DB 미변경)'); process.exit(0) }

if (!rows.length) { console.log('추가할 카드 없음'); process.exit(0) }
if (fail.name.length > rows.length * 0.3) throw new Error('한국어 이름 실패가 30% 초과 — 페이지 구조 변경 의심, 중단')

const maxOrder = Number(q(`SELECT coalesce(max("sortOrder"),0) FROM "Character" WHERE "gameId" = ${esc(gameId)};`)[0][0] || 0)
const sql = rows.map((r, i) => `
INSERT INTO "Character" (id, "gameId", "nameKo", "nameEn", tier, rarity, "weaponType", "isLimited",
                         "basePrice", "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt",
                         slug, metadata, kind)
VALUES (gen_random_uuid()::text, ${esc(gameId)}, ${esc(r.nameKo)}, ${esc(r.nameEn)}, ${esc(r.tier)},
        ${esc(r.rarity)}, ${esc(r.weaponType)}, false, 0, ${esc(r.imageUrl)}, true, ${maxOrder + 1000 + i},
        now(), now(), ${esc(r.slug)}, ${esc(JSON.stringify(r.metadata))}::jsonb, 'support');`).join('\n')

execSync(`psql "${DB}" -v ON_ERROR_STOP=1 -q -f -`, { input: sql, stdio: ['pipe', 'inherit', 'inherit'] })
console.log(`\n→ ${rows.length}장 INSERT 완료`)
