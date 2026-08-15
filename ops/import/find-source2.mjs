// 자동 임포터가 없는 게임 / 공개 API 탐색용 스크래치. 러너 전용, DB 미변경.
// 커밋 태그: [fs2] (브라우저 없이) / [find-source2] (Playwright 설치 후 실행)
// 확인할 대상이 생기면 이 파일 내용을 갈아끼우고 다시 돌린다.
//
// ─────────────────────────────────────────────────────────────────────
// 조사 기록
//
// [2026-08-05] 팬사이트 전수 조사
//   림버스 단빵숲       → ✅ 임포터 구축 (games/limbus.mjs, Playwright)
//   브라운더스트2/로스트소드 → ❌ 기계가 읽을 데이터 없음
//   쿠키런킹덤          → ⚠️ 영문 fandom MediaWiki API 만 열림 (한국어 이름 없음)
//
// [2026-08-15] 카오스 제로 나이트메어 — 스토브 공개 API 탐색
//   결론 ①  전적/대전기록 API 는 없다.
//           static-pubcomm.onstove.com/gameRecord/{game}/ 는 epic7 만 200,
//           czn·lostark·outerplane·sevenknights 전부 403 → 에픽세븐이 예외적 특별 케이스.
//   결론 ②  공식 캐릭터 데이터는 열려 있다 (아래).
//
//   · 스토브 공식 게임코드 = czn / 내부 게임ID = STOVE_CHAOSZERO
//   · 공식 홈은 Nuxt SPA: static-pubcomm.onstove.com/live/czn/brand/
//   · 데이터 규칙: static-pubcomm.onstove.com/live/czn/{multilingual|analytics}/czn_{페이지}.json
//
//   열려 있는 것 (인증 불필요, CORS 확인 안 함 → 서버/러너에서 받을 것):
//     live/czn/multilingual/czn_homepage_brand_character.json   ← 캐릭터 26명
//     live/czn/multilingual/czn_homepage_brand_main.json        ← 메인 페이지 문구
//     live/czn/multilingual/czn_common_common.json              ← 공통 문구·OG 이미지
//     live/czn/multilingual/czn_common_error.json
//     live/czn/analytics/czn_*.json                             ← 로그용 라벨 (쓸모 없음)
//
//   캐릭터 JSON 구조 — 4개 언어(ko / en / ja / zh-TW) 전부 동일하게 26명:
//     Character_(char_1050)_Name           = 오웬
//     Character_(char_1050)_Description    = 실망할 필요 없습니다. 다시 해보죠!   (대표 대사)
//     Character_(char_1050)_Voice_Actor_Ko = 정의택
//     Character_(char_1050)_Voice_Actor_Ja = 아마사키 코헤이
//     Character_(char_1050)_Card_Text_1~5  = 바람 충전 / 바람 베기 / …           (카드=스킬명 5개)
//     Family_(fam_terrascion)_Name 등 세력명, Character_Role_(role_combatant) 등 역할명도 있음
//
//   ★ char_ 번호가 czncompass 의 portrait_character_crop_half_{번호} 와 같은 ID 공간이다.
//     → 우리 DB 의 metadata.srcId 로 그대로 조인된다 (35명 중 18명 매칭).
//   · 공식에만 있고 우리 DB 에 없는 8명(1054 유피나, 1058 솔리아, 20005 아이슐렌, 20014 세리테아,
//     20019 프리실라, 30076 페코, 30094 실비아, 00002 일렉시아)은 czncompass 플레이어블 목록에 없음
//     → NPC·스토리 캐릭터로 추정.
//   · 반대로 우리 DB 35명 중 17명은 공식 JSON 에 없음 → 공식 홈 캐릭터 섹션이 출시 시점 기준이라 최신 캐릭터 누락.
//
//   공식 이미지: live/czn/brand/images/... 는 디렉터리 목록 403, 개별 파일명 규칙 미확인
//                (ogtag_1200.jpg 처럼 아는 파일만 200)
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
