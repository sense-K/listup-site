// 캐릭터 추가 요청 알림 프록시
// 브라우저 → /api/char-request-notify (same-origin)
// CF Function → Supabase Edge Function quick-responder (server-to-server)

const EDGE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co/functions/v1/quick-responder'

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function onRequestPost(context) {
  try {
    const { requestId } = await context.request.json()
    const token = (context.request.headers.get('Authorization') ?? '').replace('Bearer ', '')

    if (!requestId || !token) {
      return json({ ok: false, error: 'missing params' }, 400)
    }

    const upstream = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'char-request', requestId }),
    })

    if (upstream.ok) {
      return json({ ok: true }, 200)
    }
    const upstreamBody = await upstream.text().catch(() => '')
    return json({ ok: false, error: upstreamBody || 'upstream error', status: upstream.status }, 200)
  } catch (e) {
    return json({ ok: false, error: e.message }, 200)
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
