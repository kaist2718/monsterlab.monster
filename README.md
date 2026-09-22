# MonsterLab — monsterlab.monster

`monsterlab.monster` 홈페이지. 빌드 도구가 필요 없는 정적 사이트(HTML + CSS + JS)입니다.

## 구조

```
index.html    # 페이지 마크업 (모든 섹션)
styles.css    # 스타일 (다크 테마, 반응형)
script.js     # 한/영 전환, 모바일 메뉴, 스크롤 효과
```

- 프레임워크·패키지·빌드 과정 없음. 파일을 그대로 올리면 동작합니다.
- 외부 의존성 없음(폰트는 시스템 폰트 사용, CDN 요청 없음).

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

`hello@monsterlab.monster`가 실제 수신 가능한 주소인지 확인하세요 (`index.html`에서 `mailto:` 두 곳).

### 색상 변경

`styles.css` 상단 `:root`의 변수만 바꾸면 전체 테마가 바뀝니다.
`--accent`(그린), `--accent-2`(퍼플)가 포인트 컬러입니다.

## 기능

- 한/영 전환 토글, 선택 언어는 `localStorage`에 저장
- 모바일 햄버거 메뉴 (ESC로 닫기)
- 스크롤 시 헤더 경계선 표시
- `prefers-reduced-motion` 존중, 키보드 포커스 링 지원
