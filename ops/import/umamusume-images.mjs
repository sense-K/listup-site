// 우마무스메 — imageUrl 이 비어있는 캐릭터 이미지 채우기
//
// 최초 등록 때는 umapyoi.net 이미지만 썼는데, 카카오 eng ↔ umapyoi name_en 매칭에
// 실패한 9명이 imageUrl NULL로 남았다. 카카오 원본에도 icon/header 필드가 있으므로
//   1순위: umapyoi (느슨한 매칭 재시도)
//   2순위: 카카오 자체 이미지
// 순으로 채운다. 후보 URL은 실제로 200이 뜨는지, 리퍼러 차단이 없는지 확인한 뒤에만 쓴다.
//
// MODE=probe  → 후보만 출력, DB 미변경
// MODE=import → UPDATE 실행

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const MODE = process.env.MODE || 'probe'
const DB = process.env.SUPABASE_DB_URL

const KAKAO_HOME = 'https://umamusume.kakaogames.com/'
const UMAPYOI_LIST = 'https://umapyoi.net/api/v1/character'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const log = (...a) => console.log(...a)

async function get(url, asText = true) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' } })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
  return asText ? await r.text() : await r.json()
}

// 배포본에서 <img>로 불러올 것이므로 리퍼러를 resetlist.kr로 위장해 핫링크 차단을 확인한다
async function probeImage(url) {
  if (!url) return { ok: false, why: 'URL 없음' }
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: 'https://resetlist.kr/', Accept: 'image/*,*/*' },
    })
    const ct = r.headers.get('content-type') || ''
    const buf = r.ok ? await r.arrayBuffer() : null
    if (!r.ok) return { ok: false, why: `HTTP ${r.status}` }
    if (!/^image\//.test(ct)) return { ok: false, why: `content-type ${ct}` }
    if (buf.byteLength < 1000) return { ok: false, why: `너무 작음 ${buf.byteLength}B` }
    return { ok: true, ct, size: buf.byteLength }
  } catch (e) { return { ok: false, why: e.message.slice(0, 60) } }
}

// ------------------------------------------------------------ 카카오 원본
function extractCharacters(js) {
  const names = [...js.matchAll(/(?:^|\n)\s*(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=/g)].map(m => m[1])
  const candidates = []
  for (const name of new Set(names)) {
    const at = js.search(new RegExp(`(?:const|var|let)\\s+${name}\\s*=\\s*`))
    if (at < 0) continue
    let i = js.indexOf('=', at) + 1
    while (i < js.length && /\s/.test(js[i])) i++
    const open = js[i]
    if (open !== '[' && open !== '{') continue
    const close = open === '[' ? ']' : '}'
    let depth = 0, end = -1, inStr = null
    for (let j = i; j < js.length; j++) {
      const ch = js[j], prev = js[j - 1]
      if (inStr) { if (ch === inStr && prev !== '\\') inStr = null; continue }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue }
      if (ch === open) depth++
      else if (ch === close) { depth--; if (depth === 0) { end = j; break } }
    }
    if (end < 0) continue
    try {
      const val = Function(`"use strict"; return (${js.slice(i, end + 1)});`)()
      const arr = Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val).flat() : null)
      if (Array.isArray(arr) && arr.length) {
        const objs = arr.filter(o => o && typeof o === 'object')
        if (objs.length) candidates.push({ name, arr: objs })
      }
    } catch { /* 평가 실패한 선언은 건너뜀 */ }
  }
  candidates.sort((a, b) => b.arr.length - a.arr.length)
  const best = candidates.find(c => c.arr.some(o => o.name && (o.eng || o.cv || o.icon))) || candidates[0]
  return best ? best.arr.filter(o => o && (o.name || o.eng)) : []
}

async function loadKakao() {
  log('\n=== 1) 카카오 원본 ===')
  const html = await get(KAKAO_HOME)
  const m = [...html.matchAll(/["']([^"']*data\.v[^"']*\.js[^"']*)["']/g)].map(x => x[1])
  if (!m.length) throw new Error('data.v*.js 경로 추출 실패')
  const url = m[0].startsWith('http') ? m[0] : new URL(m[0], KAKAO_HOME).href
  log(`data.js: ${url}`)
  const chars = extractCharacters(await get(url))
  log(`캐릭터 ${chars.length}명`)
  const withImg = chars.filter(c => c.icon || c.header)
  log(`icon/header 있는 캐릭터: ${withImg.length}명`)
  if (withImg[0]) {
    log(`  icon   샘플: ${JSON.stringify(withImg[0].icon)}`)
    log(`  header 샘플: ${JSON.stringify(withImg[0].header)}`)
  }
  return chars
}

// 카카오 icon/header 값이 상대경로일 수 있으므로 절대 URL로
function abs(v) {
  if (!v) return null
  const s = String(v)
  if (/^https?:\/\//.test(s)) return s
  return new URL(s.replace(/^\.?\//, ''), KAKAO_HOME).href
}

// ------------------------------------------------------------ umapyoi
async function loadUmapyoi() {
  log('\n=== 2) umapyoi ===')
  const idx = await get(UMAPYOI_LIST, false)
  if (!Array.isArray(idx) || !idx.length) { log('!! 인덱스 비어있음'); return [] }
  const out = []
  const queue = [...idx]
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const it = queue.shift()
      try { out.push(await get(`https://umapyoi.net/api/v1/character/${it.game_id}`, false)) } catch { /* 개별 실패 무시 */ }
    }
  }))
  log(`상세 수집 ${out.length}/${idx.length}`)
  return out
}

// ------------------------------------------------------------ DB에서 빈 캐릭터
function missingFromDb() {
  const out = execFileSync('psql', [DB, '-t', '-A', '-F', '\t', '-c',
    `SELECT c.id, c."nameKo", coalesce(c."nameEn",'')
     FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
     WHERE g.slug = 'umamusume' AND c."imageUrl" IS NULL
     ORDER BY c."sortOrder";`], { encoding: 'utf8' })
  return out.trim().split('\n').filter(Boolean).map(l => {
    const [id, nameKo, nameEn] = l.split('\t')
    return { id, nameKo, nameEn }
  })
}

// ------------------------------------------------------------ main
if (!DB) { console.error('::error::SUPABASE_DB_URL 없음'); process.exit(1) }

const kakao = await loadKakao()
const umapyoi = await loadUmapyoi()
const missing = missingFromDb()
log(`\n=== 3) DB에 이미지 없는 캐릭터 ${missing.length}명 ===`)
log(missing.map(m => `${m.nameKo} (${m.nameEn})`).join(', '))

const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
// t↔ch, si↔shi 등 로마자 표기 흔들림 흡수
const loose = s => norm(s).replace(/ch/g, 't').replace(/sh/g, 's').replace(/ou/g, 'o').replace(/uu/g, 'u')

const umaByKey = new Map()
for (const u of umapyoi) {
  for (const k of [u.name_en, u.name, u.name_jp, u.name_ko]) {
    if (!k) continue
    if (!umaByKey.has(norm(k))) umaByKey.set(norm(k), u)
    if (!umaByKey.has('~' + loose(k))) umaByKey.set('~' + loose(k), u)
  }
}
const kakaoByKey = new Map()
for (const c of kakao) {
  for (const k of [c.name, c.eng]) if (k) kakaoByKey.set(norm(k), c)
}

log('\n=== 4) 후보 탐색 ===')
const plan = []
for (const m of missing) {
  const k = kakaoByKey.get(norm(m.nameKo)) || kakaoByKey.get(norm(m.nameEn))
  const u = umaByKey.get(norm(m.nameEn)) || umaByKey.get(norm(m.nameKo))
        || umaByKey.get('~' + loose(m.nameEn)) || umaByKey.get('~' + loose(m.nameKo))

  // 카드용(정사각 얼굴) / 상세 히어로용(가로 배너) 후보를 우선순위대로
  const thumbCands = [
    ['umapyoi.thumb_img', u?.thumb_img],
    ['umapyoi.sns_icon', u?.sns_icon],
    ['kakao.icon', abs(k?.icon)],
    ['kakao.header', abs(k?.header)],
  ].filter(([, v]) => v)
  const heroCands = [
    ['umapyoi.sns_header', u?.sns_header],
    ['umapyoi.detail_img_pc', u?.detail_img_pc],
    ['kakao.header', abs(k?.header)],
  ].filter(([, v]) => v)

  log(`\n--- ${m.nameKo} (${m.nameEn})`)
  log(`    카카오 매칭: ${k ? 'O' : 'X'} / umapyoi 매칭: ${u ? `O (${u.name_en})` : 'X'}`)
  if (k && !thumbCands.length) log(`    카카오 필드: ${JSON.stringify(Object.keys(k))}`)

  let thumb = null, hero = null
  for (const [src, url] of thumbCands) {
    const p = await probeImage(url)
    log(`    thumb ${p.ok ? 'OK  ' : 'FAIL'} ${src} ${p.ok ? `${p.ct} ${p.size}B` : p.why}`)
    if (p.ok) { thumb = url; break }
  }
  for (const [src, url] of heroCands) {
    if (url === thumb) continue
    const p = await probeImage(url)
    log(`    hero  ${p.ok ? 'OK  ' : 'FAIL'} ${src} ${p.ok ? `${p.ct} ${p.size}B` : p.why}`)
    if (p.ok) { hero = url; break }
  }
  if (thumb) plan.push({ ...m, thumb, hero })
  else log(`    !! 쓸 수 있는 이미지 없음`)
}

log(`\n=== 5) 채울 수 있는 캐릭터 ${plan.length}/${missing.length}명 ===`)
plan.forEach(p => log(`  ${p.nameKo}: ${p.thumb}`))

if (MODE !== 'import') { log('\n>>> probe 모드 — DB 변경 없이 종료'); process.exit(0) }
if (!plan.length) { log('\n>>> 채울 것이 없어 종료'); process.exit(0) }

const q = s => s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`
const sql = ['\\set ON_ERROR_STOP on', 'BEGIN;']
for (const p of plan) {
  sql.push(`
UPDATE "Character" SET "imageUrl" = ${q(p.thumb)},
  metadata = coalesce(metadata, '{}'::jsonb) || ${q(JSON.stringify({ fullImageUrl: p.hero ?? null }))}::jsonb,
  "updatedAt" = now()
WHERE id = ${q(p.id)} AND "imageUrl" IS NULL;`)
}
sql.push('COMMIT;')
sql.push(`\\echo '===== 결과 ====='`)
sql.push(`SELECT count(*) AS "전체",
  count(c."imageUrl") AS "이미지 있음",
  count(*) FILTER (WHERE c."imageUrl" IS NULL) AS "아직 없음"
FROM "Character" c JOIN "Game" g ON g.id = c."gameId" WHERE g.slug='umamusume';`)
sql.push(`SELECT c."nameKo", c."imageUrl" FROM "Character" c JOIN "Game" g ON g.id = c."gameId"
WHERE g.slug='umamusume' AND c."imageUrl" IS NULL ORDER BY c."sortOrder";`)

writeFileSync('/tmp/uma-img.sql', sql.join('\n'))
log(`\n=== 6) SQL 실행 (${plan.length}명) ===`)
execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-f', '/tmp/uma-img.sql'], { stdio: 'inherit' })
log('>>> 완료')
