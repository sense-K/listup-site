// 원신 — genshin-db API
// admin "원신 캐릭터 불러오기" 와 같은 소스·같은 필드 규칙. 신캐릭터 감지용 기본 필드만
// 가져온다 (talents/constellations 상세는 admin "상세정보 동기화" 버튼이 계속 담당).
//
// 주의: queryLanguages=Korean 없으면 한국어 쿼리가 빈 응답을 준다 (CLAUDE.md).

export const meta = {
  slug: 'genshin',
  name: '원신',
  source: 'https://genshin-db-api.vercel.app/api/v5',
}

const API = 'https://genshin-db-api.vercel.app/api/v5'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const TRAVELER = new Set(['아이테르', '루미네'])

async function getJson(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!r.ok) return null
    const t = await r.text()
    return t && t.trim() ? JSON.parse(t) : null
  } catch { return null }
}
const slugify = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || null

export async function fetchCharacters() {
  const names = await getJson(`${API}/characters?query=names&matchCategories=true&queryLanguages=Korean&resultLanguage=Korean`)
  if (!Array.isArray(names) || !names.length) throw new Error('캐릭터 이름 목록을 못 받음')
  const targets = names.filter(n => !TRAVELER.has(n))

  const out = []
  const failed = []
  const BATCH = 5
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(async name => {
      const qs = encodeURIComponent(name)
      const [kr, en] = await Promise.all([
        getJson(`${API}/characters?query=${qs}&queryLanguages=Korean&resultLanguage=Korean`),
        getJson(`${API}/characters?query=${qs}&queryLanguages=Korean&resultLanguage=English`),
      ])
      return { name, kr, en }
    }))
    for (const { name, kr, en } of results) {
      if (!kr?.name) { failed.push(name); continue }
      out.push({
        nameKo: kr.name,
        nameEn: en?.name || null,
        tier: kr.rarity >= 5 ? 'S' : 'A',
        element: kr.elementText ?? null,
        weaponType: kr.weaponText ?? null,
        region: kr.region || null,
        imageUrl: kr.images?.cover1 ?? kr.images?.cover2 ?? kr.images?.['hoyolab-avatar']
               ?? kr.images?.hoyowiki_icon ?? kr.images?.mihoyo_icon ?? null,
        slug: slugify(en?.name || kr.name),
      })
    }
  }
  if (failed.length) console.log(`  (개별 조회 실패 ${failed.length}명: ${failed.slice(0, 8).join(', ')})`)
  // 개별 조회가 절반 이상 죽으면 API 장애로 보고 중단 (부분 데이터로 오판하지 않게)
  if (out.length < targets.length / 2) throw new Error(`개별 조회 성공이 ${out.length}/${targets.length}뿐 — API 장애 의심`)
  return out
}
