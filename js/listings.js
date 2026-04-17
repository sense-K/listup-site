// ===== 매물 카드 렌더링 =====

function getArtClass(gameSlug) {
  const map = {
    genshin: 'genshin', bluearchive: 'bluearchive', nikke: 'nikke',
    'cookie-run': 'cookierunkingdom', cookierunkingdom: 'cookierunkingdom',
    stardive: 'stardive', zzz: 'zzz', sevenknightsre: 'sevenknightsre',
    leehwan: 'leehwan', trickcal: 'trickcal', limbus: 'limbus'
  }
  return map[gameSlug] || 'genshin'
}

function renderListingCard(listing) {
  const gameSlug = listing.game?.slug ?? ''
  const gameEmoji = listing.game?.emoji ?? ''
  const gameImageUrl = listing.game?.imageUrl ?? ''
  const gameArtUrl = listing.game?.artImageUrl ?? ''
  const serverName = listing.server?.nameKo ?? ''
  const nickname = listing.user?.nickname ?? '익명'
  const artClass = getArtClass(gameSlug)

  const chars = listing.characters ?? []
  const currencies = (listing.currencies ?? []).filter(lc => lc.currency && lc.amount > 0)
  const TOTAL_SLOTS = 10

  let charBadges, extraBadge
  if (chars.length <= TOTAL_SLOTS) {
    charBadges = chars.map(lc => renderCharIcon(lc.character, lc.count)).join('')
    extraBadge = ''
  } else {
    charBadges = chars.slice(0, TOTAL_SLOTS - 1).map(lc => renderCharIcon(lc.character, lc.count)).join('')
    extraBadge = `<span class="char-img-more">+${chars.length - (TOTAL_SLOTS - 1)}</span>`
  }

  function renderCharIcon(c, count) {
    if (!c) return ''
    const gc = typeof gradeClass === 'function' ? gradeClass(c.tier) : ''
    const countBadge = (count > 1) ? `<span style="position:absolute;bottom:2px;right:2px;background:#111;color:#fff;border-radius:999px;font-size:13px;font-weight:700;min-width:21px;height:21px;display:flex;align-items:center;justify-content:center;padding:0 3px;line-height:1;">×${count}</span>` : ''
    if (c.imageUrl) return `<span style="position:relative;display:inline-block;"><img class="char-img-badge${gc ? ' grade-' + gc : ''}" src="${c.imageUrl}" alt="${c.nameKo}" title="${c.nameKo + (count > 1 ? ' ×' + count : '')}">${countBadge}</span>`
    return `<span class="char-badge${gc ? ' grade-' + gc : ''}">${c.nameKo}${count > 1 ? ` ×${count}` : ''}</span>`
  }

  const discountHtml = listing.discountAmount
    ? `<span class="card-discount">↓ ${formatPrice(listing.discountAmount)} 할인</span>`
    : ''

  const isSold = listing.status === 'sold'
  const isTrading = listing.status === 'trading'
  const hotBadge = !isSold && !isTrading && listing.viewCount > 50 ? `<div class="badge-hot">🔥 HOT</div>` : ''
  const tradingOverlay = isTrading ? `<div class="badge-trading-overlay"><span class="badge-trading-text">거래중</span></div>` : ''
  const soldOverlay = isSold ? `<div class="badge-sold-overlay"><span class="badge-sold-text">판매완료</span></div>` : ''
  const gameName = listing.game?.nameKo ?? ''
  const artInfo = gameName + (serverName ? ` / ${serverName}` : '')

  return `
    <a href="/listing/?id=${listing.id}" class="card${isSold ? ' card-sold' : ''}">
      <div class="card-art ${artClass}">
        ${gameArtUrl ? `<img class="card-art-img" src="${gameArtUrl}" alt="${gameName}">` : ''}
        <div class="card-art-overlay"></div>
        ${isSold ? `<div class="card-art-blur"></div>` : ''}
        ${hotBadge}
        ${tradingOverlay}
        ${soldOverlay}
      </div>
      <div class="card-body">
        ${currencies.length > 0 || serverName ? `
        <div class="card-currencies">
          ${serverName ? `<span class="card-server-chip">${serverName}</span>` : ''}
          ${currencies.map(lc => {
            const c = lc.currency
            return `<span class="card-currency-chip">
              ${c.imageUrl ? `<img src="${c.imageUrl}" alt="${c.nameKo}">` : '💎'}
              ${lc.amount.toLocaleString()}
            </span>`
          }).join('')}
        </div>` : ''}
        <div class="card-chars">${charBadges}${extraBadge}</div>
        <div class="card-footer">
          <div>
            <span class="card-price">${formatPrice(listing.price)}</span>
            ${discountHtml}
          </div>
          <div class="card-seller">
            <span>👤 ${nickname}</span>
          </div>
        </div>
      </div>
    </a>
  `
}

// ===== 매물 목록 로드 =====
async function loadListings({ container, gameSlug, serverId, page = 1, limit = 9, sort = 'latest', append = false, moreBtn = null, characterIds = null, characterFilter = null }) {
  const el = document.getElementById(container)
  if (!el) return

  const moreBtnEl = moreBtn ? document.getElementById(moreBtn) : null

  if (!append) el.innerHTML = '<div class="loading">불러오는 중...</div>'
  if (moreBtnEl) moreBtnEl.style.display = 'none'

  try {
    let gameId = null
    if (gameSlug) {
      const { data: game } = await db.from('Game').select('id').eq('slug', gameSlug).single()
      gameId = game?.id ?? null
      if (!gameId) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">🎮</div><p>게임 정보를 찾을 수 없어요</p></div>'
        return
      }
    }

    // 캐릭터 필터: 선택한 캐릭터를 모두 보유한 계정만 (교집합, count 포함)
    // characterFilter: { charId: { count } } 형태 (게임 페이지 필터)
    // characterIds: string[] 형태 (하위 호환)
    const filterMap = characterFilter
      ? Object.fromEntries(Object.entries(characterFilter).map(([id, v]) => [id, v.count ?? 1]))
      : characterIds?.length > 0
        ? Object.fromEntries(characterIds.map(id => [id, 1]))
        : null

    let filteredListingIds = null
    if (filterMap && Object.keys(filterMap).length > 0) {
      let matchSet = null
      for (const [charId, requiredCount] of Object.entries(filterMap)) {
        const { data: lcs } = await db.from('ListingCharacter').select('listingId, count').eq('characterId', charId)
        const ids = new Set((lcs ?? []).filter(lc => (lc.count ?? 1) >= requiredCount).map(lc => lc.listingId))
        matchSet = matchSet === null ? ids : new Set([...matchSet].filter(id => ids.has(id)))
      }
      filteredListingIds = matchSet ? [...matchSet] : []
      if (filteredListingIds.length === 0) {
        if (!append) el.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div><p>조건에 맞는 계정이 없어요</p></div>`
        if (moreBtnEl) moreBtnEl.style.display = 'none'
        return
      }
    }

    // limit+1 개 조회해서 다음 페이지 존재 여부 확인
    let query = db
      .from('Listing')
      .select(`
        id, price, discountAmount, description, createdAt, viewCount, status,
        game:Game(nameKo, slug, emoji, imageUrl, artImageUrl),
        server:Server(nameKo),
        user:User(nickname),
        characters:ListingCharacter(
          count,
          character:Character(nameKo, tier, imageUrl)
        ),
        currencies:ListingCurrency(amount, currency:Currency(nameKo, imageUrl, sortOrder))
      `)
      .in('status', ['active', 'trading', 'sold'])
      .order(sort === 'price' ? 'price' : 'createdAt', { ascending: sort === 'price' })
      .range((page - 1) * limit, page * limit)  // limit+1

    if (gameId) query = query.eq('gameId', gameId)
    if (serverId) query = query.eq('serverId', serverId)
    if (filteredListingIds) query = query.in('id', filteredListingIds)

    const { data: listings, error } = await query

    if (error) throw error

    if (!listings || listings.length === 0) {
      if (!append) {
        el.innerHTML = `
          <div class="empty">
            <div class="empty-icon">📭</div>
            <p>아직 등록된 계정이 없어요</p>
          </div>
        `
      }
      return
    }

    const hasMore = listings.length > limit
    const pageListings = listings.slice(0, limit)

    // Listing.status가 'trading'인데 실제 활성 Trade가 없으면 active로 보정
    const tradingIds = pageListings.filter(l => l.status === 'trading').map(l => l.id)
    let activeTradeIds = new Set()
    if (tradingIds.length > 0) {
      const { data: activeTrades } = await db
        .from('Trade')
        .select('listingId')
        .in('listingId', tradingIds)
        .in('status', ['active', 'seller_confirmed'])
      activeTradeIds = new Set((activeTrades ?? []).map(t => t.listingId))
    }
    const corrected = pageListings.map(l =>
      l.status === 'trading' && !activeTradeIds.has(l.id) ? { ...l, status: 'active' } : l
    )

    if (append) {
      const existingGrid = el.querySelector('.listings-grid')
      if (existingGrid) {
        existingGrid.innerHTML += corrected.map(renderListingCard).join('')
      } else {
        el.innerHTML = `<div class="listings-grid">${corrected.map(renderListingCard).join('')}</div>`
      }
    } else {
      el.innerHTML = `<div class="listings-grid">${corrected.map(renderListingCard).join('')}</div>`
    }

    if (moreBtnEl) moreBtnEl.style.display = hasMore ? 'block' : 'none'
  } catch (e) {
    console.error(e)
    if (!append) el.innerHTML = '<div class="empty"><p>계정을 불러오지 못했어요</p></div>'
  }
}
