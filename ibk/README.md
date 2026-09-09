# 2026 IBK기업은행 위탁 교육기관 선정 제안 — 웹 프레젠테이션

`2 하나투어_정성제안서-1_260909_095815.pdf` (93페이지)를 웹 게시용 HTML 덱으로 전환한 결과물입니다.
**41 슬라이드**, 전 슬라이드 애니메이션 적용.

## 실행

- **그냥 열기** — `index.html` 더블클릭 (file:// 에서도 모든 효과가 정상 동작합니다)
- **로컬 서버** — 웹 게시 환경과 동일하게 확인하려면
  ```bash
  cd ibk-deck
  python -m http.server 4300
  # → http://127.0.0.1:4300
  ```

## 조작

| 키 | 동작 |
|---|---|
| `←` `→` `Space` `PgUp/PgDn` | 슬라이드 이동 |
| `Home` `End` | 처음 / 끝 |
| `F` | 전체화면 |
| `O` | 전체 슬라이드 오버뷰 |
| `T` | 테마 순환 (aurora → glassmorphism → tokyo-night → cyberpunk-neon → corporate-clean → pitch-deck-vc) |
| `A` | 현재 슬라이드 애니메이션 랜덤 재생 |
| `S` | 발표자 모드 창 (현재/다음 슬라이드 · 타이머) |
| `N` | 발표 노트 드로어 |
| `#/12` | URL 해시로 특정 슬라이드 딥링크 |

기본 테마는 **aurora**(딥 네이비). 밝은 배경이 필요하면 `T`를 눌러 `corporate-clean` / `pitch-deck-vc`로 바꾸거나,
`index.html`의 `<link id="theme-link">` href를 직접 지정하세요.

## 적용한 효과

**슬라이드 전환** — blur + scale + slide, 좌우 방향 인식

**진입 애니메이션** (`data-anim`, 슬라이드 진입 시마다 재생)
`rise-in` · `fade-up/down/left/right` · `blur-in` · `zoom-pop` · `stagger-list`(카드/리스트 순차 등장) · `counter-up`(숫자 카운트업)

**캔버스 FX** (`data-fx`, 16종 — 슬라이드 진입 시 시작, 이탈 시 정지)

| 슬라이드 | FX |
|---|---|
| 표지 | galaxy-swirl |
| 01 섹션 / 런던 커버 | constellation |
| 02 섹션 | magnetic-field |
| Two Capitals 컨셉 | shockwave |
| 03 섹션 | data-stream |
| 뉴욕 커버 | starfield |
| 컬럼비아 특강 | neural-net |
| 뉴욕 네트워킹 | sparkle-trail |
| LSE 특강 | knowledge-graph |
| 런던 기관방문 | orbit-ring |
| 04 섹션 | chain-react |
| Heritage Tea | gradient-blob |
| 보안·보험 | matrix-rain |
| 제안 핵심 POINT | particle-burst |
| THANK YOU | firework |

FX 캔버스는 `mix-blend-mode: screen`으로 합성해 사진 배경 위에 **빛만 얹히도록** 처리했습니다.

**상시 모션** — 떠다니는 글로우 오브, 그리드 스캔라인, 그라디언트 텍스트 흐름, 로고 스트립 마퀴,
사진 켄번스 줌, 카드 호버 리프트, 타일 이미지 확대

## 구성

```
ibk-deck/
├── index.html    41 슬라이드
├── style.css     .tpl-ibk 전용 레이어 (레이아웃 · 카드 · 표 · 타임라인 · 배경)
├── assets/       html-ppt 스킬 자산 (base.css · 36 테마 · runtime.js · 27 애니메이션 · 20 FX)
└── img/          여행지·기관 사진 15장 + CREDITS.json
```

## 슬라이드 구성

| # | 내용 |
|---|---|
| 1–2 | 표지 · 제안서 구성(INDEX) |
| 3–6 | **01 제안기업 일반** — 회사 개요 · 재무 안정성 · 유사 사업실적(IBK 2건 강조) |
| 7–10 | **02 제안개요** — Why London & New York · Two Capitals One IBK · 프로그램 핵심 비교 |
| 11–21 | **03 연수운영부문 (뉴욕)** — 5대 포인트 · 항공 · 호텔 · 6일 일정 · 컬럼비아 특강 · 하이라이트 · 네트워킹 · 식사 · 차량/가이드 |
| 22–31 | **03 연수운영부문 (런던)** — 5대 포인트 · 항공 · 호텔 · 6일 일정 · LSE 특강 · 하이라이트 · 기관방문 · 식사 · 차량/가이드 |
| 32–39 | **04 연수상세부문** — 인천공항 특전 · Heritage Tea · 비자대행 · 전담인력 · 상담센터 · 긴급상황 · 보안/보험 |
| 40–41 | 제안 핵심 POINT 6 · THANK YOU |

## 이미지

원본 PDF의 사진은 추출하지 않고, **위키미디어 커먼즈의 자유 이용 라이선스**(CC0 / CC BY / CC BY-SA / Public domain)
이미지를 새로 받아 사용했습니다. 저작자·라이선스 전체 목록은 `img/CREDITS.json`에 있습니다.
실제 제안 제출용으로 쓰실 경우 하나투어가 보유한 실사진으로 교체하시면 됩니다
(파일명을 그대로 덮어쓰면 자동 반영).

## 참고

- 원본 PDF의 수치·일정·인명·메뉴는 그대로 옮겼습니다. 다만 93페이지를 41장으로 압축하면서
  호텔 부대시설 상세, 객실 사진 페이지, 조직도 등 **사진 위주 페이지는 통합**했습니다.
- 상담센터 대표번호(`02-2076-0000`)는 원본에도 "미정"으로 표기되어 있어 그대로 두었습니다.
- 발표자 노트는 일부 슬라이드에만 넣었습니다. `N` 또는 `S`로 확인하며 필요한 만큼 채우시면 됩니다.
