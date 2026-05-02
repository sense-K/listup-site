const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://resetlist.kr',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function onRequestPost(context) {
  const { request } = context

  try {
    const body = await request.json()
    const { listingId, gameId, userId } = body

    if (!listingId || !gameId) {
      return new Response('Bad Request', { status: 400 })
    }

    // CF-Connecting-IP: Cloudflare가 주입하는 실제 클라이언트 IP
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const ipHash = await sha256(ip)

    await fetch(`${SUPABASE_URL}/rest/v1/rpc/track_listing_view`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_listing_id: listingId,
        p_game_id:    gameId,
        p_user_id:    userId || null,
        p_ip_hash:    ipHash,
      }),
    })

    return new Response('ok', { status: 200 })
  } catch {
    return new Response('Internal Error', { status: 500 })
  }
}

async function sha256(text) {
  const data = new TextEncoder().encode(text)
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
