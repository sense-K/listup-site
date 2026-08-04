const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

const ACCENT = '#6366f1'   // 우마무스메 게임 컬러

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
async function supaGet(path) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    return res.ok ? res.json() : null
  } catch { return null }
}
// 카카오 데이터의 color 값은 형식이 일정하지 않아 hex만 통과시킨다 (CSS 주입 방지 겸)
function safeColor(v) {
  return /^#[0-9a-fA-F]{6}$/.test(String(v ?? '')) ? String(v) : ACCENT
}

function respond404(msg) {
  return new Response(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>캐릭터를 찾을 수 없어요 | 리세리스트</title><link rel="stylesheet" href="/css/style.css"></head>
<body><div id="navbar-container"></div>
<div style="max-width:560px;margin:80px auto;padding:20px;text-align:center;">
  <div style="font-size:48px;margin-bottom:16px;">😔</div>
  <h1 style="font-size:20px;font-weight:800;color:#1e293b;margin-bottom:8px;">캐릭터를 찾을 수 없어요</h1>
  <p style="color:#64748b;font-size:14px;margin-bottom:24px;">${esc(msg)}</p>
  <a href="/game/umamusume/characters/" style="display:inline-block;padding:12px 24px;background:${ACCENT};color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">← 우마무스메 캐릭터 도감</a>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>document.getElementById('navbar-container').innerHTML=renderNavbar();loadAndRenderGameUI('umamusume')</script>
</body></html>`, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function onRequest({ params }) {
  const slug = params.slug ?? ''
  if (!/^[a-z0-9-]+$/.test(slug)) return respond404(`유효하지 않은 주소예요.`)

  // gameId를 하드코딩하지 않고 Game.slug 조인으로 찾는다
  const rows = await supaGet(
    `Character?slug=eq.${encodeURIComponent(slug)}&isActive=eq.true` +
    `&select=id,gameId,nameKo,nameEn,slug,imageUrl,sortOrder,metadata,game:Game!inner(slug)` +
    `&game.slug=eq.umamusume&limit=1`
  )
  if (!rows?.[0]) return respond404(`'${esc(slug)}' 캐릭터를 찾을 수 없어요.`)

  const c = rows[0]
  const meta = (typeof c.metadata === 'object' && c.metadata) ? c.metadata : {}
  const accent = safeColor(meta.color)
  const canonical = `https://resetlist.kr/game/umamusume/characters/${slug}/`
  const banner = meta.fullImageUrl || null

  // 우마무스메는 속성·등급 구분이 없어서 도감 순서상 앞뒤 캐릭터를 추천으로 쓴다
  const [prevRows, nextRows] = await Promise.all([
    supaGet(`Character?gameId=eq.${encodeURIComponent(c.gameId)}&isActive=eq.true&sortOrder=lt.${c.sortOrder}` +
            `&slug=not.is.null&select=nameKo,slug,imageUrl&order=sortOrder.desc&limit=2`),
    supaGet(`Character?gameId=eq.${encodeURIComponent(c.gameId)}&isActive=eq.true&sortOrder=gt.${c.sortOrder}` +
            `&slug=not.is.null&select=nameKo,slug,imageUrl&order=sortOrder.asc&limit=2`),
  ])
  const related = [...(prevRows || []).reverse(), ...(nextRows || [])].slice(0, 4)

  // 거래 통계
  const lcRows = await supaGet(
    `ListingCharacter?characterId=eq.${c.id}&select=listing:Listing!inner(id,price,status)&limit=200`
  )
  const activePrices = (lcRows || []).map(lc => lc.listing)
    .filter(l => l?.status === 'active').map(l => Number(l.price))
  const tradeStats = {
    active_count: activePrices.length,
    min_price: activePrices.length ? Math.min(...activePrices) : null,
    max_price: activePrices.length ? Math.max(...activePrices) : null,
  }
  const fmt = n => n != null ? Number(n).toLocaleString('ko-KR') : ''

  const nameDisplay = c.nameEn && c.nameEn !== c.nameKo ? `${c.nameKo} (${c.nameEn})` : c.nameKo
  const tradePrefix = tradeStats.active_count > 0 ? `보유 계정 ${tradeStats.active_count}개 거래중 · ` : ''
  const tradeSuffix = tradeStats.active_count > 0
    ? ` ${c.nameKo} 보유 계정 ${tradeStats.active_count}개가 ${fmt(tradeStats.min_price)}원~${fmt(tradeStats.max_price)}원에 판매 중.`
    : ` ${c.nameKo} 리세계·돌계 계정을 판매하신다면 수수료 없이 등록해보세요.`
  const title = `${nameDisplay} — ${tradePrefix}우마무스메 캐릭터 정보 | 리세리스트`
  const profileStr = [meta.cv ? `성우 ${meta.cv}` : '', meta.birthday ? `생일 ${meta.birthday}` : '']
    .filter(Boolean).join(' · ')
  const desc = `우마무스메 프리티 더비 ${c.nameKo} 캐릭터 정보.${profileStr ? ` ${profileStr}.` : ''}${tradeSuffix}`
  const keywords = [
    c.nameKo, `우마무스메 ${c.nameKo}`, `우마무스메 ${c.nameKo} 리세계`,
    `우마무스메 ${c.nameKo} 계정`, '우마무스메 리세계', '우마무스메 돌계',
    '우마무스메 대행', '우마무스메 타오바오', c.nameEn || '',
  ].filter(Boolean).join(', ')

  // 프로필 표 — 값이 있는 항목만
  const profile = [['성우', meta.cv], ['생일', meta.birthday], ['신장', meta.height]]
    .filter(([, v]) => v)
  const profileHtml = profile.length
    ? `<table class="gc-profile"><tbody>${profile.map(([k, v]) =>
        `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`
    : ''

  const relatedHtml = related.length
    ? `<div class="gc-rel-grid">${related.map(r => `
      <a class="gc-rel-card" href="/game/umamusume/characters/${esc(r.slug)}/">
        <div class="gc-rel-img">
          ${r.imageUrl ? `<img src="${esc(r.imageUrl)}" alt="${esc(r.nameKo)}" loading="lazy" onerror="this.style.display='none'">` : ''}
        </div>
        <div class="gc-rel-name">${esc(r.nameKo)}</div>
      </a>`).join('')}</div>`
    : ''

  const jsonLd = JSON.stringify([
    { '@context':'https://schema.org','@type':'Article', headline:`우마무스메 ${c.nameKo} 캐릭터 정보`, image:c.imageUrl||'', author:{name:'리세리스트'}, publisher:{name:'리세리스트',url:'https://resetlist.kr/'}, description:desc, mainEntityOfPage:canonical },
    { '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[
      {position:1,name:'홈',item:'https://resetlist.kr/'},
      {position:2,name:'우마무스메',item:'https://resetlist.kr/game/umamusume/'},
      {position:3,name:'캐릭터 도감',item:'https://resetlist.kr/game/umamusume/characters/'},
      {position:4,name:c.nameKo}
    ]}
  ])

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="shortcut icon" href="/favicon.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="keywords" content="${esc(keywords)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${canonical}"><meta property="og:type" content="article"><meta property="og:site_name" content="리세리스트">
  ${banner || c.imageUrl ? `<meta property="og:image" content="${esc(banner || c.imageUrl)}"><meta name="twitter:image" content="${esc(banner || c.imageUrl)}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${jsonLd}</script>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .gc-wrap { max-width:900px; margin:0 auto; padding:20px 16px 60px; }
    .gc-breadcrumb { display:flex; align-items:center; gap:6px; font-size:13px; color:#94a3b8; margin-bottom:20px; flex-wrap:wrap; }
    .gc-breadcrumb a { color:#64748b; text-decoration:none; }
    .gc-breadcrumb a:hover { color:${accent}; }
    .gc-breadcrumb span { color:#cbd5e1; }
    .gc-banner { border-radius:18px; overflow:hidden; margin-bottom:20px; background:linear-gradient(135deg,${accent}22,#0f172a); aspect-ratio:3/1; }
    .gc-banner img { width:100%; height:100%; object-fit:cover; display:block; }
    .gc-hero { display:grid; grid-template-columns:2fr 3fr; gap:32px; margin-bottom:8px; align-items:start; }
    @media(max-width:640px){ .gc-hero { grid-template-columns:1fr; gap:20px; } }
    .gc-hero-img { border-radius:20px; overflow:hidden; aspect-ratio:1; background:linear-gradient(160deg,${accent}33 0%,#1a1a2e 100%); position:relative; }
    .gc-hero-img img { width:100%; height:100%; object-fit:cover; object-position:top center; display:block; }
    /* 이미지 매칭 안 된 캐릭터 — 빈 박스 대신 표시 */
    .gc-hero-img.no-img::after { content:'🐴'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:56px; opacity:0.35; }
    .gc-char-name { font-size:28px; font-weight:900; color:#1e293b; margin:0 0 2px; }
    .gc-char-en   { font-size:14px; color:#94a3b8; margin:0 0 12px; }
    .gc-catch { font-size:15px; font-weight:700; color:${accent}; margin:0 0 12px; line-height:1.5; }
    .gc-desc  { font-size:14px; color:#475569; line-height:1.75; margin:0 0 14px; white-space:pre-line; }
    .gc-profile { width:100%; border-collapse:collapse; font-size:13px; }
    .gc-profile th { text-align:left; color:#94a3b8; font-weight:700; width:72px; padding:6px 0; vertical-align:top; }
    .gc-profile td { color:#1e293b; padding:6px 0; }
    .gc-h2 { font-size:18px; font-weight:800; color:#1e293b; margin:40px 0 16px; padding-bottom:10px; border-bottom:2px solid #e5e7eb; }
    .gc-rel-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
    @media(max-width:600px){ .gc-rel-grid { grid-template-columns:repeat(2,1fr); } }
    .gc-rel-card { text-decoration:none; color:inherit; border:1.5px solid #e5e7eb; border-radius:14px; overflow:hidden; background:#fff; transition:box-shadow 0.15s,transform 0.15s; display:block; }
    .gc-rel-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.1); transform:translateY(-2px); }
    .gc-rel-img { aspect-ratio:1; background:linear-gradient(160deg,#1a1a2e,#16213e); position:relative; overflow:hidden; }
    .gc-rel-img img { width:100%; height:100%; object-fit:cover; object-position:top; display:block; }
    .gc-rel-name { font-size:12px; font-weight:700; color:#1e293b; padding:6px 8px 8px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .gc-bottom-links { display:flex; gap:10px; flex-wrap:wrap; margin-top:48px; padding-top:24px; border-top:1px solid #e5e7eb; }
    .gc-link { display:inline-flex; align-items:center; padding:10px 18px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:700; transition:transform 0.15s; }
    .gc-link:hover { transform:translateY(-1px); }
    .gc-link-primary { background:${accent}; color:#fff; }
    .gc-link-sec { background:#f1f5f9; color:#1e293b; border:1px solid #e5e7eb; }
    .gc-seo { font-size:13px; color:#64748b; line-height:1.8; margin:36px 0 0; }
    .tw-stats { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:4px; }
    @media(max-width:600px){ .tw-stats { grid-template-columns:1fr; } }
  </style>
</head>
<body>
<div id="navbar-container"></div>
<main class="gc-wrap">
  <nav class="gc-breadcrumb" aria-label="breadcrumb">
    <a href="/">홈</a><span>›</span>
    <a href="/game/umamusume/">우마무스메</a><span>›</span>
    <a href="/game/umamusume/characters/">캐릭터 도감</a><span>›</span>
    <span style="color:#1e293b;font-weight:600;">${esc(c.nameKo)}</span>
  </nav>

  ${banner ? `<div class="gc-banner"><img src="${esc(banner)}" alt="${esc(c.nameKo)}" fetchpriority="high" onerror="this.parentElement.style.display='none'"></div>` : ''}

  <section class="gc-hero">
    <div class="gc-hero-img${c.imageUrl ? '' : ' no-img'}">
      ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" alt="${esc(c.nameKo)}" onerror="this.parentElement.classList.add('no-img');this.style.display='none'">` : ''}
    </div>
    <div>
      <h1 class="gc-char-name">${esc(c.nameKo)}</h1>
      ${c.nameEn && c.nameEn !== c.nameKo ? `<p class="gc-char-en">${esc(c.nameEn)}</p>` : ''}
      ${meta.catchphrase ? `<p class="gc-catch">"${esc(meta.catchphrase)}"</p>` : ''}
      ${meta.description ? `<p class="gc-desc">${esc(meta.description)}</p>` : ''}
      ${profileHtml}
    </div>
  </section>

  ${tradeStats.active_count > 0 ? `
  <section style="margin:32px 0;padding:28px;background:linear-gradient(135deg,#1e293b,#334155);color:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.15);">
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
    <a href="/trade/umamusume/?character=${esc(slug)}" style="display:block;text-align:center;padding:14px;background:#f59e0b;color:#1e293b;font-weight:700;font-size:16px;border-radius:10px;text-decoration:none;margin-top:20px;">
      → ${esc(c.nameKo)} 보유 계정 보러가기
    </a>
    <p style="margin:12px 0 0;font-size:12px;opacity:0.6;text-align:center;">※ 가격은 ${esc(c.nameKo)}을(를) 보유한 전체 계정 기준입니다</p>
  </section>` : `
  <section style="margin:32px 0;padding:28px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:16px;border:1px dashed ${accent};">
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🐴</div>
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#312e81;">${esc(c.nameKo)} 보유 계정을 판매해보세요</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#4338ca;">아직 등록된 계정이 없어요. 지금 올리면 이 자리에 내 계정이 노출됩니다 — 등록비·중개 수수료 없음</p>
      <a href="/trade/register/?game=umamusume" style="display:inline-block;padding:12px 28px;background:${accent};color:#fff;font-weight:700;border-radius:10px;text-decoration:none;">판매계정 등록하기</a>
    </div>
  </section>`}

  ${related.length ? `
  <h2 class="gc-h2">다른 우마무스메 캐릭터</h2>
  ${relatedHtml}` : ''}

  <p class="gc-seo">
    우마무스메 프리티 더비 ${esc(c.nameKo)} 캐릭터 정보입니다.
    ${esc(c.nameKo)} 보유 리세계·돌계 계정을 판매하신다면 리세리스트에 등록해보세요.
    구매자가 ${esc(c.nameKo)}로 검색할 때 내 판매계정이 바로 노출되고, 중개 수수료가 없어 판매 대금은 전액 판매자 몫입니다.
    타오바오에서 우마무스메 계정을 들여와 파는 대행 상점도, 직접 리세마라를 돌린 개인 판매자도 똑같이 등록할 수 있어요.
  </p>

  <div class="gc-bottom-links">
    <a href="/trade/register/?game=umamusume" class="gc-link gc-link-primary">🐴 내 계정 판매하기</a>
    <a href="/trade/umamusume/"               class="gc-link gc-link-sec">우마무스메 거래소</a>
    <a href="/game/umamusume/characters/"     class="gc-link gc-link-sec">← 캐릭터 도감</a>
    <a href="/trade/price/umamusume/"         class="gc-link gc-link-sec">📊 우마무스메 시세</a>
  </div>
</main>
<div id="footer-container"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI('umamusume')
  document.getElementById('footer-container').innerHTML = typeof renderFooter === 'function' ? renderFooter() : ''
</script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
