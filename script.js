/* MonsterLab — interactions: language toggle, mobile nav, misc */
(function () {
  'use strict';

  /* ── i18n ───────────────────────────────────────────────────────────── */
  var I18N = {
    ko: {
      'nav.about': '소개',
      'nav.services': '서비스',
      'nav.roadmap': '로드맵',
      'nav.contact': '문의',

      'hero.badge': '실험실에서 막 나온 서비스들',
      'hero.title': '작은 아이디어를<br /><span class="accent">괴물 같은 서비스</span>로.',
      'hero.subtitle': 'MonsterLab는 학습부터 도구까지, 사람들이 매일 쓰는 서비스를 만듭니다. 지금 <strong>toeic.monster</strong>를 운영하고 있고, 더 많은 실험을 준비 중입니다.',
      'hero.ctaPrimary': '서비스 둘러보기',
      'hero.ctaSecondary': 'toeic.monster 바로가기',

      'stats.live': '운영 중인 서비스',
      'stats.lab': '실험 중인 서비스',
      'stats.ideas': '다음 아이디어',

      'about.kicker': 'ABOUT THE LAB',
      'about.title': '작게 시작해서, 오래 쓰이는 것을 만듭니다',
      'about.lead': 'MonsterLab는 하나의 팀이 여러 개의 작은 서비스를 실험하는 곳입니다. 거창한 플랫폼보다, 매일 열어보게 되는 실용적인 도구를 먼저 만듭니다.',
      'about.v1.title': '빠르게 실험',
      'about.v1.body': '완벽한 기획보다 빠른 출시를 택합니다. 써보고, 고치고, 다시 내놓습니다.',
      'about.v2.title': '실용적인 문제',
      'about.v2.body': '공부, 시험, 일상의 반복 작업처럼 누구나 겪는 불편을 서비스로 풉니다.',
      'about.v3.title': '서로 연결되는 제품',
      'about.v3.body': '각 서비스는 따로 시작하지만, 같은 .monster 패밀리로 이어집니다.',

      'services.kicker': 'SERVICES',
      'services.title': '지금 쓸 수 있는 것, 곧 나올 것',
      'services.lead': '운영 중인 서비스는 바로 사용할 수 있습니다. 준비 중인 서비스는 출시되면 이곳에서 알려드립니다.',

      'status.live': '운영 중',
      'status.soon': '준비 중',
      'service.toeic.desc': '토익 학습을 더 가볍게. 문제 풀이와 오답 관리로 점수를 끌어올리는 영어 시험 학습 서비스.',
      'service.visit': '사이트 방문',
      'service.soonCta': '곧 공개됩니다',
      'service.s1.name': '새로운 학습 서비스',
      'service.s1.desc': '시험 대비를 넘어 매일 짧게 이어가는 학습 루틴을 만들고 있습니다.',
      'service.s2.name': '생산성 도구',
      'service.s2.desc': '반복되는 작업을 줄여주는 작은 웹 도구를 실험하고 있습니다.',
      'service.s3.name': '다음 실험',
      'service.s3.desc': '아직 이름을 붙이지 못한 아이디어를 다듬는 중입니다. 기대해 주세요.',

      'roadmap.kicker': 'ROADMAP',
      'roadmap.title': '실험실 타임라인',
      'roadmap.i1.date': 'Now',
      'roadmap.i1.title': 'toeic.monster 운영',
      'roadmap.i1.body': '토익 학습 서비스를 운영하며 사용자 피드백을 쌓고 있습니다.',
      'roadmap.i2.date': 'Next',
      'roadmap.i2.title': '두 번째 서비스 출시',
      'roadmap.i2.body': '학습과 도구 영역으로 실험을 넓힙니다.',
      'roadmap.i3.date': 'Later',
      'roadmap.i3.title': '.monster 패밀리 확장',
      'roadmap.i3.body': '서로 연결되는 여러 서비스를 하나의 생태계로 묶습니다.',

      'contact.title': '함께 만들 아이디어가 있나요?',
      'contact.lead': '제휴, 피드백, 버그 제보 모두 환영합니다. 편하게 메일을 보내주세요.',
      'contact.cta': '메일 보내기',

      'footer.rights': '모든 권리 보유.'
    },

    en: {
      'nav.about': 'About',
      'nav.services': 'Services',
      'nav.roadmap': 'Roadmap',
      'nav.contact': 'Contact',

      'hero.badge': 'Fresh out of the lab',
      'hero.title': 'Small ideas into<br /><span class="accent">monster services</span>.',
      'hero.subtitle': 'MonsterLab builds services people open every day — from studying to everyday tools. We run <strong>toeic.monster</strong> today, with more experiments on the way.',
      'hero.ctaPrimary': 'Explore services',
      'hero.ctaSecondary': 'Visit toeic.monster',

      'stats.live': 'Live service',
      'stats.lab': 'In the lab',
      'stats.ideas': 'Next ideas',

      'about.kicker': 'ABOUT THE LAB',
      'about.title': 'Start small. Build things that last.',
      'about.lead': 'MonsterLab is one team running many small services. We care less about grand platforms and more about practical tools you actually reopen tomorrow.',
      'about.v1.title': 'Ship fast',
      'about.v1.body': 'We choose a quick release over a perfect plan. Use it, fix it, ship it again.',
      'about.v2.title': 'Real problems',
      'about.v2.body': 'Studying, exams, repetitive daily work — we turn everyday friction into products.',
      'about.v3.title': 'Connected products',
      'about.v3.body': 'Each service starts on its own, then grows into the same .monster family.',

      'services.kicker': 'SERVICES',
      'services.title': 'What you can use now, and what is next',
      'services.lead': 'Live services are ready to use right away. Coming-soon services will be announced here once they launch.',

      'status.live': 'Live',
      'status.soon': 'In progress',
      'service.toeic.desc': 'TOEIC prep made lighter. Practice questions and mistake tracking that push your score up.',
      'service.visit': 'Visit site',
      'service.soonCta': 'Coming soon',
      'service.s1.name': 'A new learning service',
      'service.s1.desc': 'Beyond test prep — we are building a short, daily learning routine.',
      'service.s2.name': 'Productivity tools',
      'service.s2.desc': 'Small web tools that remove repetitive work. Currently in the lab.',
      'service.s3.name': 'The next experiment',
      'service.s3.desc': 'An idea without a name yet. Still being sharpened. Stay tuned.',

      'roadmap.kicker': 'ROADMAP',
      'roadmap.title': 'Lab timeline',
      'roadmap.i1.date': 'Now',
      'roadmap.i1.title': 'Running toeic.monster',
      'roadmap.i1.body': 'Operating a TOEIC learning service and collecting real user feedback.',
      'roadmap.i2.date': 'Next',
      'roadmap.i2.title': 'Second service launch',
      'roadmap.i2.body': 'Expanding experiments across learning and tools.',
      'roadmap.i3.date': 'Later',
      'roadmap.i3.title': 'Growing the .monster family',
      'roadmap.i3.body': 'Bringing connected services together into one ecosystem.',

      'contact.title': 'Have an idea to build together?',
      'contact.lead': 'Partnerships, feedback, and bug reports are all welcome. Just drop us a line.',
      'contact.cta': 'Send an email',

      'footer.rights': 'All rights reserved.'
    }
  };

  var STORAGE_KEY = 'monsterlab.lang';
  var DEFAULT_LANG = 'ko';

  var langBtn = document.getElementById('langBtn');
  var langLabel = document.getElementById('langLabel');
  var htmlEl = document.documentElement;

  function applyLang(lang) {
    var dict = I18N[lang] || I18N[DEFAULT_LANG];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n')];
      if (value != null) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n-html')];
      if (value != null) el.innerHTML = value;
    });

    htmlEl.setAttribute('lang', lang);
    langLabel.textContent = lang === 'ko' ? 'EN' : 'KO';
    langBtn.setAttribute('aria-label', lang === 'ko' ? 'Switch to English' : '한국어로 전환');

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
  }

  var savedLang;
  try { savedLang = localStorage.getItem(STORAGE_KEY); } catch (e) { savedLang = null; }
  applyLang(savedLang === 'en' ? 'en' : DEFAULT_LANG);

  langBtn.addEventListener('click', function () {
    applyLang(htmlEl.getAttribute('lang') === 'ko' ? 'en' : 'ko');
  });

  /* ── Mobile nav ─────────────────────────────────────────────────────── */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');

  function closeNav() {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }

  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeNav();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ── Header shadow on scroll ────────────────────────────────────────── */
  var header = document.getElementById('siteHeader');

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Footer year ────────────────────────────────────────────────────── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
