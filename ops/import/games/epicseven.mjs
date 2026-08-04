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

  // 이 JSON 은 언어별 키를 가진 객체다: { ko:[...], en:[...], de:[...] ... }
  // '가장 긴 배열'을 고르면 엉뚱한 언어를 집는다 (실제로 de 를 집어 이름이 영문으로 들어갔음).
  // 도감 화면(game/epic7/heroes/)과 동일하게 ko 를 명시적으로 쓴다.
  const heroes = json?.ko
  if (!Array.isArray(heroes) || !heroes.length) {
    throw new Error(`ko 배열 없음 — 최상위 키: ${JSON.stringify(Object.keys(json || {})).slice(0, 120)}`)
  }
  // 영문명은 code 로 맞춰 가져온다 (nameEn 이 NOT NULL 이라 있으면 채워둔다)
  const enByCode = new Map((json.en || []).map(h => [h.code, h.name]))

  return heroes
    // 도감과 동일하게 주인공(플레이어 캐릭터)은 제외한다
    .filter(h => h && h.code && h.name && h.code !== 'c0001' && h.code !== 'c1005')
    .map(h => {
      const job = JOB_KO[String(h.job_cd || '').toLowerCase()] || h.job_cd || null
      const elem = ELEM_KO[String(h.attribute_cd || '').toLowerCase()] || h.attribute_cd || null
      return {
        nameKo: String(h.name).trim(),
        // slug 는 영문명이 아니라 스토브 hero code 로 만든다 (동명이인·표기 변화에 안전)
        nameEn: enByCode.get(h.code) || h.name_en || null,
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
