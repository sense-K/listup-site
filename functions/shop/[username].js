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
      `&select=id,username,nickname,shopBio,sellerGrade,deliveryTime,refundPolicy,supportRecovery,businessHours,tradeCount,avgRating,profileImage,createdAt&limit=1`
    )
    const user = users?.[0]
    if (!user) {
      return errorPage(404, '상점을 찾을 수 없어요', `'${username}' 상점이 존재하지 않아요.`)
    }

    const listingsRaw = await supaGet(
      `Listing?userId=eq.${user.id}&status=in.(active,trading,seller_confirmed,sold)` +
      `&select=id,price,description,status,type,stock,createdAt,game:Game(nameKo,slug,emoji,imageUrl),` +
      `characters:ListingCharacter(count,character:Character(nameKo,imageUrl)),` +
      `currencies:ListingCurrency(amount,currency:Currency(nameKo,ratePerUnit))` +
      `&order=createdAt.desc&limit=200`
    )
    const listings = listingsRaw || []

    const soldCount = listings.filter(l => l.status === 'sold').length
    const activeCount = listings.filter(l => l.status === 'active' || l.status === 'trading' || l.status === 'seller_confirmed').length

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
    const description = `${nickname} 판매자 상점 — 리세계 계정·돌계 직거래. 판매중 계정 ${activeCount}개 · 판매완료 ${soldCount}건${avgRating ? ` · 평점 ${avgRating}` : ''}. 플레이센스에서 수수료 없이 안전하게 거래하세요.`
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
  <meta name="keywords" content="${esc(nickname)} 상점, 판매자 상점, 대행 상점, 게임 계정 대행, 리세계 대행, 리세계 계정 판매, 돌계 판매, 돌계 거래, 플레이센스">
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
      padding: 24px; margin-bottom: 20px; flex-wrap: wrap;
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
    .shop-badge-grade { background: linear-gradient(135deg,#fde68a,#f59e0b); color: #78350f; }
    .shop-bio { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap; }
    .shop-stats { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: #666; margin-bottom: 10px; }
    .shop-stats b { color: #111; }
    .shop-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .shop-chip { font-size: 12px; font-weight: 700; color: #6c47ff; background: #f3f0ff; padding: 5px 11px; border-radius: 999px; }
    .shop-hours { font-size: 12px; color: #999; }

    /* 주인 전용: 헤더 우측 액션 (판매글 등록 · 상점 설정) */
    .shop-owner-actions {
      display: none; gap: 8px; flex-shrink: 0; margin-left: auto; align-self: flex-start; flex-wrap: wrap;
    }
    .shop-register-btn {
      display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
      background: #6c47ff; color: #fff; border-radius: 10px;
      padding: 9px 16px; font-size: 13px; font-weight: 700; transition: background 0.15s; white-space: nowrap;
    }
    .shop-register-btn:hover { background: #5a37e0; }
    .shop-settings-btn {
      display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
      background: #111; color: #fff; border: none; border-radius: 10px;
      padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s;
      white-space: nowrap;
    }
    .shop-settings-btn:hover { background: #2a2a2a; }
    @media (max-width: 560px) {
      .shop-owner-actions { width: 100%; margin-left: 0; }
      .shop-register-btn, .shop-settings-btn { flex: 1; justify-content: center; }
    }

    /* 배지 설명 (설정 모달) */
    .badge-info-btn {
      background: none; border: none; padding: 0; cursor: pointer; font: inherit; color: inherit;
    }
    .badge-help {
      margin-top: 10px; background: #f8f7ff; border: 1px solid #e5e0ff; border-radius: 10px;
      padding: 12px 14px; font-size: 12px; color: #444; line-height: 1.6; display: none;
    }
    .badge-help.open { display: block; }
    .badge-help h5 { margin: 0 0 4px; font-size: 12.5px; font-weight: 800; color: #111; }
    .badge-help ul { margin: 0 0 10px; padding-left: 16px; }
    .badge-help li { margin: 2px 0; }
    .badge-help .grade-row { display: flex; gap: 6px; margin: 3px 0; align-items: baseline; }
    .badge-help .grade-name { font-weight: 800; color: #6c47ff; min-width: 62px; }
    .badge-help .apply { color: #666; border-top: 1px dashed #ddd; padding-top: 8px; margin-top: 4px; }

    /* 게임 탭 + 상태 필터 */
    .shop-filters-row { margin-bottom: 20px; }
    .shop-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 10px; }
    .shop-tab {
      flex-shrink: 0; font-size: 13px; font-weight: 700; color: #555; background: #fff;
      border: 1.5px solid var(--border, #e8e8e8); border-radius: 999px; padding: 8px 16px; cursor: pointer;
      white-space: nowrap; transition: all 0.15s;
    }
    .shop-tab.active { background: #111; color: #fff; border-color: #111; }
    .shop-tab-count { opacity: 0.6; font-weight: 600; }

    .shop-status-filters { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
    .shop-status-chip {
      flex-shrink: 0; font-size: 12px; font-weight: 700; color: #666; background: #f3f4f6;
      border: 1.5px solid transparent; border-radius: 999px; padding: 7px 14px; cursor: pointer;
      white-space: nowrap; transition: all 0.15s;
    }
    .shop-status-chip.active { background: #6c47ff; color: #fff; }

    /* 매물 그리드 */
    .shop-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 8px; }
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
      background: rgba(0,0,0,0.45); color: #fff; font-size: 15px; font-weight: 800; text-align: center; padding: 0 8px;
    }
    .shop-empty { grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #aaa; font-size: 14px; }

    /* 주인 전용: 매물 카드 하단 관리 액션 */
    .shop-card-owner-actions { display: flex; gap: 6px; padding: 0 12px 12px; margin-top: -2px; }
    .shop-card-owner-btn {
      flex: 1; background: #f3f4f6; border: none; border-radius: 8px; color: #555;
      font-size: 11px; font-weight: 700; padding: 7px 0; cursor: pointer; transition: all 0.15s;
    }
    .shop-card-owner-btn:hover { background: #e5e7eb; color: #111; }
    .shop-card-owner-btn.danger:hover { background: #fee2e2; color: #dc2626; }
    .shop-card-owner-btn.bump { background: #ece7ff; color: #5b34d6; }
    .shop-card-owner-btn.bump:hover { background: #ddd3ff; color: #4c28c4; }
    .shop-card-owner-btn.bump:disabled { background: #f3f4f6; color: #aaa; cursor: default; }

    @media (max-width: 480px) {
      .shop-name { font-size: 19px; }
      .shop-hero { padding: 18px; }
    }

    /* ===== 주인 전용: 대시보드 영역 ===== */
    #shop-owner-actions, #shop-summary-strip, #shop-action-section, #shop-purchases-section { display: none; }
    body.is-owner-view #shop-owner-actions { display: flex; }
    body.is-owner-view #shop-summary-strip { display: grid; }
    body.is-owner-view #shop-action-section { display: block; }
    body.is-owner-view #shop-purchases-section { display: block; }

    .shop-section-title { font-size: 15px; font-weight: 800; color: #111; margin: 0 0 12px; }

    /* 요약 스트립 */
    .shop-summary-strip { grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .shop-summary-card {
      background: #fff; border: 1px solid var(--border, #e8e8e8); border-radius: 14px;
      padding: 14px 8px; text-align: center;
    }
    .shop-summary-num { font-size: 22px; font-weight: 900; color: #111; line-height: 1.2; }
    .shop-summary-label { font-size: 11px; color: #888; font-weight: 700; margin-top: 4px; }
    @media (max-width: 480px) {
      .shop-summary-strip { grid-template-columns: repeat(2, 1fr); }
      .shop-summary-num { font-size: 19px; }
    }

    /* 지금 처리할 일 */
    #shop-action-section { margin-bottom: 20px; }
    .shop-action-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 640px) { .shop-action-grid { grid-template-columns: repeat(2, 1fr); } }

    .shop-action-card {
      display: flex; align-items: center; gap: 12px; background: #fffaf0;
      border: 1.5px solid #fde68a; border-radius: 14px; padding: 14px 16px; flex-wrap: wrap;
    }
    .shop-action-role { font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 999px; flex-shrink: 0; }
    .shop-action-role.role-sell { background: #dbeafe; color: #1d4ed8; }
    .shop-action-role.role-buy { background: #fce7f3; color: #be185d; }
    .shop-action-main { flex: 1; min-width: 140px; }
    .shop-action-game { font-size: 12px; color: #888; margin-bottom: 2px; }
    .shop-action-price { font-size: 16px; font-weight: 900; color: #111; }
    .shop-action-counterparty { font-size: 12px; color: #999; margin-top: 2px; }
    .shop-action-btns { display: flex; gap: 6px; flex-wrap: wrap; }
    .shop-action-btn {
      border: none; border-radius: 9px; padding: 9px 14px; font-size: 12px; font-weight: 700;
      cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; white-space: nowrap;
    }
    .shop-action-btn.primary { background: #111; color: #fff; }
    .shop-action-btn.primary:hover { background: #2a2a2a; }
    .shop-action-btn.secondary { background: #fff; color: #111; border: 1.5px solid #e5e7eb; }
    .shop-action-btn.secondary:hover { border-color: #111; }

    @media (max-width: 480px) {
      .shop-action-card { padding: 12px; }
      .shop-action-btns { width: 100%; }
      .shop-action-btn { flex: 1; justify-content: center; }
    }

    /* 내 구매 내역 (완료/취소) */
    #shop-purchases-section { margin-top: 28px; }
    .my-listing-item { display: flex; align-items: center; gap: 14px; padding: 12px 4px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: opacity 0.15s; }
    .my-listing-item:hover { opacity: 0.7; }
    .my-listing-item:last-child { border-bottom: none; }
    .my-listing-thumb { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; background: #e5e7eb; flex-shrink: 0; }
    .my-listing-thumb-placeholder { width: 52px; height: 52px; border-radius: 10px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .my-listing-info { flex: 1; min-width: 0; }
    .my-listing-game { font-size: 11px; color: #aaa; margin-bottom: 2px; }
    .my-listing-price { font-size: 15px; font-weight: 800; }
    .my-listing-chars { font-size: 11px; color: #888; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .my-listing-meta { text-align: right; flex-shrink: 0; }
    .my-listing-status { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; margin-bottom: 4px; display: inline-block; }
    .status-active { background: #dcfce7; color: #16a34a; }
    .status-trading { background: #fef3c7; color: #d97706; }
    .status-seller-confirmed { background: #e0f2fe; color: #0369a1; }
    .status-sold { background: #f3f4f6; color: #888; }
    .my-listing-time { font-size: 11px; color: #bbb; }

    .my-item-btn { background: none; border: 1px solid #e5e7eb; border-radius: 6px; color: #aaa; font-size: 11px; padding: 3px 8px; cursor: pointer; margin-top: 4px; margin-left: 3px; transition: all 0.15s; }
    .my-item-btn:hover { border-color: #ef4444; color: #ef4444; }
    .my-item-btn.review { border-color: #f97316; color: #f97316; }
    .my-item-btn.review:hover { background: #f97316; color: #fff; }
    .my-item-btn.confirm { border-color: var(--primary); color: var(--primary); }
    .my-item-btn.confirm:hover { background: var(--primary); color: #fff; }

    .empty-my { text-align: center; padding: 32px 0; color: #bbb; font-size: 13px; line-height: 1.8; }
    .empty-my a { color: #111; font-weight: 700; }

    /* 상점 설정 모달 */
    .shop-modal-overlay {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 10000; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto;
    }
    .shop-modal-overlay.open { display: flex; }
    .shop-modal {
      background: #fff; border-radius: 18px; width: 100%; max-width: 480px;
      max-height: calc(100vh - 80px); display: flex; flex-direction: column; overflow: hidden;
    }
    .shop-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px; border-bottom: 1.5px solid #f0f0f0; flex-shrink: 0;
    }
    .shop-modal-header h3 { font-size: 16px; font-weight: 800; color: #111; margin: 0; }
    .shop-modal-close {
      background: none; border: none; font-size: 16px; color: #aaa; cursor: pointer;
      width: 28px; height: 28px; border-radius: 50%; transition: background 0.15s;
    }
    .shop-modal-close:hover { background: #f3f4f6; color: #111; }
    .shop-modal-body { padding: 20px; overflow-y: auto; }

    .shop-mgr-nick-row { display: flex; gap: 8px; align-items: center; margin-bottom: 22px; flex-wrap: wrap; }
    .shop-mgr-nick-row input { flex: 1; min-width: 140px; }
    .shop-mgr-label-sm { font-size: 12px; font-weight: 700; color: #888; margin-bottom: 6px; display: block; }

    .shop-form-group { margin-bottom: 16px; }
    .shop-form-label { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 6px; display: block; }
    .shop-form-hint { font-size: 11px; color: #aaa; margin-top: 4px; }
    .shop-form-group textarea.form-input { resize: vertical; min-height: 72px; font-family: inherit; }
    .shop-username-prefix { display: flex; align-items: stretch; border: 1.5px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .shop-username-prefix span { background: #f8f8f8; color: #aaa; font-size: 13px; font-weight: 600; padding: 0 10px; display: flex; align-items: center; white-space: nowrap; }
    .shop-username-prefix input { border: none; flex: 1; padding: 10px 10px; font-size: 14px; }
    .shop-username-prefix input:focus { outline: none; }
    .shop-checkbox-row { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .shop-checkbox-row input { width: 16px; height: 16px; cursor: pointer; }
    .shop-checkbox-row span { font-size: 13px; font-weight: 700; color: #111; }
    .shop-save-btn { width: 100%; margin-top: 4px; padding: 13px; font-size: 14px; }

    .shop-mgr-link-card {
      background: #111; border-radius: 14px; padding: 16px 18px; color: #fff; margin-bottom: 18px;
    }
    .shop-mgr-link-label { font-size: 11px; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
    .shop-mgr-link-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .shop-mgr-link-text { font-size: 14px; font-weight: 800; word-break: break-all; }
    .shop-mgr-link-actions { display: flex; gap: 6px; margin-left: auto; }
    .shop-mgr-link-btn {
      background: rgba(255,255,255,0.12); color: #fff; border: none; border-radius: 8px;
      padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s;
      white-space: nowrap; text-decoration: none; display: inline-flex; align-items: center;
    }
    .shop-mgr-link-btn:hover { background: rgba(255,255,255,0.22); }
    .shop-mgr-badges { margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .shop-mgr-verify-hint { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 10px; }

    .shop-mgr-logout-btn {
      width: 100%; margin-top: 20px; padding: 13px; background: none; border: 1.5px solid #e5e7eb;
      border-radius: 10px; color: #bbb; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .shop-mgr-logout-btn:hover { border-color: #ef4444; color: #ef4444; }

    .shop-mgr-toast {
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
      background: #111; color: #fff; font-size: 13px; font-weight: 600;
      padding: 10px 20px; border-radius: 999px;
      opacity: 0; pointer-events: none; transition: opacity 0.2s;
      z-index: 9999; white-space: nowrap;
    }
    .shop-mgr-toast.show { opacity: 1; }
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
    <div class="shop-owner-actions" id="shop-owner-actions">
      <a href="/trade/register/" class="shop-register-btn">＋ 판매글 등록</a>
      <button class="shop-settings-btn" id="shop-settings-btn" onclick="mgrOpenSettings()">⚙ 상점 설정</button>
    </div>
  </section>

  <div class="shop-summary-strip" id="shop-summary-strip"></div>

  <section id="shop-action-section">
    <h2 class="shop-section-title">⚡ 지금 처리할 일</h2>
    <div class="shop-action-grid" id="shop-action-grid"></div>
  </section>

  <div class="shop-filters-row">
    <div class="shop-tabs" id="shop-tabs">${tabsHtml}</div>
    <div class="shop-status-filters" id="shop-status-filters">
      <button class="shop-status-chip active" data-status="all">전체</button>
      <button class="shop-status-chip" data-status="active">판매중</button>
      <button class="shop-status-chip" data-status="trading">거래중</button>
      <button class="shop-status-chip" data-status="sold">판매완료</button>
    </div>
  </div>

  <div class="shop-grid" id="shop-grid">
    ${cardsHtml}
  </div>

  <section id="shop-purchases-section">
    <h2 class="shop-section-title">내 구매 내역</h2>
    <div id="shop-purchases-list"></div>
  </section>
</main>

<div class="shop-modal-overlay" id="shop-settings-modal" onclick="if(event.target===this) mgrCloseSettings()">
  <div class="shop-modal">
    <div class="shop-modal-header">
      <h3>⚙ 상점 설정</h3>
      <button class="shop-modal-close" onclick="mgrCloseSettings()" aria-label="닫기">✕</button>
    </div>
    <div class="shop-modal-body" id="shop-settings-body"><div class="loading">불러오는 중...</div></div>
  </div>
</div>

<div id="footer-container"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar-container').innerHTML = renderNavbar()
  loadAndRenderGameUI(null)
  document.getElementById('footer-container').innerHTML = typeof renderFooter === 'function' ? renderFooter() : ''

  // ===== 게임 탭 + 상태 필터 (방문자에게도 항상 노출) =====
  ;(function () {
    var gameTabs = document.querySelectorAll('.shop-tab')
    var statusChips = document.querySelectorAll('.shop-status-chip')
    var cards = document.querySelectorAll('.shop-card')
    var activeGame = 'all'
    var activeStatusFilter = 'all'

    function statusMatches(cardStatus, filter) {
      if (filter === 'all') return true
      if (filter === 'trading') return cardStatus === 'trading' || cardStatus === 'seller_confirmed'
      return cardStatus === filter
    }

    function applyFilters() {
      cards.forEach(function (c) {
        var gameOk = activeGame === 'all' || c.getAttribute('data-game') === activeGame
        var statusOk = statusMatches(c.getAttribute('data-status'), activeStatusFilter)
        c.style.display = (gameOk && statusOk) ? '' : 'none'
      })
    }

    gameTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        gameTabs.forEach(function (t) { t.classList.remove('active') })
        tab.classList.add('active')
        activeGame = tab.getAttribute('data-tab')
        applyFilters()
      })
    })

    statusChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        statusChips.forEach(function (c) { c.classList.remove('active') })
        chip.classList.add('active')
        activeStatusFilter = chip.getAttribute('data-status')
        applyFilters()
      })
    })
  })()

  // ===== 상점 주인 대시보드 (구 /mypage/ 기능 이식) =====
  // 로그인한 유저의 username이 이 상점 페이지의 username과 같을 때만 노출된다.
  // SSR 시점엔 로그인 여부를 알 수 없으므로 반드시 클라이언트에서 판정한다.
  const PAGE_USERNAME = ${JSON.stringify(username)}
  const SHOP_RESERVED_USERNAMES = ['admin','shop','shops','api','trade','listing','mypage','auth','game','seller']

  let mgrCurrentUserId = null
  let mgrReviewedListingIds = new Set()
  let mgrStaleSellerConfirmedIds = new Set()
  let mgrStaleTradingIds = new Set()
  let mgrBumpedAt = {}   // listingId → bumpedAt (끌올 쿨다운 판정)

  async function mgrInit() {
    try {
      const { data: { session } } = await db.auth.getSession()
      if (!session) return // 비로그인 방문자는 대시보드 없이 공개 상점만 본다

      const authUser = session.user
      const { data: me } = await db.from('User')
        .select('id, nickname, username, shopBio, deliveryTime, refundPolicy, supportRecovery, businessHours, sellerGrade')
        .eq('id', authUser.id).single()

      if (!me || (me.username || '').toLowerCase() !== PAGE_USERNAME) return // 남의 상점을 구경 중

      mgrCurrentUserId = authUser.id
      document.body.classList.add('is-owner-view')

      await mgrLoadData(authUser, me)
    } catch (e) {
      console.error('shop dashboard init error:', e)
    }
  }

  async function mgrLoadData(authUser, me) {
    try {
      const { data: listings } = await db
        .from('Listing')
        .select(\`id, price, status, createdAt, bumpedAt,
          game:Game(nameKo, emoji, imageUrl, artImageUrl),
          characters:ListingCharacter(character:Character(nameKo))\`)
        .eq('userId', authUser.id)
        .order('createdAt', { ascending: false })

      // 끌올 쿨다운 판정용 (id → bumpedAt)
      mgrBumpedAt = {}
      ;(listings ?? []).forEach(l => { mgrBumpedAt[l.id] = l.bumpedAt || l.createdAt })

      // trading/seller_confirmed인데 실제 활성 Trade 없는 경우 보정
      const tradingOrConfirmedIds = (listings ?? [])
        .filter(l => l.status === 'trading' || l.status === 'seller_confirmed').map(l => l.id)
      mgrStaleSellerConfirmedIds = new Set()
      mgrStaleTradingIds = new Set()
      if (tradingOrConfirmedIds.length > 0) {
        const { data: stillActiveTrades } = await db.from('Trade')
          .select('listingId, status').in('listingId', tradingOrConfirmedIds)
          .in('status', ['active', 'seller_confirmed'])
        const activeTradeMap = new Map()
        ;(stillActiveTrades ?? []).forEach(t => activeTradeMap.set(t.listingId, t.status))
        tradingOrConfirmedIds.forEach(id => {
          const listing = (listings ?? []).find(l => l.id === id)
          if (!activeTradeMap.has(id)) {
            if (listing?.status === 'seller_confirmed') {
              mgrStaleSellerConfirmedIds.add(id)
              db.from('Listing').update({ status: 'sold' }).eq('id', id)
            } else if (listing?.status === 'trading') {
              mgrStaleTradingIds.add(id)
              db.from('Listing').update({ status: 'active' }).eq('id', id)
            }
          }
        })
      }

      const { data: myTrades } = await db
        .from('Trade')
        .select(\`id, type, status, createdAt, sellerId,
          listing:Listing(id, price, status,
            game:Game(nameKo, emoji, imageUrl, artImageUrl),
            characters:ListingCharacter(character:Character(nameKo)))\`)
        .eq('buyerId', authUser.id)
        .order('createdAt', { ascending: false })

      // 판매자로서 "계정 전달"을 아직 안 한, 구매자가 기다리고 있는 거래
      const { data: sellActionTrades } = await db
        .from('Trade')
        .select(\`id, status, createdAt, listingId, buyerId,
          listing:Listing(price, game:Game(nameKo, emoji))\`)
        .eq('sellerId', authUser.id)
        .eq('status', 'active')
        .order('createdAt', { ascending: false })

      const { data: myReviews } = await db.from('Review').select('listingId').eq('reviewerId', authUser.id)
      mgrReviewedListingIds = new Set((myReviews ?? []).map(r => r.listingId))

      const buyActionTrades = (myTrades ?? []).filter(t => t.status === 'seller_confirmed')
      const nickIds = [...new Set([
        ...(sellActionTrades ?? []).map(t => t.buyerId),
        ...buyActionTrades.map(t => t.sellerId),
      ])].filter(Boolean)
      let nickMap = {}
      if (nickIds.length > 0) {
        const { data: nickUsers } = await db.from('User').select('id, nickname').in('id', nickIds)
        ;(nickUsers ?? []).forEach(u => { nickMap[u.id] = u.nickname })
      }

      mgrRender(authUser, me, listings ?? [], myTrades ?? [], sellActionTrades ?? [], nickMap)
    } catch (e) {
      console.error('shop dashboard data load error:', e)
    }
  }

  function mgrGetEffectiveStatus(l) {
    if (mgrStaleSellerConfirmedIds.has(l.id)) return 'sold'
    if (mgrStaleTradingIds.has(l.id)) return 'active'
    return l.status
  }

  function mgrEscapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
  }

  function mgrRender(authUser, me, listings, myTrades, sellActionTrades, nickMap) {
    mgrRenderSummary(listings, myTrades)
    mgrRenderActionSection(sellActionTrades, myTrades.filter(t => t.status === 'seller_confirmed'), nickMap)
    mgrDecorateGrid()
    mgrRenderPurchases(myTrades)
    document.getElementById('shop-settings-body').innerHTML = mgrRenderSettingsPanel(authUser, me)
  }

  // --- 요약 스트립 ---
  function mgrRenderSummary(listings, myTrades) {
    const activeN = listings.filter(l => mgrGetEffectiveStatus(l) === 'active').length
    const tradingN = listings.filter(l => ['trading', 'seller_confirmed'].includes(mgrGetEffectiveStatus(l))).length
    const soldN = listings.filter(l => mgrGetEffectiveStatus(l) === 'sold').length
    const buyingN = myTrades.filter(t => t.status === 'active' || t.status === 'seller_confirmed').length

    document.getElementById('shop-summary-strip').innerHTML = \`
      <div class="shop-summary-card"><div class="shop-summary-num">\${activeN}</div><div class="shop-summary-label">판매중</div></div>
      <div class="shop-summary-card"><div class="shop-summary-num">\${tradingN}</div><div class="shop-summary-label">거래중</div></div>
      <div class="shop-summary-card"><div class="shop-summary-num">\${soldN}</div><div class="shop-summary-label">판매완료</div></div>
      <div class="shop-summary-card"><div class="shop-summary-num">\${buyingN}</div><div class="shop-summary-label">구매 진행중</div></div>
    \`
  }

  // --- 지금 처리할 일 ---
  function mgrRenderActionSection(sellActionTrades, buyActionTrades, nickMap) {
    const section = document.getElementById('shop-action-section')
    const grid = document.getElementById('shop-action-grid')
    const cards = []

    sellActionTrades.forEach(t => {
      const l = t.listing
      if (!l) return
      const nick = nickMap[t.buyerId] || '구매자'
      cards.push(\`
        <div class="shop-action-card">
          <span class="shop-action-role role-sell">판매</span>
          <div class="shop-action-main">
            <div class="shop-action-game">\${mgrEscapeHtml(l.game?.emoji || '')} \${mgrEscapeHtml(l.game?.nameKo || '')}</div>
            <div class="shop-action-price">\${formatPrice(l.price)}</div>
            <div class="shop-action-counterparty">구매자 \${mgrEscapeHtml(nick)} · \${timeAgo(t.createdAt)}</div>
          </div>
          <div class="shop-action-btns">
            <button class="shop-action-btn primary" onclick="mgrSellerConfirm('\${t.id}','\${t.listingId}')">계정 전달 완료</button>
          </div>
        </div>\`)
    })

    buyActionTrades.forEach(t => {
      const l = t.listing
      if (!l) return
      const nick = nickMap[t.sellerId] || '판매자'
      cards.push(\`
        <div class="shop-action-card">
          <span class="shop-action-role role-buy">구매</span>
          <div class="shop-action-main">
            <div class="shop-action-game">\${mgrEscapeHtml(l.game?.emoji || '')} \${mgrEscapeHtml(l.game?.nameKo || '')}</div>
            <div class="shop-action-price">\${formatPrice(l.price)}</div>
            <div class="shop-action-counterparty">판매자 \${mgrEscapeHtml(nick)} · \${timeAgo(t.createdAt)}</div>
          </div>
          <div class="shop-action-btns">
            <button class="shop-action-btn primary" onclick="mgrBuyerConfirm('\${t.id}','\${l.id}','\${t.sellerId}')">수령 확인</button>
            <a class="shop-action-btn secondary" href="/review/?tradeId=\${t.id}">후기 작성</a>
          </div>
        </div>\`)
    })

    if (cards.length === 0) {
      section.style.display = 'none'
      return
    }
    section.style.display = ''
    grid.innerHTML = cards.join('')
  }

  // --- 매물 그리드에 주인 전용 수정/삭제 버튼 부착 ---
  function mgrDecorateGrid() {
    document.querySelectorAll('.shop-card-owner-actions').forEach(el => el.remove())
    document.querySelectorAll('.shop-card').forEach(card => {
      const id = card.getAttribute('data-id')
      const status = card.getAttribute('data-status')
      if (!id || status === 'sold') return
      const bar = document.createElement('div')
      bar.className = 'shop-card-owner-actions'
      bar.innerHTML = \`
        <button class="shop-card-owner-btn bump" id="bump-btn-\${id}" onclick="event.preventDefault();event.stopPropagation();mgrBump('\${id}')">⬆ 끌올</button>
        <button class="shop-card-owner-btn" onclick="event.preventDefault();event.stopPropagation();location.href='/trade/register/?edit=\${id}'">수정</button>
        <button class="shop-card-owner-btn danger" onclick="event.preventDefault();event.stopPropagation();mgrDeleteListing('\${id}')">삭제</button>
      \`
      card.appendChild(bar)
      mgrRefreshBumpBtn(id)
    })
  }

  // --- 내 구매 내역 (완료/취소) ---
  function mgrRenderTradeItem(t) {
    const l = t.listing
    if (!l) return ''
    const gameName = l.game?.nameKo ?? ''
    const gameImg = l.game?.artImageUrl ?? ''
    const gameEmoji = l.game?.emoji ?? ''
    const chars = (l.characters ?? []).map(lc => lc.character?.nameKo).filter(Boolean)
    const stClass = { active: 'status-trading', seller_confirmed: 'status-seller-confirmed', completed: 'status-sold', cancelled: 'status-sold' }[t.status] ?? 'status-sold'
    const stText = { active: '거래중', seller_confirmed: '수령확인 대기', completed: '거래완료', cancelled: '취소됨' }[t.status] ?? ''
    const reviewBtn = t.status === 'completed' && !mgrReviewedListingIds.has(l.id)
      ? \`<div><button class="my-item-btn review" onclick="event.stopPropagation();location.href='/review/?tradeId=\${t.id}'">후기작성</button></div>\` : ''
    return \`
      <div class="my-listing-item" onclick="location.href='/listing/?id=\${l.id}'">
        \${gameImg ? \`<img class="my-listing-thumb" src="\${gameImg}" alt="\${gameName}">\` : \`<div class="my-listing-thumb-placeholder">\${gameEmoji}</div>\`}
        <div class="my-listing-info">
          <div class="my-listing-game">\${gameName}</div>
          <div class="my-listing-price">\${formatPrice(l.price)}</div>
          <div class="my-listing-chars">\${chars.length > 0 ? chars.join(', ') : '캐릭터 없음'}</div>
        </div>
        <div class="my-listing-meta">
          <div class="my-listing-status \${stClass}">\${stText}</div>
          <div class="my-listing-time">\${timeAgo(t.createdAt)}</div>
          \${reviewBtn}
        </div>
      </div>\`
  }

  function mgrRenderPurchases(myTrades) {
    const section = document.getElementById('shop-purchases-section')
    const list = document.getElementById('shop-purchases-list')
    const historyTrades = myTrades.filter(t => t.status === 'completed' || t.status === 'cancelled')
    if (historyTrades.length === 0) {
      section.style.display = 'none'
      return
    }
    section.style.display = ''
    list.innerHTML = historyTrades.map(mgrRenderTradeItem).join('')
  }

  // --- 상점 설정 (모달) ---
  function mgrRenderSettingsPanel(authUser, me) {
    const nickname = me.nickname ?? ''
    const username = me.username ?? ''
    const shopBio = me.shopBio ?? ''
    const deliveryTime = me.deliveryTime ?? ''
    const refundPolicy = me.refundPolicy ?? ''
    const supportRecovery = !!me.supportRecovery
    const businessHours = me.businessHours ?? ''
    const sellerGrade = me.sellerGrade ?? ''

    const badgeRow = sellerGrade
      ? \`<div class="shop-mgr-badges">
          <button type="button" class="badge-info-btn" onclick="mgrToggleBadgeHelp('grade')" title="등급 조건 보기">
            <span class="shop-grade-badge" style="background:rgba(255,255,255,0.15);color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;">🏅 \${mgrEscapeHtml(sellerGrade)} &#9432;</span>
          </button>
        </div>\`
      : \`<div class="shop-mgr-verify-hint">
           아직 판매자 등급이 없어요 ·
           <button type="button" class="badge-info-btn" style="text-decoration:underline;font-weight:700;" onclick="mgrToggleBadgeHelp('grade')">등급 조건 보기</button>
         </div>\`

    const badgesHtml = badgeRow + \`
      <div class="badge-help" id="badge-help-grade">
        <h5>🏅 판매자 등급이란?</h5>
        <p style="margin:0 0 8px;">거래 실적과 평점에 따라 <b>매일 자동으로</b> 반영되는 등급이에요. 따로 신청하지 않아도 조건을 채우면 붙습니다.</p>
        <div class="grade-row"><span class="grade-name">등급 없음</span><span>거래 완료 10건 미만</span></div>
        <div class="grade-row"><span class="grade-name">우수 판매자</span><span>거래 완료 10건 이상 · 평점 4.0 이상</span></div>
        <div class="grade-row"><span class="grade-name">파워 판매자</span><span>거래 완료 30건 이상 · 평점 4.5 이상 · 최근 30일 내 판매 활동</span></div>
        <div class="grade-row"><span class="grade-name">공식 파트너</span><span>운영자가 직접 선정한 판매자</span></div>
        <div class="apply">집계 기준은 <b>거래 완료된 판매 건수</b>와 <b>받은 후기 평균 평점</b>이에요. 조건에서 내려가면 등급도 자동으로 조정돼요.</div>
      </div>\`

    return \`
      <div class="shop-mgr-nick-row">
        <div style="flex:1;">
          <label class="shop-mgr-label-sm" for="mgr-nickname-input">상점 이름 (닉네임)</label>
          <input type="text" class="form-input" id="mgr-nickname-input" value="\${mgrEscapeHtml(nickname)}" placeholder="닉네임" maxlength="20">
        </div>
        <button class="btn btn-outline" style="align-self:flex-end;" onclick="mgrSaveNickname('\${authUser.id}')">닉네임 저장</button>
      </div>

      <div class="shop-mgr-link-card">
        <div class="shop-mgr-link-label">내 상점 주소</div>
        <div class="shop-mgr-link-row">
          <div class="shop-mgr-link-text" id="mgr-shop-address-text">resetlist.kr/shop/\${username ? mgrEscapeHtml(username) : '-'}</div>
          <div class="shop-mgr-link-actions">
            <button class="shop-mgr-link-btn" onclick="mgrCopyShopLink()">복사</button>
          </div>
        </div>
        \${badgesHtml}
      </div>

      <div class="shop-form-group">
        <label class="shop-form-label" for="mgr-username-input">상점 아이디 (영문)</label>
        <div class="shop-username-prefix">
          <span>resetlist.kr/shop/</span>
          <input type="text" id="mgr-username-input" value="\${mgrEscapeHtml(username)}" placeholder="my-shop" maxlength="20"
            oninput="this.value = this.value.toLowerCase()">
        </div>
        <div class="shop-form-hint">영문 소문자·숫자·하이픈만 사용, 3~20자. 변경하면 상점 주소가 바뀌어요.</div>
      </div>

      <div class="shop-form-group">
        <label class="shop-form-label" for="mgr-bio-input">상점 소개</label>
        <textarea class="form-input" id="mgr-bio-input" placeholder="상점을 소개해주세요">\${mgrEscapeHtml(shopBio)}</textarea>
      </div>

      <div class="shop-form-group">
        <label class="shop-form-label" for="mgr-delivery-input">전달 시간 정책</label>
        <input type="text" class="form-input" id="mgr-delivery-input" value="\${mgrEscapeHtml(deliveryTime)}" placeholder="예: 30분 이내">
      </div>

      <div class="shop-form-group">
        <label class="shop-form-label" for="mgr-refund-input">환불 정책</label>
        <input type="text" class="form-input" id="mgr-refund-input" value="\${mgrEscapeHtml(refundPolicy)}" placeholder="예: 밴 시 100% 환불">
      </div>

      <div class="shop-form-group">
        <label class="shop-checkbox-row">
          <input type="checkbox" id="mgr-recovery-input" \${supportRecovery ? 'checked' : ''}>
          <span>계정복구 지원</span>
        </label>
      </div>

      <div class="shop-form-group">
        <label class="shop-form-label" for="mgr-hours-input">영업시간</label>
        <input type="text" class="form-input" id="mgr-hours-input" value="\${mgrEscapeHtml(businessHours)}" placeholder="예: 10:00~24:00">
      </div>

      <button class="btn btn-primary shop-save-btn" id="mgr-save-btn" onclick="mgrSaveShopSettings('\${me.id}')">저장</button>

      \${authUser.email === 'zzabhm@gmail.com' ? \`<a href="/admin/" class="btn btn-primary" style="display:block;text-align:center;margin-top:16px;">관리자 페이지 →</a>\` : ''}
      <button class="shop-mgr-logout-btn" onclick="mgrLogout()">로그아웃</button>
    \`
  }

  function mgrOpenSettings() {
    document.getElementById('shop-settings-modal').classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  function mgrCloseSettings() {
    document.getElementById('shop-settings-modal').classList.remove('open')
    document.body.style.overflow = ''
  }

  // 배지 설명 토글 (데스크톱 hover는 title, 모바일/클릭은 이 토글)
  function mgrToggleBadgeHelp(kind) {
    const target = document.getElementById('badge-help-' + kind)
    if (!target) return
    const wasOpen = target.classList.contains('open')
    document.querySelectorAll('.badge-help').forEach(el => el.classList.remove('open'))
    if (!wasOpen) target.classList.add('open')
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') mgrCloseSettings()
  })

  async function mgrSaveNickname(userId) {
    const val = document.getElementById('mgr-nickname-input').value.trim()
    if (!val) return
    const { error } = await db.from('User').update({ nickname: val }).eq('id', userId)
    if (!error) {
      showShopMgrToast('닉네임이 저장됐어요!')
      const nameEl = document.querySelector('.shop-name')
      if (nameEl) nameEl.textContent = val
    } else {
      showShopMgrToast('저장 중 오류가 발생했어요: ' + error.message)
    }
  }

  async function mgrSaveShopSettings(userId) {
    const usernameInput = document.getElementById('mgr-username-input')
    const username = usernameInput.value.trim().toLowerCase()
    usernameInput.value = username

    if (!/^[a-z0-9-]{3,20}$/.test(username)) {
      showShopMgrToast('아이디는 영문 소문자·숫자·하이픈 3~20자로 입력해주세요')
      return
    }
    if (SHOP_RESERVED_USERNAMES.includes(username)) {
      showShopMgrToast('사용할 수 없는 아이디예요')
      return
    }

    const payload = {
      username,
      shopBio: document.getElementById('mgr-bio-input').value.trim(),
      deliveryTime: document.getElementById('mgr-delivery-input').value.trim(),
      refundPolicy: document.getElementById('mgr-refund-input').value.trim(),
      supportRecovery: document.getElementById('mgr-recovery-input').checked,
      businessHours: document.getElementById('mgr-hours-input').value.trim(),
    }

    const saveBtn = document.getElementById('mgr-save-btn')
    saveBtn.disabled = true
    saveBtn.textContent = '저장 중...'

    const { data, error } = await db.from('User').update(payload).eq('id', userId).select()

    saveBtn.disabled = false
    saveBtn.textContent = '저장'

    if (error) {
      if (error.code === '23505') {
        showShopMgrToast('이미 사용 중인 아이디예요')
      } else {
        showShopMgrToast('저장 중 오류가 발생했어요: ' + error.message)
      }
      return
    }
    if (!data || data.length === 0) {
      showShopMgrToast('저장에 실패했어요 (권한 문제일 수 있어요)')
      return
    }

    showShopMgrToast('상점 정보가 저장됐어요! 이동할게요...')
    if (username !== PAGE_USERNAME) {
      setTimeout(() => { window.location.href = '/shop/' + encodeURIComponent(username) }, 600)
    } else {
      document.getElementById('mgr-shop-address-text').textContent = 'resetlist.kr/shop/' + username
    }
  }

  async function mgrCopyShopLink() {
    const usernameInput = document.getElementById('mgr-username-input')
    const username = (usernameInput?.value ?? PAGE_USERNAME).trim()
    if (!username) { showShopMgrToast('먼저 상점 아이디를 저장해주세요'); return }
    const url = 'https://resetlist.kr/shop/' + encodeURIComponent(username)
    try {
      await navigator.clipboard.writeText(url)
      showShopMgrToast('링크가 복사됐어요!')
    } catch (e) {
      showShopMgrToast('링크: ' + url)
    }
  }

  function showShopMgrToast(msg) {
    let toast = document.getElementById('shop-mgr-toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'shop-mgr-toast'
      toast.className = 'shop-mgr-toast'
      document.body.appendChild(toast)
    }
    toast.textContent = msg
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 2200)
  }

  // --- 거래 액션: 판매자 계정 전달 완료 / 구매자 수령 확인 / 매물 삭제 ---
  async function mgrSellerConfirm(tradeId, listingId) {
    if (!confirm('계정을 구매자에게 전달하셨나요?\\n확인을 누르면 구매자에게 수령 확인 요청이 돼요.')) return
    try {
      await db.from('Trade').update({ status: 'seller_confirmed' }).eq('id', tradeId)
      await db.from('Listing').update({ status: 'seller_confirmed' }).eq('id', listingId)
      location.reload()
    } catch (e) {
      console.error(e)
      alert('오류가 발생했어요: ' + e.message)
    }
  }

  async function mgrBuyerConfirm(tradeId, listingId, sellerId) {
    if (!confirm('계정을 정상적으로 수령하셨나요?\\n확인하면 거래가 완료돼요. (후기는 나중에도 작성할 수 있어요)')) return
    try {
      const now = new Date().toISOString()

      // 동일 buyer-seller 쌍 이전 완료 거래 수 확인 (어뷰징 방지)
      const { data: prevCompleted } = await db.from('Trade')
        .select('id').eq('buyerId', mgrCurrentUserId).eq('sellerId', sellerId).eq('status', 'completed')
      const isFirstTime = !prevCompleted || prevCompleted.length === 0

      await db.from('Trade').update({ status: 'completed', completedAt: now }).eq('id', tradeId)
      await db.from('Listing').update({ status: 'sold' }).eq('id', listingId)

      if (isFirstTime) {
        const { data: seller } = await db.from('User').select('tradeCount').eq('id', sellerId).single()
        await db.from('User').update({ tradeCount: (seller?.tradeCount ?? 0) + 1 }).eq('id', sellerId)
      }

      alert('거래가 완료됐어요! 감사합니다 😊')
      location.reload()
    } catch (e) {
      console.error(e)
      alert('오류가 발생했어요: ' + e.message)
    }
  }

  // --- 끌어올리기 (5분 쿨다운, DB 트리거로도 강제됨) ---
  const BUMP_COOLDOWN_MS = 5 * 60 * 1000
  let mgrBumpTimer = null

  function mgrRefreshBumpBtn(id) {
    const btn = document.getElementById('bump-btn-' + id)
    if (!btn) return
    const last = mgrBumpedAt[id] ? new Date(mgrBumpedAt[id]).getTime() : 0
    const left = last + BUMP_COOLDOWN_MS - Date.now()
    if (left > 0) {
      const m = Math.floor(left / 60000)
      const sec = Math.ceil((left % 60000) / 1000)
      btn.disabled = true
      btn.textContent = m > 0 ? \`⬆ \${m}분 후\` : \`⬆ \${sec}초 후\`
      if (!mgrBumpTimer) mgrBumpTimer = setInterval(mgrRefreshAllBumpBtns, 1000)
    } else {
      btn.disabled = false
      btn.textContent = '⬆ 끌올'
    }
  }

  function mgrRefreshAllBumpBtns() {
    const btns = document.querySelectorAll('[id^="bump-btn-"]')
    if (btns.length === 0) { clearInterval(mgrBumpTimer); mgrBumpTimer = null; return }
    let anyWaiting = false
    btns.forEach(b => {
      const id = b.id.replace('bump-btn-', '')
      const last = mgrBumpedAt[id] ? new Date(mgrBumpedAt[id]).getTime() : 0
      if (last + BUMP_COOLDOWN_MS - Date.now() > 0) anyWaiting = true
      mgrRefreshBumpBtn(id)
    })
    if (!anyWaiting) { clearInterval(mgrBumpTimer); mgrBumpTimer = null }
  }

  async function mgrBump(id) {
    const btn = document.getElementById('bump-btn-' + id)
    const last = mgrBumpedAt[id] ? new Date(mgrBumpedAt[id]).getTime() : 0
    if (last + BUMP_COOLDOWN_MS > Date.now()) { mgrRefreshBumpBtn(id); return }
    if (btn) { btn.disabled = true; btn.textContent = '⬆ 올리는 중...' }
    const now = new Date().toISOString()
    const { data, error } = await db.from('Listing')
      .update({ bumpedAt: now }).eq('id', id).select('id, bumpedAt')
    if (error) {
      alert(error.message.includes('5분') ? '끌어올리기는 5분에 한 번만 가능해요' : '끌어올리기 실패: ' + error.message)
      mgrRefreshBumpBtn(id)
      return
    }
    if (!data || data.length === 0) {
      alert('끌어올리기에 실패했어요. 잠시 후 다시 시도해주세요.')
      mgrRefreshBumpBtn(id)
      return
    }
    mgrBumpedAt[id] = data[0].bumpedAt ?? now
    mgrRefreshBumpBtn(id)
    mgrToast('거래소 맨 위로 올렸어요 ⬆')
  }

  function mgrToast(msg) {
    let el = document.getElementById('mgr-toast')
    if (!el) {
      el = document.createElement('div')
      el.id = 'mgr-toast'
      el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(10px);background:#111;color:#fff;font-size:13px;font-weight:700;padding:11px 18px;border-radius:999px;z-index:9999;opacity:0;transition:all .2s;pointer-events:none;'
      document.body.appendChild(el)
    }
    el.textContent = msg
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateX(-50%) translateY(0)' })
    clearTimeout(el._t)
    el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) translateY(10px)' }, 1800)
  }

  async function mgrDeleteListing(id) {
    if (!confirm('이 판매계정을 삭제할까요?')) return
    await db.from('Trade').update({ status: 'cancelled' }).eq('listingId', id).not('status', 'eq', 'completed')
    await db.from('ListingCharacter').delete().eq('listingId', id)
    await db.from('Trade').delete().eq('listingId', id)
    const { error } = await db.from('Listing').delete().eq('id', id)
    if (error) { alert('삭제 중 오류가 발생했어요: ' + error.message); return }
    location.reload()
  }

  async function mgrLogout() {
    await db.auth.signOut()
    window.location.href = '/'
  }

  mgrInit()
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
  const isSellerConfirmed = l.status === 'seller_confirmed'
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
    : isSellerConfirmed
      ? `<div class="shop-status-overlay">수령확인 대기</div>`
      : isTrading
        ? `<div class="shop-status-overlay">거래중</div>`
        : ''

  return `
    <a class="shop-card${isSold ? ' is-sold' : ''}" href="/listing/?id=${esc(l.id)}" data-id="${esc(l.id)}" data-game="${esc(game.slug || '')}" data-status="${esc(l.status || '')}">
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
