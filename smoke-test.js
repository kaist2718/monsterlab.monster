/* ==========================================================================
   스모크 테스트 — 브라우저 없이 페이지 스크립트를 실제로 실행해 검증합니다.
   ==========================================================================

   실행:  node smoke-test.js

   왜 필요한가:
     이 저장소는 GitHub Pages로 바로 배포되는데, 개발 환경에서 브라우저를 띄울 수
     없습니다. 그래서 script.js의 초기화가 예외로 죽어도(예: 아직 선언되지 않은
     변수를 먼저 읽는 경우) 알아채지 못하고 배포되는 사고가 있었습니다. 그때
     화면에는 "테마 아이콘이 안 보이고 언어 전환도 안 되는" 증상이 나타났습니다.

   이 테스트가 확인하는 것:
     1. head의 인라인 스크립트 → script.js 순서로 오류 없이 실행되는가
     2. 언어 전환이 실제로 문구·탭 제목을 바꾸는가 (ko/en 사전에 빈틈은 없는가)
     3. 테마 버튼/강조색 스와치가 선택 상태를 정확히 반영하는가
     4. 문의 폼 검증과 Formspree 전송(성공·실패·한도, FormData, reCAPTCHA)이 동작하는가
     6. 한 기능이 실패해도 나머지(특히 언어 전환)는 살아남는가  ← 핵심 회귀 테스트
     7. HTML에 중복 id가 없고, 에셋 URL에 캐시 무효화 버전이 붙어 있는가
   ========================================================================== */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = __dirname;
const results = [];
let failures = 0;

function check(name, fn) {
  try {
    const detail = fn();
    results.push(['PASS', name, detail || '']);
  } catch (err) {
    failures++;
    results.push(['FAIL', name, err && err.message]);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/* ── 최소 DOM 구현 ──────────────────────────────────────────────────────── */
function makeClassList() {
  const set = new Set();
  return {
    add(...names) { names.forEach((n) => set.add(n)); },
    remove(...names) { names.forEach((n) => set.delete(n)); },
    contains: (name) => set.has(name),
    toggle(name, force) {
      const on = force === undefined ? !set.has(name) : !!force;
      if (on) set.add(name); else set.delete(name);
      return on;
    },
  };
}

function makeElement(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    children: [],
    parentNode: null,
    attributes: {},
    style: {},
    hidden: false,
    value: '',
    _handlers: {},
  };

  /* 실제 DOM과 같게: textContent/innerHTML에 값을 넣으면 자식 노드가 사라집니다.
     렌더링 스크립트는 컨테이너를 비울 때 node.textContent = '' 를 쓰기 때문에,
     이 동작이 없으면 재렌더링 때 섹션이 중복으로 쌓인 것처럼 보입니다. */
  let text = '';
  let markup = '';
  Object.defineProperty(el, 'textContent', {
    get: () => text,
    set: (value) => { text = String(value); el.children.length = 0; },
  });
  Object.defineProperty(el, 'innerHTML', {
    get: () => markup,
    set: (value) => { markup = String(value); el.children.length = 0; },
  });

  el.classList = makeClassList();
  el.setAttribute = (name, value) => {
    el.attributes[name] = String(value);
    if (name === 'id') el.id = String(value);
  };
  el.getAttribute = (name) => (el.attributes[name] === undefined ? null : el.attributes[name]);
  el.removeAttribute = (name) => { delete el.attributes[name]; };
  el.hasAttribute = (name) => el.attributes[name] !== undefined;
  el.appendChild = (child) => { el.children.push(child); child.parentNode = el; return child; };
  el.insertBefore = (child, ref) => {
    const i = el.children.indexOf(ref);
    if (i < 0) el.children.push(child); else el.children.splice(i, 0, child);
    child.parentNode = el;
    return child;
  };
  el.removeChild = (child) => {
    const i = el.children.indexOf(child);
    if (i > -1) el.children.splice(i, 1);
    return child;
  };
  el.addEventListener = (type, fn) => { (el._handlers[type] = el._handlers[type] || []).push(fn); };
  el.removeEventListener = () => {};
  el.dispatch = (type, event) => {
    (el._handlers[type] || []).forEach((fn) => fn(event || { target: el }));
  };
  el.querySelector = () => null;
  el.querySelectorAll = () => [];
  el.focus = () => {};
  el.select = () => {};
  el.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 });
  el.reset = () => {};

  Object.defineProperty(el, 'firstChild', { get: () => el.children[0] || null });
  Object.defineProperty(el, 'offsetHeight', { get: () => 1200 });
  Object.defineProperty(el, 'offsetTop', { get: () => 0 });

  return el;
}

function makeMeta(name, content) {
  const el = makeElement('meta');
  el.setAttribute('name', name);
  el.setAttribute('content', content);
  return el;
}

function makeDom(html, options) {
  const opts = options || {};
  const byId = new Map();
  const bySelector = {};

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);

  ids.forEach((id) => {
    if (opts.missingIds && opts.missingIds.indexOf(id) !== -1) return;
    const el = makeElement(/^cf/.test(id) && !/Err$/.test(id) ? 'input' : 'div');
    el.setAttribute('id', id);
    byId.set(id, el);
  });

  ['data-i18n', 'data-i18n-html', 'data-i18n-placeholder', 'data-i18n-aria-label']
    .forEach((attr) => {
      bySelector['[' + attr + ']'] = [...html.matchAll(new RegExp(attr + '="([^"]+)"', 'g'))]
        .map((m) => {
          const el = makeElement('span');
          el.setAttribute(attr, m[1]);
          return el;
        });
    });

  bySelector['[data-theme-option]'] = [...html.matchAll(/data-theme-option="([^"]+)"/g)]
    .map((m) => {
      const el = makeElement('button');
      el.setAttribute('data-theme-option', m[1]);
      return el;
    });

  bySelector['.swatch'] = [...html.matchAll(/class="swatch"[^>]*data-accent="([^"]+)"/g)]
    .map((m) => {
      const el = makeElement('button');
      el.setAttribute('data-accent', m[1]);
      return el;
    });

  bySelector['[data-rate]'] = [...html.matchAll(/data-rate="([^"]+)"/g)].map((m) => {
    const el = makeElement('button');
    el.setAttribute('data-rate', m[1]);
    return el;
  });

  bySelector['.intent-tab'] = [...html.matchAll(/data-intent="([^"]+)"/g)].map((m) => {
    const el = makeElement('button');
    el.setAttribute('data-intent', m[1]);
    return el;
  });

  bySelector['meta[name="theme-color"]'] = [makeMeta('theme-color', '#0a0e13')];
  bySelector['meta[name="description"]'] = [makeMeta('description', '')];

  /* id가 붙은 실제 태그의 속성을 그 요소로 옮깁니다 (action, data-i18n, placeholder ...).
     script.js는 이런 속성을 읽어 동작을 정하므로(예: <form action>으로 Formspree 연결 판단),
     옮기지 않으면 화면과 다른 상태를 테스트하게 됩니다. */
  [...html.matchAll(/<([a-z][\w-]*)([^>]*)>/gi)].forEach((m) => {
    const idMatch = /\sid="([^"]+)"/.exec(m[2]);
    if (!idMatch) return;

    const el = byId.get(idMatch[1]);
    if (!el) return;

    [...m[2].matchAll(/([a-z][\w-]*)\s*=\s*"([^"]*)"/gi)].forEach((a) => {
      if (a[1] !== 'id') el.setAttribute(a[1], a[2]);
    });
  });

  const formEl = byId.get('contactForm');
  if (formEl) {
    if (opts.formspreeAction) formEl.setAttribute('action', opts.formspreeAction);
    if (opts.recaptchaKey) formEl.setAttribute('data-recaptcha-key', opts.recaptchaKey);

    /* 실제 폼처럼 submit 후 입력값이 비워지는지 볼 수 있게 */
    formEl.reset = () => {
      ['cfName', 'cfEmail', 'cfMsg'].forEach((id) => {
        const field = byId.get(id);
        if (field) field.value = '';
      });
    };

    /* FormData 최소 구현이 읽어 갈 “폼 안 입력값” — 태그의 name/value 와
       테스트가 넣은 값을 합쳐 돌려줍니다(전송 내용을 검사할 수 있게). */
    formEl.__fields = () => [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)]
      .map((m) => {
        const name = (m[0].match(/\bname="([^"]+)"/) || [])[1];
        if (!name) return null;

        const id = (m[0].match(/\bid="([^"]+)"/) || [])[1];
        const el = id ? byId.get(id) : null;
        const attrValue = (m[0].match(/\bvalue="([^"]*)"/) || [])[1];

        return { name, value: (el && el.value) || attrValue || '' };
      })
      .filter(Boolean);
  }

  /* <html> 태그의 속성( lang, data-title-key ... )도 그대로 옮깁니다 */
  const documentElement = makeElement('html');
  const htmlTag = html.match(/<html([^>]*)>/);
  if (htmlTag) {
    [...htmlTag[1].matchAll(/([a-z][\w-]*)="([^"]*)"/gi)].forEach((m) => {
      documentElement.setAttribute(m[1], m[2]);
    });
  }

  const body = makeElement('body');
  const documentListeners = {};

  /* <head> — script 주입(reCAPTCHA)을 추적합니다. 가짜 네트워크라 append 하면
     바로 로드된 것으로 처리하고(opts.recaptchaLoad === false 면 실패로),
     테스트는 head.children 으로 “외부 요청이 있었는지”를 볼 수 있습니다. */
  const head = makeElement('head');
  head.appendChild = (child) => {
    head.children.push(child);
    child.parentNode = head;

    if (child.tagName === 'SCRIPT') {
      if (opts.recaptchaLoad === false) {
        if (typeof child.onerror === 'function') child.onerror();
      } else if (typeof child.onload === 'function') {
        child.onload();
      }
    }
    return child;
  };

  const document = {
    documentElement,
    body,
    head,
    title: '',
    readyState: 'complete',
    getElementById: (id) => byId.get(id) || null,
    querySelector: (sel) => {
      if (opts.throwOnSelector && sel === opts.throwOnSelector) {
        throw new Error('테스트용 강제 실패: ' + sel);
      }
      return (bySelector[sel] && bySelector[sel][0]) || null;
    },
    querySelectorAll: (sel) => {
      if (opts.throwOnSelector && sel === opts.throwOnSelector) {
        throw new Error('테스트용 강제 실패: ' + sel);
      }
      return bySelector[sel] || [];
    },
    createElement: (tag) => makeElement(tag),
    addEventListener: (type, fn) => {
      (documentListeners[type] = documentListeners[type] || []).push(fn);
    },
    removeEventListener: () => {},
    dispatchEvent: (event) => {
      (documentListeners[event.type] || []).forEach((fn) => fn(event));
      return true;
    },
    execCommand: () => true,
  };

  return { document, byId, bySelector, documentElement, duplicateIds };
}

/* script.js 는 fetch(...).then(성공).then(성공, 실패) 형태만 씁니다.
   테스트를 동기로 유지하려고, 그 체인만 그대로 흉내 내는 최소 thenable을 씁니다
   (진짜 Promise는 마이크로태스크라서 check() 안에서 결과를 바로 볼 수 없습니다). */
function makeThenable(settle) {
  let value;
  let error;
  try { value = settle(); } catch (err) { error = err; }

  return {
    then(onOk, onErr) {
      if (error) {
        if (!onErr) return makeThenable(() => { throw error; });
        return makeThenable(() => onErr(error));
      }
      if (!onOk) return makeThenable(() => value);
      return makeThenable(() => onOk(value));
    },
  };
}

function makeSandbox(dom, opts) {
  const store = new Map(Object.entries((opts && opts.storage) || {}));
  const windowListeners = {};
  const fetchCalls = [];

  const sandbox = {
    console: opts.silentConsole
      ? { log: () => {}, error: () => {}, warn: () => {} }
      : console,
    setTimeout,
    clearTimeout,
    Math,
    Date,
    JSON,
    document: dom.document,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    navigator: {},
    location: { href: '' },
    CustomEvent: class {
      constructor(type, options) { this.type = type; this.detail = options && options.detail; }
    },
    IntersectionObserver: class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
      unobserve() {}
      disconnect() {}
    },
    SpeechSynthesisUtterance: class {
      constructor(text) { this.text = text; }
    },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    _store: store,
  };

  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  sandbox.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    addListener() {},
    removeListener() {},
  });
  sandbox.scrollTo = () => {};
  sandbox.open = () => null;
  sandbox.confirm = () => true;
  sandbox.scrollY = 0;
  sandbox.pageYOffset = 0;
  sandbox.innerHeight = 800;
  sandbox.innerWidth = 1280;
  sandbox.addEventListener = (type, fn) => {
    (windowListeners[type] = windowListeners[type] || []).push(fn);
  };
  sandbox.removeEventListener = () => {};
  sandbox.speechSynthesis = { cancel() {}, speak() {} };

  /* FormData 최소 구현 — 폼 입력값을 읽고, set() 으로 덧붙인 값(토큰·제목 등)을
     담습니다. 테스트는 body.get('필드명') 으로 전송 내용을 확인합니다. */
  sandbox.FormData = class FormData {
    constructor(form) {
      this._entries = [];

      const fields = (form && typeof form.__fields === 'function') ? form.__fields() : [];
      fields.forEach((f) => this.set(f.name, f.value));
    }

    set(name, value) {
      const pair = [String(name), String(value)];
      const i = this._entries.findIndex((e) => e[0] === pair[0]);

      if (i > -1) this._entries[i] = pair; else this._entries.push(pair);
      return this;
    }

    get(name) {
      const hit = this._entries.filter((e) => e[0] === String(name))[0];
      return hit ? hit[1] : null;
    }

    has(name) { return this._entries.some((e) => e[0] === String(name)); }
  };

  /* reCAPTCHA v3 — opts.recaptchaKey 를 주면 스크립트가 로드된 상태를 흑내 냅니다. */
  if (opts && opts.recaptchaKey) {
    sandbox.grecaptcha = {
      ready: (cb) => cb(),
      execute: () => {
        if (opts.recaptchaTokenFails) return makeThenable(() => { throw new Error('recaptcha'); });
        return makeThenable(() => 'test-token');
      },
    };
  }

  /* Formspree 전송 테스트용 가짜 fetch. opts.fetchResponse 로 응답을 바꿉니다. */
  sandbox.fetch = (url, options) => {
    fetchCalls.push({ url, options });
    const res = (opts && opts.fetchResponse) || { ok: true, status: 200 };
    return makeThenable(() => {
      if (res instanceof Error) throw res;
      return res;
    });
  };
  sandbox._fetchCalls = fetchCalls;

  return sandbox;
}

/* 브라우저와 같은 순서로 실행: head 인라인 → script.js */
function runPage(file, options) {
  const opts = options || {};
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = makeDom(html, opts);
  const sandbox = makeSandbox(dom, opts);
  const context = vm.createContext(sandbox);

  const inline = html.match(/<script>([\s\S]*?)<\/script>/);
  if (inline) {
    vm.runInContext(inline[1], context, { filename: file + ' (인라인)' });
  }

  ['script.js'].forEach((name) => {
    if (!fs.existsSync(path.join(ROOT, name))) return;
    vm.runInContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), context, { filename: name });
  });

  return { sandbox, dom, html };
}

/* 문의 폼을 값으로 채우고 제출합니다 (Formspree 전송 테스트용) */
function submitForm(page, values) {
  const byId = page.dom.byId;
  byId.get('cfName').value = values.name;
  byId.get('cfEmail').value = values.email;
  byId.get('cfMsg').value = values.message;

  const form = byId.get('contactForm');
  form.dispatch('submit', { preventDefault() {}, target: form });
  return form;
}

const FORMSPREE_URL = 'https://formspree.io/f/xyzabcd12';
const PAGES = ['index.html'];
const loaded = {};

/* ── 1. 두 페이지가 오류 없이 초기화되는가 ─────────────────────────────── */
PAGES.forEach((file) => {
  check(file + ' — 스크립트가 오류 없이 초기화된다', () => {
    loaded[file] = runPage(file);
  });
});

/* ── 2. index.html 기능 ────────────────────────────────────────────────── */
const index = loaded['index.html'];

if (index) {
  const { sandbox, dom } = index;

  check('window.MonsterLab API가 노출된다', () => {
    assert(sandbox.MonsterLab && typeof sandbox.MonsterLab.t === 'function',
      'window.MonsterLab.t 가 없습니다 (없으면 화면에 키 이름이 그대로 나옵니다)');
    const label = sandbox.MonsterLab.t('stats.live', 'ko');
    assert(label !== 'stats.live', 't()가 키를 그대로 반환했습니다');
    return 't("stats.live") = "' + label + '"';
  });

  check('인라인 스크립트가 첫 페인트 전에 테마/강조색을 심는다', () => {
    assert(dom.documentElement.getAttribute('data-theme-mode') === 'system',
      'data-theme-mode = ' + dom.documentElement.getAttribute('data-theme-mode'));
    assert(['dark', 'light'].indexOf(dom.documentElement.getAttribute('data-theme')) !== -1,
      'data-theme = ' + dom.documentElement.getAttribute('data-theme'));
    assert(dom.documentElement.getAttribute('data-accent') === 'mint',
      'data-accent = ' + dom.documentElement.getAttribute('data-accent'));
    return 'mode=system / theme=dark / accent=mint';
  });

  check('테마 버튼이 헤더와 모바일 메뉴 양쪽에 모두 있다', () => {
    const btns = dom.bySelector['[data-theme-option]'];
    assert(btns.length === 6, '테마 버튼이 ' + btns.length + '개입니다 (헤더 3 + 메뉴 3 = 6)');
    ['light', 'dark', 'system'].forEach((mode) => {
      const same = btns.filter((b) => b.getAttribute('data-theme-option') === mode);
      assert(same.length === 2, mode + ' 버튼이 ' + same.length + '개입니다');
    });
    return '2세트 × 3개';
  });

  check('테마 버튼 선택 상태가 두 세트에서 일치한다', () => {
    const btns = dom.bySelector['[data-theme-option]'];
    const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');

    /* 세트(3개)마다 정확히 하나만 눌려 있어야 합니다 */
    assert(pressed.length === 2, '선택 상태 ' + pressed.length + '개 (세트마다 1개여야 함)');
    assert(pressed.every((b) => b.getAttribute('data-theme-option') === 'system'),
      '시스템 모드인데 ' + pressed.map((b) => b.getAttribute('data-theme-option')).join(',') + '가 선택됨');
    return '두 세트 모두 system 선택';
  });

  check('테마 버튼 클릭이 테마·저장값·선택 표시를 함께 바꾼다', () => {
    const btns = dom.bySelector['[data-theme-option]'];
    const lightBtn = btns.filter((b) => b.getAttribute('data-theme-option') === 'light')[0];

    lightBtn.dispatch('click');

    assert(dom.documentElement.getAttribute('data-theme') === 'light',
      'data-theme = ' + dom.documentElement.getAttribute('data-theme'));
    assert(sandbox.localStorage.getItem('monsterlab.theme') === 'light', '저장되지 않았습니다');

    const pressed = btns.filter((b) => b.getAttribute('aria-pressed') === 'true');
    assert(pressed.length === 2, '선택 상태 ' + pressed.length + '개');
    assert(pressed.every((b) => b.getAttribute('data-theme-option') === 'light'),
      '두 세트가 동기화되지 않았습니다');

    const label = btns[0].getAttribute('aria-label');
    assert(label && label !== 'undefined', 'aria-label = ' + label);
    return 'system → light, 두 세트 동기화 + 저장';
  });

  check('강조색 스와치가 선택 상태를 반영한다', () => {
    const swatches = dom.bySelector['.swatch'];
    assert(swatches.length === 4, '스와치 ' + swatches.length + '개');

    const mint = swatches.filter((s) => s.getAttribute('data-accent') === 'mint')[0];
    const ocean = swatches.filter((s) => s.getAttribute('data-accent') === 'ocean')[0];
    assert(mint.getAttribute('aria-pressed') === 'true', '기본값이 mint로 표시되지 않았습니다');

    ocean.dispatch('click');
    assert(dom.documentElement.getAttribute('data-accent') === 'ocean', 'data-accent가 바뀌지 않았습니다');
    assert(sandbox.localStorage.getItem('monsterlab.accent') === 'ocean', '저장되지 않았습니다');
    assert(ocean.getAttribute('aria-pressed') === 'true', '선택 표시가 갱신되지 않았습니다');
    return 'mint → ocean 전환·저장·표시 확인';
  });

  check('언어 버튼 클릭이 화면 문구를 영어로 바꾼다', () => {
    const items = dom.bySelector['[data-i18n]'];
    const before = items.map((el) => el.textContent);

    dom.byId.get('langBtn').dispatch('click');

    const changed = items.filter((el, i) => el.textContent !== before[i]).length;
    assert(dom.documentElement.getAttribute('lang') === 'en',
      'lang 속성 = ' + dom.documentElement.getAttribute('lang'));
    assert(changed > 40, '문구가 ' + changed + '개만 바뀌었습니다 (거의 그대로면 사전 누락입니다)');
    assert(sandbox.localStorage.getItem('monsterlab.lang') === 'en', '언어가 저장되지 않았습니다');
    assert(dom.byId.get('langLabel').textContent === 'KO', '버튼 라벨이 갱신되지 않았습니다');
    return changed + '개 문구 변경 + 저장 + 라벨 갱신';
  });

  check('언어 전환이 탭 제목과 설명도 바꾼다', () => {
    const title = dom.document.title;
    const desc = dom.bySelector['meta[name="description"]'][0].getAttribute('content');
    const expected = sandbox.MonsterLab.t('page.title', 'en');
    assert(title === expected, 'title = "' + title + '" (기대: "' + expected + '")');
    assert(desc && desc.length > 10, 'description이 비어 있습니다');
    return 'title = "' + title + '"';
  });

  check('테마 버튼 설명도 새 언어로 갱신된다', () => {
    const btn = dom.bySelector['[data-theme-option]']
      .filter((b) => b.getAttribute('data-theme-option') === 'dark')[0];
    const expected = sandbox.MonsterLab.t('theme.setDark', 'en');
    assert(btn.getAttribute('aria-label') === expected,
      'aria-label = "' + btn.getAttribute('aria-label') + '" (기대: "' + expected + '")');
    return 'theme.setDark = "' + expected + '"';
  });

  check('Alt+L 단축키로도 언어가 전환된다', () => {
    dom.document.dispatchEvent({ type: 'keydown', altKey: true, key: 'l' });
    assert(dom.documentElement.getAttribute('lang') === 'ko',
      'Alt+L 후 lang = ' + dom.documentElement.getAttribute('lang'));
    dom.document.dispatchEvent({ type: 'keydown', altKey: true, key: 'l' });
    assert(dom.documentElement.getAttribute('lang') === 'en', '다시 영어로 돌아오지 않았습니다');
    return 'en ↔ ko 왕복';
  });

  check('문의 폼이 필드별 오류를 표시한다', () => {
    const form = dom.byId.get('contactForm');
    assert(form, '#contactForm이 없습니다');
    ['cfName', 'cfEmail', 'cfMsg'].forEach((id) => {
      const el = dom.byId.get(id);
      assert(el, '#' + id + '가 없습니다');
      el.value = '';
    });

    form.dispatch('submit', { preventDefault() {}, target: form });

    const shown = ['cfNameErr', 'cfEmailErr', 'cfMsgErr']
      .filter((id) => dom.byId.get(id) && dom.byId.get(id).hidden === false);
    assert(shown.length === 3, '오류가 ' + shown.length + '개만 표시됐습니다');
    return '빈 제출 시 3개 필드 오류';
  });

  /* index.html은 실제 폼 ID로 연결되어 있으므로,
     "아직 연결하지 않았을 때"의 동작은 자리표시자로 따로 확인합니다. */
  const fallbackPage = () =>
    runPage('index.html', { formspreeAction: 'https://formspree.io/f/REPLACE_ME' });

  check('폼 ID가 없으면 검증 통과 후 mailto 링크를 만든다', () => {
    const page = fallbackPage();
    submitForm(page, { name: '김테스트', email: 'a@b.com', message: '안녕하세요' });

    const still = ['cfNameErr', 'cfEmailErr', 'cfMsgErr']
      .filter((id) => page.dom.byId.get(id) && page.dom.byId.get(id).hidden === false);
    assert(still.length === 0, '통과했는데 오류가 남아 있습니다: ' + still.join(','));
    assert(page.sandbox.location.href.indexOf('mailto:kaist2718@gmail.com') === 0,
      'mailto 주소가 아닙니다: ' + page.sandbox.location.href);
    assert(page.sandbox._fetchCalls.length === 0,
      'Formspree ID를 넣지 않았는데 fetch가 호출되었습니다');
    return 'mailto:kaist2718@gmail.com 생성 (Formspree 미연결)';
  });

  /* ── Formspree 연결 (action에 폼 ID가 있는 경우) ─────────────────────── */
  check('폼 ID가 있으면 FormData(multipart)로 전송한다', () => {
    const page = runPage('index.html', { formspreeAction: FORMSPREE_URL });
    submitForm(page, { name: '김테스트', email: 'a@b.com', message: '안녕하세요' });

    const calls = page.sandbox._fetchCalls;
    assert(calls.length === 1, 'fetch 호출 ' + calls.length + '회 (1회여야 함)');
    assert(calls[0].url === FORMSPREE_URL, '전송 주소 = ' + calls[0].url);
    assert(calls[0].options.method === 'POST', 'method = ' + calls[0].options.method);
    assert(calls[0].options.headers.Accept === 'application/json', 'Accept 헤더가 없습니다');
    assert(calls[0].options.headers['Content-Type'] === undefined,
      'Content-Type을 직접 지정하면 CORS 사전 요청(preflight)이 생깁니다');

    const body = calls[0].options.body;
    assert(body && typeof body.get === 'function', '본문이 FormData가 아닙니다');
    assert(body.get('name') === '김테스트' && body.get('email') === 'a@b.com',
      '이름·이메일이 전달되지 않았습니다');
    assert(body.get('message') === '안녕하세요', '내용이 전달되지 않았습니다');
    assert(body.get('_subject').indexOf('MonsterLab') === 0, '_subject = ' + body.get('_subject'));
    assert(body.get('intent') === 'general', 'intent = ' + body.get('intent'));
    assert(body.get('source') === 'monsterlab.monster', 'source = ' + body.get('source'));

    /* 함정 칸은 비어 있고, reCAPTCHA 키가 없으면 토큰도 붙지 않아야 합니다 */
    assert(body.get('_gotcha') === '', '허니팟 칸이 비어 있지 않습니다');
    assert(body.get('g-recaptcha-response') === null, '키가 없는데 reCAPTCHA 토큰이 붙었습니다');
    return 'POST FormData · _subject·intent·source 확인';
  });

  check('reCAPTCHA 키가 없으면 Google 스크립트를 부르지 않는다', () => {
    const page = runPage('index.html', { formspreeAction: FORMSPREE_URL });
    submitForm(page, { name: '김', email: 'a@b.com', message: '안녕' });

    assert(page.dom.document.head.children.length === 0,
      '외부 스크립트를 불러왔습니다: ' + page.dom.document.head.children.length + '개');
    return '외부 요청 0 (사이트 키 비움)';
  });

  check('reCAPTCHA 키가 있으면 토큰을 붙이고 스크립트는 한 번만 부른다', () => {
    const page = runPage('index.html', {
      formspreeAction: FORMSPREE_URL,
      recaptchaKey: 'test-site-key',
    });
    submitForm(page, { name: '김', email: 'a@b.com', message: '안녕' });

    const head = page.dom.document.head;
    assert(head.children.length === 1, '스크립트 ' + head.children.length + '개 (1개여야 함)');
    assert(String(head.children[0].src).indexOf('test-site-key') > -1,
      '사이트 키가 주소에 없습니다: ' + head.children[0].src);
    assert(String(head.children[0].src).indexOf('google.com/recaptcha') > -1,
      'Google reCAPTCHA 주소가 아닙니다: ' + head.children[0].src);
    assert(page.sandbox._fetchCalls[0].options.body.get('g-recaptcha-response') === 'test-token',
      '토큰이 전달되지 않았습니다');

    /* 두 번째 전송은 스크립트를 다시 불러오지 않아야 합니다 */
    submitForm(page, { name: '김', email: 'a@b.com', message: '두 번째' });

    assert(head.children.length === 1, '스크립트를 다시 불러왔습니다 (' + head.children.length + '개)');
    assert(page.sandbox._fetchCalls.length === 2, '두 번째 전송이 없습니다');
    return 'script 1회 · 토큰 전달';
  });

  check('reCAPTCHA 스크립트를 못 불러와도 전송은 시도한다', () => {
    const page = runPage('index.html', {
      formspreeAction: FORMSPREE_URL,
      recaptchaKey: 'test-site-key',
      recaptchaLoad: false,
    });
    submitForm(page, { name: '김', email: 'a@b.com', message: '안녕' });

    const calls = page.sandbox._fetchCalls;
    assert(calls.length === 1, 'fetch 호출 ' + calls.length + '회 (전송이 막혔습니다)');
    assert(calls[0].options.body.get('g-recaptcha-response') === null, '토큰이 붙었습니다');
    return '로드 실패 → 토큰 없이 전송 시도';
  });

  check('전송 성공 시 상태 안내가 뜨고 입력값이 비워진다', () => {
    const page = runPage('index.html', { formspreeAction: FORMSPREE_URL });
    submitForm(page, { name: '김테스트', email: 'a@b.com', message: '안녕하세요' });

    const status = page.dom.byId.get('formStatus');
    const t = page.sandbox.MonsterLab.t;
    assert(status, '#formStatus가 없습니다');
    assert(status.hidden === false, '성공 안내가 숨겨져 있습니다');
    assert(status.textContent === t('form.sent', 'ko'), '문구 = ' + status.textContent);
    assert(status.classList.contains('is-error') === false, '성공인데 오류 색으로 표시됩니다');
    assert(page.dom.byId.get('cfMsg').value === '', '전송 후에도 입력값이 남아 있습니다');

    const btn = page.dom.byId.get('sendBtn');
    assert(btn.disabled === false, '전송 후에도 버튼이 잠겨 있습니다');
    assert(btn.textContent === t('form.send', 'ko'), '버튼 문구 = ' + btn.textContent);

    /* 버튼·안내 문구가 Formspree용으로 바뀌어 있어야 합니다 */
    assert(btn.getAttribute('data-i18n') === 'form.send', '버튼 data-i18n이 그대로입니다');
    assert(page.dom.byId.get('formHint').getAttribute('data-i18n') === 'form.hintOnline',
      '안내 문구가 Formspree용으로 바뀌지 않았습니다');
    return '성공 안내 + 입력값 초기화 + 버튼 복구';
  });

  check('전송 실패와 한도 초과를 각각 다른 문구로 알린다', () => {
    const fail = runPage('index.html', {
      formspreeAction: FORMSPREE_URL,
      fetchResponse: { ok: false, status: 500 },
    });
    submitForm(fail, { name: '김', email: 'a@b.com', message: '안녕' });

    const failStatus = fail.dom.byId.get('formStatus');
    assert(failStatus.hidden === false && failStatus.classList.contains('is-error'),
      '실패 안내가 오류 상태로 표시되지 않았습니다');
    assert(failStatus.textContent === fail.sandbox.MonsterLab.t('form.sendFail', 'ko'),
      '문구 = ' + failStatus.textContent);
    assert(fail.dom.byId.get('sendBtn').disabled === false, '실패 후 버튼이 잠겨 있습니다');

    const rate = runPage('index.html', {
      formspreeAction: FORMSPREE_URL,
      fetchResponse: { ok: false, status: 429 },
    });
    submitForm(rate, { name: '김', email: 'a@b.com', message: '안녕' });
    assert(rate.dom.byId.get('formStatus').textContent === rate.sandbox.MonsterLab.t('form.rateLimited', 'ko'),
      '429 문구 = ' + rate.dom.byId.get('formStatus').textContent);
    return '500 → 실패 안내 / 429 → 한도 안내';
  });

  check('폼 ID를 아직 넣지 않았으면(REPLACE_ME) Formspree를 쓰지 않는다', () => {
    const page = fallbackPage();
    submitForm(page, { name: '김', email: 'a@b.com', message: '안녕' });

    assert(page.sandbox._fetchCalls.length === 0, 'REPLACE_ME 상태인데 fetch가 호출되었습니다');
    assert(page.sandbox.location.href.indexOf('mailto:') === 0,
      'mailto로 가지 않았습니다: ' + page.sandbox.location.href);
    assert(page.dom.byId.get('sendBtn').getAttribute('data-i18n') === 'form.sendMailApp',
      '버튼 문구가 Formspree용으로 바뀌었습니다');
    return 'REPLACE_ME → 기존 메일 앱 동작 유지';
  });

  check('저장된 설정이 있으면 그대로 복원된다', () => {
    const page = runPage('index.html', {
      storage: { 'monsterlab.theme': 'light', 'monsterlab.accent': 'ocean', 'monsterlab.lang': 'en' },
    });

    assert(page.dom.documentElement.getAttribute('data-theme') === 'light', '테마가 복원되지 않았습니다');
    assert(page.dom.documentElement.getAttribute('data-accent') === 'ocean', '강조색이 복원되지 않았습니다');
    assert(page.dom.documentElement.getAttribute('lang') === 'en', '언어가 복원되지 않았습니다');

    const pressed = page.dom.bySelector['[data-theme-option]']
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    assert(pressed.length === 2 && pressed.every((b) => b.getAttribute('data-theme-option') === 'light'),
      '복원된 테마가 버튼에 반영되지 않았습니다');
    return '테마 light · 강조 ocean · 언어 en 복원';
  });
}

/* ── 3. 오류 격리 (회귀 테스트) ────────────────────────────────────────── */
check('테마 초기화가 실패해도 언어 전환은 살아남는다', () => {
  const page = runPage('index.html', { throwOnSelector: '[data-theme-option]', silentConsole: true });

  assert(page.sandbox.MonsterLab, 'window.MonsterLab이 노출되지 않았습니다');

  const items = page.dom.bySelector['[data-i18n]'];
  const before = items.map((el) => el.textContent);
  const langBtn = page.dom.byId.get('langBtn');
  assert(langBtn, '#langBtn이 없습니다');

  langBtn.dispatch('click');

  const changed = items.filter((el, i) => el.textContent !== before[i]).length;
  assert(page.dom.documentElement.getAttribute('lang') === 'en',
    '테마가 죽자 언어 전환도 죽었습니다 (회귀!)');
  assert(changed > 40, '문구가 ' + changed + '개만 바뀌었습니다');
  return '테마 강제 실패 → 언어 전환 정상 (' + changed + '개 변경)';
});

check('요소 하나가 없어도 나머지 기능이 동작한다', () => {
  const page = runPage('index.html', { missingIds: ['siteHeader', 'toTop', 'footerTheme'], silentConsole: true });
  page.dom.byId.get('langBtn').dispatch('click');
  assert(page.dom.documentElement.getAttribute('lang') === 'en', '언어 전환이 죽었습니다');
  return '#siteHeader·#toTop·#footerTheme 제거 후에도 정상';
});

check('필수 요소(#langBtn·#langLabel·#toast)가 HTML에 있다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ['langBtn', 'langLabel', 'toast', 'contactForm', 'sendBtn', 'formStatus', 'formHint',
    'siteHeader', 'nav', 'menuBtn'].forEach((id) => {
    assert(html.indexOf('id="' + id + '"') !== -1, '# ' + id + ' 가 index.html에 없습니다');
  });
  return 'index.html 필수 요소 확인';
});

/* ── 4. i18n 사전 완전성 ───────────────────────────────────────────────── */
if (index) {
  check('HTML이 쓰는 모든 i18n 키가 ko·en 양쪽에 있다', () => {
    const missing = [];
    PAGES.forEach((file) => {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
      ['data-i18n', 'data-i18n-html', 'data-i18n-placeholder', 'data-i18n-aria-label']
        .forEach((attr) => {
          const re = new RegExp(attr + '="([^"]+)"', 'g');
          [...html.matchAll(re)].forEach((m) => {
            ['ko', 'en'].forEach((lang) => {
              if (index.sandbox.MonsterLab.t(m[1], lang) === m[1]) {
                missing.push(file + ' ' + attr + '="' + m[1] + '" (' + lang + ')');
              }
            });
          });
        });
    });
    assert(missing.length === 0, '누락: ' + missing.slice(0, 5).join(' / '));
    return 'index.html 모든 속성 × ko·en 통과';
  });

  check('사전에 한쪽 언어에만 있는 키가 없다', () => {
    const dump = (file) => {
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const start = src.indexOf('var I18N');
      const body = src.slice(start, src.indexOf('var STORAGE_KEY', start));
      const cut = body.indexOf('en: {');
      return {
        ko: [...body.slice(0, cut).matchAll(/'([^']+)':/g)].map((m) => m[1]),
        en: [...body.slice(cut).matchAll(/'([^']+)':/g)].map((m) => m[1]),
      };
    };
    const dict = dump('script.js');
    const onlyKo = dict.ko.filter((k) => dict.en.indexOf(k) === -1);
    const onlyEn = dict.en.filter((k) => dict.ko.indexOf(k) === -1);
    assert(onlyKo.length === 0, 'ko에만 있음: ' + onlyKo.join(', '));
    assert(onlyEn.length === 0, 'en에만 있음: ' + onlyEn.join(', '));
    return 'ko ' + dict.ko.length + '개 = en ' + dict.en.length + '개';
  });
}

check('사용하지 않는 i18n 키가 없다', () => {
  const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  const start = src.indexOf('var I18N');
  const body = src.slice(start, src.indexOf('var STORAGE_KEY', start));
  const cut = body.indexOf('en: {');
  const keys = [...body.slice(0, cut).matchAll(/'([^']+)':/g)].map((m) => m[1]);

  /* 어디든 문자열로 등장하면 사용 중으로 봅니다. 'accent.' 처럼 조합해서
     만드는 키(accent.* / theme.* / contact.subject.*)는 접두사로 인정합니다. */
  const literals = new Set();
  PAGES.concat(['script.js']).forEach((file) => {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    [...code.matchAll(/'([A-Za-z][\w.-]*)'/g)].forEach((m) => literals.add(m[1]));
  });

  const prefixes = [...literals].filter((s) => s.length > 1 && s.endsWith('.'));
  const unused = keys.filter((k) =>
    !literals.has(k) && !prefixes.some((p) => k.startsWith(p)));

  assert(unused.length === 0, '사용되지 않음: ' + unused.join(', '));
  return keys.length + '개 키 모두 사용 중 (조합 접두사 ' + prefixes.length + '개)';
});

/* ── 6. HTML 위생 점검 ─────────────────────────────────────────────────── */
PAGES.forEach((file) => {
  check(file + ' — 중복 id가 없다', () => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    assert(dup.length === 0, '중복 id: ' + [...new Set(dup)].join(', '));
    return ids.length + '개 id 모두 고유';
  });

  check(file + ' — 에셋 URL에 캐시 무효화 버전이 붙어 있다', () => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="((?:styles|[a-z-]+)\.(?:css|js))"/g)].map((m) => m[1]);
    assert(refs.length === 0, '버전 없는 참조: ' + refs.join(', '));
    return '모든 css/js 참조에 ?v= 포함';
  });
});

check('공유 에셋(styles.css / script.js) 버전 표기가 일관된다', () => {
  const versions = {};
  PAGES.forEach((file) => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    [...html.matchAll(/([\w-]+\.(?:css|js))\?v=([\w.-]+)/g)].forEach((m) => {
      versions[m[1]] = versions[m[1]] || new Set();
      versions[m[1]].add(m[2]);
    });
  });

  const conflicts = Object.entries(versions)
    .filter(([, set]) => set.size > 1)
    .map(([name, set]) => name + ': ' + [...set].join(' vs '));
  assert(conflicts.length === 0, '버전 불일치: ' + conflicts.join(', '));

  const shared = ['styles.css', 'script.js'].filter((name) => versions[name]);
  assert(shared.length === 2, 'styles.css / script.js 버전 표기를 찾지 못했습니다');
  return Object.entries(versions).map(([n, s]) => n + '=' + [...s][0]).join(' ');
});

/* ── 6-1. 배포 설정 ───────────────────────────────────────────────────── */
check('문의 폼이 실제 Formspree 폼 ID로 연결되어 있다', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const match = /<form[^>]*action="https:\/\/formspree\.io\/f\/([^"]+)"/.exec(html);

  assert(match, '폼 action에서 Formspree 주소를 찾지 못했습니다');
  assert(!/_/.test(match[1]),
    '폼 ID가 자리표시자(' + match[1] + ')라 문의가 메일 앱으로만 갑니다 — 대시보드 폼 ID로 바꾸세요');
  assert(match[1].length >= 6, '폼 ID가 너무 짧습니다: ' + match[1]);
  return 'formspree.io/f/' + match[1];
});

/* ── 7. 데이터 구조 ───────────────────────────────────────────────────── */
check('CSS에 없는 클래스를 화면에 쓰지 않는다', () => {
  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const defined = (name) => new RegExp('\\.' + name.replace(/[^\w-]/g, '') + '(?![\\w-])').test(css);

  const problems = [];

  /* 1) HTML에 적힌 클래스 */
  PAGES.forEach((file) => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const used = new Set();
    [...html.matchAll(/class="([^"]+)"/g)].forEach((m) => {
      m[1].split(/\s+/).forEach((c) => c && used.add(c));
    });
    used.forEach((c) => { if (!defined(c)) problems.push(file + ' .' + c); });
  });

  assert(problems.length === 0, '스타일 없음: ' + [...new Set(problems)].join(', '));
  return 'HTML 클래스 모두 정의됨';
});

/* ── 결과 ─────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));

console.log('\n  스모크 테스트 — ' + path.basename(ROOT) + '\n');
results.forEach(([status, name, detail]) => {
  console.log((status === 'PASS' ? '  ✓' : '  ✗') + ' ' + pad(name, 56) + (detail || ''));
});
console.log('\n  ' + (results.length - failures) + '/' + results.length + ' 통과\n');

process.exit(failures ? 1 : 0);
