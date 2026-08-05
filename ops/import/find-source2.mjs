// 소스 탐색 2차 — 러너 전용, DB 미변경.
//  ① 단빵숲 /identity HTML 구조 (SSR 이라 파싱 가능한지)
//  ② 우마무스메 서포트 카드 상세 + 한국어 이름 소스(카카오 공식)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

const get = async (url, asJson = false) => {
  const r = await fetch(url, { headers: H, redirect: 'follow' })
  const t = await r.text()
  return { ok: r.ok, status: r.status, text: t, json: asJson && r.ok ? (() => { try { return JSON.parse(t) } catch { return null } })() : null }
}

console.log('======== ① 단빵숲 /identity HTML 구조 ========')
{
  const r = await get('https://baslimbus.info/identity')
  const h = r.text
  console.log(`status=${r.status} size=${h.length}B`)
  for (const k of ['__NEXT_DATA__', '__NUXT__', '__INITIAL', 'self.__next_f', 'application/ld+json']) {
    console.log(`  ${k}: ${h.includes(k) ? 'YES' : 'no'}`)
  }
  // 인격 이름으로 쓰일 만한 반복 구조 찾기
  const known = ['이스마엘', '히스클리프', '돈키호테', '료슈', '뫼르소', '홍루', '싱클레어', '오티스', '그레고르', '파우스트', '단테']
  for (const n of known.slice(0, 4)) {
    const i = h.indexOf(n)
    console.log(`\n  "${n}" 위치 ${i}`)
    if (i > 0) console.log('  주변 HTML: ' + h.slice(Math.max(0, i - 400), i + 200).replace(/\s+/g, ' '))
  }
  // 이미지 CDN 파악
  const imgs = [...new Set([...h.matchAll(/src="([^"]+\.(?:png|webp|jpg))"/g)].map(m => m[1]))].slice(0, 8)
  console.log(`\n  이미지 예: ${imgs.join('\n            ')}`)
  // Next.js RSC 스트림이면 self.__next_f 안에 JSON 이 들어있다
  const rsc = [...h.matchAll(/self\.__next_f\.push\(\[1,"(.{0,300})/g)].slice(0, 2).map(m => m[1])
  if (rsc.length) console.log('\n  RSC 청크 샘플: ' + rsc.join('\n  ---\n'))
}

console.log('\n\n======== ② 우마무스메 서포트 카드 ========')
{
  const list = await get('https://umapyoi.net/api/v1/support', true)
  const arr = list.json || []
  console.log(`목록 ${arr.length}장`)
  for (const id of [10001, 30028]) {
    const d = await get(`https://umapyoi.net/api/v1/support/${id}`, true)
    console.log(`\n  /support/${id} → ${d.status}`)
    if (d.json) {
      console.log('  키: ' + Object.keys(d.json).join(', '))
      console.log('  값: ' + JSON.stringify(d.json).slice(0, 1200))
    }
  }
  // 이미지 후보
  for (const u of [
    'https://umapyoi.net/api/v1/support/image/10001',
    'https://gametora.com/images/umamusume/supports/support_thumb_10001.png',
    'https://gametora.com/images/umamusume/supports/tex_support_card_10001.png',
  ]) {
    const r = await fetch(u, { headers: H }).catch(e => ({ status: 'ERR ' + e.message }))
    console.log(`  이미지 ${r.status}  ${u}`)
  }
}

console.log('\n\n======== ③ 카카오 공식(한국어) 에 서포트 카드가 있나 ========')
{
  for (const v of ['20260112', '20260601', '20260801']) {
    const r = await get(`https://umamusume.kakaogames.com/assets/js/data.v5.js?v=${v}`)
    if (!r.ok) { console.log(`  v=${v} → ${r.status}`); continue }
    const t = r.text
    console.log(`  v=${v} → 200, ${t.length}B`)
    const vars = [...new Set([...t.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)].map(m => m[1]))]
    console.log(`  선언된 변수: ${vars.join(', ')}`)
    for (const kw of ['support', 'Support', '서포트', 'card', 'Card']) {
      console.log(`    "${kw}" 등장 ${(t.match(new RegExp(kw, 'g')) || []).length}회`)
    }
    break
  }
  // 카카오 공식 서포트 카드 페이지 자체
  for (const p of ['/support', '/card', '/supportcard', '/ko/support']) {
    const r = await get(`https://umamusume.kakaogames.com${p}`)
    console.log(`  ${p} → ${r.status} ${r.text.length}B`)
  }
}
