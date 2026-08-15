// 카제나 스토브 공개 데이터 3차 — 공식 캐릭터 JSON 내용 확인. 러너 전용, DB 미변경.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }
const BASE = 'https://static-pubcomm.onstove.com/live/czn'

const getJson = async u => {
  const r = await fetch(u, { headers: H })
  if (!r.ok) { console.log(`  ${r.status} ${u}`); return null }
  try { return JSON.parse(await r.text()) } catch { console.log(`  파싱실패 ${u}`); return null }
}

console.log('========== ① 공식 캐릭터 JSON ==========')
const ch = await getJson(`${BASE}/multilingual/czn_homepage_brand_character.json`)
if (ch) {
  const ko = ch.ko || {}
  const keys = Object.keys(ko)
  console.log(`  언어: ${Object.keys(ch).join(', ')} · ko 키 ${keys.length}개`)
  console.log(`  키 목록(앞 80):`)
  for (const k of keys.slice(0, 80)) {
    const v = String(ko[k] ?? '').replace(/\s+/g, ' ')
    console.log(`    ${k} = ${v.slice(0, 90)}`)
  }
  if (keys.length > 80) console.log(`    ... 외 ${keys.length - 80}개`)
  // 우리가 아는 캐릭터 35명 중 몇 명이 여기 있나
  const NAMES = ['힐데','테네브리아','페이','아델하이트','하이데마리','나르쟈','나인','디아나','레노아','루크',
                 '리타','린','마그나','메이린','베로니카','세레니엘','오를레아','유키','치즈루','카일론',
                 '칼리페','티페라','하루','휴고','니아','레이','루카스','마리벨','미카','베릴',
                 '셀레나','아미르','오웬','카시우스','트리사']
  const flat = JSON.stringify(ko)
  const inJson = NAMES.filter(n => flat.includes(n))
  console.log(`\n  캐릭터 이름 ${inJson.length}/35 포함: ${inJson.join(', ') || '없음'}`)
}

console.log('\n========== ② Nuxt 빌드 매니페스트 (공식 홈 라우트) ==========')
for (const u of [`${BASE}/brand/_nuxt/builds/latest.json`,
                 `${BASE}/brand/_nuxt/builds/meta/860e8073-82b2-4f77-b215-c849f72c99e1.json`]) {
  const j = await getJson(u)
  if (!j) continue
  console.log(`  ${u.split('/').pop()} → 키: ${Object.keys(j).join(', ')}`)
  for (const k of ['prerendered', 'routes', 'pages']) {
    if (Array.isArray(j[k])) console.log(`    ${k} (${j[k].length}): ${j[k].join('  ')}`)
  }
  const s = JSON.stringify(j)
  if (s.length < 1500) console.log(`    전체: ${s}`)
}

console.log('\n========== ③ 공식 캐릭터 페이지 실물 ==========')
for (const p of ['/ko/character', '/ko/characters', '/ko/hero', '/ko/world', '/ko/media', '/ko/guide']) {
  const r = await fetch(`https://chaoszeronightmare.onstove.com${p}`, { headers: H, redirect: 'manual' })
  console.log(`  ${r.status} ${p}${r.headers.get('location') ? ' → ' + r.headers.get('location') : ''}`)
}

console.log('\n========== ④ 공식 이미지 경로 규칙 ==========')
for (const u of [
  `${BASE}/brand/images/ko/ogtag_1200.jpg`,
  `${BASE}/brand/images/character/`,
  `${BASE}/brand/images/ko/character_01.png`,
]) {
  const r = await fetch(u, { headers: H, method: 'HEAD' }).catch(() => null)
  console.log(`  ${r?.status ?? 'ERR'} ${(r?.headers.get('content-type') || '')} ${u}`)
}

console.log('\n========== ⑤ 다른 스토브 게임의 gameRecord 존재 여부(규칙 확인) ==========')
for (const g of ['epic7', 'lostark', 'outerplane', 'czn', 'sevenknights']) {
  const r = await fetch(`https://static-pubcomm.onstove.com/gameRecord/${g}/${g}_hero.json`, { headers: H, method: 'HEAD' }).catch(() => null)
  console.log(`  ${r?.status ?? 'ERR'}  gameRecord/${g}/${g}_hero.json`)
}
