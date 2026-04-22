export async function onRequest({ params }) {
  const uid = (params.uid ?? []).join('/')
  if (!uid || !/^\d{9}$/.test(uid)) {
    return new Response(JSON.stringify({ detail: 'Invalid UID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const res = await fetch(`https://api.mihomo.me/sr_info_parsed/${uid}?lang=kr`, {
    headers: { 'User-Agent': 'resetlist.kr/1.0' }
  })
  const body = await res.text()
  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    }
  })
}
