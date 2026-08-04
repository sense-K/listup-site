// 명일방주 — Kengxxiao/ArknightsGameData_YoStar (한국어 공식 게임데이터 미러)
// 이미지: yuanyan3060/ArknightsGameResource (아바타)
// 게임이 아직 비활성(isActive=false)이어도 캐릭터를 미리 채워두면 활성화 즉시 거래소가 돌아간다.

export const meta = {
  slug: 'arknights',
  name: '명일방주',
  source: 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main/ko_KR/gamedata/excel/character_table.json',
}

const IMG = 'https://raw.githubusercontent.com/yuanyan3060/ArknightsGameResource/main/avatar'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const JOB_KO = {
  PIONEER: '뱅가드', WARRIOR: '가드', DEFENDER: '디펜더', SNIPER: '스나이퍼',
  CASTER: '캐스터', MEDIC: '메딕', SUPPORT: '서포터', SPECIAL: '스페셜리스트',
}
const TIER = { TIER_6: '6성', TIER_5: '5성', TIER_4: '4성', TIER_3: '3성', TIER_2: '2성', TIER_1: '1성' }

const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || null

export async function fetchCharacters() {
  const r = await fetch(meta.source, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`${r.status} character_table.json`)
  const table = await r.json()

  return Object.entries(table)
    // char_ 로 시작하는 것만 (토큰·트랩 제외) + 획득 불가 제외
    .filter(([id, c]) => id.startsWith('char_') && c?.name && !c.isNotObtainable)
    .map(([id, c]) => ({
      nameKo: String(c.name).trim(),
      nameEn: c.appellation || null,
      tier: TIER[c.rarity] || '',
      weaponType: JOB_KO[c.profession] || null,   // 직업을 weaponType 컬럼에 (다른 게임 규칙과 동일)
      imageUrl: `${IMG}/${id}.png`,
      slug: slugify(c.appellation) || slugify(id.replace(/^char_\d+_/, '')),
      metadata: { charId: id, position: c.position || null },
    }))
}
