const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const listingId = url.searchParams.get('id')
  const accept = request.headers.get('Accept') || ''

  // ID 없거나 봇/스크래퍼 아닌 경우는 정적 파일 그대로 서빙
  if (!listingId) {
    return env.ASSETS.fetch(request)
  }

  try {
    const apiUrl = `${SUPABASE_URL}/rest/v1/Listing?id=eq.${encodeURIComponent(listingId)}&select=price,status,game:Game(nameKo,artImageUrl,imageUrl),server:Server(nameKo),characters:ListingCharacter(character:Character(nameKo))&limit=1`

    const res = await fetch(apiUrl, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json',
      }
    })

    const listings = await res.json()
    const listing = listings?.[0]

    if (!listing) {
      return env.ASSETS.fetch(request)
    }

    const gameName = listing.game?.nameKo ?? '리세계'
    const serverName = listing.server?.nameKo ?? ''
    const price = Number(listing.price).toLocaleString('ko-KR')
    const chars = (listing.characters ?? [])
      .map(lc => lc.character?.nameKo)
      .filter(Boolean)
    const artImageUrl = listing.game?.artImageUrl ?? listing.game?.imageUrl ?? ''

    const title = `${gameName} 리세계 판매계정 · ${price}원 | 리세리스트`
    const descParts = []
    if (serverName) descParts.push(`서버: ${serverName}`)
    if (chars.length > 0) {
      const preview = chars.slice(0, 6).join(', ')
      const extra = chars.length > 6 ? ` 외 ${chars.length - 6}개` : ''
      descParts.push(`보유 캐릭터: ${preview}${extra}`)
    }
    const description = descParts.join(' | ')
    const pageUrl = `https://resetlist.kr/listing/?id=${listingId}`

    const ogTags = `
  <meta property="og:type" content="product">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:site_name" content="리세리스트">
  ${artImageUrl ? `<meta property="og:image" content="${esc(artImageUrl)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${artImageUrl ? `<meta name="twitter:image" content="${esc(artImageUrl)}">` : ''}
  <meta name="description" content="${esc(description)}">`

    // 정적 HTML 가져와서 </head> 앞에 OG 태그 주입
    const assetReq = new Request(new URL('/listing/', url).toString(), { headers: request.headers })
    const htmlRes = await env.ASSETS.fetch(assetReq)
    let html = await htmlRes.text()
    html = html.replace('</head>', `${ogTags}\n</head>`)

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      }
    })
  } catch (e) {
    console.error('OG injection error:', e)
    return env.ASSETS.fetch(request)
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
