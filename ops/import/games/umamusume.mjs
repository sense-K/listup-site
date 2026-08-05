// 우마무스메 (육성 우마무스메) — 카카오게임즈 한국 공식 데이터 + umapyoi 이미지
//   카카오 data.v5.js   : 한국어 이름·설명·성우·생일 등 (JS 변수라 정규식으로 뽑는다)
//   umapyoi.net API     : 이미지 (thumb_img = 도감 카드 / sns_header = 상세 배너)
//   매핑 키             : 카카오 eng ↔ umapyoi name_en
//
// 서포트 카드는 별도 어댑터(games/umamusume-support.mjs, kind='support').

export const meta = {
  slug: 'umamusume',
  name: '우마무스메 프리티 더비',
  source: 'https://umamusume.kakaogames.com + https://umapyoi.net',
  kind: 'character',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// 카카오 공식 홈에서 data.vN.js 의 실제 경로를 찾아낸다 (버전 쿼리스트링이 수시로 바뀜)
async function findDataJs() {
  const r = await fetch('https://umamusume.kakaogames.com/', { headers: H })
  if (!r.ok) throw new Error(`카카오 홈 ${r.status}`)
  const html = await r.text()
  const m = html.match(/["']([^"']*\/data\.v\d+\.js[^"']*)["']/)
  if (!m) throw new Error('data.js 경로를 홈에서 못 찾음 — 공식 사이트 구조 변경')
  return new URL(m[1], 'https://umamusume.kakaogames.com/').href
}

// characterData 는 배열일 수도 객체일 수도 있다 (공식 사이트가 바꾼 적 있음).
// 선언 뒤 첫 [ 또는 { 를 균형 괄호로 잘라 평가한다 — 순수 JSON 이 아닐 수 있어 Function 으로 평가.
function extractCharacters(js) {
  const at = js.search(/(?:const|var|let)\s+characterData\s*=/)
  if (at < 0) throw new Error('characterData 선언 없음 — 공식 사이트 구조 변경')
  let i = js.indexOf('=', at) + 1
  while (i < js.length && /\s/.test(js[i])) i++
  const open = js[i]
  if (open !== '[' && open !== '{') throw new Error(`characterData 가 배열/객체가 아님 (${open})`)
  const close = open === '[' ? ']' : '}'
  let depth = 0, end = -1, inStr = null
  for (let j = i; j < js.length; j++) {
    const ch = js[j]
    if (inStr) { if (ch === '\\') j++; else if (ch === inStr) inStr = null; continue }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue }
    if (ch === open) depth++
    else if (ch === close) { depth--; if (!depth) { end = j; break } }
  }
  if (end < 0) throw new Error('characterData 끝을 못 찾음')
  // eslint-disable-next-line no-new-func
  const val = Function(`"use strict"; return (${js.slice(i, end + 1)});`)()
  const arr = Array.isArray(val) ? val : Object.values(val).flat()
  return arr.filter(o => o && typeof o === 'object' && (o.name || o.eng))
}

const stripTags = t => String(t ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

const normEn = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || null

export async function fetchCharacters({ existing = [] } = {}) {
  const url = await findDataJs()
  const js = await (await fetch(url, { headers: H })).text()
  const list = extractCharacters(js).filter(c => c?.name && c?.eng)
  console.log(`  카카오 ${list.length}명 (${url.split('/').pop()})`)

  // 이미지: 이미 이미지가 있는 캐릭터는 umapyoi 를 다시 부르지 않는다
  const haveImg = new Set(existing.filter(e => e.imageUrl).map(e => e.nameKo.trim()))
  const needImg = list.filter(c => !haveImg.has(String(c.name).trim()))
  console.log(`  이미지 필요 ${needImg.length}명`)

  const imgByEn = {}
  if (needImg.length) {
    const idxRes = await fetch('https://umapyoi.net/api/v1/character', { headers: H })
    if (!idxRes.ok) throw new Error(`umapyoi 목록 ${idxRes.status}`)
    const idx = await idxRes.json()
    const wanted = new Set(needImg.map(c => normEn(c.eng)))
    const targets = idx.filter(u => wanted.has(normEn(u.name_en)))
    console.log(`  umapyoi 매칭 ${targets.length}명 — 상세 조회`)
    for (const t of targets) {
      try {
        const d = await (await fetch(`https://umapyoi.net/api/v1/character/${t.game_id}`, { headers: H })).json()
        imgByEn[normEn(t.name_en)] = {
          thumb: d?.thumb_img ?? d?.sns_icon ?? null,
          header: d?.sns_header ?? d?.detail_img_pc ?? d?.thumb_img ?? null,
        }
      } catch { /* 개별 실패는 넘어간다 */ }
      await sleep(120)
    }
  }

  return list.map(c => {
    const im = imgByEn[normEn(c.eng)] || {}
    return {
      nameKo: String(c.name).trim(),
      nameEn: c.eng,
      tier: '우마무스메',                  // 등록 화면에서 서포트 카드와 갈리는 그룹 이름
      slug: slugify(c.eng),
      imageUrl: im.thumb || null,
      metadata: {
        fullImageUrl: im.header || null,
        cv: c.cv || null, birthday: c.birth || null, height: c.height || null,
        catchphrase: stripTags(c.words) || null, description: stripTags(c.description) || null,
        color: c.color || null,
      },
    }
  })
}
