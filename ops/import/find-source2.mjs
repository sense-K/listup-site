// 카제나 스토브 공개 데이터 2차 탐색 — 러너 전용, DB 미변경.
//
// 1차에서 확인된 것:
//   · 스토브 공식 게임코드 = czn, 내부 게임ID = STOVE_CHAOSZERO
//   · 공식 홈은 Nuxt 앱: static-pubcomm.onstove.com/live/czn/brand/
//   · 데이터 JSON 규칙: static-pubcomm.onstove.com/live/czn/{섹션}/czn_{페이지}.json
//   · gameRecord/czn/* 는 전부 404 (에픽세븐의 gameRecord/epic7/* 는 여전히 200)
//
// 이번에 확인할 것:
//   ① Nuxt 빌드 매니페스트 → 공식 홈에 어떤 페이지(라우트)가 있는지 전부
//   ② multilingual/analytics JSON 을 페이지명 조합으로 훑기 (캐릭터 페이지가 있으면 여기 걸림)
//   ③ 이미 확인된 JSON 안에 실제로 뭐가 들었는지 (캐릭터 이름/이미지가 있나)
//   ④ 스토브 전적(gameRecord) API 를 STOVE_CHAOSZERO 로 대입

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }
const BASE = 'https://static-pubcomm.onstove.com/live/czn'

const found = []
async function get(url, { quiet = false, show = 0 } = {}) {
  try {
    const r = await fetch(url, { headers: H, redirect: 'follow' })
    if (!r.ok) { if (!quiet) console.log(`  ${r.status}  ${url}`); return null }
    const ct = (r.headers.get('content-type') || '').split(';')[0]
    const body = await r.text()
    console.log(`  ✅ ${r.status} ${ct} ${body.length}B  ${url}`)
    found.push(url)
    if (show) console.log(`      ${body.slice(0, show).replace(/\s+/g, ' ')}`)
    return body
  } catch (e) { if (!quiet) console.log(`  ERR ${url} — ${e.message.slice(0, 50)}`); return null }
}

console.log('========== ① Nuxt 빌드 매니페스트 (공식 홈 라우트 전체) ==========')
for (const u of [
  `${BASE}/brand/_nuxt/builds/latest.json`,
  `${BASE}/brand/_nuxt/builds/meta/860e8073-82b2-4f77-b215-c849f72c99e1.json`,
]) {
  const b = await get(u, { show: 600 })
  if (b) {
    try {
      const j = JSON.parse(b)
      const keys = Object.keys(j)
      console.log(`      키: ${keys.join(', ')}`)
      // prerendered / routes 배열이 있으면 페이지 목록이다
      for (const k of ['prerendered', 'routes', 'pages']) {
        if (Array.isArray(j[k])) console.log(`      ${k} (${j[k].length}개): ${j[k].slice(0, 60).join(' ')}`)
      }
    } catch {}
  }
}

console.log('\n========== ② 페이지별 JSON 훑기 ==========')
const PAGES = [
  'common_common', 'common_error', 'homepage_brand_main',
  'homepage_brand_character', 'homepage_brand_characters', 'homepage_brand_hero',
  'homepage_brand_world', 'homepage_brand_media', 'homepage_brand_story',
  'homepage_brand_guide', 'homepage_brand_system', 'homepage_brand_about',
  'homepage_character', 'homepage_characters', 'character', 'characters',
]
for (const sec of ['multilingual', 'analytics']) {
  console.log(`  -- ${sec}`)
  for (const p of PAGES) await get(`${BASE}/${sec}/czn_${p}.json`, { quiet: true })
}

console.log('\n========== ③ 이미 확인된 JSON 내용 ==========')
for (const u of [`${BASE}/multilingual/czn_common_common.json`,
                 `${BASE}/multilingual/czn_homepage_brand_main.json`]) {
  const b = await get(u)
  if (!b) continue
  try {
    const j = JSON.parse(b)
    const flat = JSON.stringify(j)
    console.log(`      최상위 키: ${Object.keys(j).slice(0, 15).join(', ')}`)
    // 캐릭터 이름이 들어있는지 (우리가 아는 35명 중 몇 명이 보이나)
    const NAMES = ['힐데', '테네브리아', '아델하이트', '하이데마리', '나르쟈', '디아나', '루크', '유키']
    const seen = NAMES.filter(n => flat.includes(n))
    console.log(`      캐릭터 이름 포함: ${seen.length ? seen.join(', ') : '없음'}`)
    console.log(`      샘플: ${flat.slice(0, 500)}`)
  } catch {}
}

console.log('\n========== ④ 스토브 전적(gameRecord) API 대입 ==========')
// 에픽세븐이 쓰는 규칙 + 내부 게임ID(STOVE_CHAOSZERO) 조합
const RECORD = [
  'https://static-pubcomm.onstove.com/gameRecord/czn/czn_character.json',
  'https://static-pubcomm.onstove.com/gameRecord/STOVE_CHAOSZERO/character.json',
  'https://api.onstove.com/gamerecord/v1.0/STOVE_CHAOSZERO/characters',
  'https://api.onstove.com/gamerecord/v1.0/czn/characters',
  'https://gamerecord.onstove.com/v1.0/czn/characters',
  'https://api.onstove.com/game/v1.0/STOVE_CHAOSZERO',
  'https://maintenance.onstove.com/v2.0/maintenance/GAME/STOVE_CHAOSZERO/PC_MARKET/ko',
]
for (const u of RECORD) await get(u, { show: 250 })

console.log('\n========== 요약 ==========')
console.log(found.length ? `열린 응답 ${found.length}건:\n  ${found.join('\n  ')}` : '아무것도 못 찾음')
