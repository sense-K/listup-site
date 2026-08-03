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
  const sellerGrade = listing.user?.sellerGrade ?? ''
  const artClass = getArtClass(gameSlug)

  const isCurrency = listing.type === 'currency'
  const stock = listing.stock ?? 1

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
    const countBadge = (count > 1) ? `<span class="char-count-badge">×${count}</span>` : ''
    const charThumb = c.metadata?.cardImageUrl || c.imageUrl
    if (charThumb) return `<span style="position:relative;display:inline-block;"><img class="char-img-badge${gc ? ' grade-' + gc : ''}" src="${charThumb}" alt="${c.nameKo}" title="${c.nameKo + (count > 1 ? ' ×' + count : '')}">${countBadge}</span>`
    return `<span class="char-badge${gc ? ' grade-' + gc : ''}">${c.nameKo}${count > 1 ? ` ×${count}` : ''}</span>`
  }

  const discountHtml = listing.discountAmount
    ? `<span class="card-discount">↓ ${formatPrice(listing.discountAmount)} 할인</span>`
    : ''

  // 돌계(재화) 배지 + 재고 칩
  const dollBadge = isCurrency ? `<span class="badge-type-doll">돌계</span>` : ''
  const stockChip = stock > 1 ? `<span class="stock-chip">재고 ${stock}</span>` : ''

  // 돌계 카드: 캐릭터 칩 대신 재화 라인(재화 이미지 + 이름 + 수량 + 환산 연차)
  const currencyLinesHtml = isCurrency ? currencies.map(lc => {
    const c = lc.currency
    const rate = c?.ratePerUnit
    const approx = (rate && rate > 0) ? ` · 약 ${Math.floor(lc.amount / rate).toLocaleString()}연` : ''
    return `<div class="card-currency-line">
      ${c?.imageUrl ? `<img src="${c.imageUrl}" alt="${c.nameKo ?? '재화'}">` : `<span class="card-currency-line-icon">💎</span>`}
      <span class="card-currency-line-text">${c?.nameKo ?? '재화'} ${(lc.amount ?? 0).toLocaleString()}${approx}</span>
    </div>`
  }).join('') : ''

  // 상점 미니 라인 (판매자 닉네임 + 등급) — 카드 전체가 <a>라서 텍스트로만 표시
  const shopMiniHtml = `<div class="card-shop-mini">🏪 ${nickname}${sellerGrade ? ` <span class="grade">🏅 ${sellerGrade}</span>` : ''}</div>`

  const isSold = listing.status === 'sold'
  const isTrading = listing.status === 'trading'
  const hotBadge = !isSold && !isTrading && listing.viewCount > 50 ? `<div class="badge-hot">🔥 HOT</div>` : ''
  const tradingOverlay = isTrading ? `<div class="badge-trading-overlay"><span class="badge-trading-text">거래중</span></div>` : ''
  const soldOverlay = isSold ? `<div class="badge-sold-overlay"><span class="badge-sold-text">판매완료</span></div>` : ''
  const gameName = listing.game?.nameKo ?? ''
  const artInfo = gameName + (serverName ? ` / ${serverName}` : '')

  const isBlocked = (isSold || isTrading) && !window.isAdmin
  const wrapOpen = isBlocked
    ? `<div class="card${isSold ? ' card-sold' : ' card-trading'}">`
    : `<a href="/listing/?id=${listing.id}" class="card${isSold ? ' card-sold' : ''}">`
  const wrapClose = isBlocked ? `</div>` : `</a>`

  return wrapOpen + `
      <div class="card-art ${artClass}">
        ${gameArtUrl ? `<img class="card-art-img" src="${gameArtUrl}" alt="${gameName}">` : ''}
        <div class="card-art-overlay"></div>
        ${isSold ? `<div class="card-art-blur"></div>` : ''}
        ${dollBadge}
        ${hotBadge}
        ${tradingOverlay}
        ${soldOverlay}
        ${gameName ? `<span class="card-art-game-name">${gameName}</span>` : ''}
      </div>
      <div class="card-body">
        ${(currencies.length > 0 && !isCurrency) ? `
        <div class="card-currencies">
          ${currencies.map(lc => {
            const c = lc.currency
            return `<span class="card-currency-chip">
              ${c.imageUrl ? `<img src="${c.imageUrl}" alt="${c.nameKo}">` : '💎'}
              <span class="card-currency-num">${lc.amount.toLocaleString()}</span>
            </span>`
          }).join('')}
        </div>` : ''}
        ${isCurrency
          ? `<div class="card-currency-lines">${currencyLinesHtml}</div>`
          : `<div class="card-chars">${charBadges}${extraBadge}</div>`}
        ${listing.description ? `<p class="card-desc">${listing.description.replace(/\r?\n/g, ' ').trim()}</p>` : ''}
        <div class="card-footer">
          <div>
            <span class="card-price">${formatPrice(listing.price)}</span>
            ${discountHtml}
          </div>
          <div class="card-footer-chips">
            ${stockChip}
            ${serverName ? `<span class="card-server-chip">${serverName}</span>` : ''}
          </div>
        </div>
        ${shopMiniHtml}
      </div>
  ` + wrapClose
}

// ===== 매물 목록 로드 =====
async function loadListings({ container, gameSlug, serverId, page = 1, limit = 9, sort = 'latest', append = false, moreBtn = null, characterIds = null, characterFilter = null, typeFilter = 'all' }) {
  const el = document.getElementById(container)
  if (!el) return

  const moreBtnEl = moreBtn ? document.getElementById(moreBtn) : null

  if (!append) el.innerHTML = '<div class="loading">불러오는 중...</div>'
  if (moreBtnEl) moreBtnEl.style.display = 'none'

  if (window._adminReady) await window._adminReady

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

    // 상태 구분 없이 최신순으로 한 번에 노출 (거래중·판매완료가 섞여 활발해 보이도록)
    const SELECT_FIELDS = `
      id, price, discountAmount, description, createdAt, viewCount, status, type, stock,
      game:Game(nameKo, slug, emoji, imageUrl, artImageUrl),
      server:Server(nameKo),
      user:User(nickname, username, sellerGrade),
      characters:ListingCharacter(
        count,
        character:Character(nameKo, tier, imageUrl, metadata)
      ),
      currencies:ListingCurrency(amount, currency:Currency(nameKo, imageUrl, sortOrder, ratePerUnit))
    `
    const orderCol = sort === 'price' ? 'price' : 'createdAt'
    const orderAsc = sort === 'price'

    const buildBase = (statusList) => {
      let q = db.from('Listing').select(SELECT_FIELDS)
        .in('status', statusList)
        .order(orderCol, { ascending: orderAsc })
      if (gameId) q = q.eq('gameId', gameId)
      if (serverId) q = q.eq('serverId', serverId)
      if (typeFilter && typeFilter !== 'all') q = q.eq('type', typeFilter)
      if (filteredListingIds) q = q.in('id', filteredListingIds)
      return q
    }

    // 판매중·거래중·판매완료를 한 번에 최신순(또는 가격순)으로 fetch — 상태별로 묶지 않음
    const { data: mixedData, error } = await buildBase(['active', 'trading', 'sold']).limit(400)
    if (error) throw error

    // 정렬 그대로(최신순/가격순) 사용 → 거래완료가 뒤로 몰리지 않고 중간중간 섞여 노출됨
    const allListings = mixedData ?? []
    const start = (page - 1) * limit
    const listings = allListings.slice(start, start + limit + 1)  // limit+1 for hasMore check

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
