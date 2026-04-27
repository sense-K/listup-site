const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'
const GENSHIN_GAME_ID = 'd4b69d1d-7744-4c62-bd45-925c5bcdf1a6'

const ELEM_COLOR = {
  '불': '#ed7d31', '물': '#4a90e2', '바람': '#74c69d',
  '번개': '#b07ed4', '얼음': '#87cefa', '풀': '#82b366', '바위': '#d4a72c',
}
const SKILL_LABEL = {
  normal: '일반 공격', skill: '원소 전투 스킬', burst: '원소 폭발',
  passive1: '고유 특성 1', passive2: '고유 특성 2', passive3: '고유 특성 3',
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
  <a href="/game/genshin/characters/" style="display:inline-block;padding:12px 24px;background:#6c47ff;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">← 원신 캐릭터 도감</a>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI('genshin')
</script>
</body>
</html>`, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function onRequest({ params }) {
  const slug = params.slug ?? ''
  if (!/^[a-z0-9-]+$/.test(slug)) return respond404(`유효하지 않은 주소예요.`)

  // 캐릭터 조회
  const rows = await supaGet(
    `Character?slug=eq.${encodeURIComponent(slug)}&gameId=eq.${GENSHIN_GAME_ID}` +
    `&isActive=eq.true&select=id,nameKo,nameEn,tier,element,weaponType,region,slug,imageUrl,metadata&limit=1`
  )
  if (!rows?.[0]) return respond404(`'${esc(slug)}' 캐릭터를 찾을 수 없어요.`)

  const c = rows[0]
  const meta = (typeof c.metadata === 'object' && c.metadata !== null) ? c.metadata : {}
  const tierLabel = c.tier === 'S' ? '5성' : '4성'
  const elemColor = ELEM_COLOR[c.element] || '#6c47ff'
  const canonical = `https://resetlist.kr/game/genshin/characters/${slug}/`

  // 같은 원소 추천 (8개 가져와서 무작위 4개)
  let related = []
  if (c.element) {
    const relRows = await supaGet(
      `Character?gameId=eq.${GENSHIN_GAME_ID}&element=eq.${encodeURIComponent(c.element)}` +
      `&id=neq.${c.id}&isActive=eq.true&select=nameKo,slug,imageUrl,tier&limit=8`
    )
    related = (relRows || []).sort(() => Math.random() - 0.5).slice(0, 4)
  }

  // SEO
  const nameDisplay = c.nameEn ? `${c.nameKo} (${c.nameEn})` : c.nameKo
  const attrStr = [c.element ? `${c.element}속성` : '', c.weaponType].filter(Boolean).join(' ')
  const title = `${nameDisplay} — 원신 ${tierLabel} ${attrStr} 정보 | 플레이센스`
  const desc = [
    `${c.nameKo} 캐릭터 정보, 스킬 효과, 별자리 6개 효과.`,
    c.region ? ` ${c.region} 출신` : '',
    ` 원신 ${tierLabel} ${attrStr}.`,
    meta.title ? ` ${meta.title}.` : '',
  ].join('')
  const keywords = `${c.nameKo}, 원신 ${c.nameKo}, 원신 ${c.nameKo} 정보, 원신 ${c.nameKo} 스킬, 원신 ${c.nameKo} 별자리, 원신 ${tierLabel} ${c.element || ''}속성, ${c.nameEn || ''}`

  const jsonLdArr = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: `원신 ${c.nameKo} 캐릭터 정보`,
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
        { '@type': 'ListItem', position: 2, name: '원신', item: 'https://resetlist.kr/game/genshin/' },
        { '@type': 'ListItem', position: 3, name: '캐릭터 도감', item: 'https://resetlist.kr/game/genshin/characters/' },
        { '@type': 'ListItem', position: 4, name: c.nameKo },
      ],
    },
  ]

  // 스킬 HTML (details/summary 아코디언, 첫 번째만 open)
  const skillsHtml = meta.skills?.length
    ? meta.skills.map((s, i) => `
      <details class="gc-skill"${i === 0 ? ' open' : ''}>
        <summary class="gc-skill-head">
          <span class="gc-skill-type">${esc(SKILL_LABEL[s.type] || s.type)}</span>
          <span class="gc-skill-name">${esc(s.name)}</span>
          <span class="gc-skill-arrow">▾</span>
        </summary>
        <div class="gc-skill-body"><p>${esc(s.desc).replace(/\n/g, '<br>')}</p></div>
      </details>`).join('')
    : '<p class="gc-empty">스킬 정보 준비 중이에요.</p>'

  // 별자리 HTML (2열 그리드)
  const constsHtml = meta.constellations?.length
    ? `<div class="gc-const-grid">${meta.constellations.map(con => `
      <div class="gc-const-card">
        <div class="gc-const-head">
          <span class="gc-const-rank" style="background:${elemColor}22;color:${elemColor};">${con.rank}돌파</span>
          <span class="gc-const-name">${esc(con.name)}</span>
        </div>
        <p class="gc-const-desc">${esc(con.desc).replace(/\n/g, '<br>')}</p>
      </div>`).join('')}</div>`
    : '<p class="gc-empty">별자리 정보 준비 중이에요.</p>'

  // 같은 원소 추천 HTML
  const relatedHtml = related.length
    ? `<div class="gc-rel-grid">${related.map(r => `
      <a class="gc-rel-card" href="/game/genshin/characters/${esc(r.slug)}/">
        <div class="gc-rel-img">
          ${r.imageUrl ? `<img src="${esc(r.imageUrl)}" alt="${esc(r.nameKo)}" loading="lazy">` : ''}
          <span class="gc-badge badge-${esc(r.tier)}">${r.tier === 'S' ? '5성' : '4성'}</span>
        </div>
        <div class="gc-rel-name">${esc(r.nameKo)}</div>
      </a>`).join('')}</div>`
    : ''

  // 추가 정보 테이블 행
  const infoRows = [
    meta.birthday      ? `<tr><th>생일</th><td>${esc(meta.birthday)}</td></tr>` : '',
    meta.constellation ? `<tr><th>별자리</th><td>${esc(meta.constellation)}</td></tr>` : '',
    meta.affiliation   ? `<tr><th>소속</th><td>${esc(meta.affiliation)}</td></tr>` : '',
    meta.substat       ? `<tr><th>돌파 스탯</th><td>${esc(meta.substat)}</td></tr>` : '',
    meta.cv?.korean    ? `<tr><th>한국 성우</th><td>${esc(meta.cv.korean)}</td></tr>` : '',
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

    /* hero */
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
    .gc-title     { font-size:13px; color:#6c47ff; font-weight:600; margin:0 0 10px; }
    .gc-desc      { font-size:14px; color:#374151; line-height:1.7; margin:0 0 16px; }
    .gc-info-table { width:100%; border-collapse:collapse; font-size:13px; }
    .gc-info-table th { text-align:left; color:#94a3b8; font-weight:600; padding:4px 12px 4px 0; width:90px; white-space:nowrap; }
    .gc-info-table td { color:#1e293b; padding:4px 0; }

    /* section */
    .gc-h2 { font-size:18px; font-weight:800; color:#1e293b; margin:40px 0 16px; padding-bottom:10px; border-bottom:2px solid #e5e7eb; }

    /* skill accordion */
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

    /* constellations */
    .gc-const-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media(max-width:600px){ .gc-const-grid { grid-template-columns:1fr; } }
    .gc-const-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:16px; }
    .gc-const-head { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
    .gc-const-rank { font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; white-space:nowrap; }
    .gc-const-name { font-size:15px; font-weight:700; color:#1e293b; }
    .gc-const-desc { font-size:13px; color:#374151; line-height:1.7; margin:0; }

    /* related */
    .gc-rel-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    @media(max-width:600px){ .gc-rel-grid { grid-template-columns:repeat(2,1fr); } }
    .gc-rel-card { text-decoration:none; color:inherit; border:1.5px solid #e5e7eb; border-radius:14px; overflow:hidden; background:#fff; transition:box-shadow 0.15s,transform 0.15s; display:block; }
    .gc-rel-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); transform:translateY(-2px); }
    .gc-rel-img { aspect-ratio:1; background:linear-gradient(160deg,#1a1a2e,#16213e); position:relative; overflow:hidden; }
    .gc-rel-img img { width:100%; height:100%; object-fit:cover; object-position:top; display:block; }
    .gc-rel-img .gc-badge { position:absolute; top:5px; left:5px; }
    .gc-rel-name { font-size:12px; font-weight:700; color:#1e293b; padding:6px 8px 8px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    /* bottom links */
    .gc-bottom-links { display:flex; gap:10px; flex-wrap:wrap; margin-top:48px; padding-top:24px; border-top:1px solid #e5e7eb; }
    .gc-link { display:inline-flex; align-items:center; padding:10px 18px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:700; transition:transform 0.15s; }
    .gc-link:hover { transform:translateY(-1px); }
    .gc-link-primary { background:#6c47ff; color:#fff; }
    .gc-link-sec { background:#f1f5f9; color:#1e293b; border:1px solid #e5e7eb; }

    .gc-empty { color:#94a3b8; font-size:14px; padding:20px 0; margin:0; }
  </style>
</head>
<body>
<div id="navbar-container"></div>

<main class="gc-wrap">

  <nav class="gc-breadcrumb" aria-label="breadcrumb">
    <a href="/">홈</a><span>›</span>
    <a href="/game/genshin/">원신</a><span>›</span>
    <a href="/game/genshin/characters/">캐릭터 도감</a><span>›</span>
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
      <p class="gc-attrs">${[c.element, c.weaponType, c.region].filter(Boolean).map(esc).join(' · ')}</p>
      ${meta.title       ? `<p class="gc-title">${esc(meta.title)}</p>` : ''}
      ${meta.description ? `<p class="gc-desc">${esc(meta.description)}</p>` : ''}
      ${infoRows ? `<table class="gc-info-table"><tbody>${infoRows}</tbody></table>` : ''}
    </div>
  </section>

  <div id="trade-widget-placeholder" style="margin:24px 0;"></div>

  <h2 class="gc-h2">⚔️ 스킬</h2>
  ${skillsHtml}

  <h2 class="gc-h2">✦ 별자리</h2>
  ${constsHtml}

  ${related.length ? `
  <h2 class="gc-h2">같은 ${esc(c.element || '')}속성 캐릭터</h2>
  ${relatedHtml}` : ''}

  <div class="gc-bottom-links">
    <a href="/trade/genshin/"                   class="gc-link gc-link-primary">⚔️ 원신 거래소</a>
    <a href="/game/genshin/characters/"         class="gc-link gc-link-sec">← 캐릭터 도감</a>
    <a href="/trade/price/genshin/"             class="gc-link gc-link-sec">📊 원신 시세</a>
  </div>

</main>

<div id="footer-container"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI('genshin')
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
