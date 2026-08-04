// 우마무스메 프리티 더비 — 게임/서버/재화/캐릭터 등록
//
// 데이터 소스
//   1) 카카오게임즈 한국 공식 data.v*.js — 한국어 캐릭터명·설명·성우 (버전 쿼리가 바뀌므로 메인 HTML에서 추출)
//   2) umapyoi.net API                   — 캐릭터 이미지 (CORS 허용, microcms CDN)
//   매핑 키: 카카오 eng ↔ umapyoi name_en
//
// MODE=probe  → 소스 구조·매칭률만 출력하고 DB는 건드리지 않음
// MODE=import → Game/Server/Currency/Character INSERT 실행

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const MODE = process.env.MODE || 'probe'
const DB = process.env.SUPABASE_DB_URL

const KAKAO_HOME = 'https://umamusume.kakaogames.com/'
const UMAPYOI_LIST = 'https://umapyoi.net/api/v1/character'
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.kakaogames.umamusume&hl=ko'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

async function get(url, asText = true) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' } })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} — ${url}`)
  return asText ? await r.text() : await r.json()
}

function log(...a) { console.log(...a) }
function head(s, n = 400) { return String(s).slice(0, n).replace(/\s+/g, ' ') }

// ---------------------------------------------------------------- 1) 카카오
async function loadKakao() {
  log('\n=== 1) 카카오 공식 데이터 ===')
  const html = await get(KAKAO_HOME)
  log(`메인 HTML 길이: ${html.length}`)

  // data.v*.js 스크립트 경로 추출 (버전 쿼리 포함)
  const m = [...html.matchAll(/["']([^"']*data\.v[^"']*\.js[^"']*)["']/g)].map(x => x[1])
  log(`data.v*.js 후보: ${JSON.stringify(m.slice(0, 5))}`)
  if (m.length === 0) {
    // 폴백: 모든 js 경로 나열
    const all = [...html.matchAll(/src=["']([^"']+\.js[^"']*)["']/g)].map(x => x[1])
    log(`!! data.v*.js 못 찾음. 페이지의 js 목록: ${JSON.stringify(all.slice(0, 15))}`)
    throw new Error('data.v*.js 경로 추출 실패')
  }
  const path = m[0]
  const url = path.startsWith('http') ? path : new URL(path, KAKAO_HOME).href
  log(`선택한 URL: ${url}`)

  const js = await get(url)
  log(`data.js 길이: ${js.length}`)
  log(`앞부분: ${head(js, 300)}`)

  // 최상위 배열/객체 리터럴을 찾아 JSON으로 파싱
  const chars = extractCharacters(js)
  log(`파싱된 캐릭터 수: ${chars.length}`)
  if (chars.length) log(`샘플: ${JSON.stringify(chars[0]).slice(0, 500)}`)
  return chars
}

function extractCharacters(js) {
  // `const X = [ ... ];` 또는 `var X = { ... };` 형태를 모두 시도해 가장 큰 컬렉션 채택
  const candidates = []
  const re = /(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*;?\s*(?=(?:const|var|let|function|\/\/|\/\*|$))/g
  let m
  while ((m = re.exec(js)) !== null) {
    const [, name, body] = m
    try {
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${body});`)()
      const arr = Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : null)
      if (Array.isArray(arr) && arr.length > 20 && arr.every(o => o && typeof o === 'object')) {
        candidates.push({ name, arr })
      }
    } catch { /* 파싱 실패한 리터럴은 무시 */ }
  }
  candidates.sort((a, b) => b.arr.length - a.arr.length)
  for (const c of candidates.slice(0, 4)) {
    log(`  후보 변수 ${c.name}: ${c.arr.length}건 / 키=${JSON.stringify(Object.keys(c.arr[0] || {}))}`)
  }
  const best = candidates[0]
  if (!best) return []
  // 캐릭터로 보이는 것만 (이름 필드 존재)
  return best.arr.filter(o => o && (o.name || o.eng))
}

// ---------------------------------------------------------------- 2) umapyoi
async function loadUmapyoi() {
  log('\n=== 2) umapyoi 이미지 ===')
  const list = await get(UMAPYOI_LIST, false)
  log(`umapyoi 캐릭터 수: ${Array.isArray(list) ? list.length : '(배열 아님)'}`)
  if (Array.isArray(list) && list.length) {
    log(`키: ${JSON.stringify(Object.keys(list[0]))}`)
    log(`샘플: ${JSON.stringify(list[0]).slice(0, 400)}`)
  }
  return Array.isArray(list) ? list : []
}

// ---------------------------------------------------------------- 3) 앱 아이콘
async function loadAppIcon() {
  log('\n=== 3) Google Play 앱 아이콘 ===')
  try {
    const html = await get(PLAY_URL)
    const m = html.match(/https:\/\/play-lh\.googleusercontent\.com\/[A-Za-z0-9_\-]+=?[sw]\d+[^"'\\]*/g)
    if (!m) { log('!! 아이콘 URL 추출 실패'); return null }
    const uniq = [...new Set(m)]
    log(`후보 ${uniq.length}개, 상위: ${JSON.stringify(uniq.slice(0, 3))}`)
    // 다른 게임들과 동일하게 =s96-rw 규격으로 정규화
    const base = uniq[0].split('=')[0]
    const icon = `${base}=s96-rw`
    log(`선택: ${icon}`)
    return icon
  } catch (e) {
    log(`!! Play 페이지 실패: ${e.message}`)
    return null
  }
}

const norm = s => String(s ?? '').toLowerCase().replace(/[\s_:.\-,'’]+/g, '')

// ---------------------------------------------------------------- main
const kakao = await loadKakao()
const umapyoi = await loadUmapyoi()
const appIcon = await loadAppIcon()

log('\n=== 4) 매칭 ===')
const umaMap = new Map()
for (const u of umapyoi) {
  for (const k of [u.name_en, u.name, u.name_jp]) if (k) umaMap.set(norm(k), u)
}
let matched = 0
const rows = kakao.map(c => {
  const u = umaMap.get(norm(c.eng)) || umaMap.get(norm(c.name))
  if (u) matched++
  return {
    nameKo: c.name ?? null,
    nameEn: c.eng ?? c.name ?? null,
    thumb: u?.thumb_img ?? u?.image ?? null,
    header: u?.sns_header ?? u?.thumb_img ?? null,
    cv: c.cv ?? null,
    raw: c,
  }
})
log(`카카오 ${kakao.length}명 / umapyoi ${umapyoi.length}명 / 매칭 ${matched}명`)
const unmatched = rows.filter(r => !r.thumb).map(r => r.nameKo)
log(`이미지 미매칭 ${unmatched.length}명: ${JSON.stringify(unmatched.slice(0, 20))}`)

if (MODE !== 'import') {
  log('\n>>> probe 모드 — DB 변경 없이 종료')
  process.exit(0)
}

// ---------------------------------------------------------------- INSERT
if (!DB) { console.error('::error::SUPABASE_DB_URL 없음'); process.exit(1) }
const valid = rows.filter(r => r.nameKo && r.nameEn)
if (valid.length < 50) { console.error(`::error::캐릭터 ${valid.length}명뿐 — 소스 파싱 이상. 중단`); process.exit(1) }

const q = s => s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`
const GAME_ID = 'game_umamusume_kr'
const ART = 'https://i.namu.wiki/i/umamusume-keyart-placeholder'

const sql = []
sql.push(`\\set ON_ERROR_STOP on`)
sql.push(`BEGIN;`)

// Game — 이미 있으면 아이콘만 갱신
sql.push(`
INSERT INTO "Game" (id, slug, "nameKo", "nameEn", color, emoji, "isActive", "sortOrder", "imageUrl", "artImageUrl")
VALUES (${q(GAME_ID)}, 'umamusume', '우마무스메 프리티 더비', 'Umamusume Pretty Derby',
        '#6366f1', '🐴', true, 12, ${q(appIcon)}, NULL)
ON CONFLICT (slug) DO UPDATE SET
  "imageUrl" = COALESCE(EXCLUDED."imageUrl", "Game"."imageUrl"),
  "isActive" = true;`)

// 서버 — 대행샵이 한섭/일섭을 모두 취급
const servers = [
  { ko: '한국', en: 'Korea', order: 0 },
  { ko: '일본', en: 'Japan', order: 1 },
]
for (const s of servers) {
  sql.push(`
INSERT INTO "Server" (id, "gameId", "nameKo", "nameEn", premium, "isActive", "sortOrder")
SELECT ${q('srv_uma_' + s.en.toLowerCase())}, g.id, ${q(s.ko)}, ${q(s.en)}, 1, true, ${s.order}
FROM "Game" g WHERE g.slug = 'umamusume'
  AND NOT EXISTS (SELECT 1 FROM "Server" x WHERE x."gameId" = g.id AND x."nameKo" = ${q(s.ko)});`)
}

// 재화 — 쥬얼 150개 = 1연
sql.push(`
INSERT INTO "Currency" (id, "gameId", "nameKo", unit, "ratePerUnit", importance, "isActive", "sortOrder", "imageUrl")
SELECT 'cur_uma_jewel', g.id, '쥬얼', NULL, 150,
       (SELECT importance FROM "Currency" LIMIT 1), true, 0, NULL
FROM "Game" g WHERE g.slug = 'umamusume'
  AND NOT EXISTS (SELECT 1 FROM "Currency" c WHERE c."gameId" = g.id AND c."nameKo" = '쥬얼');`)

// 캐릭터 — 우마무스메는 등급(레어도)이 캐릭터 고유값이 아니라 카드별이므로 tier는 비움
for (const [i, r] of valid.entries()) {
  sql.push(`
INSERT INTO "Character" (id, "gameId", "nameKo", "nameEn", tier, "isLimited", "basePrice",
                         "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt", metadata)
SELECT ${q('chr_uma_' + i)}, g.id, ${q(r.nameKo)}, ${q(r.nameEn)}, '', false, 0,
       ${q(r.thumb)}, true, ${i}, now(), now(),
       ${q(JSON.stringify({ fullImageUrl: r.header, cv: r.cv }))}::jsonb
FROM "Game" g WHERE g.slug = 'umamusume'
  AND NOT EXISTS (SELECT 1 FROM "Character" c WHERE c."gameId" = g.id AND c."nameKo" = ${q(r.nameKo)});`)
}

sql.push(`COMMIT;`)
sql.push(`\\echo '===== 등록 결과 ====='`)
sql.push(`SELECT g."nameKo", g.slug, g."imageUrl" IS NOT NULL AS "아이콘",
  (SELECT count(*) FROM "Server" s WHERE s."gameId"=g.id) AS "서버",
  (SELECT count(*) FROM "Currency" c WHERE c."gameId"=g.id) AS "재화",
  (SELECT count(*) FROM "Character" c WHERE c."gameId"=g.id) AS "캐릭터",
  (SELECT count(*) FROM "Character" c WHERE c."gameId"=g.id AND c."imageUrl" IS NOT NULL) AS "이미지있음"
FROM "Game" g WHERE g.slug='umamusume';`)

writeFileSync('/tmp/uma.sql', sql.join('\n'))
log(`\n=== 5) SQL 실행 (${valid.length}명) ===`)
execFileSync('psql', [DB, '-v', 'ON_ERROR_STOP=1', '-f', '/tmp/uma.sql'], { stdio: 'inherit' })
log('>>> 완료')
