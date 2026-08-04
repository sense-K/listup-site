// 캐릭터 임포터 — 공통 러너
//
// 게임마다 다른 건 "소스에서 캐릭터 목록을 뽑는 함수" 하나뿐이다.
// 그 뒤(검증 → slug 생성 → 신규/갱신 판정 → UPSERT → 리포트)는 전부 같으므로
// 여기에 모아두고, 게임별 파일은 ops/import/games/{slug}.mjs 어댑터 하나만 둔다.
//
// 어댑터가 지켜야 할 계약:
//   export const meta = { slug, name, source }
//   export async function fetchCharacters() → [{
//     nameKo,                  // 필수. 이 값으로 기존 행과 대조한다
//     nameEn, tier, imageUrl,  // 선택
//     slug,                    // 선택. 없으면 nameEn 으로 자동 생성
//     metadata,                // 선택. 객체
//   }]
//
// 실행:  GAME=epicseven MODE=probe|import node ops/import/run.mjs
//   probe  = 무엇이 바뀌는지만 출력, DB 미변경
//   import = 실제 INSERT/UPDATE

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const GAME = process.env.GAME
const MODE = process.env.MODE || 'probe'
const DB = process.env.SUPABASE_DB_URL
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const log = (...a) => console.log(...a)
const out = []
const say = s => { out.push(s); log(s) }

if (!GAME) { console.error('::error::GAME 환경변수 없음'); process.exit(1) }
if (!DB) { console.error('::error::SUPABASE_DB_URL 없음'); process.exit(1) }

// ---------------------------------------------------------------- DB 헬퍼
function q(sql) {
  return execFileSync('psql', [DB, '-t', '-A', '-F', '\t', '-c', sql], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(l => l.split('\t'))
}
const esc = s => s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`

// ---------------------------------------------------------------- 공통 유틸
// 영문명 → URL slug. 한국어만 있으면 slug 를 만들 수 없으므로 null.
function toSlug(nameEn) {
  if (!nameEn) return null
  const s = String(nameEn).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '')
  return s || null
}

// 이미지가 실제로 뜨는지 표본 검사 (전수는 느리므로 앞에서 몇 개만)
async function sampleImages(rows, n = 6) {
  const picked = rows.filter(r => r.imageUrl).slice(0, n)
  if (!picked.length) return say('  이미지 표본: (URL 있는 캐릭터 없음)')
  let ok = 0
  for (const r of picked) {
    try {
      const res = await fetch(r.imageUrl, { headers: { 'User-Agent': UA, Referer: 'https://resetlist.kr/' } })
      const ct = res.headers.get('content-type') || ''
      const good = res.ok && /^image\//.test(ct)
      if (good) ok++
      log(`    ${good ? '✓' : '✗'} ${r.nameKo} → ${res.status} ${ct}`)
    } catch (e) { log(`    ✗ ${r.nameKo} → ${e.message.slice(0, 40)}`) }
  }
  say(`  이미지 표본 ${ok}/${picked.length} 정상`)
  if (ok === 0) say('  !! 표본이 전부 실패 — 이미지 URL 규칙이 바뀌었을 수 있음')
}

// ---------------------------------------------------------------- main
const adapter = await import(`./games/${GAME}.mjs`)
const { meta } = adapter
log(`=== ${meta.name} (${meta.slug}) ===`)
log(`소스: ${meta.source}`)

const fetched = await adapter.fetchCharacters()
say(`소스에서 ${fetched.length}명 수집`)
if (!fetched.length) { console.error('::error::수집 0명 — 소스 구조가 바뀌었을 수 있음. 중단'); process.exit(1) }
log(`샘플: ${JSON.stringify(fetched[0]).slice(0, 300)}`)

// 게임 확인
const g = q(`SELECT id FROM "Game" WHERE slug = ${esc(meta.slug)};`)
if (!g.length) { console.error(`::error::Game 에 slug=${meta.slug} 없음`); process.exit(1) }
const gameId = g[0][0]

// 기존 캐릭터
const existing = q(`SELECT id, "nameKo", coalesce("nameEn",''), coalesce(slug,''),
  coalesce("imageUrl",''), coalesce(tier,'') FROM "Character" WHERE "gameId" = ${esc(gameId)};`)
  .map(([id, nameKo, nameEn, slug, imageUrl, tier]) => ({ id, nameKo, nameEn, slug, imageUrl, tier }))
const byName = new Map(existing.map(r => [r.nameKo.trim(), r]))
say(`DB 기존 ${existing.length}명`)

// 신규 / 갱신 판정
const news = [], updates = []
const seen = new Set()
for (const [i, r] of fetched.entries()) {
  const nameKo = String(r.nameKo ?? '').trim()
  if (!nameKo) continue
  if (seen.has(nameKo)) continue        // 소스 안 중복
  seen.add(nameKo)

  const slug = r.slug ?? toSlug(r.nameEn)
  const hit = byName.get(nameKo)
  if (!hit) { news.push({ ...r, nameKo, slug, sortOrder: i }); continue }

  // 값이 실제로 달라진 것만 갱신 대상에 올린다 (빈 값으로 덮어쓰지 않음)
  const diff = {}
  if (r.imageUrl && r.imageUrl !== hit.imageUrl) diff.imageUrl = r.imageUrl
  if (r.tier && r.tier !== hit.tier) diff.tier = r.tier
  if (slug && slug !== hit.slug) diff.slug = slug
  if (r.nameEn && r.nameEn !== hit.nameEn) diff.nameEn = r.nameEn
  if (r.metadata && Object.keys(r.metadata).length) diff.metadata = r.metadata
  if (Object.keys(diff).length) updates.push({ id: hit.id, nameKo, diff })
}

say(`신규 ${news.length}명 / 갱신 ${updates.length}명 / 변화없음 ${fetched.length - news.length - updates.length}명`)
if (news.length) say(`  신규 예시: ${news.slice(0, 10).map(r => r.nameKo).join(', ')}${news.length > 10 ? ` … 외 ${news.length - 10}명` : ''}`)
if (updates.length) {
  const fields = {}
  updates.forEach(u => Object.keys(u.diff).forEach(k => { fields[k] = (fields[k] || 0) + 1 }))
  say(`  갱신 필드: ${Object.entries(fields).map(([k, v]) => `${k} ${v}건`).join(', ')}`)
}

// slug 커버리지 — 캐릭터 상세 페이지를 열려면 필요하다
const withSlug = fetched.filter(r => (r.slug ?? toSlug(r.nameEn))).length
say(`slug 생성 가능 ${withSlug}/${fetched.length}명` + (withSlug < fetched.length ? ' (영문명 없는 캐릭터는 slug 없이 등록됨)' : ''))

log('\n이미지 표본 검사')
await sampleImages(news.length ? news : fetched)

if (MODE !== 'import') {
  log('\n=== 요약 ===')
  out.forEach(l => log(l))
  log('>>> probe 모드 — DB 변경 없이 종료')
  process.exit(0)
}
if (!news.length && !updates.length) { log('\n>>> 바뀔 게 없어 종료'); process.exit(0) }

// ---------------------------------------------------------------- UPSERT
const now = 'now()'
const sql = ['\\set ON_ERROR_STOP on', 'BEGIN;']
const maxOrder = existing.length
for (const [i, r] of news.entries()) {
  // nameEn 은 NOT NULL 이라 없으면 한국어 이름을 그대로 넣는다
  sql.push(`
INSERT INTO "Character" (id, "gameId", "nameKo", "nameEn", tier, "isLimited", "basePrice",
                         "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt", slug, metadata)
VALUES (gen_random_uuid()::text, ${esc(gameId)}, ${esc(r.nameKo)}, ${esc(r.nameEn || r.nameKo)},
        ${esc(r.tier || '')}, false, 0, ${esc(r.imageUrl)}, true, ${maxOrder + i}, ${now}, ${now},
        ${esc(r.slug)}, ${esc(JSON.stringify(r.metadata || {}))}::jsonb);`)
}
for (const u of updates) {
  const sets = Object.entries(u.diff).map(([k, v]) =>
    k === 'metadata'
      ? `metadata = coalesce(metadata,'{}'::jsonb) || ${esc(JSON.stringify(v))}::jsonb`
      : `"${k}" = ${esc(v)}`)
  sql.push(`UPDATE "Character" SET ${sets.join(', ')}, "updatedAt" = ${now} WHERE id = ${esc(u.id)};`)
}
sql.push('COMMIT;')
sql.push(`\\echo '===== 결과 ====='`)
sql.push(`SELECT count(*) AS "전체",
  count(*) FILTER (WHERE "imageUrl" IS NOT NULL) AS "이미지",
  count(*) FILTER (WHERE slug IS NOT NULL AND slug <> '') AS "slug"
FROM "Character" WHERE "gameId" = ${esc(gameId)} AND "isActive";`)

writeFileSync('/tmp/import.sql', sql.join('\n'))
log(`\n=== SQL 실행 (신규 ${news.length} / 갱신 ${updates.length}) ===`)
execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-f', '/tmp/import.sql'], { stdio: 'inherit' })

log('\n=== 요약 ===')
out.forEach(l => log(l))
log('>>> 완료')
