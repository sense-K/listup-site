export async function onRequest() {
  try {
    const res = await fetch(
      'https://www.prydwen.gg/page-data/nikke/characters/page-data.json',
      { headers: { 'User-Agent': 'resetlist.kr/1.0' } }
    )
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'prydwen fetch failed', status: res.status }), {
        status: 502,
        headers: corsHeaders(),
      })
    }
    const data = await res.text()
    return new Response(data, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}
