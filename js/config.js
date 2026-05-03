// ===== Google Tag Manager =====
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-N4LHKZKZ');
document.addEventListener('DOMContentLoaded',function(){var n=document.createElement('noscript');var f=document.createElement('iframe');f.src='https://www.googletagmanager.com/ns.html?id=GTM-N4LHKZKZ';f.height='0';f.width='0';f.style.cssText='display:none;visibility:hidden';n.appendChild(f);document.body.insertBefore(n,document.body.firstChild);});

// ===== Google Analytics 4 =====
(function(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-SQDKTZQYCW';document.head.appendChild(s);})();
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','G-SQDKTZQYCW');

// ===== Supabase 설정 =====
const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ===== 관리자 체크 =====
const ADMIN_EMAIL = 'zzabhm@gmail.com'
window.isAdmin = false
window._adminReady = db.auth.getUser().then(({ data: { user } }) => {
  if (user?.email === ADMIN_EMAIL) window.isAdmin = true
})


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
        <a href="/" class="navbar-logo">플레이센스</a>
        <div class="navbar-menu">
          <div class="nav-dropdown-wrap" id="nav-guide-dropdown-wrap" onclick="toggleGuideDropdown()">
            <span class="muted" style="cursor:pointer;">게임 공략 ▾</span>
            <div class="nav-dropdown" id="nav-guide-dropdown">
              <div class="nav-dropdown-loading">불러오는 중...</div>
            </div>
          </div>
          <div class="nav-dropdown-wrap" id="nav-trade-dropdown-wrap" onclick="toggleTradeDropdown()">
            <span class="muted" style="cursor:pointer;">거래소 ▾</span>
            <div class="nav-dropdown" id="nav-trade-dropdown-static">
              <a href="/trade/" class="nav-dropdown-item">🏪 거래소 바로가기</a>
              <a href="/trade/register/" class="nav-dropdown-item">✏️ 판매 등록하기</a>
            </div>
          </div>
          <a href="/trade/price/" class="muted">시세</a>
          <a href="/contact/" class="muted">문의하기</a>
        </div>
        <div class="navbar-actions" id="navbar-actions">
          <a href="/auth/" class="login-btn">로그인</a>
        </div>
        <button class="navbar-hamburger" id="navbar-hamburger" onclick="toggleMobileMenu()" aria-label="메뉴">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
    <div class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu-inner">
        <div class="mobile-menu-link mobile-guide-toggle" onclick="toggleMobileGuide()" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <span>게임 공략</span><span id="mobile-guide-arrow">▾</span>
        </div>
        <div id="mobile-guide-links" style="display:none;padding:4px 0 8px 12px;"></div>
        <div class="mobile-menu-divider"></div>
        <div class="mobile-menu-link mobile-guide-toggle" onclick="toggleMobileTrade()" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
          <span>거래소</span><span id="mobile-trade-arrow">▾</span>
        </div>
        <div id="mobile-trade-links" style="display:none;padding:4px 0 8px 12px;">
          <a href="/trade/" class="mobile-menu-link" style="font-size:14px;padding:8px 0;">🏪 거래소 바로가기</a>
          <a href="/trade/register/" class="mobile-menu-link" style="font-size:14px;padding:8px 0;">✏️ 판매 등록하기</a>
        </div>
        <div class="mobile-menu-divider"></div>
        <a href="/trade/price/" class="mobile-menu-link">시세</a>
        <div class="mobile-menu-divider"></div>
        <a href="/contact/" class="mobile-menu-link">문의하기</a>
        <div class="mobile-menu-divider"></div>
        <div class="mobile-menu-actions" id="mobile-menu-actions">
          <a href="/auth/" class="btn btn-primary" style="text-align:center;">로그인</a>
        </div>
      </div>
    </div>
    <div class="mobile-menu-backdrop" id="mobile-menu-backdrop" onclick="toggleMobileMenu()"></div>
  `
}

function toggleNavDropdown() {
  const wrap = document.getElementById('nav-dropdown-wrap')
  if (wrap) wrap.classList.toggle('open')
}

function toggleGuideDropdown() {
  const wrap = document.getElementById('nav-guide-dropdown-wrap')
  if (wrap) wrap.classList.toggle('open')
}

function toggleMobileGuide() {
  const el = document.getElementById('mobile-guide-links')
  const arrow = document.getElementById('mobile-guide-arrow')
  if (!el) return
  const open = el.style.display === 'none'
  el.style.display = open ? 'block' : 'none'
  if (arrow) arrow.textContent = open ? '▴' : '▾'
}

function toggleTradeDropdown() {
  const wrap = document.getElementById('nav-trade-dropdown-wrap')
  if (wrap) wrap.classList.toggle('open')
}

function toggleMobileTrade() {
  const el = document.getElementById('mobile-trade-links')
  const arrow = document.getElementById('mobile-trade-arrow')
  if (!el) return
  const open = el.style.display === 'none'
  el.style.display = open ? 'block' : 'none'
  if (arrow) arrow.textContent = open ? '▴' : '▾'
}

// 드롭다운 외부 클릭 시 닫기
document.addEventListener('click', e => {
  const wrap = document.getElementById('nav-dropdown-wrap')
  if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open')
  const guideWrap = document.getElementById('nav-guide-dropdown-wrap')
  if (guideWrap && !guideWrap.contains(e.target)) guideWrap.classList.remove('open')
  const tradeWrap = document.getElementById('nav-trade-dropdown-wrap')
  if (tradeWrap && !tradeWrap.contains(e.target)) tradeWrap.classList.remove('open')
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
    let { data: user } = await db.from('User').select('nickname').eq('id', session.user.id).maybeSingle()
    if (!user) {
      const meta = session.user.user_metadata
      const nickname = meta?.full_name ?? meta?.name ?? session.user.email?.split('@')[0] ?? '사용자'
      await db.from('User').insert({ id: session.user.id, nickname, isPhoneVerified: false, createdAt: new Date().toISOString() })
      user = { nickname }
    }
    const nickname = user?.nickname ?? '사용자'
    el.innerHTML = `
      <a href="/mypage/" style="font-size:13px;color:#888;font-weight:600;">${nickname}</a>
      <button class="login-btn" onclick="authSignOut()" style="background:none;border:none;cursor:pointer;">로그아웃</button>
    `
    if (mobileEl) {
      mobileEl.innerHTML = `
        <a href="/mypage/" class="btn btn-primary" style="text-align:center;">마이페이지 (${nickname})</a>
        <button class="mobile-logout-btn" onclick="authSignOut()">로그아웃</button>
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
  'genshin':        '/trade/genshin/',
  'bluearchive':    '/trade/bluearchive/',
  'nikke':          '/trade/nikke/',
  'cookie-run':     '/trade/cookierunkingdom/',
  'zzz':            '/trade/zzz/',
  'sevenknightsre': '/trade/sevenknightsre/',
  'leehwan':        '/trade/leehwan/',
  'stardive':       '/trade/stardive/',
  'epicseven':      '/trade/epic7/',
  'trickcal':       '/trade/trickcal/',
  'limbus':         '/trade/limbus/',
}
const SLUG_TO_GAME_PATH = {
  'genshin':        '/game/genshin/',
  'bluearchive':    '/game/bluearchive/',
  'nikke':          '/game/nikke/',
  'cookie-run':     '/game/cookierunkingdom/',
  'zzz':            '/game/zzz/',
  'sevenknightsre': '/game/sevenknightsre/',
  'leehwan':        '/game/leehwan/',
  'stardive':       '/game/stardive/',
  'epicseven':      '/game/epic7/',
  'trickcal':       '/game/trickcal/',
  'limbus':         '/game/limbus/',
}
const GUIDE_SLUGS = ['genshin', 'starrail', 'zzz', 'nikke', 'wuwa', 'leehwan', 'epicseven', 'bluearchive']

// 메인 페이지 게임별 공략 데이터 (공략 많은 순)
const GAME_GUIDES = [
  { slug: 'epicseven', guides: [
    { name: 'RTA 드래프트',   url: '/game/epic7/rta/',             icon: 'swords'          },
    { name: '영웅 도감',      url: '/game/epic7/heroes/',          icon: 'book-open'       },
    { name: '아티팩트 도감',  url: '/game/epic7/artifacts/',       icon: 'gem'             },
    { name: '장비 주인 찾기', url: '/game/epic7/gear-recommend/', icon: 'settings'        },
    { name: '강화 어시스트',  url: '/game/epic7/enhance-assist/', icon: 'zap', isNew: true },
  ]},
  { slug: 'genshin',      guides: [
    { name: 'UID 캐릭터 조회', url: '/game/genshin/uid/',          icon: 'search'    },
    { name: '캐릭터 도감',     url: '/game/genshin/characters/',   icon: 'book-open' },
  ]},
  { slug: 'starrail',     guides: [
    { name: 'UID 캐릭터 조회', url: '/game/starrail/uid/',         icon: 'search'    },
    { name: '캐릭터 도감',     url: '/game/starrail/characters/',  icon: 'book-open' },
  ]},
  { slug: 'zzz',          guides: [
    { name: 'UID 에이전트 조회', url: '/game/zzz/uid/',            icon: 'search'    },
    { name: '캐릭터 도감',       url: '/game/zzz/characters/',     icon: 'book-open' },
  ]},
  { slug: 'nikke',        guides: [{ name: '캐릭터 도감', url: '/game/nikke/characters/',      icon: 'book-open'       }]},
  { slug: 'wuwa',         guides: [{ name: '캐릭터 도감', url: '/game/wuwa/characters/',       icon: 'book-open'       }]},
  { slug: 'leehwan',      guides: [{ name: '캐릭터 도감', url: '/game/leehwan/characters/',    icon: 'book-open'       }]},
  { slug: 'bluearchive',  guides: [{ name: '학생 도감',   url: '/game/bluearchive/students/', icon: 'graduation-cap'  }]},
]

const _ICON_SVG = {
  'swords':         `<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="2" y1="22" x2="7" y2="7"/>`,
  'book-open':      `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
  'gem':            `<polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="6" y2="9"/><line x1="12" y1="3" x2="18" y2="9"/>`,
  'settings':       `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  'zap':            `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  'search':         `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  'graduation-cap': `<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>`,
}
function guideIconSvg(name) {
  const inner = _ICON_SVG[name] || _ICON_SVG['book-open']
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
}

function gameSlugToPath(slug) {
  return SLUG_TO_PATH[slug] ?? `/trade/${slug}/`
}
function gameHubPath(slug) {
  return SLUG_TO_GAME_PATH[slug] ?? `/game/${slug}/`
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
      <a href="${gameSlugToPath(g.slug)}" class="mobile-game-item">
        ${gameIcon(g, 22)} <span>${g.nameKo}</span>
      </a>
    `).join('')
  }
  // 게임 공략 드롭다운 업데이트 (도감 있는 게임만)
  const guideDropdown = document.getElementById('nav-guide-dropdown')
  if (guideDropdown) {
    guideDropdown.innerHTML = games.filter(g => GUIDE_SLUGS.includes(g.slug)).map(g => `
      <a href="${gameHubPath(g.slug)}" class="nav-dropdown-item">
        ${gameIcon(g, 20)} <span>${g.nameKo}</span>
      </a>
    `).join('')
  }
  const mobileGuideLinks = document.getElementById('mobile-guide-links')
  if (mobileGuideLinks) {
    mobileGuideLinks.innerHTML = games.filter(g => GUIDE_SLUGS.includes(g.slug)).map(g => `
      <a href="${gameHubPath(g.slug)}" class="mobile-game-item">
        ${gameIcon(g, 22)} <span>${g.nameKo}</span>
      </a>
    `).join('')
  }

  // 탭 바 업데이트
  const tabList = document.querySelector('.tab-list')
  if (tabList) {
    tabList.innerHTML = games.map(g => `
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
          ${games.map(g => `
            <a href="${gameSlugToPath(g.slug)}" class="sidebar-game-item ${g.slug === activeSlug ? 'active' : ''}" style="display:flex;align-items:center;gap:8px;">
              ${gameIcon(g, 22)} ${g.nameKo}
            </a>
          `).join('')}
        </div>
      </div>
    `
  }

  // 히어로 대각선 3열 무한 스크롤
  const heroCollage = document.getElementById('hero-collage')
  if (heroCollage) {
    const validGames = games.filter(g => g.artImageUrl)
    if (validGames.length === 0) return

    // 각 열에 충분한 카드 수 확보 (최소 10장, 무한 루프용으로 2배 복제)
    const MIN = 10
    const pool = []
    while (pool.length < MIN) pool.push(...validGames)
    const row1 = pool.slice(0, MIN)
    const row2 = pool.slice(0, MIN).reverse()
    const row3 = pool.slice(0, MIN)

    function makeRow(items, dir) {
      const cards = items.map(g =>
        `<div class="hero-dcard" style="background-image:url('${g.artImageUrl}')"></div>`
      ).join('')
      return `<div class="hero-drow hero-drow--${dir}"><div class="hero-drow-track">${cards}${cards}</div></div>`
    }

    heroCollage.innerHTML = `
      <div class="hero-diagonal-rows">
        ${makeRow(row1, 'right')}
        ${makeRow(row2, 'left')}
        ${makeRow(row3, 'right')}
      </div>
    `
  }

  // 게임 공략 카드 (메인 페이지)
  const guideGameEl = document.getElementById('guide-game-section')
  if (guideGameEl) {
    const gmap = Object.fromEntries(games.map(g => [g.slug, g]))
    guideGameEl.innerHTML = GAME_GUIDES.map(gd => {
      const g = gmap[gd.slug]
      if (!g) return ''
      const iconHtml = g.imageUrl
        ? `<img class="guide-card-img" src="${g.imageUrl}" alt="${g.nameKo}">`
        : `<span class="guide-card-emoji">${g.emoji || '🎮'}</span>`
      const miniCards = gd.guides.map(gde => `
        <a href="${gde.url}" class="guide-mini-card">
          ${gde.isNew ? `<span class="guide-mini-new">NEW</span>` : ''}
          <span class="guide-mini-icon">${guideIconSvg(gde.icon)}</span>
          <span class="guide-mini-label">${gde.name}</span>
        </a>`).join('')
      return `
        <article class="guide-game-card">
          <a href="${gameHubPath(gd.slug)}" class="guide-card-header">
            ${iconHtml}
            <div class="guide-card-info">
              <div class="guide-card-name">${g.nameKo}</div>
              <div class="guide-card-count">${gd.guides.length}개 공략</div>
            </div>
            <svg class="guide-card-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
          <div class="guide-mini-grid">${miniCards}</div>
        </article>`
    }).filter(Boolean).join('')
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

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="footer-logo">플레이센스</span>
            <p class="footer-desc">모바일 게임 공략 · 빌드 · 거래 플랫폼</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2025 플레이센스. All rights reserved.</span>
          <a href="mailto:zzabhm@gmail.com" style="color:inherit;opacity:0.6;font-size:12px;text-decoration:none;">zzabhm@gmail.com</a>
        </div>
      </div>
    </footer>
  `
}

function renderSidebarGames(activeSlug) {
  // placeholder — loadAndRenderGameUI가 덮어씀
  return `<div class="sidebar-section"><div class="sidebar-label">게임</div><div class="sidebar-game-list" style="color:#aaa;font-size:13px;padding:8px;">불러오는 중...</div></div>`
}

// 푸터 자동 렌더링
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('footer')
  if (el) el.innerHTML = renderFooter()
})
