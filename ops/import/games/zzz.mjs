// 젠레스 존 제로 — nanoka.cc (Hakushin)
// admin "ZZZ 캐릭터 등록" 과 같은 소스·같은 매핑. 기본 필드만 (상세 metadata 는 admin 버튼).

export const meta = {
  slug: 'zzz',
  name: '젠레스 존 제로',
  source: 'https://static.nanoka.cc/zzz/{version}/character.json',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const IMG = 'https://enka.network/ui/zzz'
const ELEM_KO = { 200: '물리', 201: '화염', 202: '얼음', 203: '전기', 205: '에테르' }
const TYPE_KO = { 1: '공격', 2: '격파', 3: '이상', 4: '지원', 5: '방어', 6: '강탈' }

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}
const slugify = s => (s || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || null

export async function fetchCharacters() {
  const manifest = await getJson('https://static.nanoka.cc/manifest.json')
  const version = manifest?.zzz?.latest
  if (!version) throw new Error('manifest 에 zzz.latest 없음')
  const raw = await getJson(`https://static.nanoka.cc/zzz/${version}/character.json`)

  return Object.values(raw)
    .filter(c => c?.ko && c.ko.trim() && c.rank !== null && c.rank !== undefined)
    .map(c => ({
      nameKo: c.ko.trim(),
      nameEn: c.en || c.code || null,
      tier: c.rank === 4 ? 'S' : 'A',
      element: ELEM_KO[c.element] || null,
      weaponType: TYPE_KO[c.type] || null,        // 전문분야를 weaponType 컬럼에 (기존 규칙)
      imageUrl: c.icon ? `${IMG}/${String(c.icon).replace('IconRole', 'IconRoleSelect')}.png` : null,
      slug: slugify(c.en || c.code),
    }))
}
