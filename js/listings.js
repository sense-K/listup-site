// ===== 매물 카드 렌더링 =====

function renderListingCard(listing) {
  const chars = listing.characters?.map(lc => {
    const c = lc.character
    if (!c) return ''
    const tierClass = c.tier === 'S' ? 'tier-s' : c.tier === 'A' ? 'tier-a' : ''
    const img = c.imageUrl
      ? `<img src="${c.imageUrl}" alt="${c.nameKo}" loading="lazy">`
      : ''
    return `<span class="char-badge ${tierClass}">${img}${c.nameKo}</span>`
  }).join('') ?? ''

  const gameName = listing.game?.nameKo ?? ''
  const gameEmoji = listing.game?.emoji ?? ''
  const serverName = listing.server?.nameKo ?? ''
  const nickname = listing.user?.nickname ?? '익명'
  const trustScore = listing.user?.trustScore ?? 0

  const discountHtml = listing.discountAmount
    ? `<span style="font-size:13px;color:#10b981;font-weight:600;">↓ ${formatPrice(listing.discountAmount)} 할인</span>`
    : ''

  return `
    <article class="card">
      <div class="card-header">
        <span class="card-game">${gameEmoji} ${gameName} · ${serverName}</span>
        <div style="text-align:right;">
          <div class="card-price">${formatPrice(listing.price)}<small>/개</small></div>
          ${discountHtml}
        </div>
      </div>
      <div class="card-characters">${chars}</div>
      ${listing.description ? `<p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;line-height:1.5;">${listing.description}</p>` : ''}
      <div class="card-footer">
        <div class="seller-info">
          <span>👤 ${nickname}</span>
          ${trustScore > 0 ? `<span class="trust-score">★ ${trustScore}</span>` : ''}
        </div>
        <span>${timeAgo(listing.createdAt)}</span>
      </div>
    </article>
  `
}

// ===== 매물 목록 로드 =====
async function loadListings({ container, gameSlug, serverId, page = 1, limit = 20 }) {
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
        id, price, discountAmount, description, contactInfo, createdAt, status,
        game:Game(nameKo, slug, emoji),
        server:Server(nameKo),
        user:User(nickname, trustScore),
        characters:ListingCharacter(
          character:Character(nameKo, tier, imageUrl)
        )
      `)
      .eq('status', 'active')
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (gameId) query = query.eq('gameId', gameId)
    if (serverId) query = query.eq('serverId', serverId)

    const { data: listings, error } = await query

    if (error) throw error

    if (!listings || listings.length === 0) {
      el.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📭</div>
          <p>아직 등록된 매물이 없어요</p>
        </div>
      `
      return
    }

    el.innerHTML = `<div class="listings-grid">${listings.map(renderListingCard).join('')}</div>`
  } catch (e) {
    console.error(e)
    el.innerHTML = '<div class="empty"><p>매물을 불러오지 못했어요</p></div>'
  }
}
