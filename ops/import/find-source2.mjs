// 카제나 카드 DB 추출 가능성 검증 — 러너 전용, DB 미변경. [fs2]
//
// 3차까지 확인된 것: czncompass 의 JS 청크 617bed1dd2e06513.js (4.7MB) 안에
// 카드/이벤트/보상 데이터가 5개 언어(default·ko·en·ja·zhs·zht)로 박혀 있다.
// 이번엔 "실제로 구조화된 카드 목록을 뽑을 수 있는가" 를 본다.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// 청크 파일명은 빌드마다 바뀌므로 /ko 에서 목록을 얻어 가장 큰 것을 고른다
const home = await (await fetch('https://www.czncompass.com/ko', { headers: { 'User-Agent': UA } })).text()
const chunkPaths = [...new Set([...home.matchAll(/["'](\/_next\/static\/chunks\/[\w.-]+\.js)["']/g)].map(m => m[1]))]
console.log(`청크 후보 ${chunkPaths.length}개`)

let best = { len: 0 }
for (const p of chunkPaths) {
  try {
    const t = await (await fetch(`https://www.czncompass.com${p}`, { headers: { 'User-Agent': UA } })).text()
    if (t.length > best.len && /"ko":/.test(t)) best = { len: t.length, path: p, text: t }
  } catch {}
}
console.log(`가장 큰 다국어 청크: ${best.path} (${best.len}B)\n`)
const T = best.text || ''

// ── 다국어 이름 객체를 전부 수집: {"default":"...","ko":"...","en":"...","ja":"..."}
const nameObjs = []
const re = /\{"default":"((?:[^"\\]|\\.)*)","ko":"((?:[^"\\]|\\.)*)","en":"((?:[^"\\]|\\.)*)"/g
let m
while ((m = re.exec(T)) !== null) {
  const dec = s => { try { return JSON.parse(`"${s}"`) } catch { return s } }
  nameObjs.push({ def: dec(m[1]), ko: dec(m[2]), en: dec(m[3]), at: m.index })
}
console.log(`다국어 문자열 객체 ${nameObjs.length}개`)
console.log('  예시 10개:')
for (const o of nameObjs.slice(0, 10)) console.log(`    ko="${o.ko.slice(0, 40)}"  en="${o.en.slice(0, 40)}"`)

// ── 카드로 보이는 레코드: id 와 다국어 name 이 붙어 있는 패턴
console.log('\n── 카드 레코드 패턴 탐색')
const PATTERNS = [
  ['dbid_ 필터',   /"filter_id":"(dbid_[\w]+)"/g],
  ['card id',      /"card_id":"([\w-]+)"/g],
  ['id=card_',     /"id":"(card_[\w-]+)"/g],
  ['id=neutral_',  /"id":"(neutral_[\w-]+)"/g],
  ['id=uk_ (고유)', /"id":"(uk_[\w-]+)"/g],
  ['type CARD_',   /"type":"(CARD_[\w]+)"/g],
]
for (const [label, rx] of PATTERNS) {
  const all = [...T.matchAll(rx)].map(x => x[1])
  const uniq = [...new Set(all)]
  console.log(`  ${label.padEnd(14)} ${String(uniq.length).padStart(5)}종 (총 ${all.length}회)  예: ${uniq.slice(0, 6).join(', ').slice(0, 130)}`)
}

// ── 카드 종류 키워드가 실제로 데이터에 붙어 나오는지
console.log('\n── 카드 종류별 등장')
for (const [ko, en] of [['중립','Neutral'], ['몬스터','Monster'], ['금기','Forbidden'],
                        ['고유','Unique'], ['기본','Basic'], ['번뜩임','Epiphany'], ['페르소나','Persona'], ['각인','Engrav']]) {
  const c = (T.match(new RegExp(`"ko":"[^"]*${ko}[^"]*"`, 'g')) || []).length
  console.log(`  ${ko.padEnd(5)} / ${en.padEnd(10)} ko 문자열 ${c}건`)
}

// ── 가장 그럴듯한 카드 배열 덩어리 한 곳을 통째로 보여준다
console.log('\n── 카드 레코드 실물 샘플')
const anchor = T.indexOf('"card_id"') >= 0 ? T.indexOf('"card_id"')
              : T.indexOf('dbid_neutral') >= 0 ? T.indexOf('dbid_neutral') : -1
if (anchor > 0) console.log(T.slice(Math.max(0, anchor - 700), anchor + 900).replace(/\s+/g, ' '))
else console.log('  카드 앵커를 못 찾음')

// ── 이미지 CDN 에 카드 이미지가 있는지
console.log('\n── 카드 이미지 경로')
const imgs = [...new Set([...T.matchAll(/assets\.czncompass\.com\/[\w/.-]+/g)].map(x => x[0]))]
console.log(`  assets 경로 ${imgs.length}종`)
for (const u of imgs.filter(u => /card/i.test(u)).slice(0, 10)) console.log(`    ${u}`)
if (!imgs.some(u => /card/i.test(u))) console.log(`    (card 포함 경로 없음) 전체 예: ${imgs.slice(0, 6).join('  ')}`)
