// 소스 탐색 3차 — 러너 전용, DB 미변경.
//  ① 단빵숲 RSC 스트림에서 인격 데이터 추출 가능한지
//  ② 우마무스메 서포트 카드 "한국어 이름" 소스 (GameTora ko)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }
const get = async u => { const r = await fetch(u, { headers: H, redirect: 'follow' }); return { s: r.status, t: await r.text() } }

console.log('======== ① 단빵숲 RSC 스트림 ========')
{
  const { s, t } = await get('https://baslimbus.info/identity')
  console.log(`status=${s} ${t.length}B`)
  // self.__next_f.push([1,"...."]) 안의 문자열을 전부 이어붙여 원본 페이로드 복원
  const chunks = [...t.matchAll(/self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g)].map(m => m[1])
  console.log(`RSC 청크 ${chunks.length}개`)
  let payload = ''
  for (const c of chunks) { try { payload += JSON.parse(`"${c}"`) } catch { payload += c } }
  console.log(`복원 페이로드 ${payload.length}B`)

  // 인격 이름 후보 (실제 인격 표기: "LCB 인격 이스마엘", "죄악의 흐름" 등)
  for (const kw of ['죄악', '인격', 'sinner', 'identity', 'grade', '등급', 'season', '시즌']) {
    console.log(`  "${kw}" 등장 ${(payload.match(new RegExp(kw, 'g')) || []).length}회`)
  }
  // JSON 객체처럼 보이는 구간 샘플
  const objs = [...payload.matchAll(/\{"[a-zA-Z_]{2,20}":[^{}]{40,400}\}/g)].map(m => m[0])
  console.log(`  JSON 객체 후보 ${objs.length}개`)
  for (const o of objs.slice(0, 5)) console.log('   · ' + o.slice(0, 320))
  // 한국어가 들어간 객체만
  const koObjs = objs.filter(o => /[가-힣]/.test(o))
  console.log(`  그중 한국어 포함 ${koObjs.length}개`)
  for (const o of koObjs.slice(0, 6)) console.log('   ▸ ' + o.slice(0, 320))
}

console.log('\n\n======== ② GameTora 한국어 서포트 카드 ========')
{
  const { t } = await get('https://gametora.com/ko/umamusume/supports')
  const m = t.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!m) { console.log('  __NEXT_DATA__ 없음') }
  else {
    let d = null
    try { d = JSON.parse(m[1]) } catch (e) { console.log('  파싱 실패 ' + e.message) }
    if (d) {
      const pp = d?.props?.pageProps || {}
      console.log(`  pageProps 키: ${Object.keys(pp).join(', ')}`)
      for (const [k, v] of Object.entries(pp)) {
        if (Array.isArray(v)) {
          console.log(`   · ${k}: 배열 ${v.length}개, 첫 항목 키 ${Object.keys(v[0] || {}).slice(0, 15).join(',')}`)
          console.log(`     샘플 ${JSON.stringify(v.slice(0, 2)).slice(0, 700)}`)
        } else if (v && typeof v === 'object') {
          console.log(`   · ${k}: 객체 키 ${Object.keys(v).slice(0, 15).join(',')}`)
        }
      }
      console.log(`  buildId=${d.buildId}`)
    }
  }
  // GameTora 는 별도 정적 데이터 파일을 쓸 수 있다
  for (const p of [
    '/data/umamusume/supports.json',
    '/data/umamusume/support_cards.json',
    '/db/umamusume/supports.json',
    '/data/ko/umamusume/supports.json',
  ]) {
    const r = await get(`https://gametora.com${p}`)
    console.log(`  ${p} → ${r.s} ${r.t.length}B`)
  }
  // 개별 카드 상세 페이지에 한국어 이름이 SSR 되는지
  const d1 = await get('https://gametora.com/ko/umamusume/supports/30028-kitasan-black')
  console.log(`  카드 상세 → ${d1.s} ${d1.t.length}B`)
  const ko = [...new Set((d1.t.match(/[가-힣][가-힣\s]{1,20}/g) || []))].slice(0, 40)
  console.log(`  한국어 토큰: ${ko.join(' | ')}`)
}
