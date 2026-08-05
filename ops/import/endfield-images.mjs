// 엔드필드 캐릭터 이미지 수집 — 네트워크 열린 러너 전용
// 위키(MediaWiki API)에서 오퍼레이터 아이콘을 찾아 img/characters/endfield/{slug}.png 로 저장.
// 파일은 워크플로우가 repo 에 커밋 → Cloudflare Pages 가 서빙 (외부 핫링크 의존 0).
//
// MODE=probe  : 후보 URL 만 표로 출력 (파일 미저장)
// MODE=import : 실제 다운로드 + 저장  ([ef-img-fetch] 태그)

import { fetchCharacters } from './games/endfield.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'

const MODE = process.env.MODE === 'import' ? 'import' : 'probe'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const OUT_DIR = 'img/characters/endfield'

const WIKIS = [
  'https://endfield.wiki.gg/api.php',
  'https://endfield.fandom.com/api.php',
]

async function api(base, params) {
  const u = `${base}?${new URLSearchParams({ format: 'json', ...params })}`
  const r = await fetch(u, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status} ${base}`)
  return r.json()
}

// File 네임스페이스에서 이름 검색 → icon 류 우선 랭킹
function rank(title, engName) {
  const t = title.toLowerCase()
  if (title === `File:${engName} icon.png`) return 100   // 정확 일치 최우선
  let s = 0
  if (/\bicon\b|_icon|icon\./.test(t)) s += 30
  if (/avatar|head|profile/.test(t)) s += 20
  if (/portrait/.test(t)) s += 10
  if (/\.png$/.test(t)) s += 5
  // 스킬/특성/굿즈 아이콘 오인 방지 (미브가 Combo-Mifu.png 를 집었던 사례)
  if (/talent|combo|\bult\b|ult-|skill|statuette|contract|snapshot|emoji|chibi|sprite|weapon|banner|skin|outfit|elite|\be2\b/.test(t)) s -= 60
  return s
}

async function findIcon(base, engName) {
  const q = await api(base, {
    action: 'query', list: 'search', srnamespace: '6', srlimit: '25',
    srsearch: engName,
  })
  const hits = (q?.query?.search || [])
    .map(h => h.title)
    .filter(t => t.toLowerCase().includes(engName.toLowerCase().split(' ')[0]))
  if (!hits.length) return null
  hits.sort((a, b) => rank(b, engName) - rank(a, engName))
  const best = hits[0]
  if (rank(best, engName) < 0) return null   // 그럴듯한 후보가 없으면 다음 위키로
  const info = await api(base, { action: 'query', titles: best, prop: 'imageinfo', iiprop: 'url|size' })
  const page = Object.values(info?.query?.pages || {})[0]
  const ii = page?.imageinfo?.[0]
  if (!ii?.url) return null
  return { title: best, url: ii.url, w: ii.width, h: ii.height, candidates: hits.slice(0, 5) }
}

const rows = await fetchCharacters()
console.log(`캐릭터 ${rows.length}명, MODE=${MODE}\n`)

// 위키 접근성 먼저 확인
const alive = []
for (const w of WIKIS) {
  try {
    await api(w, { action: 'query', meta: 'siteinfo' })
    console.log(`OK   ${w}`)
    alive.push(w)
  } catch (e) { console.log(`FAIL ${w} — ${e.message}`) }
}
if (!alive.length) { console.log('::error::접근 가능한 위키가 없음'); process.exit(1) }

if (MODE === 'import') mkdirSync(OUT_DIR, { recursive: true })

let ok = 0, miss = []
for (const r of rows) {
  let found = null, src = null
  for (const w of alive) {
    try { found = await findIcon(w, r.nameEn); if (found) { src = new URL(w).host; break } }
    catch (e) { console.log(`  ${r.nameEn}: ${w} 오류 ${e.message}`) }
  }
  if (!found) { miss.push(r.nameEn); console.log(`MISS ${r.nameEn}`); continue }
  console.log(`HIT  ${r.nameEn} ← [${src}] ${found.title} (${found.w}x${found.h})`)
  if (MODE === 'probe') console.log(`       후보: ${found.candidates.join(' | ')}`)

  if (MODE === 'import') {
    const res = await fetch(found.url, { headers: { 'User-Agent': UA } })
    if (!res.ok) { miss.push(r.nameEn); console.log(`  다운로드 실패 ${res.status}`); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 2000) { miss.push(r.nameEn); console.log(`  파일이 너무 작음 ${buf.length}B`); continue }
    writeFileSync(`${OUT_DIR}/${r.slug}.png`, buf)
    console.log(`       저장: ${OUT_DIR}/${r.slug}.png (${Math.round(buf.length / 1024)}KB)`)
  }
  ok++
}

console.log(`\n결과: ${ok}/${rows.length} 확보, 실패 ${miss.length}${miss.length ? ' — ' + miss.join(', ') : ''}`)
if (MODE === 'import' && ok === 0) { console.log('::error::이미지 0장 — 커밋 중단'); process.exit(1) }
