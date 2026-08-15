// 자동 임포터가 없는 게임 / 공개 API 탐색용 스크래치. 러너 전용, DB 미변경.
// 커밋 태그: [fs2] (브라우저 없이) / [find-source2] (Playwright 설치 후)
// 확인할 대상이 생기면 이 파일 내용을 갈아끼우고 다시 돌린다.
//
// ─────────────────────────────────────────────────────────────────────
// [2026-08-05] 팬사이트 전수 조사
//   림버스 단빵숲 → ✅ games/limbus.mjs / 브라운더스트2·로스트소드 → ❌ / 쿠킹덤 → ⚠️ 영문 fandom 만
//
// [2026-08-15] 카오스 제로 나이트메어 — 스토브 공개 API + 카드 데이터
//
//   ■ 전적/대전기록 API : 없음
//     static-pubcomm.onstove.com/gameRecord/{game}/ 는 epic7 만 200.
//     czn·lostark·outerplane·sevenknights 전부 403 → 에픽세븐이 예외적 특별 케이스.
//
//   ■ 공식 캐릭터 데이터 : 있음 (인증 불필요)
//     https://static-pubcomm.onstove.com/live/czn/multilingual/czn_homepage_brand_character.json
//     · 게임코드 czn / 내부 게임ID STOVE_CHAOSZERO / 공식 홈은 Nuxt SPA (live/czn/brand/)
//     · 4개 언어(ko·en·ja·zh-TW) × 26명 동일 구조
//     · 필드: Name, Description(대사), Voice_Actor_Ko, Voice_Actor_Ja, Card_Text_1~5(카드명)
//             + Family_(fam_*)_Name(세력), Character_Role_(role_*)
//     · char_ 번호가 czncompass 와 같은 ID 공간 → Character.metadata.srcId 로 조인 (35명 중 18명)
//
//   ■ 카드 데이터 : czncompass 의 JS 번들 안에 있음 (API 아님)
//     · 공식 스토브에는 카드 페이지 JSON 이 없다 (czn_homepage_brand_card* 전부 404)
//     · czncompass 청크 617bed1dd2e06513.js (4.7MB) = 카오스 인카운터/보상 DB
//         6개 언어(default·ko·en·ja·zhs·zht), uk_* 이벤트 노드 3,429종,
//         card_id(card_enc_*) 26종, dbid_* 카드풀 필터 27종, type CARD_* 13종
//         예: {"id":"get_cur_card_enc_00005","type":"CARD_ID_CURSE","card_id":"card_enc_00005",
//              "card_name":{"ko":"변이","en":"Mutate","ja":"変異",...},"count":1,...}
//     · 청크 97309bb70ea0624e.js (3.6MB) = 덱빌더 i18n. 카드 분류 어휘 확인:
//         중립 / 몬스터 / 금기 / 고유 / 기본, 번뜩임(일반·신성), 페르소나, 각인
//     · 살아있는 페이지(추측으로 찾음): /ko/characters, /ko/monsters, /ko/partners(47명), /ko/chaos(8존)
//       카드 정보·덱빌더 경로는 못 찾음 — 사이트가 JS 라우팅이라 <a href> 가 /ko, /ko/privacy 뿐.
//       필요하면 메뉴 버튼을 클릭해 router 이동 후 URL 을 읽어야 한다.
//     · 카드 이미지 CDN 경로는 해당 청크에 없음 (assets.czncompass.com/czneploy/... 는 캐릭터·직업 아이콘)
//
//   ⚠ 카드/몬스터/인카운터 데이터는 czncompass 가 직접 구축한 것이다.
//     쓰려면 출처 표기·사전 양해가 맞고, 번들 파싱은 빌드마다 깨질 수 있다.
// ─────────────────────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' }

const TARGETS = [
  ['카제나 공식 캐릭터', 'https://static-pubcomm.onstove.com/live/czn/multilingual/czn_homepage_brand_character.json'],
  ['에픽세븐 영웅(기준점)', 'https://static-pubcomm.onstove.com/gameRecord/epic7/epic7_hero.json'],
]
for (const [name, url] of TARGETS) {
  try {
    const r = await fetch(url, { headers: H })
    console.log(`[${r.status}] ${name}  ${(await r.text()).length}B\n      ${url}`)
  } catch (e) { console.log(`[ERR] ${name} — ${e.message}`) }
}
