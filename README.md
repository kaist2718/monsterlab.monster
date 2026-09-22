# MonsterLab — monsterlab.monster

`monsterlab.monster` 홈페이지. 빌드 도구가 필요 없는 정적 사이트(HTML + CSS + JS)입니다.

## 구조

```
index.html     # 홈페이지 마크업 (소개·서비스·로드맵·FAQ·문의)
magazine.html  # 매거진 1호 페이지 (섹션 목록·오디오·단어장·확인 문제)
issues.js      # 매거진 데이터(호·섹션) — 이 파일이 콘텐츠의 "DB"
magazine.js    # 매거진 페이지 렌더링·오디오·단어장·진행률
styles.css     # 스타일 (다크/라이트 테마, 강조색 프리셋, 반응형)
script.js      # 한/영 전환, 테마·강조색, 모바일 메뉴, 스크롤 효과
```

- 프레임워크·패키지·빌드 과정 없음. 파일을 그대로 올리면 동작합니다.
- 외부 의존성 없음(폰트는 시스템 폰트 사용, CDN 요청 없음). 매거진 오디오도 브라우저 내장 음성합성을 씁니다.
- 연락 폼은 별도 서버 없이 `mailto:`로 동작합니다. 백엔드가 필요하면 폼 `submit` 핸들러만 교체하면 됩니다.
- `script.js`가 두 페이지 공통(테마·언어·메뉴)을 맡고, `magazine.js`는 `window.MonsterLab`(`t`, `toast`)과
  `langchange` 이벤트로만 연결됩니다. 두 페이지의 헤더/푸터 ID가 같아야 공통 스크립트가 그대로 동작합니다.

## 로컬에서 보기

`index.html`을 브라우저로 열면 됩니다. 로컬 서버로 확인하려면:

```bash
python -m http.server 8000
# 또는
npx serve .
```

그다음 http://localhost:8000 접속.

## 배포

정적 호스팅 아무 곳에나 `index.html`, `styles.css`, `script.js` 세 파일을 올리면 됩니다.

- **Vercel**: 프로젝트 루트를 그대로 배포 (프레임워크: Other / Static)
- **Netlify**: 폴더를 드래그 앤 드롭
- **GitHub Pages**: 브랜치 푸시 후 Pages 활성화
- **Cloudflare Pages**: 빌드 명령 없이 루트 디렉터리 지정

배포 후 `monsterlab.monster` 도메인을 연결하세요.

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

헤더의 버튼 한 개로 세 가지 모드를 순환합니다.

```
🌙 다크  →  ☀️ 라이트  →  🖥️ 시스템  →  (다시 다크)
```

동작 방식:

1. `index.html` `<head>`의 인라인 스크립트가 첫 페인트 전에 `data-theme`(실제 적용할 색)과
   `data-theme-mode`(사용자가 고른 모드)를 심습니다 → 테마 깜박임 없음.
2. 저장된 선택이 없거나 `시스템` 모드이면 `prefers-color-scheme`을 따릅니다.
   `시스템` 모드에서는 OS 설정이 바뀌면 페이지가 실시간으로 따라갑니다.
3. 버튼을 누르면 모드가 `localStorage`(`monsterlab.theme` = `dark` | `light` | `system`)에 저장되어 다음 방문에도 유지됩니다.
4. 버튼의 아이콘·라벨과 `title`/`aria-label`은 현재 모드와 언어에 맞춰 같이 갱신됩니다.
   620px 이하 화면에서는 라벨을 숨기고 아이콘만 보여줍니다.
5. **푸터의 "테마" 항목**에 현재 모드가 항상 같이 표시됩니다(헤더 버튼과 동기화).

## 섹션 구성

히어로(제품 미리보기 포함) → 소개 → 서비스 → 로드맵 → FAQ → 문의 → 푸터.

- **히어로 미리보기**: `index.html`의 `.hero-preview` 블록. 실제 화면 캡처 이미지로 교체하려면
  `.preview-window` 안을 `<img src="preview.png" alt="..." />`로 바꾸면 됩니다.
- **FAQ**: `<details class="faq">` 항목을 복사해 추가합니다. 첫 항목만 `open`이 붙어 있습니다.
- **문의 폼**: 입력값을 검사한 뒤 `mailto:` 링크를 열어 메일 앱으로 전달합니다.

## 매거진 (`magazine.html`)

`issues.js` 하나로 호(issue)를 추가하는 구조입니다. 서버도 CMS도 필요 없습니다.

```js
var MAGAZINE_ISSUES = [
  { number: 2, slug: 'issue-02', date: '2026-11', level: 'B1', minutes: 25,
    theme: { ko, en }, title: { ko, en }, summary: { ko, en },
    sections: [ { id, kind, level, title:{ko,en}, intro, body, items, dialogue, questions, quiz } ] }
];
```

- 배열의 **맨 앞 호**가 페이지에 표시됩니다(`issues[0]`). 새 호는 맨 앞에 끼워 넣으면 됩니다.
- 섹션 필드는 모두 선택사항이고, 있는 필드만 그려집니다.
  - `items` — 어휘·표현. 각 항목에 "단어장에 저장" 버튼이 자동으로 붙습니다.
  - `bullets` — 저장 버튼 없는 목록(해설 노트용)
  - `dialogue` — `{ who, en, ko }` 대화문
  - `questions` — 토론 질문 / `quiz` — 보기 중 정답 인덱스(`answer`)와 해설
- `kind` 값은 `mag.kind.<kind>` 문구와 짝을 이룹니다. 새 종류를 쓰려면 `script.js`의 `I18N`에
  `mag.kind.<이름>`을 ko/en 양쪽에 추가하세요.
- **오디오**: `issues.js`의 영어 필드(`body.en`, `items[].en`, `dialogue[].en`)를 모아
  `speechSynthesis`로 읽습니다. 오디오 파일이 필요 없고 비용도 0입니다.
  미리 만든 음성 파일이 필요해지면 `magazine.js`의 `speak()`만 교체하면 됩니다.

저장 키: `monsterlab.wordbook`(저장한 단어) · `monsterlab.progress`(섹션 완료) — 모두 이 브라우저에만 남습니다.

> ⚠️ `issues.js`의 1호 내용은 **템플릿 예시(초안)**입니다. 실제 발행 전에 자체 집필로 교체하세요.
> "Learn Hot English"는 실존하는 상업 브랜드(월간, 290호 이상)이므로 **이름·섹션 구성·문장을 그대로 가져오면 안 됩니다.**
> 포맷(월간 테마 + 고정 섹션)만 참고하고 내용은 직접 써야 합니다.

## 기능

- 매거진: 섹션별 듣기(브라우저 음성합성), 단어장 저장/복사/비우기, 섹션 완료 표시와 진행률, 즉시 채점되는 확인 문제
- 한/영 전환 토글 — 매거진 페이지의 동적 콘텐츠도 `langchange` 이벤트로 함께 다시 그려집니다
- 선택 언어는 `localStorage`에 저장
- 모바일 햄버거 메뉴 (ESC로 닫기)
- 스크롤 시 헤더 경계선 표시, 현재 보고 있는 섹션 메뉴 강조
- 스크롤 진입 시 카드/서비스/FAQ 페이드인 (`prefers-reduced-motion`이면 비활성)
- 이메일 주소 복사 버튼(클립보드 API, 실패 시 폴백)과 토스트 안내
- 문의 폼 검증 + 메일 앱 연결
- 맨 위로 가기 버튼 (600px 이상 스크롤 시 표시)
- 다크/라이트/시스템 3단계 테마 순환 (`localStorage` 저장, 기본은 시스템 설정)
- 강조색 4종 프리셋 선택 (푸터 스와치, `localStorage` 저장)
- 푸터에 현재 테마 모드 표시
- `prefers-reduced-motion` 존중, 키보드 포커스 링 지원
