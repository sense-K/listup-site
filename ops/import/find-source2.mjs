// GameTora 한국어 서포트 카드 페이지에서 "카드 고유명" 위치 확인 — 러너 전용, DB 미변경.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// 같은 캐릭터의 SSR 여러 장 + 비교용 R 한 장
const CARDS = ['30028-kitasan-black', '30001-special-week', '30014-special-week', '10001-special-week']

for (const slug of CARDS) {
  const r = await fetch(`https://gametora.com/ko/umamusume/supports/${slug}`, { headers: H })
  const h = await r.text()
  console.log(`\n================ ${slug} [${r.status}] ${h.length}B`)
  const og = h.match(/<meta property="og:title" content="([^"]+)"/)
  console.log(`  og:title = ${og?.[1]}`)
  const desc = h.match(/<meta name="description" content="([^"]+)"/)
  console.log(`  description = ${desc?.[1]}`)

  // 한국어가 들어간 태그를 전부 뽑아 짧은 것부터 (카드 고유명 후보)
  const tags = [...h.matchAll(/<(h[1-6]|div|span|p)[^>]*>([^<>{}]{2,40})<\/\1>/g)]
    .map(m => [m[1], m[2].trim()])
    .filter(([, v]) => /[가-힣]/.test(v))
  const seen = new Set()
  const uniq = tags.filter(([t, v]) => { const k = t + '|' + v; if (seen.has(k)) return false; seen.add(k); return true })
  console.log(`  한국어 태그 ${uniq.length}개 (앞 18개):`)
  for (const [t, v] of uniq.slice(0, 18)) console.log(`    <${t}> ${v}`)

  // og:title 의 캐릭터명을 뺀, 그 근처에 나오는 다른 한국어 문구 = 카드 고유명일 가능성
  const charName = og?.[1]?.split(' (')[0]
  if (charName) {
    const i = h.indexOf(charName)
    if (i > 0) console.log(`\n  "${charName}" 첫 등장 주변:\n    ${h.slice(i - 500, i + 300).replace(/\s+/g, ' ')}`)
  }
  await sleep(250)
}
