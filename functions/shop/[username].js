const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

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
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function fmtPrice(n) {
  return Number(n || 0).toLocaleString('ko-KR') + '원'
}

function errorPage(status, heading, msg) {
  return new Response(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(heading)} | 플레이센스</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div id="navbar-container"></div>
<div style="max-width:560px;margin:80px auto;padding:20px;text-align:center;">
  <div style="font-size:48px;margin-bottom:16px;">😔</div>
  <h1 style="font-size:20px;font-weight:800;color:#1e293b;margin-bottom:8px;">${esc(heading)}</h1>
  <p style="color:#64748b;font-size:14px;margin-bottom:24px;">${esc(msg)}</p>
  <a href="/trade/" style="display:inline-block;padding:12px 24px;background:#6c47ff;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">← 거래소로 이동</a>
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI(null)
</script>
</body>
</html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function onRequest({ params }) {
  const usernameRaw = params.username ?? ''
  const username = String(usernameRaw).toLowerCase()

  if (!/^[a-z0-9-]{3,20}$/.test(username)) {
    return errorPage(404, '상점을 찾을 수 없어요', '유효하지 않은 상점 주소예요.')
  }

  try {
    const users = await supaGet(
      `User?username=eq.${encodeURIComponent(username)}` +
      `&select=id,username,nickname,shopBio,isVerified,sellerGrade,deliveryTime,refundPolicy,supportRecovery,businessHours,tradeCount,avgRating,profileImage,createdAt&limit=1`
    )
    const user = users?.[0]
    if (!user) {
      return errorPage(404, '상점을 찾을 수 없어요', `'${username}' 상점이 존재하지 않아요.`)
    }

    const listingsRaw = await supaGet(
      `Listing?userId=eq.${user.id}&status=in.(active,trading,sold)` +
      `&select=id,price,description,status,type,stock,createdAt,game:Game(nameKo,slug,emoji,imageUrl),` +
      `characters:ListingCharacter(count,character:Character(nameKo,imageUrl)),` +
      `currencies:ListingCurrency(amount,currency:Currency(nameKo,ratePerUnit))` +
      `&order=createdAt.desc&limit=200`
    )
    const listings = listingsRaw || []

    const soldCount = listings.filter(l => l.status === 'sold').length
    const activeCount = listings.filter(l => l.status === 'active' || l.status === 'trading').length

    // 게임 탭 집계
    const gameMap = new Map()
    for (const l of listings) {
      const g = l.game
      if (!g?.slug) continue
      if (!gameMap.has(g.slug)) gameMap.set(g.slug, { slug: g.slug, nameKo: g.nameKo, emoji: g.emoji, imageUrl: g.imageUrl, count: 0 })
      gameMap.get(g.slug).count++
    }
    const gameTabs = [...gameMap.values()].sort((a, b) => b.count - a.count)

    const nickname = user.nickname || user.username
    const avgRating = user.avgRating != null ? Number(user.avgRating).toFixed(1) : null
    const tradeCount = user.tradeCount ?? 0

    const verifiedBadge = user.isVerified
      ? `<span class="shop-badge shop-badge-verified">✓ 인증</span>` : ''
    const gradeBadge = user.sellerGrade
      ? `<span class="shop-badge shop-badge-grade">🏅 ${esc(user.sellerGrade)}</span>` : ''

    const policyChips = [
      user.deliveryTime ? `<span class="shop-chip">⏱ ${esc(user.deliveryTime)}</span>` : '',
      user.refundPolicy ? `<span class="shop-chip">🛡 ${esc(user.refundPolicy)}</span>` : '',
      user.supportRecovery ? `<span class="shop-chip">🔑 계정복구 지원</span>` : '',
    ].filter(Boolean).join('')

    const avatarHtml = user.profileImage
      ? `<img src="${esc(user.profileImage)}" alt="${esc(nickname)}" class="shop-avatar-img">`
      : `<div class="shop-avatar-fallback">🏪</div>`

    const tabsHtml = `
      <button class="shop-tab active" data-tab="all">전체 <span class="shop-tab-count">${listings.length}</span></button>
      ${gameTabs.map(g => `<button class="shop-tab" data-tab="${esc(g.slug)}">${esc(g.emoji || '')} ${esc(g.nameKo)} <span class="shop-tab-count">${g.count}</span></button>`).join('')}
    `

    const cardsHtml = listings.length > 0
      ? listings.map(l => renderCard(l)).join('')
      : `<div class="shop-empty">아직 등록된 판매계정이 없어요.</div>`

    const title = `${nickname} 상점 | 플레이센스`
    const description = `${nickname} — 판매중 계정 ${activeCount}개 · 판매완료 ${soldCount}건${avgRating ? ` · 평점 ${avgRating}` : ''}`
    const canonical = `https://resetlist.kr/shop/${esc(username)}`

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: `${nickname} 상점`,
      description,
      url: canonical,
      mainEntity: {
        '@type': 'Person',
        name: nickname,
        ...(avgRating ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating,
            reviewCount: tradeCount || 1,
          }
        } : {}),
      },
    }

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="shortcut icon" href="/favicon.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="플레이센스">
  ${user.profileImage ? `<meta property="og:image" content="${esc(user.profileImage)}">` : ''}
  <meta name="twitter:card" content="${user.profileImage ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${user.profileImage ? `<meta name="twitter:image" content="${esc(user.profileImage)}">` : ''}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .shop-wrap { max-width: 1100px; margin: 0 auto; padding: 28px 16px 60px; }

    /* 상점 헤더 */
    .shop-hero {
      display: flex; gap: 20px; align-items: flex-start;
      background: #fff; border: 1px solid var(--border, #e8e8e8); border-radius: 20px;
      padding: 24px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .shop-avatar-img { width: 76px; height: 76px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1.5px solid #e8e8e8; }
    .shop-avatar-fallback {
      width: 76px; height: 76px; border-radius: 50%; flex-shrink: 0;
      background: #f3f0ff; display: flex; align-items: center; justify-content: center; font-size: 34px;
    }
    .shop-hero-body { flex: 1; min-width: 200px; }
    .shop-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .shop-name { font-size: 22px; font-weight: 900; color: #111; }
    .shop-badge { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; }
    .shop-badge-verified { background: #d1fae5; color: #0f7a52; }
    .shop-badge-grade { background: linear-gradient(135deg,#fde68a,#f59e0b); color: #78350f; }
    .shop-bio { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap; }
    .shop-stats { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: #666; margin-bottom: 10px; }
    .shop-stats b { color: #111; }
    .shop-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .shop-chip { font-size: 12px; font-weight: 700; color: #6c47ff; background: #f3f0ff; padding: 5px 11px; border-radius: 999px; }
    .shop-hours { font-size: 12px; color: #999; }

    /* 게임 탭 */
    .shop-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 20px; }
    .shop-tab {
      flex-shrink: 0; font-size: 13px; font-weight: 700; color: #555; background: #fff;
      border: 1.5px solid var(--border, #e8e8e8); border-radius: 999px; padding: 8px 16px; cursor: pointer;
      white-space: nowrap; transition: all 0.15s;
    }
    .shop-tab.active { background: #111; color: #fff; border-color: #111; }
    .shop-tab-count { opacity: 0.6; font-weight: 600; }

    /* 매물 그리드 */
    .shop-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    @media (min-width: 720px) { .shop-grid { grid-template-columns: repeat(4, 1fr); } }

    .shop-card {
      position: relative; display: block; background: #fff;
      border: 1px solid var(--border, #e8e8e8); border-radius: 16px; overflow: hidden;
      text-decoration: none; color: inherit; transition: box-shadow 0.15s, transform 0.15s;
    }
    .shop-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .shop-card.is-sold { opacity: 0.55; }
    .shop-card-body { padding: 12px; }
    .shop-card-game { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #888; margin-bottom: 8px; }
    .shop-card-game img { width: 16px; height: 16px; border-radius: 4px; object-fit: cover; }

    .shop-char-chips { display: flex; align-items: center; gap: 4px; margin-bottom: 10px; min-height: 32px; }
    .shop-char-chip { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; border: 1px solid #eee; }
    .shop-char-chip-empty { display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #aaa; font-size: 10px; }
    .shop-char-more { font-size: 11px; font-weight: 700; color: #888; background: #f3f4f6; border-radius: 8px; padding: 4px 6px; }
    .shop-char-chips.muted { color: #bbb; font-size: 11px; }

    .shop-curr-badge {
      display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800;
      color: #fff; background: #0ea5e9; border-radius: 999px; padding: 3px 9px; margin-bottom: 8px;
    }
    .shop-curr-row { font-size: 12px; color: #444; margin-bottom: 4px; }
    .shop-curr-row b { color: #111; font-size: 13px; margin: 0 4px; }
    .shop-curr-sub { color: #0ea5e9; font-weight: 700; }
    .shop-curr-row.muted { color: #bbb; }

    .shop-card-price { font-size: 17px; font-weight: 900; color: #111; }
    .shop-stock-chip {
      position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 800;
      background: rgba(17,17,17,0.75); color: #fff; padding: 3px 8px; border-radius: 999px;
    }
    .shop-status-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.45); color: #fff; font-size: 15px; font-weight: 800;
    }
    .shop-empty { grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #aaa; font-size: 14px; }

    @media (max-width: 480px) {
      .shop-name { font-size: 19px; }
      .shop-hero { padding: 18px; }
    }
  </style>
</head>
<body>
<div id="navbar-container"></div>

<main class="shop-wrap">
  <section class="shop-hero">
    ${avatarHtml}
    <div class="shop-hero-body">
      <div class="shop-name-row">
        <span class="shop-name">${esc(nickname)}</span>
        ${verifiedBadge}
        ${gradeBadge}
      </div>
      ${user.shopBio ? `<p class="shop-bio">${esc(user.shopBio)}</p>` : ''}
      <div class="shop-stats">
        ${avgRating ? `<span>⭐ <b>${avgRating}</b></span>` : ''}
        <span>🤝 거래완료 <b>${tradeCount}</b></span>
        <span>🏷️ 판매중 <b>${activeCount}</b></span>
      </div>
      ${policyChips ? `<div class="shop-chips">${policyChips}</div>` : ''}
      ${user.businessHours ? `<div class="shop-hours">🕒 영업시간 ${esc(user.businessHours)}</div>` : ''}
    </div>
  </section>

  <div class="shop-tabs" id="shop-tabs">${tabsHtml}</div>

  <div class="shop-grid" id="shop-grid">
    ${cardsHtml}
  </div>
</main>

<div id="footer-container"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI(null)
  document.getElementById('footer-container').innerHTML = typeof renderFooter === 'function' ? renderFooter() : ''

  ;(function () {
    var tabs = document.querySelectorAll('.shop-tab')
    var cards = document.querySelectorAll('.shop-card')
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active') })
        tab.classList.add('active')
        var g = tab.getAttribute('data-tab')
        cards.forEach(function (c) {
          c.style.display = (g === 'all' || c.getAttribute('data-game') === g) ? '' : 'none'
        })
      })
    })
  })()
</script>
</body>
</html>`

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (e) {
    console.error('shop page error:', e)
    return errorPage(500, '일시적인 오류가 발생했어요', '잠시 후 다시 시도해주세요.')
  }
}

function renderCard(l) {
  const game = l.game || {}
  const isCurrency = l.type === 'currency'
  const isSold = l.status === 'sold'
  const isTrading = l.status === 'trading'

  let bodyInner
  if (isCurrency) {
    const currs = (l.currencies || []).filter(lc => lc.currency)
    bodyInner = `<span class="shop-curr-badge">💎 돌계</span>` + (
      currs.length > 0
        ? currs.slice(0, 2).map(lc => {
            const c = lc.currency
            const amount = Number(lc.amount || 0)
            const per = c.ratePerUnit ? Math.floor(amount / Number(c.ratePerUnit)) : null
            return `<div class="shop-curr-row">${esc(c.nameKo)} <b>${amount.toLocaleString('ko-KR')}</b>${per != null ? `<span class="shop-curr-sub"> · 약 ${per.toLocaleString('ko-KR')}연</span>` : ''}</div>`
          }).join('')
        : `<div class="shop-curr-row muted">재화 정보 없음</div>`
    )
  } else {
    const chars = (l.characters || []).filter(lc => lc.character)
    bodyInner = chars.length > 0
      ? `<div class="shop-char-chips">
          ${chars.slice(0, 3).map(lc => {
            const c = lc.character
            return c.imageUrl
              ? `<img class="shop-char-chip" src="${esc(c.imageUrl)}" alt="${esc(c.nameKo)}" loading="lazy">`
              : `<span class="shop-char-chip shop-char-chip-empty">${esc((c.nameKo || '?').slice(0, 2))}</span>`
          }).join('')}
          ${chars.length > 3 ? `<span class="shop-char-more">+${chars.length - 3}</span>` : ''}
        </div>`
      : `<div class="shop-char-chips muted">캐릭터 정보 없음</div>`
  }

  const stockChip = (l.stock && l.stock > 1) ? `<span class="shop-stock-chip">재고 ${esc(l.stock)}</span>` : ''
  const statusOverlay = isSold
    ? `<div class="shop-status-overlay">판매완료</div>`
    : isTrading
      ? `<div class="shop-status-overlay">거래중</div>`
      : ''

  return `
    <a class="shop-card${isSold ? ' is-sold' : ''}" href="/listing/?id=${esc(l.id)}" data-game="${esc(game.slug || '')}">
      ${stockChip}
      ${statusOverlay}
      <div class="shop-card-body">
        <div class="shop-card-game">
          ${game.imageUrl ? `<img src="${esc(game.imageUrl)}" alt="${esc(game.nameKo || '')}">` : `<span>${esc(game.emoji || '')}</span>`}
          <span>${esc(game.nameKo || '')}</span>
        </div>
        ${bodyInner}
        <div class="shop-card-price">${fmtPrice(l.price)}</div>
      </div>
    </a>`
}
