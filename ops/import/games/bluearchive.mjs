// 블루 아카이브 — SchaleDB 공개 데이터
//
// /game/bluearchive/students/ 도감이 이미 쓰는 것과 같은 소스·같은 필드 해석이다.
// SchaleDB 는 2025.06 아카이브됐지만 kr 데이터는 계속 접근 가능하다.
// (신규 학생이 안 들어올 수 있음 — 그때는 소스를 갈아야 한다)

export const meta = {
  slug: 'bluearchive',
  name: '블루 아카이브',
  source: 'https://raw.githubusercontent.com/SchaleDB/SchaleDB/main/data/kr/students.json',
}

const CDN = 'https://raw.githubusercontent.com/SchaleDB/SchaleDB/main'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// 도감 화면(game/bluearchive/students/index.html)과 같은 매핑을 쓴다
const SCHOOL_KO = {
  Abydos: '아비도스', Gehenna: '게헨나', Millennium: '밀레니엄', Trinity: '트리니티',
  Hyakkiyako: '백귀야행', Shanhaijing: '산해경', RedWinter: '붉은겨울', Valkyrie: '발키리',
  SRT: 'SRT', Arius: '아리우스', Highlander: '하이랜더', WildHunt: '와일드헌트',
  Tokiwadai: '토키와다이', Sakugawa: '사쿠가와', ETC: '기타',
}
const BULLET_KO = { Explosion: '폭발', Pierce: '관통', Mystic: '신비', Sonic: '진동' }
const ROLE_KO = { DamageDealer: '딜러', Tanker: '탱커', Healer: '힐러', Supporter: '서포터' }
const ARMOR_KO = { LightArmor: '경장갑', HeavyArmor: '중장갑', Unarmed: '특수장갑', ElasticArmor: '탄력장갑' }

export async function fetchCharacters() {
  const res = await fetch(meta.source, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`SchaleDB 응답 ${res.status}`)
  const all = await res.json()
  if (!Array.isArray(all)) throw new Error('배열이 아님 — 응답 구조가 바뀜')

  // 도감과 동일하게 KR 서버 출시분만
  const released = all.filter(s => s && s.IsReleased && s.IsReleased[0] === true)

  return released.map(s => ({
    nameKo: String(s.Name || '').trim(),
    // SchaleDB 의 kr 파일은 Name 이 한국어. 영문명은 PathName(파일명용 영문)에서 가져온다
    nameEn: s.PathName || s.DevName || null,
    // 기존 DB 가 tier 에 학교명을 쓰고 있어(GRADE_ORDER_MAP 이 학교 기준) 그 규칙을 따른다
    tier: SCHOOL_KO[s.School] || s.School || '',
    imageUrl: `${CDN}/images/student/icon/${s.Id}.webp`,
    slug: String(s.PathName || s.DevName || s.Id).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || null,
    metadata: {
      schaleId: s.Id,
      star: s.StarGrade,                              // 1~3성
      school: SCHOOL_KO[s.School] || s.School || null,
      bullet: BULLET_KO[s.BulletType] || s.BulletType || null,   // 폭발/관통/신비/진동
      armor: ARMOR_KO[s.ArmorType] || s.ArmorType || null,
      role: ROLE_KO[s.TacticRole] || s.TacticRole || null,       // 딜러/탱커/힐러/서포터
      position: s.Position || null,
      weapon: s.WeaponType || null,
      fullImageUrl: `${CDN}/images/student/collection/${s.Id}.webp`,
    },
  })).filter(r => r.nameKo)
}
