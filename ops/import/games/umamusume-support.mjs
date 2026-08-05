// 우마무스메 서포트 카드 — umapyoi 목록 + GameTora 한국어 페이지
//   목록   : umapyoi.net/api/v1/support (id 앞자리 = 레어도, 3=SSR/2=SR/1=R)
//   한국어 : gametora.com/ko/umamusume/supports/{slug} 한 페이지에서 전부 나온다
//              og:title    "스페셜 위크 (SSR) 서포트 카드 …"  → 캐릭터명 + 등급
//              description "스페셜 위크 (SSR, 근성) …"        → 타입
//              <div>[일본 최고의 무대를]</div>                 → 카드 고유명
//   이미지 : gametora.com/images/umamusume/supports/tex_support_card_{id}.png
//
// 매일 도는 자동 동기화에 들어가므로, 이미 DB 에 있는 카드는 GameTora 를 아예 부르지 않는다.
// (첫 등록 때만 547장을 훑고, 그 뒤로는 신규 카드 수만큼만 요청이 나간다)

export const meta = {
  slug: 'umamusume',
  name: '우마무스메 서포트 카드',
  source: 'https://umapyoi.net + https://gametora.com/ko',
  kind: 'support',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const IMG = id => `https://gametora.com/images/umamusume/supports/tex_support_card_${id}.png`
const RARITY = { 3: 'SSR', 2: 'SR', 1: 'R' }
const TIER = { SSR: 'SSR 서포트', SR: 'SR 서포트', R: 'R 서포트' }

function parseCard(html) {
  const og = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || ''
  const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1] || ''
  const m1 = og.match(/^(.+?)\s*\((SSR|SR|R)\)/)
  const m2 = desc.match(/\((?:SSR|SR|R),\s*([^)]+)\)/)
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

export async function fetchCharacters({ existing = [] } = {}) {
  const r = await fetch('https://umapyoi.net/api/v1/support', { headers: H })
  if (!r.ok) throw new Error(`umapyoi 목록 ${r.status}`)
  const list = await r.json()
  if (list.length < 100) throw new Error(`목록이 ${list.length}장뿐 — 소스 변경 의심`)

  const have = new Set(existing.map(e => e.slug).filter(Boolean))
  const todo = list.filter(s => !have.has(`sup-${s.gametora}`))
  console.log(`  umapyoi ${list.length}장 · DB ${have.size}장 · 새로 훑을 것 ${todo.length}장`)

  // 기존 카드는 DB 값을 그대로 되돌려준다 (공통 러너가 '변화없음' 으로 처리)
  const rows = existing.filter(e => e.slug?.startsWith('sup-'))
    .map(e => ({ nameKo: e.nameKo, slug: e.slug }))

  let fail = 0
  for (const [i, s] of todo.entries()) {
    const derived = RARITY[Math.floor(s.id / 10000)]
    const c = await fetchCard(s.gametora)
    if (!c) { fail++; await sleep(150); continue }
    const rarity = c.rarity || derived
    if (!rarity) { fail++; await sleep(150); continue }

    const charSlug = String(s.gametora).replace(/^\d+-/, '')
    const charKo = c.charKo
    const nameKo = charKo && c.cardKo ? `${charKo} ${c.cardKo}`
      : charKo ? `${charKo} (${rarity})`
      : `${c.cardKo || s.title_en || charSlug} (${rarity})`

    rows.push({
      nameKo: nameKo.slice(0, 140),
      nameEn: `${s.title_en || ''} ${charSlug}`.trim(),
      tier: TIER[rarity],
      weaponType: c.typeKo,
      imageUrl: IMG(s.id),
      slug: `sup-${s.gametora}`,
      metadata: { kind: 'support', supportId: s.id, gametora: s.gametora, charSlug },
    })
    if (i && i % 50 === 0) console.log(`    ...${i}/${todo.length}`)
    await sleep(180)
  }
  if (todo.length && fail > todo.length * 0.3) {
    throw new Error(`GameTora 조회 실패 ${fail}/${todo.length} — 페이지 구조 변경 의심`)
  }
  return rows
}
