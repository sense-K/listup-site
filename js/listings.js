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
  const visibleChars = chars.slice(0, 4)
  const extraCount = chars.length - visibleChars.length

  const charBadges = visibleChars.map(lc => {
    const c = lc.character
    if (!c) return ''
    const gc = typeof gradeClass === 'function' ? gradeClass(c.tier) : ''
    return `<span class="char-badge${gc ? ' grade-' + gc : ''}">${c.nameKo}</span>`
  }).join('')

  const extraBadge = extraCount > 0
    ? `<span class="char-badge tier-more">+${extraCount}</span>`
    : ''

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
          ${discountHtml}
        </div>
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
async function loadListings({ container, gameSlug, serverId, page = 1, limit = 9, sort = 'latest' }) {
  const el = document.getElementById(container)
  if (!el) return

  el.innerHTML = '<div class="loading">불러오는 중...</div>'

  try {
    let gameId = null
    if (gameSlug) {
      const { data: game } = await db.from('Game').select('id').eq('slug', gameSlug).single()
      gameId = game?.id ?? null
    }

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
      .range((page - 1) * limit, page * limit - 1)

    if (gameId) query = query.eq('gameId', gameId)
    if (serverId) query = query.eq('serverId', serverId)

    const { data: listings, error } = await query

    if (error) throw error

    if (!listings || listings.length === 0) {
      el.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📭</div>
          <p>아직 등록된 계정이 없어요</p>
        </div>
      `
      return
    }

    el.innerHTML = `<div class="listings-grid">${listings.map(renderListingCard).join('')}</div>`
  } catch (e) {
    console.error(e)
    el.innerHTML = '<div class="empty"><p>계정을 불러오지 못했어요</p></div>'
  }
}
