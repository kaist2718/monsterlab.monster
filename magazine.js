/* ==========================================================================
   MonsterLab Magazine — 호(issue) 페이지 렌더링
   ==========================================================================

   데이터:  issues.js  (MAGAZINE_ISSUES)
   공통기능: script.js (테마·강조색·언어·토스트)
   이 파일은 "그리기"만 담당합니다. 문구를 바꾸려면 issues.js를 고치세요.

   저장 키 (모두 브라우저 localStorage)
     monsterlab.wordbook   저장한 단어 [{ en, ko, note, section }]
     monsterlab.progress   섹션 완료 { 'issue-01': ['quiz', ...] }
   ========================================================================== */
(function () {
  'use strict';

  var WB_KEY = 'monsterlab.wordbook';
  var PROGRESS_KEY = 'monsterlab.progress';

  var ISSUES = window.MAGAZINE_ISSUES || [];
  var ISSUE = ISSUES[0];
  var api = window.MonsterLab || {
    t: function (key) { return key; },
    toast: function () {}
  };

  var savedWords = [];
  var doneSections = [];
  var speakingBtn = null;

  /* ── 작은 도우미 ────────────────────────────────────────────────────── */
  function lang() {
    return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ko';
  }

  function t(key) { return api.t(key); }

  /* { ko, en } 형태에서 현재 언어를 고릅니다. 문자열이면 그대로. */
  function pick(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (value[lang()] != null) return value[lang()];
    return value.ko || value.en || '';
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* 본문에서 **굵게** 만 지원하는 아주 작은 서식 (내용은 우리가 쓴 것이라 안전) */
  function richText(text) {
    return String(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function elRich(tag, className, text) {
    var node = el(tag, className);
    node.innerHTML = richText(text);
    return node;
  }

  function plain(text) { return String(text).replace(/\*\*/g, ''); }

  function store(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      var value = JSON.parse(raw);
      return value == null ? fallback : value;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function isArray(value) { return Object.prototype.toString.call(value) === '[object Array]'; }

  /* ── 단어장 ─────────────────────────────────────────────────────────── */
  function loadWordbook() {
    var list = store(WB_KEY, []);
    savedWords = isArray(list) ? list.filter(function (w) { return w && w.en; }) : [];
  }

  function isSaved(en) {
    return savedWords.some(function (w) { return w.en === en; });
  }

  function toggleWord(entry) {
    if (isSaved(entry.en)) {
      savedWords = savedWords.filter(function (w) { return w.en !== entry.en; });
    } else {
      savedWords = savedWords.concat([entry]);
    }
    save(WB_KEY, savedWords);
    renderWordbook();
    updateCount();
    syncSaveButtons();
  }

  /* ── 섹션 완료 표시 ─────────────────────────────────────────────────── */
  function progressKey() { return ISSUE ? ISSUE.slug : 'issue'; }

  function loadProgress() {
    var all = store(PROGRESS_KEY, {});
    var list = all && all[progressKey()];
    doneSections = isArray(list) ? list : [];
  }

  function isDone(id) { return doneSections.indexOf(id) > -1; }

  function toggleDone(id) {
    doneSections = isDone(id)
      ? doneSections.filter(function (x) { return x !== id; })
      : doneSections.concat([id]);

    var all = store(PROGRESS_KEY, {});
    all[progressKey()] = doneSections;
    save(PROGRESS_KEY, all);

    renderToc();
    renderHeroMeta();
    syncDoneButtons();
  }

  /* ── 오디오 (브라우저 음성합성, 비용 0) ─────────────────────────────── */
  function sectionAudioText(section) {
    var parts = [];

    if (section.intro && section.intro.en) parts.push(plain(section.intro.en));
    (section.body && isArray(section.body.en) ? section.body.en : []).forEach(function (p) {
      parts.push(plain(p));
    });
    (section.items || []).forEach(function (item) { parts.push(item.en); });
    (section.dialogue || []).forEach(function (line) { parts.push(line.who + ': ' + line.en); });

    return parts.join(' ');
  }

  function setSpeaking(btn, on) {
    if (!btn) return;
    btn.classList.toggle('is-on', on);
    btn.textContent = on ? '⏹ ' + t('mag.stop') : '▶ ' + t('mag.listen');
  }

  function speak(btn, text) {
    if (!('speechSynthesis' in window)) {
      api.toast(t('mag.noAudio'));
      return;
    }

    if (speakingBtn === btn) {
      window.speechSynthesis.cancel();
      setSpeaking(btn, false);
      speakingBtn = null;
      return;
    }

    window.speechSynthesis.cancel();
    if (speakingBtn) setSpeaking(speakingBtn, false);

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;

    utterance.onend = function () {
      setSpeaking(btn, false);
      if (speakingBtn === btn) speakingBtn = null;
    };

    speakingBtn = btn;
    setSpeaking(btn, true);
    window.speechSynthesis.speak(utterance);
  }

  /* ── 호 표지 ────────────────────────────────────────────────────────── */
  function renderHero() {
    var kicker = document.getElementById('issueKicker');
    var title = document.getElementById('issueTitle');
    var summary = document.getElementById('issueSummary');

    if (kicker) {
      kicker.textContent = 'ISSUE ' + String(ISSUE.number).padStart(2, '0') + ' · ' + ISSUE.date;
    }
    if (title) title.textContent = pick(ISSUE.title);
    if (summary) summary.textContent = pick(ISSUE.summary);

    renderHeroMeta();
  }

  function renderHeroMeta() {
    var meta = document.getElementById('issueMeta');
    if (!meta) return;

    meta.textContent = '';

    function chip(label, value) {
      var li = el('li');
      li.appendChild(el('span', 'chip-label', label));
      li.appendChild(el('span', 'chip-value', value));
      meta.appendChild(li);
    }

    chip(t('mag.theme'), pick(ISSUE.theme));
    chip(t('mag.level'), ISSUE.level);
    chip(t('mag.sections'), String(ISSUE.sections.length));
    chip(t('mag.minutes'), String(ISSUE.minutes));
    chip(t('mag.progress'), doneSections.length + ' / ' + ISSUE.sections.length);
  }

  function updateCount() {
    var count = document.getElementById('wbCount');
    if (!count) return;
    count.textContent = String(savedWords.length);
    count.setAttribute('aria-label', t('mag.wordsSaved') + ' ' + savedWords.length);
  }

  /* ── 섹션 목록 (CONTENTS) ───────────────────────────────────────────── */
  function renderToc() {
    var list = document.getElementById('tocList');
    if (!list) return;

    list.textContent = '';

    ISSUE.sections.forEach(function (section, i) {
      var item = el('li', 'toc-item' + (isDone(section.id) ? ' is-done' : ''));

      var link = el('a', 'toc-link');
      link.href = '#' + section.id;

      link.appendChild(el('span', 'toc-num', String(i + 1).padStart(2, '0')));

      var body = el('span', 'toc-body');
      body.appendChild(el('span', 'toc-title', pick(section.title)));
      body.appendChild(el('span', 'toc-kind', t('mag.kind.' + section.kind)));
      link.appendChild(body);

      link.appendChild(el('span', 'toc-level', section.level));
      item.appendChild(link);
      list.appendChild(item);
    });
  }

  /* ── 섹션 하나 그리기 ───────────────────────────────────────────────── */
  function buildSection(section, index) {
    var wrap = el('section', 'section m-section' + (index % 2 ? ' section-alt' : ''));
    wrap.id = section.id;
    wrap.setAttribute('data-reveal', '');

    var inner = el('div', 'wrap');
    wrap.appendChild(inner);

    /* 머리말 */
    var head = el('div', 'm-head');
    inner.appendChild(head);

    var kicker = el('p', 'section-kicker');
    kicker.textContent = String(index + 1).padStart(2, '0') + ' · ' + t('mag.kind.' + section.kind);
    head.appendChild(kicker);

    var titleRow = el('div', 'm-title-row');
    titleRow.appendChild(el('h2', 'section-title', pick(section.title)));
    titleRow.appendChild(el('span', 'm-level', section.level));
    head.appendChild(titleRow);

    var tools = el('div', 'm-tools');

    var audioBtn = el('button', 'm-btn m-audio', '▶ ' + t('mag.listen'));
    audioBtn.type = 'button';
    audioBtn.addEventListener('click', function () {
      speak(audioBtn, sectionAudioText(section));
    });
    tools.appendChild(audioBtn);

    var doneBtn = el('button', 'm-btn m-done');
    doneBtn.type = 'button';
    doneBtn.setAttribute('data-done-for', section.id);
    doneBtn.addEventListener('click', function () { toggleDone(section.id); });
    tools.appendChild(doneBtn);

    head.appendChild(tools);

    if (section.intro) inner.appendChild(el('p', 'm-intro', pick(section.intro)));

    /* 본문 문단 */
    if (section.body) {
      var paragraphs = section.body[lang()] || section.body.ko || section.body.en || [];
      paragraphs.forEach(function (text) {
        inner.appendChild(elRich('p', 'm-body', text));
      });
    }

    /* 저장 버튼이 붙는 어휘·표현 목록 */
    if (section.items && section.items.length) {
      var items = el('ul', 'm-items');
      section.items.forEach(function (entry) {
        var li = el('li', 'm-item');

        var text = el('div', 'm-item-text');
        text.appendChild(el('span', 'm-item-en', entry.en));
        text.appendChild(el('span', 'm-item-ko', entry.ko));
        if (entry.note) text.appendChild(el('span', 'm-item-note', entry.note));
        li.appendChild(text);

        var saveBtn = el('button', 'm-btn m-save');
        saveBtn.type = 'button';
        saveBtn.setAttribute('data-save-for', entry.en);
        saveBtn.addEventListener('click', function () {
          toggleWord({
            en: entry.en,
            ko: entry.ko,
            note: entry.note || '',
            section: pick(section.title)
          });
        });
        li.appendChild(saveBtn);

        items.appendChild(li);
      });
      inner.appendChild(items);
    }

    /* 저장 버튼 없는 목록 (해설 노트) */
    if (section.bullets && section.bullets.length) {
      var bullets = el('ul', 'm-bullets');
      section.bullets.forEach(function (b) {
        bullets.appendChild(elRich('li', null, pick(b)));
      });
      inner.appendChild(bullets);
    }

    /* 대화문 */
    if (section.dialogue && section.dialogue.length) {
      var dialogue = el('div', 'm-dialogue');
      section.dialogue.forEach(function (line) {
        var row = el('div', 'm-line');
        row.appendChild(el('span', 'm-who', line.who));
        var bubble = el('div', 'm-bubble');
        bubble.appendChild(el('span', 'm-bubble-en', line.en));
        bubble.appendChild(el('span', 'm-bubble-ko', line.ko));
        row.appendChild(bubble);
        dialogue.appendChild(row);
      });
      inner.appendChild(dialogue);
    }

    /* 토론 질문 */
    if (section.questions && section.questions.length) {
      var questions = el('ol', 'm-questions');
      section.questions.forEach(function (q) {
        questions.appendChild(el('li', null, pick(q)));
      });
      inner.appendChild(questions);
    }

    /* 확인 문제 */
    if (section.quiz && section.quiz.length) {
      var quiz = el('div', 'm-quiz');
      section.quiz.forEach(function (item, qi) {
        quiz.appendChild(buildQuizItem(item, qi));
      });
      inner.appendChild(quiz);
    }

    return wrap;
  }

  function buildQuizItem(item, index) {
    var box = el('div', 'quiz-item');

    var q = elRich('p', 'quiz-q', (index + 1) + '. ' + pick(item.q));
    box.appendChild(q);

    var options = el('div', 'quiz-options');

    item.options.forEach(function (option, oi) {
      var btn = el('button', 'quiz-opt', option);
      btn.type = 'button';

      btn.addEventListener('click', function () {
        if (box.getAttribute('data-answered') === 'true') return;
        box.setAttribute('data-answered', 'true');

        var correct = oi === item.answer;
        btn.classList.add(correct ? 'is-correct' : 'is-wrong');

        if (!correct) {
          var right = options.children[item.answer];
          if (right) right.classList.add('is-correct');
        }

        box.appendChild(el(
          'p',
          'quiz-feedback ' + (correct ? 'is-correct' : 'is-wrong'),
          (correct ? t('mag.quizCorrect') : t('mag.quizWrong')) + ' — ' + pick(item.explain)
        ));
      });

      options.appendChild(btn);
    });

    box.appendChild(options);
    return box;
  }

  /* 저장/완료 버튼 상태만 갱신 (본문을 다시 그리지 않음 → 퀴즈 답 보존) */
  function syncSaveButtons() {
    var buttons = document.querySelectorAll('[data-save-for]');

    Array.prototype.forEach.call(buttons, function (btn) {
      var on = isSaved(btn.getAttribute('data-save-for'));
      btn.classList.toggle('is-on', on);
      btn.textContent = on ? '✓ ' + t('mag.saved') : '+ ' + t('mag.save');
    });
  }

  function syncDoneButtons() {
    var buttons = document.querySelectorAll('[data-done-for]');

    Array.prototype.forEach.call(buttons, function (btn) {
      var on = isDone(btn.getAttribute('data-done-for'));
      btn.classList.toggle('is-on', on);
      btn.textContent = on ? '✓ ' + t('mag.done') : '○ ' + t('mag.markDone');
    });
  }

  function renderContent() {
    var holder = document.getElementById('issueContent');
    if (!holder) return;

    holder.textContent = '';

    ISSUE.sections.forEach(function (section, i) {
      holder.appendChild(buildSection(section, i));
    });

    syncSaveButtons();
    syncDoneButtons();
    renderToc();
    applyReveal();
  }

  /* ── 단어장 그리기 ──────────────────────────────────────────────────── */
  function renderWordbook() {
    var list = document.getElementById('wbList');
    var empty = document.getElementById('wbEmpty');
    var actions = document.querySelector('.wb-actions');

    if (!list) return;

    list.textContent = '';

    if (empty) empty.hidden = savedWords.length > 0;
    if (actions) actions.hidden = savedWords.length === 0;

    savedWords.forEach(function (word) {
      var li = el('li', 'wb-item');

      var text = el('div', 'wb-text');
      text.appendChild(el('span', 'wb-en', word.en));
      text.appendChild(el('span', 'wb-ko', word.ko));
      if (word.note) text.appendChild(el('span', 'wb-note', word.note));
      if (word.section) text.appendChild(el('span', 'wb-from', word.section));
      li.appendChild(text);

      var remove = el('button', 'm-btn', '✕ ' + t('mag.remove'));
      remove.type = 'button';
      remove.addEventListener('click', function () {
        savedWords = savedWords.filter(function (w) { return w.en !== word.en; });
        save(WB_KEY, savedWords);
        renderWordbook();
        updateCount();
        syncSaveButtons();
      });
      li.appendChild(remove);

      list.appendChild(li);
    });
  }

  function wordbookText() {
    return savedWords.map(function (w) {
      return w.en + ' — ' + w.ko + (w.note ? '  (' + w.note + ')' : '');
    }).join('\n');
  }

  /* ── 스크롤 진입 애니메이션 (공통 CSS 클래스를 재사용) ───────────────── */
  var revealObserver = null;

  function applyReveal() {
    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('reveal-ready');

    /* 언어를 바꾸면 내용을 다시 그리므로 이전 관찰자는 정리합니다 */
    if (revealObserver) revealObserver.disconnect();

    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });

    var targets = document.querySelectorAll('[data-reveal]');
    Array.prototype.forEach.call(targets, function (node) {
      node.classList.add('reveal');
      revealObserver.observe(node);
    });
  }

  /* ── 시작 ───────────────────────────────────────────────────────────── */
  function init() {
    if (!ISSUE) return;

    loadWordbook();
    loadProgress();

    renderHero();
    renderContent();
    renderWordbook();
    updateCount();

    /* 언어가 바뀌면 그려진 문구도 다시 그립니다 (script.js가 보내는 이벤트) */
    document.addEventListener('langchange', function () {
      renderHero();
      renderContent();
      renderWordbook();
      updateCount();
    });

    var copyBtn = document.getElementById('wbCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = wordbookText();
        if (!text) return;

        function done() { api.toast(t('mag.wbCopied')); }
        function fallback() {
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', 'readonly');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
          document.body.removeChild(area);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else {
          fallback();
        }
      });
    }

    var clearBtn = document.getElementById('wbClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!savedWords.length) return;
        if (!window.confirm(t('mag.wbClearConfirm'))) return;

        savedWords = [];
        save(WB_KEY, savedWords);
        renderWordbook();
        updateCount();
        syncSaveButtons();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
