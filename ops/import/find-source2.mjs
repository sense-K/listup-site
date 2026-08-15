// 카제나 공식 캐릭터 JSON 전수 분석 — 러너 전용, DB 미변경.
// 우리 DB(Character, gameId=game_czn)와 대조해 "공식 데이터로 무엇을 더 채울 수 있나" 를 본다.
import { execFileSync } from 'node:child_process'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }
const DB = process.env.SUPABASE_DB_URL
const URL_ = 'https://static-pubcomm.onstove.com/live/czn/multilingual/czn_homepage_brand_character.json'

const j = await (await fetch(URL_, { headers: H })).json()
const langs = Object.keys(j)
const ko = j.ko || {}

// Character_(char_1050)_Name 형태에서 id 와 필드명을 분리
const byId = {}
const fields = new Set()
for (const [k, v] of Object.entries(ko)) {
  const m = k.match(/^Character_\(([^)]+)\)_(.+)$/)
  if (!m) continue
  const [, id, field] = m
  ;(byId[id] ||= {})[field] = v
  fields.add(field)
}
const ids = Object.keys(byId)
console.log(`언어 ${langs.length}종: ${langs.join(', ')}`)
console.log(`공식 JSON 캐릭터 ${ids.length}명`)
console.log(`필드 ${fields.size}종: ${[...fields].join(', ')}`)
console.log(`\n캐릭터 목록 (id · 이름 · 성우 · 대사):`)
for (const id of ids) {
  const c = byId[id]
  console.log(`  ${id.padEnd(12)} ${String(c.Name || '?').padEnd(10)} ` +
              `성우 ${String(c.Voice_Actor_Ko || '-').padEnd(8)} ` +
              `"${String(c.Description || '').slice(0, 34)}"`)
}
// 비-캐릭터 키(섹션 문구 등)
const other = Object.keys(ko).filter(k => !/^Character_\(/.test(k))
console.log(`\n캐릭터 외 키 ${other.length}개: ${other.slice(0, 20).join(', ')}`)

if (DB) {
  const q = sql => execFileSync('psql', [DB, '-t', '-A', '-F', '\t', '-c', sql], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(l => l.split('\t'))
  const rows = q(`SELECT "nameKo", coalesce(metadata->>'srcId',''), coalesce(tier,'')
                  FROM "Character" c JOIN "Game" g ON g.id=c."gameId"
                  WHERE g.slug='czn' ORDER BY "nameKo";`)
  console.log(`\n우리 DB 카제나 캐릭터 ${rows.length}명`)
  const officialByNum = {}
  for (const id of ids) {
    const n = (id.match(/(\d+)/) || [])[1]
    if (n) officialByNum[n] = byId[id]
  }
  let matched = 0, noOfficial = []
  for (const [nameKo, srcId] of rows) {
    if (officialByNum[srcId]) matched++
    else noOfficial.push(`${nameKo}(${srcId})`)
  }
  console.log(`  캐릭터 번호로 공식 데이터와 매칭: ${matched}/${rows.length}`)
  if (noOfficial.length) console.log(`  공식 JSON 에 없는 캐릭터: ${noOfficial.join(', ')}`)
  const onlyOfficial = Object.keys(officialByNum).filter(n => !rows.some(r => r[1] === n))
  if (onlyOfficial.length) console.log(`  공식에만 있고 우리 DB 에 없는 번호: ${onlyOfficial.join(', ')}`)
}

console.log('\n========== 다른 언어 동일 구조인지 ==========')
for (const l of langs) {
  const n = Object.keys(j[l] || {}).filter(k => /^Character_\(.+\)_Name$/.test(k)).length
  console.log(`  ${l}: 캐릭터 이름 키 ${n}개`)
}
