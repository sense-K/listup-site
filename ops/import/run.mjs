// 캐릭터 임포터 — 공통 러너
//
// 게임마다 다른 건 "소스에서 캐릭터 목록을 뽑는 함수" 하나뿐이다.
// 그 뒤(검증 → 신규/갱신 판정 → UPSERT → 기록)는 전부 여기서 공통 처리한다.
// 게임별 파일은 ops/import/games/{slug}.mjs 어댑터 하나만 둔다.
//
// 어댑터 계약:
//   export const meta = { slug, name, source }
//   export async function fetchCharacters() → [{
//     nameKo,                              // 필수. 이 값으로 기존 행과 대조
//     nameEn, tier, imageUrl, slug,        // 선택
//     element, weaponType, region,         // 선택 (컬럼 직접 매핑)
//     metadata,                            // 선택. 기존 metadata 가 비어있을 때만 채움
//   }]
//
// 실행:
//   GAME=epicseven MODE=probe|import node ops/import/run.mjs   ← 한 게임
//   GAME=all       MODE=probe|import node ops/import/run.mjs   ← 자동화 가능한 전 게임 순회
//     · 게임 하나가 실패해도 나머지는 계속 돈다. 실패 내역은 끝에 모아 보고하고 exit 1.
//     · import 모드에선 결과를 ImportLog 테이블에 남겨 admin 페이지에서 볼 수 있다.
//
// 안전 규칙 (전 게임 공통):
//   · 신규 판정은 nameKo 대조 — 같은 이름을 두 번 INSERT 하지 않는다
//   · 소스가 0명을 주면 그 게임은 중단 (소스 구조 변경으로 DB를 비우는 사고 방지)
//   · 빈 값으로 기존 값을 덮어쓰지 않는다
//   · slug 는 기존 값이 있으면 절대 바꾸지 않는다 (이미 색인된 상세 URL 이 깨짐)
//   · 자체 호스팅(supabase storage) 이미지는 외부 URL 로 되돌리지 않는다
//   · metadata 는 기존이 비어있을 때만 채운다 (수동 보강분 보호)
//   · 삭제는 하지 않는다

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const GAME = process.env.GAME
const MODE = process.env.MODE || 'probe'
const DB = process.env.SUPABASE_DB_URL
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// GAME=all 일 때 도는 목록. 새 어댑터를 만들면 여기 추가.
const SYNC_GAMES = ['genshin', 'starrail', 'zzz', 'wuwa', 'epicseven', 'bluearchive']

const log = (...a) => console.log(...a)

if (!GAME) { console.error('::error::GAME 환경변수 없음'); process.exit(1) }
if (!DB) { console.error('::error::SUPABASE_DB_URL 없음'); process.exit(1) }

// ---------------------------------------------------------------- DB
function q(sql) {
  return execFileSync('psql', [DB, '-t', '-A', '-F', '\t', '-c', sql], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(l => l.split('\t'))
}
const esc = s => s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`

// ---------------------------------------------------------------- 유틸
function toSlug(nameEn) {
  if (!nameEn) return null
  const s = String(nameEn).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '')
  return s || null
}

async function sampleImages(rows, say, n = 5) {
  const picked = rows.filter(r => r.imageUrl).slice(0, n)
  if (!picked.length) return
  let ok = 0
  for (const r of picked) {
    try {
      const res = await fetch(r.imageUrl, { headers: { 'User-Agent': UA, Referer: 'https://resetlist.kr/' } })
      if (res.ok && /^image\//.test(res.headers.get('content-type') || '')) ok++
      else log(`    ✗ ${r.nameKo} → ${res.status} ${res.headers.get('content-type')}`)
    } catch (e) { log(`    ✗ ${r.nameKo} → ${e.message.slice(0, 40)}`) }
  }
  say(`  이미지 표본 ${ok}/${picked.length} 정상`)
  if (ok === 0 && picked.length > 0) throw new Error('신규 캐릭터 이미지 표본이 전부 실패 — 이미지 URL 규칙이 바뀐 듯')
}

// ---------------------------------------------------------------- 한 게임 처리
async function runGame(slug) {
  const lines = []
  const say = s => { lines.push(s); log(s) }
  log(`\n${'='.repeat(60)}`)

  const adapter = await import(`./games/${slug}.mjs`)
  const { meta } = adapter
  log(`${meta.name} (${meta.slug}) ← ${meta.source}`)

  const fetched = await adapter.fetchCharacters()
  say(`소스 ${fetched.length}명`)
  if (!fetched.length) throw new Error('수집 0명 — 소스 구조가 바뀌었을 수 있음')

  const g = q(`SELECT id FROM "Game" WHERE slug = ${esc(meta.slug)};`)
  if (!g.length) throw new Error(`Game 테이블에 slug=${meta.slug} 없음`)
  const gameId = g[0][0]

  const existing = q(`SELECT id, "nameKo", coalesce("nameEn",''), coalesce(slug,''), coalesce("imageUrl",''),
      coalesce(tier,''), coalesce(element,''), coalesce("weaponType",''),
      (metadata IS NOT NULL AND metadata::text <> '{}')::int
    FROM "Character" WHERE "gameId" = ${esc(gameId)};`)
    .map(([id, nameKo, nameEn, slug2, imageUrl, tier, element, weaponType, hasMeta]) =>
      ({ id, nameKo, nameEn, slug: slug2, imageUrl, tier, element, weaponType, hasMeta: hasMeta === '1' }))
  const byName = new Map(existing.map(r => [r.nameKo.trim(), r]))
  // 2차 대조: 소스의 한국어 이름이 오염된 경우가 실제로 있다
  // (StarRailRes kr 에 'Mar. 7th' 처럼 영어가 섞여 있음 → DB '3월 7일' 과 불일치 → 중복 INSERT 위험)
  const normEn = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const byNameEn = new Map()
  for (const r of existing) { const k = normEn(r.nameEn); if (k && !byNameEn.has(k)) byNameEn.set(k, r) }
  say(`DB ${existing.length}명`)

  const news = [], updates = []
  const seen = new Set()
  for (const [i, r] of fetched.entries()) {
    const nameKo = String(r.nameKo ?? '').trim()
    if (!nameKo || seen.has(nameKo)) continue
    seen.add(nameKo)

    const slugVal = r.slug ?? toSlug(r.nameEn)
    let hit = byName.get(nameKo)
    if (!hit && r.nameEn) {
      hit = byNameEn.get(normEn(r.nameEn))
      // nameEn 으로 잡혔다면 소스의 nameKo 가 미덥지 않은 것 — DB 의 한국어 이름을 유지한다
    }
    if (!hit) { news.push({ ...r, nameKo, slug: slugVal, sortOrder: i }); continue }

    const diff = {}
    const selfHosted = /supabase\.co\/storage\//.test(hit.imageUrl)
    if (r.imageUrl && r.imageUrl !== hit.imageUrl && !selfHosted) diff.imageUrl = r.imageUrl
    if (r.tier && r.tier !== hit.tier) diff.tier = r.tier
    if (slugVal && !hit.slug) diff.slug = slugVal                       // 기존 slug 는 URL 이므로 불변
    if (r.nameEn && r.nameEn !== hit.nameEn) diff.nameEn = r.nameEn
    if (r.element && r.element !== hit.element) diff.element = r.element
    if (r.weaponType && r.weaponType !== hit.weaponType) diff.weaponType = r.weaponType
    if (r.metadata && Object.keys(r.metadata).length && !hit.hasMeta) diff.metadata = r.metadata
    if (Object.keys(diff).length) updates.push({ id: hit.id, nameKo, diff })
  }

  // 폭주 방지: 이미 자리잡은 게임에서 신규가 소스의 30% 를 넘으면 이름 체계가 어긋난 사고다
  // (에픽세븐에서 언어 배열을 잘못 집어 '신규 384명' 이 나온 적 있음). 사람 없이 도는 cron 이므로 중단이 맞다.
  if (existing.length >= 20 && news.length > fetched.length * 0.3) {
    throw new Error(`신규 ${news.length}명이 소스 ${fetched.length}명의 30% 초과 — 이름 대조 실패 의심, 자동 반영 중단`)
  }
  say(`신규 ${news.length} / 갱신 ${updates.length} / 변화없음 ${fetched.length - news.length - updates.length}`)
  if (news.length) say(`  신규: ${news.slice(0, 12).map(r => r.nameKo).join(', ')}${news.length > 12 ? ` … 외 ${news.length - 12}명` : ''}`)
  if (updates.length) {
    const fields = {}
    updates.forEach(u => Object.keys(u.diff).forEach(k => { fields[k] = (fields[k] || 0) + 1 }))
    say(`  갱신 필드: ${Object.entries(fields).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  }
  await sampleImages(news, say)

  if (MODE !== 'import' || (!news.length && !updates.length)) {
    return { game: slug, added: news.length, updated: updates.length, applied: false, lines }
  }

  const sql = ['\\set ON_ERROR_STOP on', 'BEGIN;']
  const maxOrder = existing.length
  for (const [i, r] of news.entries()) {
    sql.push(`
INSERT INTO "Character" (id, "gameId", "nameKo", "nameEn", tier, "isLimited", "basePrice",
                         "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt",
                         slug, element, "weaponType", region, metadata)
VALUES (gen_random_uuid()::text, ${esc(gameId)}, ${esc(r.nameKo)}, ${esc(r.nameEn || r.nameKo)},
        ${esc(r.tier || '')}, false, 0, ${esc(r.imageUrl)}, true, ${maxOrder + i}, now(), now(),
        ${esc(r.slug)}, ${esc(r.element ?? null)}, ${esc(r.weaponType ?? null)}, ${esc(r.region ?? null)},
        ${esc(JSON.stringify(r.metadata || {}))}::jsonb);`)
  }
  for (const u of updates) {
    const sets = Object.entries(u.diff).map(([k, v]) =>
      k === 'metadata'
        ? `metadata = coalesce(metadata,'{}'::jsonb) || ${esc(JSON.stringify(v))}::jsonb`
        : `"${k === 'weaponType' ? 'weaponType' : k}" = ${esc(v)}`)
    sql.push(`UPDATE "Character" SET ${sets.join(', ')}, "updatedAt" = now() WHERE id = ${esc(u.id)};`)
  }
  sql.push('COMMIT;')
  writeFileSync(`/tmp/import-${slug}.sql`, sql.join('\n'))
  execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-q', '-f', `/tmp/import-${slug}.sql`], { stdio: 'inherit' })
  say(`  → DB 반영 완료`)
  return { game: slug, added: news.length, updated: updates.length, applied: true, lines }
}

// ---------------------------------------------------------------- 결과 기록 (admin 페이지가 읽는다)
function writeImportLog(results) {
  const rows = results.map(r => `(gen_random_uuid()::text, now(), ${esc(r.game)}, ${r.added ?? 0}, ${r.updated ?? 0},
     ${esc(r.error ?? null)}, ${esc(JSON.stringify({ lines: (r.lines || []).slice(0, 12) }))}::jsonb)`)
  const sql = `INSERT INTO "ImportLog" (id, "ranAt", game, added, updated, error, detail) VALUES ${rows.join(',')};`
  try { q(sql); log('ImportLog 기록 완료') }
  catch (e) { log(`::warning::ImportLog 기록 실패 (테이블 없으면 [sql] 로 생성 필요): ${e.message.slice(0, 120)}`) }
}

// ---------------------------------------------------------------- main
const targets = GAME === 'all' ? SYNC_GAMES : [GAME]
const results = []
for (const slug of targets) {
  try { results.push(await runGame(slug)) }
  catch (e) {
    log(`::error::[${slug}] ${e.message}`)
    results.push({ game: slug, added: 0, updated: 0, error: e.message.slice(0, 300), lines: [] })
  }
}

log(`\n${'='.repeat(60)}\n=== 전체 요약 (${MODE}) ===`)
for (const r of results) {
  log(r.error ? `  ✗ ${r.game}: ${r.error}` : `  ✓ ${r.game}: 신규 ${r.added} / 갱신 ${r.updated}${r.applied ? ' (반영됨)' : ''}`)
}

if (MODE === 'import') writeImportLog(results)

const failed = results.filter(r => r.error)
if (failed.length) { log(`\n>>> ${failed.length}개 게임 실패`); process.exit(1) }
log('\n>>> 완료')
