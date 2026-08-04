// 에픽세븐 — 스토브 공식 영웅 JSON
//
// 공략 도구(/game/epic7/heroes/)가 이미 실시간으로 쓰는 것과 같은 소스다.
// 거래소 캐릭터 필터는 DB 를 보므로, 같은 데이터를 Character 테이블에도 넣어준다.

export const meta = {
  slug: 'epicseven',
  name: '에픽세븐',
  source: 'https://static-pubcomm.onstove.com/gameRecord/epic7/epic7_hero.json',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// 기존 공략 도구가 쓰는 이미지 규칙과 동일하게 맞춘다
const heroImg = code => `https://static-pubcomm.onstove.com/event/live/epic7/guide/images/hero/${code}_s.png`

const JOB_KO = {
  warrior: '기사', knight: '기사', ranger: '사수', mage: '법사',
  assassin: '도적', manauser: '정령사', soulweaver: '정령사',
}
const ELEM_KO = { fire: '불', ice: '얼음', wind: '초록', light: '빛', dark: '어둠' }

// grade 는 3/4/5 (성급). 사이트 전반이 tier 를 문자열로 쓰므로 '5성' 형태로 맞춘다
const gradeToTier = g => {
  const n = Number(g)
  return Number.isFinite(n) && n > 0 ? `${n}성` : ''
}

export async function fetchCharacters() {
  const res = await fetch(meta.source, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' } })
  if (!res.ok) throw new Error(`스토브 응답 ${res.status}`)
  const json = await res.json()

  // 최상위에서 영웅 배열을 찾는다 (키 이름이 난독화돼 있어 이름으로 못 잡는다)
  const arrays = (Array.isArray(json) ? [json] : Object.values(json))
    .filter(v => Array.isArray(v) && v.length > 50)
    .filter(v => v.some(o => o && typeof o === 'object' && o.code && o.name))
  if (!arrays.length) throw new Error('영웅 배열을 못 찾음 — 응답 구조가 바뀜')
  const heroes = arrays.sort((a, b) => b.length - a.length)[0]

  return heroes
    .filter(h => h && h.code && h.name)
    .map(h => {
      const job = JOB_KO[String(h.job_cd || '').toLowerCase()] || h.job_cd || null
      const elem = ELEM_KO[String(h.attribute_cd || '').toLowerCase()] || h.attribute_cd || null
      return {
        nameKo: String(h.name).trim(),
        // 스토브 JSON 은 한국어 이름만 준다 → 영문명이 없어 slug 는 code 로 만든다
        nameEn: h.name_en || null,
        slug: String(h.code).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || null,
        tier: gradeToTier(h.grade),
        imageUrl: heroImg(h.code),
        metadata: {
          code: h.code,
          job: job,       // 기사/사수/법사/도적/정령사
          element: elem,  // 불/얼음/초록/빛/어둠
        },
      }
    })
}
