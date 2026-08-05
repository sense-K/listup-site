// 명일방주 엔드필드 — 3aKHP/EndFieldGameData (게임 클라이언트 추출 JSON 미러, GitHub Releases 배포)
// CharacterTable.json 의 이름·성우 등 문자열은 i18n 해시 키 → i18n/KR.json 에서 조인.
// 이미지: 저장소 자체 호스팅 (img/characters/endfield/{slug}.png → resetlist.kr 서빙)
//   — ops/import/endfield-images.mjs 가 위키에서 받아 repo 에 커밋. 외부 핫링크 없음.

import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const meta = {
  slug: 'endfield',
  name: '명일방주 엔드필드',
  source: 'https://github.com/3aKHP/EndFieldGameData',
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
// 최신 릴리스에 endfield-tables.zip 이 없을 수 있어(월드뷰/스토리 번들 릴리스) 목록에서 찾고, 실패 시 고정 버전
const FALLBACK_ZIP = 'https://github.com/3aKHP/EndFieldGameData/releases/download/v0.2.0/endfield-tables.zip'

const TYPE_KO = { Physical: '물리', Fire: '열기', Cryst: '냉기', Pulse: '전기', Natural: '자연' }
const PROF_KO = { 0: '가드', 2: '디펜더', 4: '서포터', 5: '캐스터', 7: '뱅가드', 8: '스트라이커' }
const TIER = { 6: '6성', 5: '5성', 4: '4성' }

const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || null

async function findTablesZipUrl() {
  try {
    const r = await fetch('https://api.github.com/repos/3aKHP/EndFieldGameData/releases?per_page=20',
      { headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' } })
    if (!r.ok) throw new Error(`releases API ${r.status}`)
    for (const rel of await r.json()) {
      const asset = (rel.assets || []).find(a => a.name === 'endfield-tables.zip')
      if (asset) return asset.browser_download_url
    }
  } catch (e) {
    console.log(`  릴리스 목록 조회 실패(${e.message}) → 고정 버전 사용`)
  }
  return FALLBACK_ZIP
}

export async function fetchCharacters() {
  const url = await findTablesZipUrl()
  console.log(`  zip: ${url}`)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} endfield-tables.zip`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1000_000) throw new Error(`zip 이 너무 작음 (${buf.length}B) — 릴리스 구조 변경 의심`)

  const dir = mkdtempSync(join(tmpdir(), 'ef-'))
  writeFileSync(join(dir, 'ef.zip'), buf)
  execSync(`unzip -o -q ${join(dir, 'ef.zip')} -d ${dir}`)

  // 문자열 해시 키가 int64 (JS Number 정밀도 2^53 초과) → 그대로 parse 하면 끝자리가 깨져
  // i18n 조인이 전부 실패한다. 15자리 이상 정수를 문자열로 감싼 뒤 parse.
  const parseBigSafe = txt => JSON.parse(txt.replace(/([:\[,]\s*)(-?\d{15,})(?=\s*[,}\]])/g, '$1"$2"'))
  const table = parseBigSafe(readFileSync(join(dir, 'tables', 'CharacterTable.json'), 'utf8'))
  const kr = JSON.parse(readFileSync(join(dir, 'i18n', 'KR.json'), 'utf8'))

  const rows = []
  for (const [id, c] of Object.entries(table)) {
    if (!c || c.engName === 'Endministrator') continue   // 주인공(관리자) 남/여/공용 3종 제외
    const nameKo = kr[String(c.name?.id)]
    if (!nameKo) continue                                 // 한국어 이름 없으면 미출시로 간주
    const slug = slugify(c.engName) || slugify(id.replace(/^chr_\d+_/, ''))
    rows.push({
      nameKo: String(nameKo).trim(),
      nameEn: c.engName || null,
      tier: TIER[c.rarity] || '',
      element: TYPE_KO[c.charTypeId] || null,
      weaponType: PROF_KO[c.profession] || null,          // 직업을 weaponType 컬럼에 (다른 게임 규칙과 동일)
      imageUrl: `https://resetlist.kr/img/characters/endfield/${slug}.png`,
      slug,
      metadata: { charId: id, department: c.department || null },
    })
  }
  return rows
}
