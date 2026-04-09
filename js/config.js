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
  setTimeout(initNavbarAuth, 0)
  return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/" class="navbar-logo">리스트업</a>
        <div class="navbar-menu">
          <div class="nav-dropdown-wrap" id="nav-dropdown-wrap">
            <span class="navbar-menu-item ${activePage === 'home' ? '' : 'muted'}" onclick="toggleNavDropdown()">거래소 ▾</span>
            <div class="nav-dropdown" id="nav-game-dropdown">
              <div class="nav-dropdown-loading">불러오는 중...</div>
            </div>
          </div>
          <a href="#" class="muted">공지사항</a>
          <a href="#" class="muted">이용안내</a>
        </div>
        <div class="navbar-actions" id="navbar-actions">
          <a href="/auth/" class="login-btn">로그인</a>
          <a href="/trade/register.html" class="navbar-sell-btn">판매하기 ↗</a>
        </div>
        <button class="navbar-hamburger" id="navbar-hamburger" onclick="toggleMobileMenu()" aria-label="메뉴">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
    <div class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu-inner">
        <div class="mobile-menu-links">
          <div class="mobile-menu-section-label">거래소</div>
          <div id="mobile-game-links"></div>
          <a href="#">공지사항</a>
          <a href="#">이용안내</a>
        </div>
        <div class="mobile-menu-actions" id="mobile-menu-actions">
          <a href="/auth/" class="btn btn-outline" style="text-align:center;">로그인</a>
          <a href="/trade/register.html" class="btn btn-primary" style="text-align:center;">판매하기 ↗</a>
        </div>
      </div>
    </div>
    <div class="mobile-menu-backdrop" id="mobile-menu-backdrop" onclick="toggleMobileMenu()"></div>
  `
}

function toggleNavDropdown() {
  const wrap = document.getElementById('nav-dropdown-wrap')
  wrap.classList.toggle('open')
}

// 드롭다운 외부 클릭 시 닫기
document.addEventListener('click', e => {
  const wrap = document.getElementById('nav-dropdown-wrap')
  if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open')
})

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu')
  const backdrop = document.getElementById('mobile-menu-backdrop')
  const hamburger = document.getElementById('navbar-hamburger')
  const open = menu.classList.toggle('open')
  backdrop.classList.toggle('open', open)
  hamburger.classList.toggle('open', open)
  document.body.style.overflow = open ? 'hidden' : ''
}

async function initNavbarAuth() {
  const { data: { session } } = await db.auth.getSession()
  const el = document.getElementById('navbar-actions')
  const mobileEl = document.getElementById('mobile-menu-actions')
  if (!el) return
  if (session?.user) {
    const { data: user } = await db.from('User').select('nickname').eq('id', session.user.id).single()
    const nickname = user?.nickname ?? '사용자'
    el.innerHTML = `
      <a href="/mypage/" style="font-size:13px;color:#888;font-weight:600;">${nickname}</a>
      <button class="login-btn" onclick="authSignOut()" style="background:none;border:none;cursor:pointer;">로그아웃</button>
      <a href="/trade/register.html" class="navbar-sell-btn">판매하기 ↗</a>
    `
    if (mobileEl) {
      mobileEl.innerHTML = `
        <a href="/mypage/" class="btn btn-outline" style="text-align:center;">마이페이지 (${nickname})</a>
        <button class="btn btn-outline" onclick="authSignOut()" style="color:#ef4444;border-color:#ef4444;">로그아웃</button>
        <a href="/trade/register.html" class="btn btn-primary" style="text-align:center;">판매하기 ↗</a>
      `
    }
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
  // User 테이블에 없으면 자동 생성
  const { data: existing } = await db.from('User').select('id').eq('id', session.user.id).maybeSingle()
  if (!existing) {
    const now = new Date().toISOString()
    const { error: insertErr } = await db.from('User').insert({
      id: session.user.id,
      nickname: session.user.email?.split('@')[0] ?? '사용자',
      isPhoneVerified: false,
      createdAt: now
    })
    if (insertErr) {
      console.error('User 생성 실패:', insertErr)
      throw new Error('사용자 정보 생성에 실패했어요. 다시 로그인해주세요.')
    }
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

// DB slug → 실제 URL 경로 매핑
const SLUG_TO_PATH = {
  'genshin': '/genshin/',
  'blue-archive': '/bluearchive/',
  'nikke': '/nikke/',
  'cookie-run': '/cookierunkingdom/',
}
function gameSlugToPath(slug) {
  return SLUG_TO_PATH[slug] ?? `/${slug}/`
}

// DB에서 게임 목록 동적으로 가져와서 탭/사이드바 렌더
async function loadAndRenderGameUI(activeSlug) {
  const { data: games } = await db.from('Game').select('id, nameKo, slug, emoji, imageUrl, artImageUrl').eq('isActive', true).order('sortOrder', { nullsFirst: false }).order('nameKo')
  if (!games) return

  // 게임 페이지 타이틀 업데이트 (이모지 → 앱아이콘)
  const titleEl = document.getElementById('game-page-title')
  if (titleEl && activeSlug) {
    const activeGame = games.find(g => g.slug === activeSlug)
    if (activeGame) {
      titleEl.innerHTML = `${gameIcon(activeGame, 26)} ${activeGame.nameKo} 계정`
    }
  }

  // 거래소 드롭다운 업데이트
  const dropdown = document.getElementById('nav-game-dropdown')
  if (dropdown) {
    dropdown.innerHTML = games.map(g => `
      <a href="${gameSlugToPath(g.slug)}" class="nav-dropdown-item ${g.slug === activeSlug ? 'active' : ''}">
        ${gameIcon(g, 20)} <span>${g.nameKo}</span>
      </a>
    `).join('')
  }
  const mobileGameLinks = document.getElementById('mobile-game-links')
  if (mobileGameLinks) {
    mobileGameLinks.innerHTML = games.map(g => `
      <a href="${gameSlugToPath(g.slug)}" style="padding-left:16px;font-size:14px;color:#555;">
        ${gameIcon(g, 18)} ${g.nameKo}
      </a>
    `).join('')
  }

  // 탭 바 업데이트
  const tabList = document.querySelector('.tab-list')
  if (tabList) {
    tabList.innerHTML = `<a href="/" class="tab-item ${!activeSlug ? 'active' : ''}">전체</a>` +
      games.map(g => `
        <a href="${gameSlugToPath(g.slug)}" class="tab-item ${g.slug === activeSlug ? 'active' : ''}" style="display:inline-flex;align-items:center;gap:5px;">
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
            <a href="${gameSlugToPath(g.slug)}" class="sidebar-game-item ${g.slug === activeSlug ? 'active' : ''}" style="display:flex;align-items:center;gap:8px;">
              ${gameIcon(g, 22)} ${g.nameKo}
            </a>
          `).join('')}
        </div>
      </div>
    `
  }

  // 히어로 콜라주
  const heroCollage = document.getElementById('hero-collage')
  if (heroCollage) {
    heroCollage.innerHTML = games.slice(0, 4).map(g =>
      `<div class="collage-item" ${g.artImageUrl ? `style="background-image:url('${g.artImageUrl}')"` : ''}></div>`
    ).join('')
  }

  // 게임 선택 카드
  const gameCardsEl = document.getElementById('game-cards-section')
  if (gameCardsEl) {
    gameCardsEl.innerHTML = games.map(g => `
      <a href="${gameSlugToPath(g.slug)}" class="game-select-card">
        ${g.artImageUrl
          ? `<img class="game-select-card-bg" src="${g.artImageUrl}" alt="${g.nameKo}">`
          : `<div class="game-select-card-bg" style="background:linear-gradient(135deg,#1a1a2e,#2d2d4e);"></div>`
        }
        <div class="game-select-card-overlay"></div>
        <div class="game-select-card-info">
          ${g.imageUrl ? `<img class="game-select-card-icon" src="${g.imageUrl}" alt="${g.nameKo}">` : `<span style="font-size:28px;">${g.emoji}</span>`}
          <span class="game-select-card-name">${g.nameKo}</span>
          <span class="game-select-card-arrow">↗</span>
        </div>
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
