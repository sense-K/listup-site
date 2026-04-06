// ===== Supabase 설정 =====
const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ===== 게임 목록 =====
const GAMES = [
  { slug: 'genshin',          nameKo: '원신',        emoji: '🌙', artClass: 'genshin',       path: '/genshin/' },
  { slug: 'bluearchive',      nameKo: '블루아카이브', emoji: '📘', artClass: 'bluearchive',   path: '/bluearchive/' },
  { slug: 'nikke',            nameKo: '니케',         emoji: '⚡', artClass: 'nikke',         path: '/nikke/' },
  { slug: 'cookierunkingdom', nameKo: '쿠키런킹덤',  emoji: '🍪', artClass: 'cookierunkingdom', path: '/cookierunkingdom/' },
]

// ===== 공용 유틸 =====
function formatPrice(price) {
  if (price >= 10000) return (price / 10000).toFixed(1).replace('.0', '') + '만원'
  return price.toLocaleString() + '원'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return m + '분 전'
  const h = Math.floor(m / 60)
  if (h < 24) return h + '시간 전'
  return Math.floor(h / 24) + '일 전'
}

function renderNavbar(activePage = '') {
  // 렌더 후 비동기로 로그인 상태 업데이트
  setTimeout(initNavbarAuth, 0)
  return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/" class="navbar-logo">리스트업</a>
        <div class="navbar-menu">
          <a href="/" class="${activePage === 'home' ? '' : 'muted'}">거래소</a>
          <a href="#" class="muted">공지사항</a>
          <a href="#" class="muted">이용안내</a>
        </div>
        <div class="navbar-actions" id="navbar-actions">
          <a href="/auth/" class="login-btn">로그인</a>
          <a href="/trade/register.html" class="navbar-sell-btn">판매하기 ↗</a>
        </div>
      </div>
    </nav>
  `
}

async function initNavbarAuth() {
  const { data: { session } } = await db.auth.getSession()
  const el = document.getElementById('navbar-actions')
  if (!el) return
  if (session?.user) {
    const { data: user } = await db.from('User').select('nickname').eq('id', session.user.id).single()
    const nickname = user?.nickname ?? '사용자'
    el.innerHTML = `
      <span style="font-size:13px;color:#888;font-weight:600;">${nickname}</span>
      <button class="login-btn" onclick="authSignOut()" style="background:none;border:none;cursor:pointer;">로그아웃</button>
      <a href="/trade/register.html" class="navbar-sell-btn">판매하기 ↗</a>
    `
  }
}

async function authSignOut() {
  await db.auth.signOut()
  window.location.reload()
}

async function requireAuth() {
  const { data: { session } } = await db.auth.getSession()
  if (!session) {
    window.location.href = '/auth/?next=' + encodeURIComponent(location.pathname + location.search)
    return null
  }
  // User 테이블에 없으면 자동 생성 (기존 가입자 대비)
  const { data: existing } = await db.from('User').select('id').eq('id', session.user.id).single()
  if (!existing) {
    const now = new Date().toISOString()
    await db.from('User').insert({
      id: session.user.id,
      nickname: session.user.email?.split('@')[0] ?? '사용자',
      isPhoneVerified: false,
      createdAt: now,
      updatedAt: now
    })
  }
  return session.user
}

// 게임 아이콘 렌더 (앱 아이콘 or 이모지 fallback)
function gameIcon(game, size = 20) {
  if (game.imageUrl) {
    return `<img src="${game.imageUrl}" alt="${game.nameKo}" style="width:${size}px;height:${size}px;border-radius:${Math.round(size*0.22)}px;object-fit:cover;flex-shrink:0;">`
  }
  return `<span style="font-size:${size*0.9}px;line-height:1;">${game.emoji ?? ''}</span>`
}

// DB에서 게임 목록 동적으로 가져와서 탭/사이드바 렌더
async function loadAndRenderGameUI(activeSlug) {
  const { data: games } = await db.from('Game').select('id, nameKo, slug, emoji, imageUrl').eq('isActive', true).order('sortOrder', { nullsFirst: false }).order('nameKo')
  if (!games) return

  // 탭 바 업데이트
  const tabList = document.querySelector('.tab-list')
  if (tabList) {
    tabList.innerHTML = `<a href="/" class="tab-item ${!activeSlug ? 'active' : ''}">전체</a>` +
      games.map(g => `
        <a href="/${g.slug}/" class="tab-item ${g.slug === activeSlug ? 'active' : ''}" style="display:inline-flex;align-items:center;gap:5px;">
          ${gameIcon(g, 18)} ${g.nameKo}
        </a>
      `).join('')
  }

  // 사이드바 업데이트
  const sidebarEl = document.getElementById('sidebar-games')
  if (sidebarEl) {
    sidebarEl.innerHTML = `
      <div class="sidebar-section">
        <div class="sidebar-label">게임</div>
        <div class="sidebar-game-list">
          <a href="/" class="sidebar-game-item ${!activeSlug ? 'active' : ''}">전체</a>
          ${games.map(g => `
            <a href="/${g.slug}/" class="sidebar-game-item ${g.slug === activeSlug ? 'active' : ''}" style="display:flex;align-items:center;gap:8px;">
              ${gameIcon(g, 22)} ${g.nameKo}
            </a>
          `).join('')}
        </div>
      </div>
    `
  }

  // 히어로 게임 카드 업데이트
  const heroGames = document.querySelector('.hero-games')
  if (heroGames) {
    heroGames.innerHTML = games.map((g, i) => `
      <a href="/${g.slug}/" class="hero-game-card ${g.slug}" style="${i === 0 ? 'grid-row:1/2;' : ''}">
        ${g.imageUrl
          ? `<img src="${g.imageUrl}" alt="${g.nameKo}" style="width:64px;height:64px;border-radius:14px;object-fit:cover;box-shadow:0 4px 16px rgba(0,0,0,0.4);">`
          : `<span class="emoji">${g.emoji}</span>`
        }
        <span class="name">${g.nameKo}</span>
      </a>
    `).join('')
  }
}

// 등급명 → CSS 클래스명 변환
function gradeClass(grade) {
  const map = {
    '위치': 'witch',
    '비스트': 'beast',
    '에인션트 각성': 'ancient-aw',
    '에인션트': 'ancient',
    '레전더리': 'legendary',
    '드래곤': 'dragon',
    '슈퍼에픽': 'superepic',
    '에픽': 'epic',
    '레어': 'rare',
    '커먼': 'common',
  }
  return map[grade] ?? ''
}

// 등급 표시용 줄임말
function gradeShort(grade) {
  const map = {
    '위치': '위치',
    '비스트': '비스트',
    '에인션트 각성': '에인•각',
    '에인션트': '에인션트',
    '레전더리': '레전',
    '드래곤': '드래곤',
    '슈퍼에픽': '슈에픽',
    '에픽': '에픽',
    '레어': '레어',
    '커먼': '커먼',
  }
  return map[grade] ?? grade
}

function renderSidebarGames(activeSlug) {
  // placeholder — loadAndRenderGameUI가 덮어씀
  return `<div class="sidebar-section"><div class="sidebar-label">게임</div><div class="sidebar-game-list" style="color:#aaa;font-size:13px;padding:8px;">불러오는 중...</div></div>`
}
