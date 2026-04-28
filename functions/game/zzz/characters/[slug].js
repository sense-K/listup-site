const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'
const ZZZ_GAME_ID = 'a7373b76-ee03-4dda-809f-1ccb7c5aa4be'

const ELEM_COLOR = {
  '물리': '#a8a8a8', '화염': '#ed7d31', '얼음': '#5dc1f4',
  '전기': '#fbbf24', '에테르': '#c084fc',
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function supaGet(path) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

function respond404(msg) {
  return new Response(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>캐릭터를 찾을 수 없어요 | 플레이센스</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div id="navbar-container"></div>
<div style="max-width:560px;margin:80px auto;padding:20px;text-align:center;">
  <div style="font-size:48px;margin-bottom:16px;">😔</div>
  <h1 style="font-size:20px;font-weight:800;color:#1e293b;margin-bottom:8px;">캐릭터를 찾을 수 없어요</h1>
  <p style="color:#64748b;font-size:14px;margin-bottom:24px;">${esc(msg)}</p>
  <a href="/game/zzz/characters/" style="display:inline-block;padding:12px 24px;background:#6c47ff;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">← 젠레스 캐릭터 도감</a>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI('zzz')
</script>
</body>
</html>`, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function onRequest({ params }) {
  const slug = params.slug ?? ''
  if (!/^[a-z0-9-]+$/.test(slug)) return respond404(`유효하지 않은 주소예요.`)

  const rows = await supaGet(
    `Character?slug=eq.${encodeURIComponent(slug)}&gameId=eq.${ZZZ_GAME_ID}` +
    `&isActive=eq.true&select=id,nameKo,nameEn,tier,element,weaponType,slug,imageUrl,metadata&limit=1`
  )
  if (!rows?.[0]) return respond404(`'${esc(slug)}' 캐릭터를 찾을 수 없어요.`)

  const c = rows[0]
  const meta = (typeof c.metadata === 'object' && c.metadata !== null) ? c.metadata : {}
  const tierLabel = c.tier === 'S' ? 'S급' : 'A급'
  const elemColor = ELEM_COLOR[c.element] || '#6c47ff'
  const canonical = `https://resetlist.kr/game/zzz/characters/${slug}/`

  // 같은 원소 추천
  let related = []
  if (c.element) {
    const relRows = await supaGet(
      `Character?gameId=eq.${ZZZ_GAME_ID}&element=eq.${encodeURIComponent(c.element)}` +
      `&id=neq.${c.id}&isActive=eq.true&select=nameKo,slug,imageUrl,tier&limit=8`
    )
    related = (relRows || []).sort(() => Math.random() - 0.5).slice(0, 4)
  }

  // 거래 통계
  const lcRows = await supaGet(
    `ListingCharacter?characterId=eq.${c.id}&select=listing:Listing!inner(id,price,status)&limit=200`
  )
  const activePrices = (lcRows || [])
    .map(lc => lc.listing)
    .filter(l => l?.status === 'active')
    .map(l => Number(l.price))
  const tradeStats = {
    active_count: activePrices.length,
    min_price: activePrices.length ? Math.min(...activePrices) : null,
    max_price: activePrices.length ? Math.max(...activePrices) : null,
  }
  const fmt = n => n != null ? Number(n).toLocaleString('ko-KR') : ''

  // SEO
  const nameDisplay = c.nameEn ? `${c.nameKo} (${c.nameEn})` : c.nameKo
  const attrStr = [c.element ? `${c.element}속성` : '', c.weaponType].filter(Boolean).join(' ')
  const tradePrefix = tradeStats.active_count > 0
    ? `보유 계정 ${tradeStats.active_count}개 거래중 · `
    : ''
  const tradeSuffix = tradeStats.active_count > 0
    ? ` ${c.nameKo} 보유 계정 ${tradeStats.active_count}개가 ${fmt(tradeStats.min_price)}원~${fmt(tradeStats.max_price)}원에 판매 중.`
    : ''
  const title = `${nameDisplay} — ${tradePrefix}젠레스 존 제로 ${tierLabel} ${attrStr} 정보 | 플레이센스`
  const desc = [
    `${c.nameKo} 캐릭터 정보, 스킬 효과, 마인드스케이프 6개 효과.`,
    ` 젠레스 존 제로 ${tierLabel} ${attrStr} 전문.`,
  ].join('') + tradeSuffix
  const keywords = `${c.nameKo}, 젠레스 ${c.nameKo}, 젠레스 ${c.nameKo} 정보, 젠레스 ${c.nameKo} 스킬, 젠레스 ${tierLabel} ${c.element || ''}속성, ${c.nameEn || ''}`

  const jsonLdArr = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: `젠레스 존 제로 ${c.nameKo} 캐릭터 정보`,
      image: c.imageUrl || '',
      author: { '@type': 'Organization', name: '플레이센스' },
      publisher: { '@type': 'Organization', name: '플레이센스', url: 'https://resetlist.kr/' },
      description: desc,
      mainEntityOfPage: canonical,
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://resetlist.kr/' },
        { '@type': 'ListItem', position: 2, name: '젠레스 존 제로', item: 'https://resetlist.kr/game/zzz/' },
        { '@type': 'ListItem', position: 3, name: '캐릭터 도감', item: 'https://resetlist.kr/game/zzz/characters/' },
        { '@type': 'ListItem', position: 4, name: c.nameKo },
      ],
    },
  ]

  // 스킬 (metadata.skills[].type 이미 한국어)
  const skillsHtml = meta.skills?.length
    ? meta.skills.map((s, i) => `
      <details class="gc-skill"${i === 0 ? ' open' : ''}>
        <summary class="gc-skill-head">
          <span class="gc-skill-type">${esc(s.type)}</span>
          <span class="gc-skill-name">${esc(s.name)}</span>
          <span class="gc-skill-arrow">▾</span>
        </summary>
        <div class="gc-skill-body"><p>${esc(s.desc).replace(/\n/g, '<br>')}</p></div>
      </details>`).join('')
    : '<p class="gc-empty">스킬 정보 준비 중이에요.</p>'

  // 마인드스케이프 (meta.mindscapes, "N성" 라벨)
  const mindscapesHtml = meta.mindscapes?.length
    ? `<div class="gc-const-grid">${meta.mindscapes.map(m => `
      <div class="gc-const-card">
        <div class="gc-const-head">
          <span class="gc-const-rank" style="background:${elemColor}22;color:${elemColor};">${m.rank}성</span>
          <span class="gc-const-name">${esc(m.name)}</span>
        </div>
        <p class="gc-const-desc">${esc(m.desc).replace(/\n/g, '<br>')}</p>
      </div>`).join('')}</div>`
    : '<p class="gc-empty">마인드스케이프 정보 준비 중이에요.</p>'

  // 추천 캐릭터
  const relatedHtml = related.length
    ? `<div class="gc-rel-grid">${related.map(r => `
      <a class="gc-rel-card" href="/game/zzz/characters/${esc(r.slug)}/">
        <div class="gc-rel-img">
          ${r.imageUrl ? `<img src="${esc(r.imageUrl)}" alt="${esc(r.nameKo)}" loading="lazy">` : ''}
          <span class="gc-badge badge-${esc(r.tier)}">${r.tier}</span>
        </div>
        <div class="gc-rel-name">${esc(r.nameKo)}</div>
      </a>`).join('')}</div>`
    : ''

  // 추가 정보 (camp, hitType)
  const infoRows = [
    meta.camp    ? `<tr><th>소속</th><td>${esc(meta.camp)}</td></tr>` : '',
    meta.hitType ? `<tr><th>공격 타입</th><td>${esc(meta.hitType)}</td></tr>` : '',
  ].filter(Boolean).join('')

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="shortcut icon" href="/favicon.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="keywords" content="${esc(keywords)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="플레이센스">
  ${c.imageUrl ? `<meta property="og:image" content="${esc(c.imageUrl)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  ${c.imageUrl ? `<meta name="twitter:image" content="${esc(c.imageUrl)}">` : ''}
  <script type="application/ld+json">${JSON.stringify(jsonLdArr[0])}</script>
  <script type="application/ld+json">${JSON.stringify(jsonLdArr[1])}</script>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .gc-wrap { max-width: 900px; margin: 0 auto; padding: 20px 16px 60px; }

    .gc-breadcrumb { display:flex; align-items:center; gap:6px; font-size:13px; color:#94a3b8; margin-bottom:20px; }
    .gc-breadcrumb a { color:#64748b; text-decoration:none; }
    .gc-breadcrumb a:hover { color:#6c47ff; }
    .gc-breadcrumb span { color:#cbd5e1; }

    .gc-hero { display:grid; grid-template-columns:2fr 3fr; gap:32px; margin-bottom:40px; align-items:start; }
    @media(max-width:640px){ .gc-hero { grid-template-columns:1fr; gap:20px; } }

    .gc-hero-img {
      border-radius:20px; overflow:hidden; aspect-ratio:1;
      background:linear-gradient(160deg,${elemColor}33 0%,#1a1a2e 100%);
    }
    .gc-hero-img img { width:100%; height:100%; object-fit:cover; object-position:top center; display:block; }

    .gc-char-name { font-size:28px; font-weight:900; color:#1e293b; margin:0 0 2px; }
    .gc-char-en   { font-size:14px; color:#94a3b8; margin:0 0 12px; }
    .gc-badges    { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
    .gc-badge     { font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; }
    .badge-S      { background:linear-gradient(135deg,#fbbf24,#f59e0b); color:#78350f; }
    .badge-A      { background:linear-gradient(135deg,#a78bfa,#8b5cf6); color:#fff; }
    .gc-attrs     { font-size:14px; color:#475569; margin:0 0 10px; }
    .gc-info-table { width:100%; border-collapse:collapse; font-size:13px; }
    .gc-info-table th { text-align:left; color:#94a3b8; font-weight:600; padding:4px 12px 4px 0; width:90px; white-space:nowrap; }
    .gc-info-table td { color:#1e293b; padding:4px 0; }

    .gc-h2 { font-size:18px; font-weight:800; color:#1e293b; margin:40px 0 16px; padding-bottom:10px; border-bottom:2px solid #e5e7eb; }

    .gc-skill { border:1px solid #e5e7eb; border-radius:12px; margin-bottom:8px; overflow:hidden; background:#fff; }
    .gc-skill-head { display:flex; align-items:center; gap:10px; padding:14px 16px; cursor:pointer; list-style:none; user-select:none; }
    .gc-skill-head::-webkit-details-marker { display:none; }
    .gc-skill[open] .gc-skill-head { background:#f8fafc; border-bottom:1px solid #e5e7eb; }
    .gc-skill-type { font-size:11px; font-weight:700; color:#fff; background:${elemColor}; padding:2px 8px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
    .gc-skill-name { font-size:15px; font-weight:700; color:#1e293b; flex:1; }
    .gc-skill-arrow { font-size:12px; color:#94a3b8; transition:transform 0.2s; flex-shrink:0; }
    .gc-skill[open] .gc-skill-arrow { transform:rotate(180deg); }
    .gc-skill-body { padding:16px; font-size:14px; color:#374151; line-height:1.8; }
    .gc-skill-body p { margin:0; }

    .gc-const-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media(max-width:600px){ .gc-const-grid { grid-template-columns:1fr; } }
    .gc-const-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:16px; }
    .gc-const-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
    .gc-const-rank { font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; white-space:nowrap; }
    .gc-const-name { font-size:15px; font-weight:700; color:#1e293b; }
    .gc-const-desc { font-size:13px; color:#374151; line-height:1.7; margin:0; }

    .gc-rel-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    @media(max-width:600px){ .gc-rel-grid { grid-template-columns:repeat(2,1fr); } }
    .gc-rel-card { text-decoration:none; color:inherit; border:1.5px solid #e5e7eb; border-radius:14px; overflow:hidden; background:#fff; transition:box-shadow 0.15s,transform 0.15s; display:block; }
    .gc-rel-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); transform:translateY(-2px); }
    .gc-rel-img { aspect-ratio:1; background:linear-gradient(160deg,#1a1a2e,#16213e); position:relative; overflow:hidden; }
    .gc-rel-img img { width:100%; height:100%; object-fit:cover; object-position:top; display:block; }
    .gc-rel-img .gc-badge { position:absolute; top:5px; left:5px; }
    .gc-rel-name { font-size:12px; font-weight:700; color:#1e293b; padding:6px 8px 8px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .gc-bottom-links { display:flex; gap:10px; flex-wrap:wrap; margin-top:48px; padding-top:24px; border-top:1px solid #e5e7eb; }
    .gc-link { display:inline-flex; align-items:center; padding:10px 18px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:700; transition:transform 0.15s; }
    .gc-link:hover { transform:translateY(-1px); }
    .gc-link-primary { background:#6c47ff; color:#fff; }
    .gc-link-sec { background:#f1f5f9; color:#1e293b; border:1px solid #e5e7eb; }

    .gc-empty { color:#94a3b8; font-size:14px; padding:20px 0; margin:0; }

    .tw-stats { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:4px; }
    @media(max-width:600px){ .tw-stats { grid-template-columns:1fr; } }
  </style>
</head>
<body>
<div id="navbar-container"></div>

<main class="gc-wrap">

  <nav class="gc-breadcrumb" aria-label="breadcrumb">
    <a href="/">홈</a><span>›</span>
    <a href="/game/zzz/">젠레스 존 제로</a><span>›</span>
    <a href="/game/zzz/characters/">캐릭터 도감</a><span>›</span>
    <span style="color:#1e293b;font-weight:600;">${esc(c.nameKo)}</span>
  </nav>

  <section class="gc-hero">
    <div class="gc-hero-img">
      ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="${esc(c.nameKo)}" fetchpriority="high">` : ''}
    </div>
    <div>
      <h1 class="gc-char-name">${esc(c.nameKo)}</h1>
      ${c.nameEn ? `<p class="gc-char-en">${esc(c.nameEn)}</p>` : ''}
      <div class="gc-badges">
        <span class="gc-badge badge-${esc(c.tier)}">${tierLabel}</span>
        ${c.element ? `<span style="font-size:13px;font-weight:700;color:${elemColor};">${esc(c.element)}속성</span>` : ''}
      </div>
      <p class="gc-attrs">${[c.element ? `${c.element}속성` : '', c.weaponType ? `전문분야: ${c.weaponType}` : ''].filter(Boolean).map(esc).join(' · ')}</p>
      ${infoRows ? `<table class="gc-info-table" style="margin-top:12px;"><tbody>${infoRows}</tbody></table>` : ''}
    </div>
  </section>

  ${tradeStats.active_count > 0 ? `
  <section class="trade-widget" style="margin:32px 0;padding:28px;background:linear-gradient(135deg,#1e293b,#334155);color:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.15);">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <span style="font-size:28px;">💰</span>
      <h2 style="margin:0;font-size:22px;font-weight:700;">${esc(c.nameKo)} 보유 계정 거래</h2>
    </div>
    <div class="tw-stats">
      <div style="background:rgba(255,255,255,0.08);padding:16px;border-radius:10px;">
        <div style="font-size:13px;opacity:0.7;margin-bottom:6px;">현재 판매중</div>
        <div style="font-size:28px;font-weight:800;">${tradeStats.active_count}<span style="font-size:16px;opacity:0.7;"> 개</span></div>
      </div>
      <div style="background:rgba(255,255,255,0.08);padding:16px;border-radius:10px;">
        <div style="font-size:13px;opacity:0.7;margin-bottom:6px;">가격대</div>
        <div style="font-size:18px;font-weight:700;">${fmt(tradeStats.min_price)}원${tradeStats.min_price !== tradeStats.max_price ? ` ~ ${fmt(tradeStats.max_price)}원` : ''}</div>
      </div>
    </div>
    <a href="/trade/zzz/?character=${esc(slug)}"
       style="display:block;text-align:center;padding:14px;background:#f59e0b;color:#1e293b;font-weight:700;font-size:16px;border-radius:10px;text-decoration:none;margin-top:20px;">
      → ${esc(c.nameKo)} 보유 계정 보러가기
    </a>
    <p style="margin:12px 0 0;font-size:12px;opacity:0.6;text-align:center;">※ 가격은 ${esc(c.nameKo)}을(를) 보유한 전체 계정 기준입니다</p>
  </section>` : `
  <section style="margin:32px 0;padding:28px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:16px;border:1px dashed #f59e0b;">
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🌟</div>
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#78350f;">${esc(c.nameKo)} 보유 계정이 아직 없어요</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#92400e;">${esc(c.nameKo)}을(를) 가진 계정의 첫 판매자가 되어보세요</p>
      <a href="/trade/register/?game=zzz"
         style="display:inline-block;padding:12px 28px;background:#f59e0b;color:#fff;font-weight:700;border-radius:10px;text-decoration:none;">
        판매계정 등록하기
      </a>
    </div>
  </section>`}

  <h2 class="gc-h2">⚔️ 스킬</h2>
  ${skillsHtml}

  <h2 class="gc-h2">✦ 마인드스케이프</h2>
  ${mindscapesHtml}

  ${related.length ? `
  <h2 class="gc-h2">같은 ${esc(c.element || '')}속성 캐릭터</h2>
  ${relatedHtml}` : ''}

  <div class="gc-bottom-links">
    <a href="/trade/zzz/"               class="gc-link gc-link-primary">⚡ 젠레스 거래소</a>
    <a href="/game/zzz/characters/"     class="gc-link gc-link-sec">← 캐릭터 도감</a>
    <a href="/trade/price/zzz/"         class="gc-link gc-link-sec">📊 젠레스 시세</a>
  </div>

</main>

<div id="footer-container"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI('zzz')
  document.getElementById('footer-container').innerHTML = typeof renderFooter === 'function' ? renderFooter() : ''
</script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
