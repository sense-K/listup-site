# ZZZ 캐릭터 도감 API 검증 결과

> 조사일: 2026-04-28  
> 조사 대상: Hakushin API (실제 호스트: static.nanoka.cc)

---

## 결론 요약

| 항목 | 결과 |
|---|---|
| API 도메인 | `static.nanoka.cc` (api.hakush.in은 현재 환경 DNS 불가) |
| 캐릭터 수 | **53명** |
| 주인공 제외 | character.json에 이미 없음 (사전 제외) |
| 한국어 이름 | character.json에 `ko` 필드로 직접 포함 |
| 추가 fetch 필요 여부 | **불필요** — character.json 1개로 충분 |
| 이미지 도메인 | `enka.network/ui/zzz/` (CORS 허용, 200 OK) |
| 매핑 필요 | element·specialty 정수 코드 → 한국어 (아래 표 참조) |

---

## A. 전체 목록 응답 구조

**URL:** `https://static.nanoka.cc/zzz/{version}/character.json`  
**버전 조회:** `https://static.nanoka.cc/manifest.json` → `zzz.latest` 필드  
*(현재 최신: `2.8.12`)*

**타입:** 객체 (ID 문자열 → 캐릭터 데이터)

```json
{
  "1011": {
    "code": "Anby",
    "rank": 3,
    "type": 2,
    "element": 203,
    "hit": 101,
    "camp": 1,
    "icon": "IconRole01",
    "ko": "엔비",
    "en": "Anby",
    "zh": "安比",
    "ja": "アンビー",
    "desc": "(영문 설명)",
    "potential": [],
    "skin": { ... }
  },
  "1021": {
    "code": "Nekomata",
    "rank": 4,
    "type": 1,
    "element": 200,
    "ko": "네코마타",
    "en": "Nekomata",
    "icon": "IconRole11",
    ...
  }
}
```

**필드 요약:**

| 필드 | 타입 | 설명 |
|---|---|---|
| `code` | string | 영문 코드명 (= slug 원본) |
| `rank` | int | 등급: 3=A등급, 4=S등급 |
| `type` | int | 전문분야: 1~6 |
| `element` | int | 속성: 200~205 |
| `hit` | int | 공격 타입: 101/102/103 |
| `camp` | int | 파벌 정수 |
| `icon` | string | 이미지 파일명 (예: "IconRole01") |
| `ko` | string | **한국어 이름 직접 포함** |
| `en` | string | 영문 이름 |

---

## B. 한국어 상세 응답

**URL:** `https://static.nanoka.cc/zzz/{version}/ko/character/{id}.json`  
*(참고용 — character.json으로 충분하므로 실제 import에 불필요)*

```json
{
  "name": "엔비",
  "code_name": "Anby",
  "rarity": 3,
  "element_type": {"203": "전기 속성"},
  "weapon_type":  {"2": "격파"},
  "hit_type":     {"101": "베기"},
  "camp":         {"1": "교활한 토끼굴"},
  "gender": 2,
  "icon": "IconRole01",
  "skill": {
    "basic":   { "description": [{"name": "일반 공격: 볼트 속공", "desc": "..."}] },
    "dodge":   { "description": [{"name": "회피: 슬라이드 스텝",  "desc": "..."}] },
    "special": { "description": [{"name": "특수 스킬: 전광 베기", "desc": "..."}] },
    "chain":   { "description": [{"name": "콤보 스킬: 전자 엔진", "desc": "..."}] },
    "assist":  { "description": [{"name": "빠른 지원: ...",        "desc": "..."}] }
  },
  "talent": {
    "1": {"name": "고속 충전 모드", "desc": "...", "level": 1},
    "2": { ... },
    ...
    "6": { ... }
  }
}
```

**스킬 타입:** `basic`, `dodge`, `special`, `chain`, `assist` (+ `core`)  
**마인드스케이프(별자리 상당):** `talent` 키, 1~6번

---

## C. 영문 이름

`character.json`의 `en` 필드와 `code` 필드가 동일한 영문 이름을 포함.  
별도 영문 fetch **불필요**.

샘플:
```
1041: en="Soldier 11", code="Soldier 11"  
1031: en="Nicole",     code="Nicole"
```

---

## D. 이미지 URL 패턴

| 도메인 | 패턴 | HTTP 결과 | CORS |
|---|---|---|---|
| `static.nanoka.cc/zzz/UI/{icon}.webp` | IconRole01.webp | ❌ 404 | - |
| **`enka.network/ui/zzz/{icon}.webp`** | IconRole01.webp | ✅ **200** | ✅ `*` |
| `enka.network/ui/zzz/{icon}.png` | IconRole01.png | ✅ 200 | ✅ `*` |

**최종 이미지 URL 패턴:**
```
https://enka.network/ui/zzz/{char.icon}.webp
```
예: `char.icon = "IconRole01"` → `https://enka.network/ui/zzz/IconRole01.webp`

---

## E. 매핑 테이블

### element (속성)

| 코드 | 한국어 |
|---|---|
| 200 | 물리 |
| 201 | 화염 |
| 202 | 얼음 |
| 203 | 전기 |
| 205 | 에테르 |

*(204 없음)*

### type (전문분야) → weaponType 컬럼에 저장

| 코드 | 한국어 |
|---|---|
| 1 | 공격 |
| 2 | 격파 |
| 3 | 이상 |
| 4 | 지원 |
| 5 | 방어 |
| 6 | 강탈 |

### rank (등급) → tier 컬럼

| 코드 | tier |
|---|---|
| 3 | A |
| 4 | S |

---

## F. 제외 대상

| ID | 이름 | 이유 |
|---|---|---|
| `2011` | Wise (주인공 남) | character.json에 이미 없음 |
| `2021` | Belle (주인공 여) | character.json에 이미 없음 |
| `rank: null` | 미공개 | 베타/미출시 캐릭터 필터 필요 |
| `ko: ""` 또는 미존재 | - | 빈 이름 필터 |

---

## G. 구현 방향 (코드 작성 전 메모)

### 데이터 소스 (fetch 1회)

```
GET https://static.nanoka.cc/manifest.json  →  zzz.latest 버전 조회
GET https://static.nanoka.cc/zzz/{version}/character.json  →  전체 캐릭터
```

### 필드 매핑

```javascript
const ZZZ_CDN_BASE  = 'https://static.nanoka.cc/zzz'
const ZZZ_IMG_BASE  = 'https://enka.network/ui/zzz'

const ZZZ_ELEMENT_MAP   = { 200:'물리', 201:'화염', 202:'얼음', 203:'전기', 205:'에테르' }
const ZZZ_SPECIALTY_MAP = { 1:'공격', 2:'격파', 3:'이상', 4:'지원', 5:'방어', 6:'강탈' }
// rank: 3→'A', 4→'S'

// 각 캐릭터 변환
nameKo    = char.ko
nameEn    = char.en       // 또는 char.code
tier      = char.rank === 4 ? 'S' : 'A'
element   = ZZZ_ELEMENT_MAP[char.element]
weaponType = ZZZ_SPECIALTY_MAP[char.type]   // 전문분야를 weaponType에
imageUrl  = `${ZZZ_IMG_BASE}/${char.icon}.webp`
slug      = char.en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
```

### 제외 조건

```javascript
function shouldExcludeZZZChar(char) {
  if (!char.ko || char.ko.trim() === '') return true
  if (char.rank === null || char.rank === undefined) return true
  return false
}
// (주인공은 character.json에 이미 없으므로 별도 ID 제외 불필요)
```

### metadata 구조 (상세 페이지용, 선택적 fetch)

상세 fetch가 필요한 경우:
```
GET https://static.nanoka.cc/zzz/{version}/ko/character/{id}.json
```
- `skill.basic/dodge/special/chain/assist` → description[0].name + desc
- `talent.1~6` → name + desc (마인드스케이프 시네마)
- `element_type`, `weapon_type` 값 → 이미 한국어

---

## 참고: 원신/스타레일 패턴과 비교

| 항목 | 원신 | 스타레일 | ZZZ |
|---|---|---|---|
| 데이터 소스 | genshin-db-api.vercel.app | GitHub raw (StarRailRes) | static.nanoka.cc |
| 버전 고정 | X | O | O (manifest로 동적) |
| 한국어 이름 | queryLanguages=Korean 필요 | index_min/kr/characters.json | character.json의 `ko` 필드 |
| element | 한국어 직접 (API 응답) | 영문 코드 → 매핑 필요 | 정수 코드 → 매핑 필요 |
| 이미지 | hoyoverse CDN | raw.githubusercontent.com | enka.network/ui/zzz/ |
| 주인공 제외 | 이름 필터 | ID 필터 | 이미 없음 |
| fetch 횟수 | 목록 + 개별 상세 | 목록 + 3개 통합 JSON | **목록 1개** |
