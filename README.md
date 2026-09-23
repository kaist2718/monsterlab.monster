# MonsterLab — monsterlab.monster

`monsterlab.monster` 홈페이지. 빌드 도구가 필요 없는 정적 사이트(HTML + CSS + JS)입니다.

MonsterLab가 운영하는 서비스:

| 서비스 | 주소 | 저장소 |
| --- | --- | --- |
| 토익 학습 | [toeic.monster](https://toeic.monster) | — |
| 월간 영어 매거진 **EngMon** | [engmon.monster](https://engmon.monster) | `engmon.monster` (별도 저장소) |

## 구조

```
index.html     # 홈페이지 마크업 (소개·서비스·로드맵·FAQ·문의)
script.js      # 한/영 전환, 테마·강조색, 모바일 메뉴, 스크롤 효과 + i18n 사전
styles.css     # 스타일 (다크/라이트 테마, 강조색 프리셋, 반응형)
smoke-test.js  # 검증 스크립트 (배포 전 `node smoke-test.js`)
CNAME          # GitHub Pages 커스텀 도메인 (monsterlab.monster)
```

- 프레임워크·패키지·빌드 과정 없음. 파일을 그대로 올리면 동작합니다.
- 외부 의존성 없음(폰트는 시스템 폰트 사용, CDN 요청 없음).
- 문의 폼은 **Formspree**로 전송합니다(서버 불필요). 폼 ID를 아직 넣지 않았으면 기존처럼 `mailto:`로 동작합니다.
  백엔드를 직접 붙이려면 폼 `submit` 핸들러만 교체하면 됩니다.
- `script.js`는 **공용 API를 먼저 노출한 뒤, 기능별로 `guard()` 안에서 초기화**합니다.
  한 기능이 예외로 죽어도 나머지(특히 언어 전환)는 계속 동작하고, 실패한 기능만 콘솔에 남습니다.
  (예전에는 모든 기능이 한 줄기라서 테마 초기화 하나가 죽으면 언어 버튼까지 함께 죽었습니다.)
- 매거진(EngMon)은 이 저장소에서 분리되었습니다. 서비스 카드는 `https://engmon.monster`로 연결만 합니다.

## 로컬에서 보기

`index.html`을 브라우저로 열면 됩니다. 로컬 서버로 확인하려면:

```bash
python -m http.server 8000
# 또는
npx serve .
```

그다음 http://localhost:8000 접속.

## 검증 (배포 전)

```bash
node smoke-test.js
```

브라우저 없이 페이지 스크립트를 **실제로 실행**해 보는 테스트입니다(의존성 없음, Node만 있으면 됩니다).
`index.html`의 인라인 스크립트 → `script.js`를 최소 DOM 위에서 돌리고,
언어 전환·테마 선택·강조색·문의 폼 검증에 더해 **Formspree 전송(성공·실패·429 한도)** 까지 흉내 내 확인합니다.
(`fetch`도 가짜로 주입하므로 네트워크 요청은 나가지 않습니다.)

특히 다음 두 가지를 지켜줍니다.

- **회귀 테스트**: 테마 초기화가 강제로 실패해도 언어 전환이 살아남는지 검사합니다.
  (실제로 배포된 사이트가 이 문제로 테마 아이콘과 언어 전환이 함께 죽은 적이 있습니다.)
- **사전 검사**: `data-i18n` 키가 ko/en 양쪽에 모두 있는지, 쓰이지 않는 키가 없는지 확인합니다.

## 캐시 무효화 (배포 후 "안 바뀐 것처럼 보이는" 문제)

CSS·JS를 참조할 때 `?v=5` 같은 버전을 붙여 둡니다.

```html
<link rel="stylesheet" href="styles.css?v=5" />
<script src="script.js?v=6"></script>
```

**CSS나 JS를 고쳐서 배포할 때는 `index.html`의 해당 `?v=` 숫자를 올리세요.**
그러지 않으면 브라우저나 CDN이 예전 파일을 계속 쓰면서 수정이 반영되지 않은 것처럼 보입니다.

## 배포

정적 호스팅 아무 곳에나 HTML·CSS·JS 파일을 올리면 됩니다
(`index.html`, `styles.css`, `script.js`, `CNAME`).

- **Vercel**: 프로젝트 루트를 그대로 배포 (프레임워크: Other / Static)
- **Netlify**: 폴더를 드래그 앤 드롭
- **GitHub Pages**: 브랜치 푸시 후 Pages 활성화
- **Cloudflare Pages**: 빌드 명령 없이 루트 디렉터리 지정

배포 후 `monsterlab.monster` 도메인을 연결하세요.

> GitHub Pages는 **저장소당 커스텀 도메인 하나만** 지원합니다. 그래서 EngMon(`engmon.monster`)은
> 별도 저장소로 분리되어 있습니다.

## 내용 수정 방법

### 새 서비스 추가

`index.html`의 `<!-- 🚧 준비 중 -->` 블록을 복사해서 `#services` 안에 붙여넣고
`data-i18n` 키와 텍스트를 바꾸면 됩니다.

운영 중인 서비스는 `service-live` 클래스와 `.status-live` 배지를 사용하세요:

```html
<article class="service service-live">
  <div class="service-head">
    <span class="service-dot" aria-hidden="true"></span>
    <span class="status status-live" data-i18n="status.live">운영 중</span>
  </div>
  <h3 class="service-name">서비스명</h3>
  <p class="service-desc" data-i18n="service.new.desc">설명</p>
  <a class="service-link" href="https://example.monster" target="_blank" rel="noopener">사이트 방문 ↗</a>
</article>
```

### 문구 변경

- 화면에 보이는 기본 텍스트(한국어)는 `index.html`에서 직접 수정합니다.
- **영어 번역은 `script.js`의 `I18N.en` 객체**에 있습니다. `data-i18n="키"` 이름을 키로 찾아 수정하세요.
- 한국어 문구도 `I18N.ko`에 함께 있으므로, 두 언어를 모두 고쳐야 전환했을 때 일관됩니다.
- `data-i18n` = 텍스트만 교체, `data-i18n-html` = HTML 허용(`<br>`, `<strong>` 등).

### 이메일 주소

수신 주소는 **`kaist2718@gmail.com`** 입니다. 세 곳에 나옵니다.

- `index.html` — 푸터 링크, 문의 영역의 주소 표시(`mailto:`)
- `script.js` — `EMAIL` 상수(주소 복사 버튼 + 문의 폼 전송에 사용)
- `index.html` — JSON-LD `Organization.email` (검색엔진용)

주소를 바꿀 때는 위 세 곳을 모두 수정하세요.

### 문의 폼 (Formspree)

문의는 별도 서버 없이 [Formspree](https://formspree.io)로 전송됩니다.

**현재 연결 상태:** monsterlab.monster → `https://formspree.io/f/mgavywgr`

연결은 `index.html`의 `action` 한 줄이 전부입니다. **수신처를 바꾸려면 이 주소의 폼 ID만 바꾸면 됩니다.**

```html
<form class="contact-form" id="contactForm" method="POST"
      action="https://formspree.io/f/mgavywgr" novalidate>
```

- 다른 사이트(toeic.monster 등)에 같은 폼을 쓸 때도 그 사이트의 `index.html` 에서 이 주소만 바꿉니다.
  ID를 그대로 두면 공용으로 받고, 다른 폼 ID를 넣으면 사이트별로 따로 받습니다.
- `REPLACE_ME` 처럼 **밑줄이 들어간 값**을 넣으면 미연결로 보고 예전처럼 메일 앱(`mailto:`)으로 보냅니다.
  (연결 전에도 사이트가 깨지지 않게 하는 안전장치입니다. `node smoke-test.js` 가 배포 전에 이 상태를 잡아냅니다.)
- 연결되면 버튼 문구가 `보내기`/`Send` 로, 안내 문구가 Formspree용으로 바뀌고,
  전송은 페이지 이동 없이 AJAX(JSON)로 나갑니다.

동작 방식(`script.js`의 `문의 폼` 블록):

- `action` 이 미연결이거나 `fetch` 를 쓸 수 없는 브라우저면 **예전처럼 `mailto:`** 로 보냅니다.
- 전송 형식은 **`FormData`(multipart/form-data)** 입니다. `Content-Type` 을 직접 지정하지 않아
  CORS 사전 요청(preflight)이 없고, 브라우저가 폼을 직접 POST 할 때와 같은 형식입니다.
- 보내는 값: `name` · `email`(회신 주소) · `message` · `_subject`(유형+이름) · `intent`(general/bug/partner) · `source`(접속 도메인).
  reCAPTCHA를 켜면 `g-recaptcha-response` 가 더해집니다.
- **스팸 방지 기본값**: 폼 안의 숨은 함정 칸(`name="_gotcha"`)은 화면 밖으로 밀어 두었습니다.
  봇이 이 칸을 채우면 Formspree가 제출을 조용히 버립니다(사람에게는 보이지 않고 탭 순서에서도 빠집니다).
- **reCAPTCHA v3 (선택)**: `<form data-recaptcha-key="">` 에 Google reCAPTCHA v3 **사이트 키**를 넣으면 켜집니다.
  (Google 콘솔에서 만든 같은 키의 **비밀 키**를 Formspree 폼 설정의 reCAPTCHA에 넣어야 합니다.)
  켠 경우에만 첫 전송 때 Google 스크립트를 한 번 불러오고, 토큰을 `g-recaptcha-response` 로 함께 보냅니다.
  **비워 두면 외부 요청이 0** — 이 저장소의 “CDN 요청 없음” 원칙이 그대로 유지됩니다.
  스크립트를 못 불러오면 토큰 없이 전송을 시도하고, 실패하면 기존 실패 안내가 뜨고 Gmail·본문 복사가 대안으로 남습니다.
- 전송 중에는 버튼을 잠가 중복 전송을 막고(Formspree는 분당 20건 제한),
  결과를 `#formStatus` 에 표시합니다. `429` 는 "잠시 후 다시 시도" 문구로 구분합니다.
- 실패해도 `Gmail로 보내기` · `본문 복사` 버튼이 그대로 남아 있어 대안 경로가 있습니다.
- Formspree가 안내하는 `@formspree/ajax` CDN 라이브러리는 쓰지 않습니다.
  이 저장소는 외부 의존성 0(CDN 요청 없음)을 원칙으로 하고, 이미 사이트 자체 검증·한/영 문구와 얽혀 있어
  Formspree의 AJAX 규칙(`Accept: application/json` · 필드/폼 오류 · 전송 중 잠금)을 `fetch` 로 직접 구현했습니다.

### 폼 하나로 여러 도메인 쓰기 (toeic.monster · engmon.monster)

**가능합니다.** Formspree의 폼 주소(`formspree.io/f/폼ID`)는 특정 도메인에 묶여 있지 않아서,
여러 사이트의 `<form action>` 이 같은 폼 ID를 가리켜도 모두 같은 받은편지함으로 들어옵니다.

- 어느 사이트에서 온 문의인지는 `source` 필드(접속 도메인)로 자동 구분됩니다.
  받은 메일에서 `source: toeic.monster` 처럼 보입니다.
- **무료 플랜에서도 폼·프로젝트가 무제한**이고 `Restrict to domain` 도 모든 플랜에서 쓸 수 있습니다.
  도메인 개수 자체로 유료가 되지는 않습니다.
- 다만 `Restrict to domain` 은 **프로젝트당 도메인 한 개**(서브도메인 포함)만 받습니다.
  도메인마다 스팸 차단을 걸고 싶으면 **사이트별로 프로젝트(폼)를 따로 만들어** 각각 그 도메인을 넣으세요.
  설정을 비워 두면 다른 도메인에서 온 제출이 차단되지는 않고 스팸함으로 분류됩니다.
- 무료 플랜의 실제 한도는 **월 50건이 계정 전체 합산**이고, 연결 메일 주소 2개까지, 최근 30일 기록만 남습니다.
  한 폼을 **여러 주소로 동시 수신(Multiple To Emails)** 하는 기능은 Personal($10/월, 연 결제 기준)부터입니다.
- 정리하면: 도메인 2개 + 스팸 차단까지 = 폼 2개(무료, 월 50건 안에서) / 도메인 2개 + 폼 1개 = 도메인 제한 없이 사용(무료).

### 색상 / 테마

`styles.css` 상단에 기본 변수 두 블록이 있습니다.

- `:root` — 다크 테마 + 민트 프리셋(기본값)
- `:root[data-theme="light"]` — 라이트 테마 + 민트 프리셋

색을 바꿀 때는 **두 블록을 함께** 수정하세요. `--accent`(포인트), `--accent-2`(보조),
`--accent-rgb`/`--accent2-rgb`는 글로우·테두리에 쓰이는 같은 색의 RGB 값입니다(공백 구분, 예: `110 231 168`).
라이트 테마는 밝은 배경에서도 읽히도록 포인트 컬러를 더 진하게, 버튼 글자색(`--accent-ink`)을 흰색으로 씁니다.

**대비 규칙(중요):** 라이트 테마의 `--accent`는 링크·라벨 같은 **본문 텍스트로도 쓰입니다.**
배경(`--bg`) 대비 4.5:1 이상을 지켜야 하므로, 새 색을 넣기 전에 대비율을 확인하세요.
현재 값은 테마 2 × 프리셋 4, 총 8조합이 모두 AA(4.5:1)를 넘습니다.

### 강조색 프리셋

포인트 컬러를 4가지 중에서 고를 수 있습니다. 푸터의 색 동그라미로 바뀌고, 선택은 `localStorage`에 저장됩니다.

| 이름 | 다크 | 라이트 | 속성값 |
| --- | --- | --- | --- |
| 민트(기본) | `#6ee7a8` | `#0a7a52` | `data-accent="mint"` |
| 바이올렛 | `#a78bfa` | `#6d4ae0` | `data-accent="violet"` |
| 오션 | `#7dd3fc` | `#0b6fc4` | `data-accent="ocean"` |
| 앰버 | `#fcd34d` | `#b45309` | `data-accent="amber"` |

프리셋을 추가하려면:

1. `styles.css`의 `:root[data-accent="이름"]` 블록을 복사해 6개 변수(`--accent`, `--accent-2`,
   `--accent-ink`, `--accent-rgb`, `--accent2-rgb`, `--btn-grad-2`)를 채웁니다.
2. 라이트용은 `:root[data-theme="light"][data-accent="이름"]` 블록도 함께 만듭니다.
   (파일 마지막 묶음이라 명시도가 높아 라이트 테마에서 우선 적용됩니다.)
3. `index.html` 푸터에 `data-accent` 스와치 버튼을 추가하고, `--bg` 대비 4.5:1을 확인합니다.
4. `script.js`의 `ACCENT_NAMES` 배열에 이름을 넣고, `I18N`의 `accent.<이름>` 라벨을 ko/en 양쪽에 추가합니다.

### 테마 전환

헤더에 **버튼 3개(☀️ 라이트 / 🌙 다크 / 🖥️ 시스템)** 가 나란히 있고, 그중 하나가 선택된 상태로 보입니다.

> 초기에는 버튼 한 개를 눌러 세 모드를 순환하는 방식이었는데, OS가 다크일 때 `시스템 → 다크`
> 전환이 **화면상 아무 변화가 없어** 고장난 것처럼 보이는 문제가 있었습니다. 선택 버튼 방식은
> 색이 그대로여도 어느 모드를 골랐는지가 항상 눈에 보입니다.

동작 방식:

1. `<head>`의 인라인 스크립트가 첫 페인트 전에 `data-theme`(실제 적용할 색)과
   `data-theme-mode`(사용자가 고른 모드)를 심습니다 → 테마 깜박임 없음.
2. 저장된 선택이 없거나 `시스템` 모드이면 `prefers-color-scheme`을 따릅니다.
   `시스템` 모드에서는 OS 설정이 바뀌면 페이지가 실시간으로 따라갑니다.
3. 버튼은 `localStorage`(`monsterlab.theme` = `dark` | `light` | `system`)에 저장되어 다음 방문에도 유지됩니다.
4. 버튼은 **HTML에 직접** 있습니다(`data-theme-option="light|dark|system"`). 스크립트가 죽어도 선택지는
   화면에 남고, 헤더와 모바일 메뉴의 두 세트에 같은 선택 상태가 동시에 반영됩니다.
5. **760px 이하**에서는 헤더가 좁아지므로 테마 버튼이 **모바일 메뉴 안으로 들어갑니다.**
6. **푸터의 "테마" 항목**에 현재 모드 이름이 같이 표시됩니다.

## 섹션 구성

**홈(index.html)** 히어로(제품 미리보기 포함) → 소개 → 서비스 → 로드맵 → FAQ → 문의 → 푸터.

- **히어로 미리보기**: `index.html`의 `.hero-preview` 블록. 실제 화면 캡처 이미지로 교체하려면
  `.preview-window` 안을 `<img src="preview.png" alt="..." />`로 바꾸면 됩니다.
- **FAQ**: `<details class="faq">` 항목을 복사해 추가합니다. 첫 항목만 `open`이 붙어 있습니다.
- **문의 폼**: 입력값을 검사한 뒤 Formspree로 전송합니다(폼 ID 미설정 시 `mailto:` 로 폴백).

## 기능

- 문의: 유형 탭(일반·버그·제휴)에 따라 제목 자동 생성, 필드별 오류 메시지, 글자 수 카운터,
  보낼 내용 미리보기, **Formspree 전송**(FormData · 전송 중 잠금 · 성공/실패/한도 안내),
  숨은 함정 칸(허니팟)과 선택적 reCAPTCHA v3,
  전송이 안 될 때의 대안 3가지(메일 앱 / Gmail / 본문 복사)
- 한/영 전환 토글 — 선택 언어는 `localStorage`에 저장
- 모바일 햄버거 메뉴 (ESC로 닫기)
- 스크롤 시 헤더 경계선 표시, 현재 보고 있는 섹션 메뉴 강조
- 스크롤 진입 시 카드/서비스/FAQ 페이드인 (`prefers-reduced-motion`이면 비활성)
- 이메일 주소 복사 버튼(클립보드 API, 실패 시 폴백)과 토스트 안내
- 맨 위로 가기 버튼 (600px 이상 스크롤 시 표시)
- 다크/라이트/시스템 3단계 테마 **선택** 버튼 (`localStorage` 저장, 기본은 시스템 설정)
- 강조색 4종 프리셋 선택 (푸터 스와치, `localStorage` 저장)
- 언어 전환 시 **탭 제목과 설명도 함께** 바뀜 (`<html data-title-key="..." data-desc-key="...">`)
- **Alt + L** 단축키로 언어 전환
- `prefers-reduced-motion` 존중, 키보드 포커스 링 지원
