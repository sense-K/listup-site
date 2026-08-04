// 명조 워더링 웨이브 — nanoka.cc
// admin "명조 캐릭터 등록" 과 같은 소스·같은 매핑.

export const meta = {
  slug: 'wuwa',
  name: '명조 워더링 웨이브',
  source: 'https://static.nanoka.cc/ww/{version}/character.json',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const ELEM_KO = { 1: '응결', 2: '융해', 3: '전도', 4: '기류', 5: '회절', 6: '인멸' }
const WEAPON_KO = { 1: '대검', 2: '쌍검', 3: '피스톨', 4: '권투', 5: '회수기' }
// 방랑자(주인공) — 남/여 2쌍씩이라 slug 가 겹친다
const ROVER = new Set(['1406', '1408', '1501', '1502', '1604', '1605'])

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}
const slugify = s => (s || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || null
const assetUrl = p => {
  const path = p?.split('/Game/Aki/UI/')[1]
  return path ? `https://static.nanoka.cc/assets/ww/${path.split('.')[0]}.webp` : null
}

export async function fetchCharacters() {
  const manifest = await getJson('https://static.nanoka.cc/manifest.json')
  const version = manifest?.ww?.latest
  if (!version) throw new Error('manifest 에 ww.latest 없음')
  const raw = await getJson(`https://static.nanoka.cc/ww/${version}/character.json`)

  return Object.entries(raw)
    .filter(([id, c]) => !ROVER.has(String(id)) && c?.ko && c.ko.trim()
      && c.rank !== null && c.rank !== undefined && c.rank >= 4)
    .map(([, c]) => ({
      nameKo: c.ko.trim(),
      nameEn: c.en || null,
      tier: c.rank === 5 ? 'S' : 'A',
      element: ELEM_KO[c.element] || null,
      weaponType: WEAPON_KO[c.weapon] || null,
      imageUrl: assetUrl(c.icon),
      slug: slugify(c.en),
      metadata: {
        fullImageUrl: assetUrl(c.background),
        nickname: c.nickname || null,
        desc: c.desc || null,
      },
    }))
}
