// 게임 공식 사이트에서 "캐릭터 목록 데이터"가 어디 있는지 찾아내는 범용 스캐너
//
// 우마무스메 때 통했던 방식을 일반화했다: 공식 사이트가 SPA면 캐릭터 배열이
// 번들 JS나 JSON 어딘가에 통째로 박혀 있다. 경로를 찍어 맞히려 하지 말고
// 사이트가 실제로 불러오는 자산을 전부 훑어서 "캐릭터스러운 배열"을 찾는다.
//
// 아무것도 못 찾으면 못 찾았다고 말한다. 추측한 URL 을 결과처럼 내놓지 않는다.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// 조사 대상. url 이 틀리면 그대로 실패로 보고된다 (추측을 결과로 포장하지 않기 위함)
const TARGETS = [
  { slug: 'cookie-run',     name: '쿠키런킹덤',        urls: ['https://cookierunkingdom.devsisters.com/', 'https://www.cookierunkingdom.com/'] },
  { slug: 'sevenknightsre', name: '세븐나이츠 리버스', urls: ['https://sevenknightsre.netmarble.com/', 'https://sevenknights-re.netmarble.com/'] },
  { slug: 'trickcal',       name: '트릭컬 리바이브',   urls: ['https://trickcal.com/', 'https://www.trickcal.com/'] },
  { slug: 'limbus',         name: '림버스 컴퍼니',     urls: ['https://limbuscompany.com/', 'https://www.limbuscompany.com/'] },
  { slug: 'stardive',       name: '몬길 스타다이브',   urls: ['https://mongilstardive.netmarble.com/', 'https://stardive.netmarble.com/'] },
  { slug: 'lostsword',      name: '로스트 소드',       urls: ['https://lostsword.co.kr/', 'https://lostsword.netmarble.com/'] },
]

// 이미 검증된 소스 — 되살아있는지 같이 확인
const KNOWN = [
  { slug: 'bluearchive', name: '블루 아카이브(SchaleDB)', url: 'https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/students.json' },
  { slug: 'epicseven',   name: '에픽세븐(스토브 공식)',   url: 'https://static-pubcomm.onstove.com/gameRecord/epic7/epic7_hero.json' },
]

const log = (...a) => console.log(...a)

async function get(url, timeoutMs = 20000) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }, signal: ac.signal })
    const text = await r.text()
    return { ok: r.ok, status: r.status, text, ct: r.headers.get('content-type') || '' }
  } catch (e) {
    return { ok: false, status: 0, text: '', err: e.name === 'AbortError' ? 'timeout' : e.message.slice(0, 60) }
  } finally { clearTimeout(t) }
}

// 캐릭터 배열처럼 보이는가? — 이름스러운 키를 가진 객체가 여러 개
const NAME_KEYS = ['name', 'nameKo', 'name_ko', 'nameKr', 'heroName', 'charName', 'title', '이름', 'ko', 'kr']
function looksLikeCharacters(arr) {
  if (!Array.isArray(arr) || arr.length < 8) return null
  const objs = arr.filter(o => o && typeof o === 'object' && !Array.isArray(o))
  if (objs.length < 8) return null
  const keys = new Set()
  objs.slice(0, 30).forEach(o => Object.keys(o).forEach(k => keys.add(k)))
  const hit = NAME_KEYS.filter(k => keys.has(k))
  if (!hit.length) return null
  return { n: objs.length, nameKeys: hit, keys: [...keys].slice(0, 25), sample: objs[0] }
}

// JSON 문자열 안에서 최상위 배열/객체를 찾아 평가
function scanJson(text) {
  const found = []
  try {
    const v = JSON.parse(text)
    const cand = Array.isArray(v) ? [['(root)', v]]
      : (v && typeof v === 'object' ? Object.entries(v).map(([k, x]) => [k, Array.isArray(x) ? x : Object.values(x || {})]) : [])
    for (const [k, arr] of cand) {
      const r = looksLikeCharacters(arr)
      if (r) found.push({ where: k, ...r })
    }
  } catch { /* JSON 아님 */ }
  return found
}

// JS 번들 안의 최상위 선언을 균형 괄호로 잘라 평가 (우마무스메에서 통한 방식)
function scanJs(js) {
  const found = []
  const names = [...js.matchAll(/(?:^|[\n;])\s*(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=/g)].map(m => m[1])
  for (const name of [...new Set(names)].slice(0, 80)) {
    const at = js.search(new RegExp(`(?:const|var|let)\\s+${name}\\s*=\\s*`))
    if (at < 0) continue
    let i = js.indexOf('=', at) + 1
    while (i < js.length && /\s/.test(js[i])) i++
    const open = js[i]
    if (open !== '[' && open !== '{') continue
    const close = open === '[' ? ']' : '}'
    let depth = 0, end = -1, inStr = null
    for (let j = i; j < js.length && j - i < 3_000_000; j++) {
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
      const r = looksLikeCharacters(arr)
      if (r) found.push({ where: name, ...r })
    } catch { /* 평가 실패 */ }
  }
  return found
}

async function investigate(t) {
  log(`\n${'='.repeat(64)}\n${t.name} (${t.slug})`)
  let home = null, homeUrl = null
  for (const u of t.urls) {
    const r = await get(u)
    log(`  ${u} → ${r.ok ? r.status : (r.err || r.status)}`)
    if (r.ok && r.text.length > 500) { home = r.text; homeUrl = u; break }
  }
  if (!home) { log('  ✗ 공식 사이트에 접근 실패 — URL 이 틀렸거나 차단됨'); return }

  // 사이트가 부르는 js/json 자산 수집
  const assets = new Set()
  for (const m of home.matchAll(/(?:src|href)=["']([^"']+\.(?:js|json)[^"']*)["']/g)) assets.add(m[1])
  for (const m of home.matchAll(/["'](\/[^"']*\.json[^"']*)["']/g)) assets.add(m[1])
  const list = [...assets].slice(0, 25).map(a => a.startsWith('http') ? a : new URL(a, homeUrl).href)
  log(`  자산 ${list.length}개`)

  // 홈 HTML 자체에 __NEXT_DATA__ / __NUXT__ 같은 인라인 JSON 이 있으면 그것부터
  for (const m of home.matchAll(/<script[^>]*(?:id=["']__NEXT_DATA__["']|type=["']application\/json["'])[^>]*>([\s\S]{200,}?)<\/script>/g)) {
    const f = scanJson(m[1])
    f.forEach(r => log(`  ★ 인라인 JSON [${r.where}] ${r.n}건 · 이름키=${JSON.stringify(r.nameKeys)}\n     키=${JSON.stringify(r.keys)}\n     샘플=${JSON.stringify(r.sample).slice(0, 240)}`))
  }

  let hits = 0
  for (const url of list) {
    const r = await get(url)
    if (!r.ok || r.text.length < 200) continue
    const found = url.endsWith('.json') || /json/.test(r.ct) ? scanJson(r.text) : scanJs(r.text)
    for (const f of found) {
      hits++
      log(`  ★ ${url.slice(0, 100)}`)
      log(`     [${f.where}] ${f.n}건 · 이름키=${JSON.stringify(f.nameKeys)}`)
      log(`     키=${JSON.stringify(f.keys)}`)
      log(`     샘플=${JSON.stringify(f.sample).slice(0, 300)}`)
    }
  }
  if (!hits) log('  ✗ 캐릭터 배열로 보이는 데이터를 못 찾음 (SSR/API 호출형일 가능성)')
}

// ---------------------------------------------------------------- main
log('=== 이미 쓰고 있는 소스 생존 확인 ===')
for (const k of KNOWN) {
  const r = await get(k.url)
  if (!r.ok) { log(`  ✗ ${k.name} → ${r.err || r.status}`); continue }
  const f = scanJson(r.text)
  log(`  ✓ ${k.name} → ${r.status}, ${(r.text.length / 1024).toFixed(0)}KB` +
      (f.length ? ` · [${f[0].where}] ${f[0].n}건 · 키=${JSON.stringify(f[0].keys.slice(0, 12))}` : ' · (배열 판정 실패)'))
}

for (const t of TARGETS) await investigate(t)
log('\n>>> 완료 (DB 변경 없음)')
