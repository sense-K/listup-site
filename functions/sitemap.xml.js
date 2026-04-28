const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'
const BASE = 'https://resetlist.kr'

// 정적 URL 목록 (캐릭터 상세 제외한 모든 페이지)
const STATIC_URLS = [
  { loc: '/',                              priority: '1.0', changefreq: 'daily'   },
  { loc: '/game/',                         priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/genshin/',                 priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/genshin/uid/',             priority: '0.6', changefreq: 'monthly' },
  { loc: '/game/genshin/characters/',      priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/starrail/',                priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/starrail/uid/',            priority: '0.6', changefreq: 'monthly' },
  { loc: '/game/starrail/characters/',     priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/zzz/',                     priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/zzz/uid/',                 priority: '0.6', changefreq: 'monthly' },
  { loc: '/game/zzz/characters/',          priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/bluearchive/',             priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/bluearchive/students/',    priority: '0.7', changefreq: 'weekly'  },
  { loc: '/game/nikke/',                   priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/nikke/characters/',        priority: '0.7', changefreq: 'weekly'  },
  { loc: '/game/cookierunkingdom/',        priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/sevenknightsre/',          priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/leehwan/',                 priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/trickcal/',               priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/limbus/',                  priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/stardive/',               priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/epic7/',                   priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/epic7/heroes/',            priority: '0.7', changefreq: 'weekly'  },
  { loc: '/game/epic7/heroes/detail/',     priority: '0.6', changefreq: 'weekly'  },
  { loc: '/game/epic7/rta/',               priority: '0.7', changefreq: 'weekly'  },
  { loc: '/game/epic7/artifacts/',         priority: '0.6', changefreq: 'weekly'  },
  { loc: '/game/epic7/gear-recommend/',    priority: '0.6', changefreq: 'weekly'  },
  { loc: '/trade/',                        priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/genshin/',               priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/starrail/',              priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/bluearchive/',           priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/nikke/',                 priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/cookierunkingdom/',      priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/zzz/',                   priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/sevenknightsre/',        priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/leehwan/',               priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/trickcal/',              priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/limbus/',                priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/stardive/',              priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/epic7/',                 priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/price/',                 priority: '0.8', changefreq: 'weekly'  },
  { loc: '/trade/price/genshin/',         priority: '0.8', changefreq: 'weekly'  },
  { loc: '/trade/price/starrail/',        priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/bluearchive/',     priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/nikke/',           priority: '0.8', changefreq: 'weekly'  },
  { loc: '/trade/price/cookierunkingdom/',priority: '0.8', changefreq: 'weekly'  },
  { loc: '/trade/price/zzz/',             priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/sevenknightsre/', priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/leehwan/',         priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/trickcal/',        priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/limbus/',          priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/stardive/',        priority: '0.7', changefreq: 'weekly'  },
  { loc: '/trade/price/epic7/',           priority: '0.7', changefreq: 'weekly'  },
  { loc: '/game/wuwa/',                   priority: '0.8', changefreq: 'weekly'  },
  { loc: '/game/wuwa/characters/',        priority: '0.8', changefreq: 'weekly'  },
  { loc: '/trade/wuwa/',                  priority: '0.9', changefreq: 'daily'   },
  { loc: '/trade/price/wuwa/',            priority: '0.7', changefreq: 'weekly'  },
  { loc: '/contact/',                     priority: '0.4', changefreq: 'monthly' },
]

// 캐릭터 상세 페이지가 있는 게임 (slug → URL 경로 매핑)
const CHAR_DETAIL_GAMES = {
  genshin:  '/game/genshin/characters/',
  starrail: '/game/starrail/characters/',
  zzz:      '/game/zzz/characters/',
  wuwa:     '/game/wuwa/characters/',
  nikke:    '/game/nikke/characters/',
}

async function supaGet(path) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    return res.ok ? res.json() : []
  } catch { return [] }
}

function urlEntry(loc, priority, changefreq, lastmod) {
  return `  <url>
    <loc>${BASE}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export async function onRequest() {
  const today = new Date().toISOString().slice(0, 10)

  // 1. 캐릭터 상세 페이지용 게임 ID 조회
  const games = await supaGet(
    `Game?slug=in.(genshin,starrail,zzz)&select=id,slug`
  )
  const gameMap = {}
  ;(games || []).forEach(g => { gameMap[g.id] = g.slug })

  // 2. 해당 게임 캐릭터 slug 조회 (isActive, slug 있는 것만)
  let charUrls = []
  if (games && games.length > 0) {
    const gameIds = games.map(g => `"${g.id}"`).join(',')
    const chars = await supaGet(
      `Character?gameId=in.(${gameIds})&isActive=eq.true&slug=not.is.null&select=slug,gameId&limit=1000`
    )
    charUrls = (chars || [])
      .filter(c => c.slug && gameMap[c.gameId])
      .map(c => {
        const basePath = CHAR_DETAIL_GAMES[gameMap[c.gameId]]
        return urlEntry(`${basePath}${c.slug}/`, '0.6', 'weekly', today)
      })
  }

  // 3. XML 조립
  const staticEntries = STATIC_URLS.map(u =>
    urlEntry(u.loc, u.priority, u.changefreq, today)
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <!-- 정적 페이지 (${staticEntries.length}개) -->
${staticEntries.join('\n')}

  <!-- 캐릭터 상세 페이지 (${charUrls.length}개: 원신/스타레일/젠레스) -->
${charUrls.join('\n')}

</urlset>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
