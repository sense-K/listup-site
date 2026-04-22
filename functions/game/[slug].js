const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

export async function onRequest({ params, env, request }) {
  const slug = params.slug
  if (!slug || !/^[a-z0-9_-]+$/.test(slug)) {
    return new Response('Not Found', { status: 404 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/Game?slug=eq.${slug}&select=id,nameKo,nameEn,slug,emoji,imageUrl,artImageUrl&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
  )
  const games = await res.json()
  const game = games?.[0]
  if (!game) return new Response('Not Found', { status: 404 })

  const nameKo = game.nameKo ?? slug
  const nameEn = game.nameEn ?? ''
  const displayName = nameEn ? `${nameKo} (${nameEn})` : nameKo
  const title = `${nameKo} 공략 - 플레이센스`
  const desc = `${nameKo} 공략 도구와 판매계정 거래소를 플레이센스에서 확인하세요.`
  const pageUrl = `https://resetlist.kr/game/${slug}/`
  const emoji = game.emoji ?? '🎮'
  const heroBg = game.artImageUrl ? `style="background-image:url('${game.artImageUrl}')"` : ''

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:site_name" content="플레이센스">
  <link rel="stylesheet" href="/css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/js/config.js"></script>
  <style>
    /* .game-hub-wrap, .tools-grid, .hub-tool-card → style.css */
    .section-label { font-size: 12px; font-weight: 700; color: var(--text-sub, #64748b); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border, #e5e7eb); }
    .coming-soon-box { background: #f8fafc; border: 1.5px dashed var(--border, #e5e7eb); border-radius: 16px; padding: 32px; text-align: center; color: var(--text-sub, #64748b); margin-bottom: 40px; }
    .coming-soon-box p { font-size: 14px; margin-top: 8px; }
    .trade-section { display: flex; gap: 12px; flex-wrap: wrap; }
    .trade-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 14px; text-decoration: none; font-size: 15px; font-weight: 700; transition: transform 0.15s, box-shadow 0.15s; }
    .trade-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .trade-btn-primary { background: #6c47ff; color: #fff; }
    .trade-btn-secondary { background: #f1f5f9; color: #1e293b; border: 1.5px solid var(--border, #e5e7eb); }
  </style>
</head>
<body>
  <div id="navbar-container"></div>
  <main class="game-hub-wrap">
    <div class="game-hub-hero">
      <div class="game-hub-hero-bg" ${heroBg}></div>
      <div class="game-hub-hero-overlay"></div>
      <div class="game-hub-hero-content">
        <img class="game-hub-app-icon" id="game-hub-app-icon" src="" alt="" style="display:none;">
        <span class="game-hub-icon" id="game-hub-emoji" style="font-size:48px;line-height:1;">${emoji}</span>
        <div>
          <div class="game-hub-title">${displayName}</div>
          <div class="game-hub-sub">공략 도구 준비 중</div>
        </div>
      </div>
    </div>

    <div class="section-label">공략 도구</div>
    <div class="coming-soon-box">
      <div style="font-size:32px;">🔧</div>
      <strong style="font-size:15px;font-weight:700;color:#475569;">공략 도구 준비 중이에요</strong>
      <p>곧 다양한 공략 도구가 추가될 예정이에요.<br>그동안 판매계정 거래소를 이용해보세요!</p>
    </div>

    <div class="section-label">거래소</div>
    <div class="trade-section">
      <a href="/trade/${slug}/" class="trade-btn trade-btn-primary">${emoji} 거래소 바로가기 →</a>
      <a href="/trade/price/${slug}/" class="trade-btn trade-btn-secondary">📊 계정 시세 확인</a>
    </div>
  </main>
  <div id="footer-container"></div>
  <script>
    const GAME_SLUG = '${slug}'
    async function loadGameHero() {
      const { data: game } = await db.from('Game').select('imageUrl, artImageUrl').eq('slug', GAME_SLUG).single()
      if (!game) return
      if (game.artImageUrl) {
        document.getElementById('game-hub-hero-bg').style.backgroundImage = \`url('\${game.artImageUrl}')\`
      }
      if (game.imageUrl) {
        const icon = document.getElementById('game-hub-app-icon')
        const emoji = document.getElementById('game-hub-emoji')
        icon.src = game.imageUrl
        icon.alt = '${nameKo}'
        icon.style.display = 'block'
        if (emoji) emoji.style.display = 'none'
      }
    }
    loadGameHero()
    document.getElementById('navbar-container').innerHTML = renderNavbar()
    loadAndRenderGameUI(null)
    document.getElementById('footer-container').innerHTML = typeof renderFooter === 'function' ? renderFooter() : ''
  </script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
