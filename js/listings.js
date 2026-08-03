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

// 게임별 티어 표기를 카드 강조용 4단계(s/a/b/c)로 정규화
// gradeClass()는 쿠키런킹덤 등급만 다뤄서 별도로 둠
function cardTierClass(tier) {
  if (!tier) return ''
  const t = String(tier).trim()
  if (['SSS', 'SS', 'S', '위치', '비스트', '에인션트 각성', '에인션트', '레전더리'].includes(t)) return 's'
  if (['A', '드래곤', '슈퍼에픽'].includes(t)) return 'a'
  if (['B', '에픽'].includes(t)) return 'b'
  if (['C', 'D', 'E', 'F', '레어', '커먼'].includes(t)) return 'c'
  return ''   // 블루아카이브 학교명 등 등급 의미가 없는 값
}

function renderListingCard(listing) {
  const gameSlug = listing.game?.slug ?? ''
  const gameArtUrl = listing.game?.artImageUrl ?? ''
  const gameImageUrl = listing.game?.imageUrl ?? ''
  const gameName = listing.game?.nameKo ?? ''
  const serverName = listing.server?.nameKo ?? ''
  const nickname = listing.user?.nickname ?? '익명'
  const sellerGrade = listing.user?.sellerGrade ?? ''
  const artClass = getArtClass(gameSlug)
  const stock = listing.stock ?? 1

  const chars = listing.characters ?? []
  const currencies = (listing.currencies ?? []).filter(lc => lc.currency && lc.amount > 0)
  const hasChars = chars.length > 0

  const isSold = listing.status === 'sold'
  const isTrading = listing.status === 'trading'

  const charThumbOf = (c) => c ? (c.metadata?.cardImageUrl || c.imageUrl || '') : ''

  // --- 대표(히어로): 첫 번째 캐릭터. 없으면 게임 이미지 ---
  const heroChar = hasChars ? chars[0].character : null
  const heroCharCount = hasChars ? (chars[0].count ?? 1) : 1
  const heroCharImg = charThumbOf(heroChar)
  const gameFallback = gameArtUrl || gameImageUrl
  const heroImg = heroCharImg || gameFallback
  // 캐릭터 이미지 로드 실패 시 게임 이미지로, 그것도 없으면 숨김
  const heroOnError = heroCharImg && gameFallback
    ? ` onerror="this.onerror=null;this.src='${gameFallback}';this.classList.add('is-game-art')"`
    : ` onerror="this.style.display='none'"`
  const heroIsGameArt = !heroCharImg

  let heroName, heroSub
  if (heroChar) {
    heroName = heroChar.nameKo + (heroCharCount > 1 ? ` ×${heroCharCount}` : '')
    const rest = chars.length - 1
    heroSub = rest > 0 ? `외 ${rest}명 보유` : '캐릭터 1명'
  } else if (currencies.length > 0) {
    const top = currencies[0]
    const c = top.currency
    const rate = c?.ratePerUnit
    heroName = `${c?.nameKo ?? '재화'} ${(top.amount ?? 0).toLocaleString()}`
    heroSub = (rate && rate > 0) ? `약 ${Math.floor(top.amount / rate).toLocaleString()}연 분량` : '보유 재화'
  } else {
    heroName = gameName
    heroSub = '상세 설명 참고'
  }

  const heroTier = heroChar ? cardTierClass(heroChar.tier) : ''

  // --- 나머지 캐릭터 스트립 (히어로 제외) ---
  const STRIP_SLOTS = 6
  const restChars = chars.slice(1)
  let stripHtml = ''
  if (restChars.length > 0) {
    const shown = restChars.length <= STRIP_SLOTS ? restChars : restChars.slice(0, STRIP_SLOTS - 1)
    const moreCount = restChars.length - shown.length
    stripHtml = shown.map(lc => {
      const c = lc.character
      if (!c) return ''
      const gc = cardTierClass(c.tier)
      const cnt = (lc.count > 1) ? `<span class="char-count-badge">×${lc.count}</span>` : ''
      const thumb = charThumbOf(c)
      if (thumb) return `<span class="strip-ch-wrap"><img class="strip-ch${gc ? ' grade-' + gc : ''}" src="${thumb}" alt="${c.nameKo}" title="${c.nameKo}">${cnt}</span>`
      return `<span class="strip-ch-text${gc ? ' grade-' + gc : ''}">${c.nameKo}</span>`
    }).join('')
    if (moreCount > 0) stripHtml += `<span class="strip-ch-more">+${moreCount}</span>`
  } else if (hasChars && currencies.length > 0) {
    // 캐릭터가 1명뿐이고 재화가 있으면 스트립 자리에 재화 칩
    stripHtml = currencies.slice(0, 3).map(lc => {
      const c = lc.currency
      return `<span class="strip-cur">${c.imageUrl ? `<img src="${c.imageUrl}" alt="${c.nameKo}">` : '💎'}${(lc.amount ?? 0).toLocaleString()}</span>`
    }).join('')
  } else if (!hasChars && currencies.length > 1) {
    // 돌계: 대표로 쓴 첫 재화 외 나머지
    stripHtml = currencies.slice(1, 4).map(lc => {
      const c = lc.currency
      return `<span class="strip-cur">${c.imageUrl ? `<img src="${c.imageUrl}" alt="${c.nameKo}">` : '💎'}${(lc.amount ?? 0).toLocaleString()}</span>`
    }).join('')
  }

  // --- 배지 ---
  const statusBadge = isSold
    ? `<span class="card-flag flag-sold">판매완료</span>`
    : isTrading
      ? `<span class="card-flag flag-trading">거래중</span>`
      : (listing.viewCount > 50 ? `<span class="card-flag flag-hot">🔥 HOT</span>` : '')

  const discountHtml = listing.discountAmount
    ? `<span class="card-discount">↓ ${formatPrice(listing.discountAmount)} 할인</span>` : ''
  const stockChip = stock > 1 ? `<span class="stock-chip">재고 ${stock}</span>` : ''
  const currencyChip = (hasChars && currencies.length > 0)
    ? `<span class="card-currency-chip">${currencies[0].currency.imageUrl ? `<img src="${currencies[0].currency.imageUrl}" alt="">` : '💎'}<span class="card-currency-num">${currencies[0].amount.toLocaleString()}</span></span>`
    : ''

  const shopMiniHtml = `<div class="card-shop-mini">🏪 ${nickname}${sellerGrade ? ` <span class="grade">🏅 ${sellerGrade}</span>` : ''}</div>`

  const isBlocked = (isSold || isTrading) && !window.isAdmin
  const dimClass = isSold ? ' card-sold' : (isTrading ? ' card-trading' : '')
  const wrapOpen = isBlocked
    ? `<div class="card${dimClass}">`
    : `<a href="/listing/?id=${listing.id}" class="card${dimClass}">`
  const wrapClose = isBlocked ? `</div>` : `</a>`

  return wrapOpen + `
      <div class="card-hero ${artClass}${heroTier ? ' hero-' + heroTier : ''}">
        ${heroImg ? `<img class="card-hero-img${heroIsGameArt ? ' is-game-art' : ''}" src="${heroImg}" alt="${heroName}"${heroOnError}>` : ''}
        <div class="card-hero-shade"></div>
        <div class="card-hero-top">
          <span class="card-hero-game">${gameName}${serverName ? ` · ${serverName}` : ''}</span>
          ${statusBadge}
        </div>
        <div class="card-hero-foot">
          <div class="card-hero-name">${heroName}</div>
          <div class="card-hero-sub">${heroSub}</div>
        </div>
      </div>
      ${stripHtml ? `<div class="card-strip">${stripHtml}</div>` : `<div class="card-strip is-empty"></div>`}
      <div class="card-body">
        ${listing.description ? `<p class="card-desc">${listing.description.replace(/\r?\n/g, ' ').trim()}</p>` : ''}
        <div class="card-footer">
          <div class="card-price-wrap">
            <span class="card-price">${formatPrice(listing.price)}</span>
            ${discountHtml}
          </div>
          <div class="card-footer-chips">
            ${stockChip}
            ${currencyChip}
          </div>
        </div>
        ${shopMiniHtml}
      </div>
  ` + wrapClose
}

// ===== 매물 목록 로드 =====
async function loadListings({ container, gameSlug, serverId, page = 1, limit = 12, sort = 'latest', append = false, moreBtn = null, characterIds = null, characterFilter = null }) {
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
      id, price, discountAmount, description, createdAt, bumpedAt, viewCount, status, type, stock,
      game:Game(nameKo, slug, emoji, imageUrl, artImageUrl),
      server:Server(nameKo),
      user:User(nickname, username, sellerGrade),
      characters:ListingCharacter(
        count,
        character:Character(nameKo, tier, imageUrl, metadata)
      ),
      currencies:ListingCurrency(amount, currency:Currency(nameKo, imageUrl, sortOrder, ratePerUnit))
    `
    const orderCol = sort === 'price' ? 'price' : 'bumpedAt'
    const orderAsc = sort === 'price'

    const buildBase = (statusList) => {
      let q = db.from('Listing').select(SELECT_FIELDS)
        .in('status', statusList)
        .order(orderCol, { ascending: orderAsc })
      if (gameId) q = q.eq('gameId', gameId)
      if (serverId) q = q.eq('serverId', serverId)
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
