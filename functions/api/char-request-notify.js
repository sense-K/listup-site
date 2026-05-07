// 캐릭터 추가 요청 이메일 알림
// POST /api/char-request-notify
// body: { requestId: string }
// header: Authorization: Bearer <supabase access token>

const SUPABASE_URL = 'https://ltcibadxwkupwjikqzik.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Y2liYWR4d2t1cHdqaWtxemlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTQ5OTEsImV4cCI6MjA5MDY5MDk5MX0.KYrP2xopjSxBOee2KcS8tM89misAkyzfBvx0828t4No'

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    // 1. Authorization 헤더에서 access token 추출
    const authHeader = request.headers.get('Authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) return json({ ok: false, error: 'unauthorized' })

    // 2. Supabase auth/v1/user로 사용자 검증
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    })
    if (!userRes.ok) return json({ ok: false, error: 'unauthorized' })
    const authUser = await userRes.json()
    if (!authUser?.id) return json({ ok: false, error: 'unauthorized' })

    // 3. requestId 파싱
    const body = await request.json()
    const { requestId } = body
    if (!requestId) return json({ ok: false, error: 'missing requestId' })

    // 4. service role로 CharacterRequest 조회 (Game + User 조인)
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return json({ ok: false, error: 'server misconfigured' })

    const dbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/CharacterRequest?id=eq.${encodeURIComponent(requestId)}&select=id,userId,characterName,createdAt,game:Game(nameKo),user:User(nickname)&limit=1`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Accept': 'application/json',
        },
      }
    )
    const rows = await dbRes.json()
    const req = rows?.[0]
    if (!req) return json({ ok: false, error: 'request not found' })

    // 5. 요청자 본인 확인 (다른 사람 알림 방지)
    if (req.userId !== authUser.id) return json({ ok: false, error: 'forbidden' })

    // 6. 이메일 내용 구성
    const gameName = req.game?.nameKo ?? '알 수 없음'
    const nickname = req.user?.nickname ?? '(닉네임 없음)'
    const requesterEmail = authUser.email ?? '(이메일 없음)'
    const createdKST = new Date(req.createdAt).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

    const resendKey = env.RESEND_API_KEY
    if (!resendKey) return json({ ok: false, error: 'server misconfigured' })

    // 7. Resend 발송
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '플레이센스 <onboarding@resend.dev>',
        to: ['zzabhm@gmail.com'],
        subject: `[플레이센스] 캐릭터 추가 요청 - ${gameName} ${req.characterName}`,
        html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;">
  <h2 style="font-size:18px;margin-bottom:4px;">🎮 캐릭터 추가 요청이 들어왔어요</h2>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
  <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.8;">
    <tr>
      <td style="color:#888;width:90px;padding:4px 0;">게임</td>
      <td style="font-weight:600;">${gameName}</td>
    </tr>
    <tr>
      <td style="color:#888;padding:4px 0;">캐릭터</td>
      <td style="font-weight:700;font-size:16px;color:#111;">${req.characterName}</td>
    </tr>
    <tr>
      <td style="color:#888;padding:4px 0;">요청자</td>
      <td>${nickname} (${requesterEmail})</td>
    </tr>
    <tr>
      <td style="color:#888;padding:4px 0;">요청 시각</td>
      <td>${createdKST} KST</td>
    </tr>
  </table>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
  <div style="background:#f8f8f8;border-radius:8px;padding:14px;font-size:12px;color:#555;">
    <div style="margin-bottom:6px;font-weight:700;">✅ 처리 완료 시 SQL</div>
    <code style="display:block;background:#111;color:#a3e635;padding:10px 12px;border-radius:6px;white-space:pre-wrap;word-break:break-all;">UPDATE "CharacterRequest" SET status='done' WHERE id='${requestId}';</code>
  </div>
</div>`,
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text().catch(() => '')
      console.error('[char-request-notify] Resend error:', errText)
      return json({ ok: false, error: 'email failed' })
    }

    return json({ ok: true })
  } catch (e) {
    console.error('[char-request-notify] error:', e)
    return json({ ok: false, error: e.message })
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function json(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}
