// 붕괴 스타레일 — StarRailRes GitHub 공개 데이터
// admin "스타레일 V2 등록" 과 같은 소스·같은 매핑. 신캐릭터 감지용 기본 필드만 다룬다.
// (스킬·성흔 상세는 admin "상세정보 동기화" 버튼이 계속 담당)

export const meta = {
  slug: 'starrail',
  name: '붕괴 스타레일',
  source: 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/kr/characters.json',
}

const CDN = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const PATH_KO = {
  Warrior: '파멸', Rogue: '수렵', Mage: '지식', Shaman: '화합',
  Warlock: '공허', Knight: '보존', Priest: '풍요', Memory: '기억', Elation: '환락',
}
const ELEM_KO = {
  Physical: '물리', Fire: '화염', Ice: '얼음', Thunder: '번개',
  Wind: '바람', Quantum: '양자', Imaginary: '허수',
}
// 개척자(주인공) — slug 중복 + 보유 캐릭터 개념이 아님
const EXCLUDE = new Set(['8001','8002','8003','8004','8005','8006','8007','8008','8009','8010'])

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

export async function fetchCharacters() {
  const [kr, en] = await Promise.all([
    getJson(meta.source),
    getJson(`${CDN}/index_min/en/characters.json`),
  ])
  return Object.entries(kr)
    .filter(([id, c]) => !EXCLUDE.has(String(id)) && c?.name && c.name.trim() && c.name !== '{NICKNAME}')
    .map(([id, c]) => {
      const nameEn = en[id]?.name || null
      return {
        nameKo: c.name.trim(),
        nameEn,
        tier: Number(c.rarity) >= 5 ? 'S' : 'A',
        element: ELEM_KO[c.element] || null,
        weaponType: PATH_KO[c.path] || null,       // 운명의 길을 weaponType 컬럼에 (기존 규칙)
        imageUrl: c.preview ? `${CDN}/${c.preview}` : null,
      }
    })
}
