import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = 'https://resetlist.kr'
const FROM = '플레이센스 <onboarding@resend.dev>'

serve(async (req) => {
  try {
    const body = await req.json()

    // 판매자가 구매자에게 연락 요청 보내기
    if (body.action === 'nudge') {
      const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

      const { data: { user: caller } } = await supabase.auth.getUser(token)
      console.log('[nudge] caller:', caller?.id ?? 'null')
      if (!caller) return new Response('unauthorized', { status: 401 })

      const { data: trade } = await supabase
        .from('Trade')
        .select('id, buyerId, sellerId, listingId')
        .eq('id', body.tradeId)
        .in('status', ['active', 'trading', 'seller_confirmed'])
        .single()

      console.log('[nudge] trade:', trade?.id ?? 'null', 'seller match:', trade?.sellerId === caller.id)
      if (!trade || trade.sellerId !== caller.id) return new Response('forbidden', { status: 403 })

      const { data: listing } = await supabase
        .from('Listing')
        .select('id, price, game:Game(nameKo)')
        .eq('id', trade.listingId)
        .single()

      const gameName = listing?.game?.nameKo ?? '게임'
      const listingUrl = `${SITE_URL}/listing/?id=${trade.listingId}`

      const { data: { user: buyer }, error: buyerErr } = await supabase.auth.admin.getUserById(trade.buyerId)
      console.log('[nudge] buyer:', buyer?.id ?? 'null', 'email:', buyer?.email ?? 'null', 'err:', buyerErr?.message ?? 'none')
      if (!buyer?.email) return new Response('no_buyer_email', { status: 422 })

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [buyer.email],
          subject: '[플레이센스] 판매자가 연락을 기다리고 있어요',
          html: makeEmail(
            '판매자가 연락을 기다리고 있어요',
            `<strong>${gameName}</strong> 계정 거래 관련하여 판매자가 연락을 기다리고 있어요.<br><br>빠르게 판매자에게 연락해주세요.`,
            '판매글 확인하기',
            listingUrl
          )
        }),
      })
      const resendData = await resendRes.json()
      console.log('[nudge] Resend:', resendRes.status, JSON.stringify(resendData))
      if (!resendRes.ok) return new Response(JSON.stringify(resendData), { status: 502 })
      return new Response(JSON.stringify(resendData), { status: 200 })
    }

    // 캐릭터 추가 요청 이메일 알림
    if (body.action === 'char-request') {
      const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

      const { data: { user: caller } } = await supabase.auth.getUser(token)
      console.log('[char-request] caller:', caller?.id ?? 'null')
      if (!caller) return new Response('unauthorized', { status: 401 })

      const { data: charReq } = await supabase
        .from('CharacterRequest')
        .select('id, userId, characterName, createdAt, game:Game(nameKo), user:User(nickname)')
        .eq('id', body.requestId)
        .single()

      console.log('[char-request] row:', charReq?.id ?? 'null', 'userId match:', charReq?.userId === caller.id)
      if (!charReq) return new Response('not_found', { status: 404 })
      if (charReq.userId !== caller.id) return new Response('forbidden', { status: 403 })

      const { data: { user: requester } } = await supabase.auth.admin.getUserById(charReq.userId)
      const requesterEmail = requester?.email ?? '(이메일 없음)'
      const nickname = charReq.user?.nickname ?? '(닉네임 없음)'
      const gameName = charReq.game?.nameKo ?? '알 수 없음'
      const createdKST = new Date(charReq.createdAt).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: ['zzabhm@gmail.com'],
          subject: `[플레이센스] 캐릭터 추가 요청 - ${gameName} ${charReq.characterName}`,
          html: makeCharRequestEmail(gameName, charReq.characterName, nickname, requesterEmail, createdKST, body.requestId),
        }),
      })
      const resendData = await resendRes.json()
      console.log('[char-request] Resend:', resendRes.status, JSON.stringify(resendData))
      if (!resendRes.ok) return new Response(JSON.stringify(resendData), { status: 502 })
      return new Response(JSON.stringify(resendData), { status: 200 })
    }

    const { type, record, old_record } = body
    if (!record) return ok()

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    // 판매글 + 게임 정보 조회
    const { data: listing } = await supabase
      .from('Listing')
      .select('id, price, game:Game(nameKo)')
      .eq('id', record.listingId)
      .single()

    const gameName = listing?.game?.nameKo ?? '게임'
    const price = listing?.price ? Number(listing.price).toLocaleString() + '원' : ''
    const listingUrl = `${SITE_URL}/listing/?id=${record.listingId}`

    let toUserId: string | null = null
    let subject = ''
    let bodyHtml = ''

    if (type === 'INSERT' && record.status === 'active') {
      // 구매 신청 → 판매자 알림
      toUserId = record.sellerId
      subject = '[플레이센스] 새 구매 신청이 들어왔어요'
      bodyHtml = makeEmail(
        '새 구매 신청이 들어왔어요!',
        `<strong>${gameName}</strong> 판매계정에 구매 신청이 왔어요.<br>가격: <strong>${price}</strong><br><br>빠르게 확인하고 구매자와 연락해보세요.`,
        '판매글 확인하기',
        listingUrl
      )
    } else if (type === 'UPDATE') {
      const newStatus = record.status
      const oldStatus = old_record?.status

      if (oldStatus === 'active' && newStatus === 'seller_confirmed') {
        // 전달완료 → 구매자 알림
        toUserId = record.buyerId
        subject = '[플레이센스] 판매자가 계정을 전달했어요'
        bodyHtml = makeEmail(
          '판매자가 계정을 전달했어요',
          `<strong>${gameName}</strong> 계정을 판매자가 전달했어요.<br><br>계정을 확인하고 수령 확인을 해주세요.`,
          '수령 확인하기',
          `${SITE_URL}/review/?tradeId=${record.id}`
        )
      } else if (oldStatus === 'seller_confirmed' && newStatus === 'completed') {
        // 수령확인 완료 → 판매자 알림
        toUserId = record.sellerId
        subject = '[플레이센스] 거래가 완료됐어요 🎉'
        bodyHtml = makeEmail(
          '거래가 완료됐어요!',
          `<strong>${gameName}</strong> 계정 거래가 완료됐어요.<br>구매자가 수령을 확인했습니다.`,
          '마이페이지 보기',
          `${SITE_URL}/mypage/`
        )
      } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        // 거래 취소 → 판매자 알림
        toUserId = record.sellerId
        subject = '[플레이센스] 거래가 취소됐어요'
        bodyHtml = makeEmail(
          '거래가 취소됐어요',
          `<strong>${gameName}</strong> 계정의 거래가 취소됐어요.<br>판매글은 다시 판매 중 상태로 돌아가요.`,
          '판매글 확인하기',
          listingUrl
        )
      }
    }

    if (!toUserId) return ok()

    // 유저 이메일 조회
    const { data: { user } } = await supabase.auth.admin.getUserById(toUserId)
    if (!user?.email) return ok()

    // Resend로 발송
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [user.email], subject, html: bodyHtml }),
    })

    const data = await res.json()
    console.log('Resend:', JSON.stringify(data))
    return new Response(JSON.stringify(data), { status: 200 })

  } catch (e) {
    console.error(e)
    return new Response('error: ' + e.message, { status: 500 })
  }
})

function ok() {
  return new Response('ok', { status: 200 })
}

function makeEmail(title: string, content: string, btnText: string, btnUrl: string) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;background:#f8f8f8;padding:40px 20px;margin:0;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #eee;">
    <div style="font-size:22px;font-weight:900;margin-bottom:24px;">플레이센스</div>
    <div style="font-size:18px;font-weight:800;margin-bottom:12px;">${title}</div>
    <div style="font-size:15px;color:#444;line-height:1.7;margin-bottom:24px;">${content}</div>
    <a href="${btnUrl}"
       style="display:inline-block;padding:13px 28px;background:#111;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
      ${btnText}
    </a>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #f0f0f0;font-size:12px;color:#bbb;">
      플레이센스 · resetlist.kr<br>이 메일은 자동 발송된 알림이에요.
    </div>
  </div>
</body>
</html>`
}

function makeCharRequestEmail(
  gameName: string, characterName: string,
  nickname: string, email: string,
  createdKST: string, requestId: string
) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;background:#f8f8f8;padding:40px 20px;margin:0;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #eee;">
    <div style="font-size:22px;font-weight:900;margin-bottom:24px;">플레이센스</div>
    <div style="font-size:18px;font-weight:800;margin-bottom:16px;">🎮 캐릭터 추가 요청이 들어왔어요</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:2;">
      <tr>
        <td style="color:#888;width:80px;vertical-align:top;">게임</td>
        <td style="font-weight:600;">${gameName}</td>
      </tr>
      <tr>
        <td style="color:#888;vertical-align:top;">캐릭터</td>
        <td style="font-weight:800;font-size:16px;color:#111;">${characterName}</td>
      </tr>
      <tr>
        <td style="color:#888;vertical-align:top;">요청자</td>
        <td>${nickname} (${email})</td>
      </tr>
      <tr>
        <td style="color:#888;vertical-align:top;">요청 시각</td>
        <td>${createdKST} KST</td>
      </tr>
    </table>
    <div style="margin-top:24px;background:#f5f5f5;border-radius:10px;padding:16px;">
      <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px;">✅ 처리 완료 시 SQL</div>
      <code style="display:block;background:#111;color:#a3e635;padding:12px;border-radius:8px;font-size:12px;word-break:break-all;">UPDATE "CharacterRequest" SET status='done' WHERE id='${requestId}';</code>
    </div>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #f0f0f0;font-size:12px;color:#bbb;">
      플레이센스 · resetlist.kr<br>이 메일은 자동 발송된 알림이에요.
    </div>
  </div>
</body>
</html>`
}
