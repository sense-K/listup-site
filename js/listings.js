// ===== 매물 카드 렌더링 =====

function getArtClass(gameSlug) {
  const map = { genshin: 'genshin', bluearchive: 'bluearchive', nikke: 'nikke', cookierunkingdom: 'cookierunkingdom' }
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
  const TOTAL_SLOTS = 8

  let charBadges, extraBadge
  if (chars.length <= TOTAL_SLOTS) {
    // 8개 이하: 전부 표시, +X 없음
    charBadges = chars.map(lc => renderCharIcon(lc.character)).join('')
    extraBadge = ''
  } else {
    // 8개 초과: 앞 7개 + 마지막 슬롯에 +X
    charBadges = chars.slice(0, TOTAL_SLOTS - 1).map(lc => renderCharIcon(lc.character)).join('')
    extraBadge = `<span class="char-img-more">+${chars.length - (TOTAL_SLOTS - 1)}</span>`
  }

  function renderCharIcon(c) {
    if (!c) return ''
    const gc = typeof gradeClass === 'function' ? gradeClass(c.tier) : ''
    if (c.imageUrl) return `<img class="char-img-badge${gc ? ' grade-' + gc : ''}" src="${c.imageUrl}" alt="${c.nameKo}" title="${c.nameKo}">`
    return `<span class="char-badge${gc ? ' grade-' + gc : ''}">${c.nameKo}</span>`
  }

  const discountHtml = listing.discountAmount
    ? `<span class="card-discount">↓ ${formatPrice(listing.discountAmount)} 할인</span>`
    : ''

  const hotBadge = listing.viewCount > 50 ? `<div class="badge-hot">🔥 HOT</div>` : ''
  const tradingBadge = listing.status === 'trading' ? `<div class="badge-trading">거래중</div>` : ''

  return `
    <a href="/listing/?id=${listing.id}" class="card">
      <div class="card-art ${artClass}" ${gameArtUrl ? `style="background-image:url('${gameArtUrl}');background-size:cover;background-position:center top;"` : ''}>
        ${gameArtUrl ? `<div style="position:absolute;inset:0;border-radius:16px 16px 0 0;background:linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%);"></div>` : ''}
        ${hotBadge}
        ${tradingBadge}
        ${serverName ? `<span style="position:absolute;bottom:10px;left:12px;background:rgba(0,0,0,0.55);color:#fff;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;backdrop-filter:blur(4px);">${serverName}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-price-row">
          <span class="card-price">${formatPrice(listing.price)}</span>
          <span class="card-game-badge">
            ${gameImageUrl ? `<img src="${gameImageUrl}" alt="${listing.game?.nameKo ?? ''}" style="width:14px;height:14px;border-radius:3px;object-fit:cover;vertical-align:middle;">` : gameEmoji}
            ${listing.game?.nameKo ?? ''}
          </span>
        </div>
        ${discountHtml ? `<div style="margin-top:-4px;">${discountHtml}</div>` : ''}
        <div class="card-chars">${charBadges}${extraBadge}</div>
        ${listing.description ? `<div class="card-desc">${listing.description}</div>` : ''}
        <div class="card-footer">
          <div class="card-seller">
            <span>👤 ${nickname}</span>
          </div>
          <span>${timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </a>
  `
}

// ===== 매물 목록 로드 =====
async function loadListings({ container, gameSlug, serverId, page = 1, limit = 9, sort = 'latest', append = false, moreBtn = null, search = '' }) {
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

    // limit+1 개 조회해서 다음 페이지 존재 여부 확인
    let query = db
      .from('Listing')
      .select(`
        id, price, discountAmount, description, createdAt, viewCount, status,
        game:Game(nameKo, slug, emoji, imageUrl, artImageUrl),
        server:Server(nameKo),
        user:User(nickname),
        characters:ListingCharacter(
          character:Character(nameKo, tier, imageUrl)
        )
      `)
      .in('status', ['active', 'trading'])
      .order(sort === 'price' ? 'price' : 'createdAt', { ascending: sort === 'price' })
      .range((page - 1) * limit, page * limit)  // limit+1

    if (gameId) query = query.eq('gameId', gameId)
    if (serverId) query = query.eq('serverId', serverId)

    // 검색어가 있으면 캐릭터명 + 설명 기준으로 필터링
    if (search) {
      const term = search.trim()
      const [{ data: chars }, { data: descMatches }] = await Promise.all([
        db.from('Character').select('id').ilike('nameKo', `%${term}%`),
        db.from('Listing').select('id').ilike('description', `%${term}%`).in('status', ['active', 'trading'])
      ])
      const charIds = (chars ?? []).map(c => c.id)
      let charListingIds = []
      if (charIds.length > 0) {
        const { data: lcs } = await db.from('ListingCharacter').select('listingId').in('characterId', charIds)
        charListingIds = (lcs ?? []).map(lc => lc.listingId)
      }
      const descIds = (descMatches ?? []).map(l => l.id)
      const matchIds = [...new Set([...charListingIds, ...descIds])]
      if (matchIds.length === 0) {
        if (!append) el.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div><p>"${term}" 검색 결과가 없어요</p></div>`
        if (moreBtnEl) moreBtnEl.style.display = 'none'
        return
      }
      query = query.in('id', matchIds)
    }

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
