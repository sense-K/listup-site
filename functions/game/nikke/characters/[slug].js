export async function onRequest({ params, env }) {
  const slug = params.slug
  if (!slug || !/^[a-z0-9\-]+$/.test(slug)) {
    return new Response('Not Found', { status: 404 })
  }

  const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
  const SUPABASE_KEY = env.SUPABASE_ANON_KEY

  // 캐릭터 조회 (slug 기준)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/Character?slug=eq.${slug}&select=nameKo,nameEn,tier,imageUrl,rarity,manufacturer,weaponType,element,classType,burstType,metadata&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  )
  const rows = await res.json()
  if (!rows || rows.length === 0) return new Response('Not Found', { status: 404 })

  const c = rows[0]
  const meta = c.metadata || {}
  const skills = meta.skills || []
  const cv = meta.cv || {}

  const MANU_KO   = { Elysion:'엘리시온', Missilis:'미실리스', Tetra:'테트라', Pilgrim:'필그림', Abnormal:'애브노멀' }
  const WEAPON_KO = { 'Assault Rifle':'돌격소총', 'Sniper Rifle':'저격소총', 'Rocket Launcher':'로켓런처', SMG:'기관단총', Shotgun:'산탄총', Minigun:'미니건' }
  const ELEM_KO   = { Fire:'화염', Water:'수력', Wind:'풍력', Electric:'전력', Iron:'철력' }
  const CLASS_KO  = { Attacker:'공격', Defender:'방어', Supporter:'지원' }
  const ELEM_COLOR  = { Fire:'#ef4444', Water:'#3b82f6', Wind:'#22c55e', Electric:'#f59e0b', Iron:'#94a3b8' }
  const CLASS_COLOR = { Attacker:'#ef4444', Defender:'#3b82f6', Supporter:'#a855f7' }
  const TIER_BG   = { SSS:'#fef3c7', SS:'#fce7f3', S:'#ede9fe', A:'#dbeafe', B:'#dcfce7', C:'#f1f5f9' }
  const TIER_COLOR= { SSS:'#78350f', SS:'#9d174d', S:'#5b21b6', A:'#1e40af', B:'#166534', C:'#475569' }

  const escHtml = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

  const skillHtml = skills.map(s => {
    const slotEmoji = s.slot === 'Burst' ? '💥' : s.slot === 'Skill 1' ? '1️⃣' : '2️⃣'
    const descLines = (s.desc || '').split('\n').filter(l => l.trim())
    return `
      <div class="skill-card">
        <div class="skill-header">
          <span class="skill-slot">${slotEmoji} ${escHtml(s.slot)}</span>
          <span class="skill-type ${s.type === 'Passive' ? 'passive' : 'active'}">${s.type === 'Passive' ? '패시브' : '액티브'}</span>
          ${s.cooldown ? `<span class="skill-cd">⏱ ${s.cooldown}s</span>` : ''}
        </div>
        <div class="skill-name">${escHtml(s.name)}</div>
        <div class="skill-desc">${descLines.map(l => `<p>${escHtml(l)}</p>`).join('')}</div>
      </div>`
  }).join('')

  const specHtml = (meta.specialities || []).map(s =>
    `<span class="spec-tag">${escHtml(s)}</span>`
  ).join('')

  const tierBg = TIER_BG[c.tier] || '#f1f5f9'
  const tierCol = TIER_COLOR[c.tier] || '#475569'
  const elemColor = ELEM_COLOR[c.element] || '#94a3b8'
  const classColor = CLASS_COLOR[c.classType] || '#94a3b8'
  const title = `${escHtml(c.nameKo)} - 니케 캐릭터 | 플레이센스`
  const desc = `${escHtml(c.nameKo)}(${escHtml(c.nameEn)}) 니케 캐릭터 정보. ${escHtml(MANU_KO[c.manufacturer]||'')} 제조사, ${escHtml(ELEM_KO[c.element]||'')} 속성, ${escHtml(CLASS_KO[c.classType]||'')} 클래스.`

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://resetlist.kr/game/nikke/characters/${slug}/">
  ${c.imageUrl ? `<meta property="og:image" content="${escHtml(c.imageUrl)}">` : ''}
  <link rel="canonical" href="https://resetlist.kr/game/nikke/characters/${slug}/">
  <link rel="stylesheet" href="/css/style.css">
  <style>
    .nd-wrap { max-width: 860px; margin: 0 auto; padding: 20px 16px 60px; }

    .nd-hero {
      display: flex; gap: 28px; align-items: flex-start;
      background: #0f0f1a; border-radius: 20px; padding: 28px;
      margin-bottom: 28px; color: #fff;
    }
    .nd-img { width: 180px; flex-shrink: 0; border-radius: 14px; overflow: hidden; background: #1a1a2e; }
    .nd-img img { width: 100%; display: block; object-fit: cover; object-position: top; }
    .nd-info { flex: 1; min-width: 0; }
    .nd-name { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
    .nd-en   { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 16px; }
    .nd-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .nd-tag  { font-size: 13px; font-weight: 700; padding: 5px 14px; border-radius: 999px; }
    .nd-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .nd-meta-item { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 12px; }
    .nd-meta-label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
    .nd-meta-value { font-size: 14px; font-weight: 700; }

    .nd-section { margin-bottom: 28px; }
    .nd-section-title {
      font-size: 13px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.06em;
      border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px;
    }

    .skill-card {
      background: #fff; border: 1.5px solid #e5e7eb;
      border-radius: 14px; padding: 16px 18px; margin-bottom: 12px;
    }
    .skill-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .skill-slot  { font-size: 12px; font-weight: 700; color: #64748b; }
    .skill-type  { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
    .skill-type.active  { background: #fee2e2; color: #991b1b; }
    .skill-type.passive { background: #ede9fe; color: #5b21b6; }
    .skill-cd    { font-size: 11px; color: #94a3b8; }
    .skill-name  { font-size: 16px; font-weight: 800; color: #1e293b; margin-bottom: 10px; }
    .skill-desc  { font-size: 13px; line-height: 1.7; color: #374151; }
    .skill-desc p { margin: 2px 0; }

    .spec-tag {
      display: inline-block; font-size: 12px; font-weight: 600;
      padding: 4px 10px; border-radius: 999px;
      background: #f1f5f9; color: #475569; margin: 3px;
    }

    .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; text-decoration: none; margin-bottom: 20px; }
    .back-link:hover { color: #1e293b; }

    @media (max-width: 600px) {
      .nd-hero { flex-direction: column; }
      .nd-img { width: 100%; max-width: 220px; margin: 0 auto; }
      .nd-name { font-size: 22px; }
    }
  </style>
</head>
<body>
<div id="navbar"></div>
<div class="nd-wrap">
  <a href="/game/nikke/characters/" class="back-link">← 니케 캐릭터 도감</a>

  <div class="nd-hero">
    <div class="nd-img">
      ${c.imageUrl ? `<img src="${escHtml(c.imageUrl)}" alt="${escHtml(c.nameKo)}">` : '<div style="height:180px;"></div>'}
    </div>
    <div class="nd-info">
      <div class="nd-name">${escHtml(c.nameKo)}</div>
      <div class="nd-en">${escHtml(c.nameEn || '')}</div>
      <div class="nd-tags">
        <span class="nd-tag" style="background:${tierBg};color:${tierCol};">${escHtml(c.rarity || c.tier)}</span>
        ${c.element ? `<span class="nd-tag" style="background:${elemColor}22;color:${elemColor};">${escHtml(ELEM_KO[c.element]||c.element)}</span>` : ''}
        ${c.classType ? `<span class="nd-tag" style="background:${classColor}22;color:${classColor};">${escHtml(CLASS_KO[c.classType]||c.classType)}</span>` : ''}
        ${c.burstType ? `<span class="nd-tag" style="background:rgba(139,92,246,0.15);color:#5b21b6;">버스트 ${escHtml(c.burstType)}</span>` : ''}
      </div>
      <div class="nd-meta">
        ${c.manufacturer ? `<div class="nd-meta-item"><div class="nd-meta-label">제조사</div><div class="nd-meta-value">${escHtml(MANU_KO[c.manufacturer]||c.manufacturer)}</div></div>` : ''}
        ${c.weaponType ? `<div class="nd-meta-item"><div class="nd-meta-label">무기</div><div class="nd-meta-value">${escHtml(WEAPON_KO[c.weaponType]||c.weaponType)}</div></div>` : ''}
        ${meta.weaponName ? `<div class="nd-meta-item"><div class="nd-meta-label">무기명</div><div class="nd-meta-value">${escHtml(meta.weaponName)}</div></div>` : ''}
        ${meta.squad ? `<div class="nd-meta-item"><div class="nd-meta-label">소속 팀</div><div class="nd-meta-value">${escHtml(meta.squad)}</div></div>` : ''}
        ${cv.kr ? `<div class="nd-meta-item"><div class="nd-meta-label">성우 (KR)</div><div class="nd-meta-value">${escHtml(cv.kr)}</div></div>` : ''}
        ${meta.releaseDate ? `<div class="nd-meta-item"><div class="nd-meta-label">출시일</div><div class="nd-meta-value">${escHtml(meta.releaseDate)}</div></div>` : ''}
      </div>
    </div>
  </div>

  ${specHtml ? `<div class="nd-section"><div class="nd-section-title">특기</div>${specHtml}</div>` : ''}

  ${skillHtml ? `<div class="nd-section"><div class="nd-section-title">스킬 (Lv.10)</div>${skillHtml}</div>` : ''}

</div>
<div id="footer"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/config.js"></script>
<script>
  document.getElementById('navbar').innerHTML = renderNavbar()
  loadAndRenderGameUI(null)
  if (typeof renderFooter === 'function') document.getElementById('footer').innerHTML = renderFooter()
</script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=3600' }
  })
}
