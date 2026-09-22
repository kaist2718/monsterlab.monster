/* MonsterLab — 페이지 공통 동작
   ==========================================================================

   구조
     1. i18n 사전
     2. 공용 API  → window.MonsterLab (magazine.js 같은 다른 페이지 스크립트가 씁니다)
     3. 언어 전환
     4. 기능별 초기화 — 모두 guard()로 격리

   왜 이렇게 나눴나:
     예전에는 모든 기능이 한 줄기로 실행됐습니다. 그래서 테마 초기화가 예외로
     죽으면 그 뒤에 있던 언어 버튼 리스너도 함께 죽어, "테마 아이콘이 안 보이고
     언어 전환도 안 되는" 증상이 한 번에 나타났습니다. 이제 기능 하나가 실패해도
     나머지는 그대로 동작하고, 실패한 기능만 콘솔에 남습니다.
   ========================================================================== */
(function () {
  'use strict';

  /* ── 1. i18n 사전 ───────────────────────────────────────────────────── */
  var I18N = {
    ko: {
      'nav.about': '소개',
      'nav.services': '서비스',
      'nav.roadmap': '로드맵',
      'nav.faq': 'FAQ',
      'nav.contact': '문의',

      'hero.badge': '실험실에서 막 나온 서비스들',
      'hero.title': '작은 아이디어를<br /><span class="accent">괴물 같은 서비스</span>로.',
      'hero.subtitle': 'MonsterLab는 학습부터 도구까지, 사람들이 매일 쓰는 서비스를 만듭니다. 지금 <strong>toeic.monster</strong>를 운영하고 있고, 더 많은 실험을 준비 중입니다.',
      'hero.ctaPrimary': '서비스 둘러보기',
      'hero.ctaSecondary': 'toeic.monster 바로가기',
      'preview.caption': 'toeic.monster 학습 화면 미리보기',

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
      'service.mag.name': '월간 영어 매거진',
      'service.mag.desc': '호(issue) 단위로 읽는 영어 매거진. 테마 어휘·문법·이디엄·대화·확인 문제를 오디오와 함께 한 호에 담습니다.',
      'service.mag.cta': '1호 템플릿 보기',
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

      'faq.kicker': 'FAQ',
      'faq.title': '자주 받는 질문',
      'faq.lead': '찾는 답이 없으면 아래 주소로 편하게 물어보세요.',
      'faq.q1': '서비스는 무료인가요?',
      'faq.a1': 'toeic.monster의 핵심 학습 기능은 무료로 사용할 수 있습니다. 꼭 필요한 추가 기능만 합리적인 가격의 유료 옵션으로 검토합니다.',
      'faq.q2': '어떤 기술로 만드나요?',
      'faq.a2': '웹 표준 기술(HTML·CSS·JavaScript)을 기본으로 하고, 서버가 필요한 곳에만 가벼운 백엔드를 붙입니다. 페이지가 빠르게 뜨도록 항상 가볍게 유지합니다.',
      'faq.q3': '제휴나 협업을 제안하고 싶어요.',
      'faq.a3': '언제든 환영합니다. 간단한 소개와 함께 메일을 보내주시면 영업일 기준 2~3일 안에 답장드립니다.',
      'faq.q4': '버그 신고나 기능 제안은 어디로 보내나요?',
      'faq.a4': '아래 문의 폼이나 메일로 보내주세요. 재현 방법이나 스크린샷을 함께 주시면 훨씬 빠르게 고칠 수 있습니다.',
      'faq.q5': '새 서비스는 언제 공개되나요?',
      'faq.a5': '출시가 확정되면 이 페이지의 서비스 섹션과 로드맵에서 가장 먼저 알립니다.',

      'contact.kicker': 'CONTACT',
      'contact.title': '함께 만들 아이디어가 있나요?',
      'contact.lead': '제휴, 피드백, 버그 제보 모두 환영합니다. 아래에서 편한 방식을 골라주세요.',
      'contact.intentLabel': '문의 유형',
      'contact.intentGeneral': '일반 문의',
      'contact.intentBug': '버그 제보',
      'contact.intentPartner': '제휴 제안',
      'contact.subject.general': 'MonsterLab 문의',
      'contact.subject.bug': 'MonsterLab 버그 제보',
      'contact.subject.partner': 'MonsterLab 제휴 제안',
      'contact.replyTime': '보통 영업일 기준 2~3일 안에 답장드립니다.',
      'contact.mailLabel': '이메일',
      'contact.copy': '주소 복사',
      'contact.copied': '이메일 주소를 복사했습니다',
      'contact.copyFailed': '복사하지 못했습니다. 주소를 직접 선택해 주세요',

      'form.name': '이름',
      'form.namePh': '홍길동',
      'form.email': '답장 받을 이메일',
      'form.message': '내용',
      'form.messagePh': '어떤 이야기든 좋습니다. 버그라면 재현 방법을 적어 주세요.',
      'form.sendMailApp': '메일 앱으로 보내기',
      'form.sendGmail': 'Gmail로 보내기',
      'form.copyBody': '본문 복사',
      'form.bodyCopied': '메일 본문을 복사했습니다',
      'form.preview': '보낼 내용 미리보기',
      'form.hint': '메일 앱이 없다면 Gmail로 보내기나 본문 복사를 쓰면 됩니다.',
      'form.needName': '이름을 입력해 주세요.',
      'form.needEmail': '이메일 주소를 확인해 주세요.',
      'form.needMessage': '내용을 입력해 주세요.',
      'form.opened': '메일 앱을 여는 중입니다',

      'top.back': '맨 위로',
      'theme.dark': '다크',
      'theme.light': '라이트',
      'theme.system': '시스템',
      'theme.group': '테마 선택',
      'theme.setDark': '다크 모드로 보기',
      'theme.setLight': '라이트 모드로 보기',
      'theme.setSystem': '시스템 설정 따르기',

      'footer.themeLabel': '테마',
      'footer.accentLabel': '강조색',
      'accent.group': '강조색 선택',
      'accent.mint': '민트',
      'accent.violet': '바이올렛',
      'accent.ocean': '오션',
      'accent.amber': '앰버',

      'mag.navIssue': '1호',
      'mag.navSections': '섹션',
      'mag.navWords': '단어장',
      'mag.navHome': '홈',
      'mag.startReading': '1호 읽기',
      'mag.openWordbook': '단어장',
      'mag.draftNotice': '이 페이지는 1호 템플릿(초안)입니다. 문장과 섹션 구성은 예시이고, 새 호를 추가하려면 issues.js만 고치면 됩니다.',
      'mag.tocKicker': 'CONTENTS',
      'mag.tocTitle': '이번 호의 섹션',
      'mag.tocLead': '섹션별로 듣고, 읽고, 모르는 단어는 단어장에 담아두세요. 진행 상황은 이 브라우저에 저장됩니다.',
      'mag.wbKicker': 'WORDBOOK',
      'mag.wbTitle': '저장한 단어',
      'mag.wbLead': '저장한 표현은 이 브라우저에 남습니다. 나중에 복사해 노트 앱이나 학습 앱으로 옮기세요.',
      'mag.wbEmpty': '아직 저장한 단어가 없습니다.',
      'mag.wbCopy': '전체 복사',
      'mag.wbClear': '비우기',
      'mag.wbCopied': '단어장을 복사했습니다',
      'mag.wbClearConfirm': '저장한 단어를 모두 지울까요?',
      'mag.progressLabel': '읽기 진행',
      'mag.minSuffix': '분',
      'mag.rateLabel': '듣기 속도',
      'mag.rateGroup': '듣기 속도 선택',
      'mag.rateSaved': '듣기 속도를 바꿨습니다',
      'mag.resume': '이어서 읽기',
      'mag.nextSection': '다음 섹션',
      'mag.nextNote': '보통 영업일 기준 2~3일 안에 답장드립니다.',
      'mag.nextTitle': '다음 호가 나오면 알려드릴까요?',
      'mag.nextLead': '새 호 소식과 피드백은 모두 같은 메일로 받습니다. 원하는 주제가 있으면 함께 적어 보내주세요.',
      'mag.subscribe': '메일 보내기',
      'mag.theme': '테마',
      'mag.level': '레벨',
      'mag.sections': '섹션',
      'mag.minutes': '분',
      'mag.listen': '듣기',
      'mag.stop': '정지',
      'mag.noAudio': '이 브라우저에서는 오디오를 재생할 수 없습니다',
      'mag.save': '단어장에 저장',
      'mag.saved': '저장됨',
      'mag.markDone': '완료 표시',
      'mag.done': '완료됨',
      'mag.remove': '빼기',
      'mag.quizCorrect': '정답입니다',
      'mag.quizWrong': '다시 보세요',
      'mag.kind.vocabulary': '어휘',
      'mag.kind.grammar': '문법',
      'mag.kind.idioms': '이디엄',
      'mag.kind.natural': '자연스러운 표현',
      'mag.kind.conversation': '회화',
      'mag.kind.discussion': '토론',
      'mag.kind.culture': '문화',
      'mag.kind.quiz': '확인 문제',
      'mag.kind.humor': '유머',
      'mag.kind.note': '해설 노트',

      'page.title': 'MonsterLab — 작은 아이디어를 괴물 같은 서비스로',
      'page.desc': 'MonsterLab는 학습부터 도구까지, 사람들이 매일 쓰는 서비스를 만듭니다. 지금 toeic.monster를 운영 중입니다.',
      'mag.pageTitle': '1호 · 월간 영어 매거진 — MonsterLab',
      'mag.pageDesc': '여행 영어를 테마로 한 1호. 어휘·문법·이디엄·대화·확인 문제를 오디오와 함께 읽는 월간 영어 매거진.',

      'footer.rights': '모든 권리 보유.'
    },

    en: {
      'nav.about': 'About',
      'nav.services': 'Services',
      'nav.roadmap': 'Roadmap',
      'nav.faq': 'FAQ',
      'nav.contact': 'Contact',

      'hero.badge': 'Fresh out of the lab',
      'hero.title': 'Small ideas into<br /><span class="accent">monster services</span>.',
      'hero.subtitle': 'MonsterLab builds services people open every day — from studying to everyday tools. We run <strong>toeic.monster</strong> today, with more experiments on the way.',
      'hero.ctaPrimary': 'Explore services',
      'hero.ctaSecondary': 'Visit toeic.monster',
      'preview.caption': 'A look at the toeic.monster study screen',

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
      'service.mag.name': 'Monthly English magazine',
      'service.mag.desc': 'An English magazine read one issue at a time — theme vocabulary, grammar, idioms, dialogues and a quiz, with audio in every issue.',
      'service.mag.cta': 'See the issue 1 template',
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

      'faq.kicker': 'FAQ',
      'faq.title': 'Questions we get a lot',
      'faq.lead': 'Nothing here? Just write to the address below.',
      'faq.q1': 'Is the service free?',
      'faq.a1': 'The core study features of toeic.monster are free to use. Only genuinely optional extras would ever be considered as fairly priced paid options.',
      'faq.q2': 'What is it built with?',
      'faq.a2': 'Plain web standards — HTML, CSS, and JavaScript — with a light backend only where a server is actually needed. We keep pages fast and lean on purpose.',
      'faq.q3': 'I would like to propose a partnership.',
      'faq.a3': 'Always welcome. Send a short introduction and we will reply within two to three business days.',
      'faq.q4': 'Where do I report a bug or suggest a feature?',
      'faq.a4': 'Use the form below or just email us. Steps to reproduce or a screenshot help us fix things much faster.',
      'faq.q5': 'When will the next service launch?',
      'faq.a5': 'Once a launch date is confirmed, the services section and roadmap on this page are the first places we announce it.',

      'contact.kicker': 'CONTACT',
      'contact.title': 'Have an idea to build together?',
      'contact.lead': 'Partnerships, feedback, and bug reports are all welcome. Pick whichever way suits you.',
      'contact.intentLabel': 'Type of enquiry',
      'contact.intentGeneral': 'General',
      'contact.intentBug': 'Bug report',
      'contact.intentPartner': 'Partnership',
      'contact.subject.general': 'MonsterLab enquiry',
      'contact.subject.bug': 'MonsterLab bug report',
      'contact.subject.partner': 'MonsterLab partnership proposal',
      'contact.replyTime': 'We usually reply within two to three business days.',
      'contact.mailLabel': 'Email',
      'contact.copy': 'Copy address',
      'contact.copied': 'Email address copied',
      'contact.copyFailed': 'Copy failed — please select the address manually',

      'form.name': 'Name',
      'form.namePh': 'Jane Doe',
      'form.email': 'Email to reply to',
      'form.message': 'Message',
      'form.messagePh': 'Anything at all. For a bug, tell us how to reproduce it.',
      'form.sendMailApp': 'Open in mail app',
      'form.sendGmail': 'Open in Gmail',
      'form.copyBody': 'Copy the message',
      'form.bodyCopied': 'Message copied',
      'form.preview': 'What will be sent',
      'form.hint': 'No mail app? Use Gmail or copy the message instead.',
      'form.needName': 'Please enter your name.',
      'form.needEmail': 'Please check your email address.',
      'form.needMessage': 'Please enter a message.',
      'form.opened': 'Opening your mail app',

      'top.back': 'Back to top',
      'theme.dark': 'Dark',
      'theme.light': 'Light',
      'theme.system': 'System',
      'theme.group': 'Choose a theme',
      'theme.setDark': 'Use dark mode',
      'theme.setLight': 'Use light mode',
      'theme.setSystem': 'Follow the system setting',

      'footer.themeLabel': 'Theme',
      'footer.accentLabel': 'Accent',
      'accent.group': 'Choose an accent color',
      'accent.mint': 'Mint',
      'accent.violet': 'Violet',
      'accent.ocean': 'Ocean',
      'accent.amber': 'Amber',

      'mag.navIssue': 'Issue 1',
      'mag.navSections': 'Sections',
      'mag.navWords': 'Wordbook',
      'mag.navHome': 'Home',
      'mag.startReading': 'Start reading',
      'mag.openWordbook': 'Wordbook',
      'mag.draftNotice': 'This page is the issue 1 template (draft). The wording and sections are samples — to add a new issue, edit issues.js only.',
      'mag.tocKicker': 'CONTENTS',
      'mag.tocTitle': 'Sections in this issue',
      'mag.tocLead': 'Listen, read, and save the words you do not know. Your progress is stored in this browser.',
      'mag.wbKicker': 'WORDBOOK',
      'mag.wbTitle': 'Saved words',
      'mag.wbLead': 'Saved expressions stay in this browser. Copy them later into your notes or study app.',
      'mag.wbEmpty': 'No saved words yet.',
      'mag.wbCopy': 'Copy all',
      'mag.wbClear': 'Clear',
      'mag.wbCopied': 'Wordbook copied',
      'mag.wbClearConfirm': 'Remove every saved word?',
      'mag.progressLabel': 'Reading progress',
      'mag.minSuffix': ' min',
      'mag.rateLabel': 'Listening speed',
      'mag.rateGroup': 'Choose the listening speed',
      'mag.rateSaved': 'Listening speed updated',
      'mag.resume': 'Continue',
      'mag.nextSection': 'Next section',
      'mag.nextNote': 'We usually reply within two to three business days.',
      'mag.nextTitle': 'Want to hear about the next issue?',
      'mag.nextLead': 'New issues and feedback both land in the same inbox. Tell us which topics you want.',
      'mag.subscribe': 'Send an email',
      'mag.theme': 'Theme',
      'mag.level': 'Level',
      'mag.sections': 'sections',
      'mag.minutes': 'min',
      'mag.listen': 'Listen',
      'mag.stop': 'Stop',
      'mag.noAudio': 'This browser cannot play the audio',
      'mag.save': 'Save word',
      'mag.saved': 'Saved',
      'mag.markDone': 'Mark done',
      'mag.done': 'Done',
      'mag.remove': 'Remove',
      'mag.quizCorrect': 'Correct',
      'mag.quizWrong': 'Try again',
      'mag.kind.vocabulary': 'Vocabulary',
      'mag.kind.grammar': 'Grammar',
      'mag.kind.idioms': 'Idioms',
      'mag.kind.natural': 'Natural English',
      'mag.kind.conversation': 'Conversation',
      'mag.kind.discussion': 'Discussion',
      'mag.kind.culture': 'Culture',
      'mag.kind.quiz': 'Quiz',
      'mag.kind.humor': 'Humour',
      'mag.kind.note': 'Notes',

      'page.title': 'MonsterLab — Small ideas into monster services',
      'page.desc': 'MonsterLab builds services people open every day. We run toeic.monster today, with more experiments on the way.',
      'mag.pageTitle': 'Issue 1 · Monthly English magazine — MonsterLab',
      'mag.pageDesc': 'Issue 1 on travel English: vocabulary, grammar, idioms, dialogue and a quiz, read alongside audio.',

      'footer.rights': 'All rights reserved.'
    }
  };

  var STORAGE_KEY = 'monsterlab.lang';
  var DEFAULT_LANG = 'ko';
  var EMAIL = 'kaist2718@gmail.com';

  var htmlEl = document.documentElement;
  var langBtn = document.getElementById('langBtn');
  var langLabel = document.getElementById('langLabel');
  var titleKey = htmlEl.getAttribute('data-title-key');
  var descKey = htmlEl.getAttribute('data-desc-key');

  function currentLang() {
    var lang = htmlEl.getAttribute('lang');
    return I18N[lang] ? lang : DEFAULT_LANG;
  }

  function currentDict() {
    return I18N[currentLang()] || I18N[DEFAULT_LANG];
  }

  /* 키가 없으면 키 이름을 그대로 돌려줍니다 — 화면에서 누락을 바로 알아챌 수 있게.
     magazine.js가 이 함수를 쓰므로, 다른 초기화보다 먼저 준비해야 합니다. */
  function t(key, lang) {
    var dict = I18N[lang] || currentDict();
    return dict[key] != null ? dict[key] : key;
  }

  var toastEl = document.getElementById('toast');
  var toastTimer;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  /* ── 2. 공용 API ─────────────────────────────────────────────────────
     먼저 노출합니다. 아래 기능 초기화가 실패해도 magazine.js는 이 API를
     찾을 수 있습니다(없으면 화면에 'mag.listen' 같은 키 이름이 그대로 나옵니다). */
  window.MonsterLab = {
    t: t,
    toast: showToast,
    lang: currentLang,
    dict: currentDict
  };

  /* ── 3. 공용 유틸 ──────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function on(el, type, handler, options) {
    if (el && el.addEventListener) el.addEventListener(type, handler, options);
  }

  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; } /* 시크릿 모드 */
  }

  function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 시크릿 모드 */ }
  }

  /* 기능 하나가 예외로 죽어도 나머지 기능과 언어 전환은 계속 동작하게 합니다. */
  function guard(name, init) {
    try {
      init();
    } catch (err) {
      if (window.console && console.error) {
        console.error('[MonsterLab] ' + name + ' 초기화 실패:', err);
      }
    }
  }

  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── 4. 언어 전환 ──────────────────────────────────────────────────── */
  function applyLang(lang) {
    var dict = I18N[lang] || I18N[DEFAULT_LANG];

    $$('[data-i18n]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n')];
      if (value != null) el.textContent = value;
    });

    $$('[data-i18n-html]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n-html')];
      if (value != null) el.innerHTML = value;
    });

    $$('[data-i18n-placeholder]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n-placeholder')];
      if (value != null) el.setAttribute('placeholder', value);
    });

    $$('[data-i18n-aria-label]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n-aria-label')];
      if (value != null) el.setAttribute('aria-label', value);
    });

    /* 탭 제목과 설명도 함께 바꿔 영어 사용자에게 맞춥니다.
       어떤 페이지인지는 <html data-title-key="..."> 가 알려줍니다. */
    if (titleKey && dict[titleKey]) document.title = dict[titleKey];

    if (descKey && dict[descKey]) {
      var descEl = document.querySelector('meta[name="description"]');
      if (descEl) descEl.setAttribute('content', dict[descKey]);
    }

    var hintEl = $('formHint');
    if (hintEl) hintEl.classList.remove('is-error');

    htmlEl.setAttribute('lang', lang);
    if (langLabel) langLabel.textContent = lang === 'ko' ? 'EN' : 'KO';
    if (langBtn) {
      langBtn.setAttribute('aria-label', lang === 'ko' ? 'Switch to English' : '한국어로 전환');
    }

    writeStore(STORAGE_KEY, lang);

    /* 다른 페이지 스크립트(magazine.js)가 그려놓은 문구도 다시 그리도록 알립니다 */
    if (typeof window.CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
    }
  }

  applyLang(readStore(STORAGE_KEY) === 'en' ? 'en' : DEFAULT_LANG);

  on(langBtn, 'click', function () {
    applyLang(currentLang() === 'ko' ? 'en' : 'ko');
  });

  on(document, 'keydown', function (e) {
    /* 언어 전환 단축키: Alt + L (한/영 어느 쪽에서도 동작) */
    if (e.altKey && (e.key === 'l' || e.key === 'L')) {
      applyLang(currentLang() === 'ko' ? 'en' : 'ko');
    }
  });

  /* ── 5. 테마 (라이트 / 다크 / 시스템) ──────────────────────────────── */
  guard('테마', function () {
    var THEME_KEY = 'monsterlab.theme';
    var THEME_MODES = ['light', 'dark', 'system'];
    var THEME_COLORS = { dark: '#0a0e13', light: '#fbfcfd' };
    var THEME_LABEL_KEYS = { light: 'theme.light', dark: 'theme.dark', system: 'theme.system' };
    var THEME_ACTION_KEYS = { light: 'theme.setLight', dark: 'theme.setDark', system: 'theme.setSystem' };

    var themeOptionBtns = $$('[data-theme-option]');
    var footerTheme = $('footerTheme');
    var themeColorMeta = document.querySelector('meta[name="theme-color"]');

    function systemTheme() {
      return (window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }

    /* 인라인 스크립트가 첫 페인트 전에 심어둔 모드. 없으면 시스템 */
    function currentMode() {
      var mode = htmlEl.getAttribute('data-theme-mode');
      return THEME_MODES.indexOf(mode) !== -1 ? mode : 'system';
    }

    function applyTheme(mode, persist) {
      var theme = mode === 'system' ? systemTheme() : mode;
      var dict = currentDict();

      htmlEl.setAttribute('data-theme-mode', mode);
      htmlEl.setAttribute('data-theme', theme);

      /* 헤더와 모바일 메뉴의 버튼이 항상 같은 선택 상태를 보여줍니다 */
      themeOptionBtns.forEach(function (btn) {
        var option = btn.getAttribute('data-theme-option');
        var action = dict[THEME_ACTION_KEYS[option]];

        btn.setAttribute('aria-pressed', option === mode ? 'true' : 'false');
        btn.setAttribute('aria-label', action);
        btn.setAttribute('title', action);
      });

      if (footerTheme && THEME_LABEL_KEYS[mode]) footerTheme.textContent = dict[THEME_LABEL_KEYS[mode]];
      if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_COLORS[theme]);

      if (persist) writeStore(THEME_KEY, mode);
    }

    /* 버튼은 HTML에 있습니다(스크립트가 채우지 않음) — 스크립트가 멈춰도
       선택지는 화면에 보입니다. 순환식이 아니라 선택식이라, 시스템 모드에서
       색이 그대로인 순간에도 어느 모드를 골랐는지 눈에 보입니다. */
    themeOptionBtns.forEach(function (btn) {
      on(btn, 'click', function () {
        applyTheme(btn.getAttribute('data-theme-option'), true);
      });
    });

    document.addEventListener('langchange', function () { applyTheme(currentMode()); });

    /* 인라인 스크립트가 정한 값을 UI에 반영 (저장은 하지 않음) */
    applyTheme(currentMode());

    /* '시스템' 모드일 때는 OS 설정이 바뀌면 바로 따라갑니다 */
    if (window.matchMedia) {
      var schemeQuery = window.matchMedia('(prefers-color-scheme: light)');
      var onSchemeChange = function () {
        if (currentMode() === 'system') applyTheme('system');
      };

      if (schemeQuery.addEventListener) schemeQuery.addEventListener('change', onSchemeChange);
      else if (schemeQuery.addListener) schemeQuery.addListener(onSchemeChange);
    }
  });

  /* ── 6. 강조색 프리셋 ──────────────────────────────────────────────── */
  guard('강조색', function () {
    var ACCENT_KEY = 'monsterlab.accent';
    var ACCENT_NAMES = ['mint', 'violet', 'ocean', 'amber'];
    var swatchBtns = $$('.swatch');

    function currentAccent() {
      var name = htmlEl.getAttribute('data-accent');
      return ACCENT_NAMES.indexOf(name) !== -1 ? name : 'mint';
    }

    function applyAccent(name, persist) {
      var dict = currentDict();

      htmlEl.setAttribute('data-accent', name);

      swatchBtns.forEach(function (btn) {
        var label = dict['accent.' + btn.getAttribute('data-accent')];
        var active = btn.getAttribute('data-accent') === name;

        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (persist) writeStore(ACCENT_KEY, name);
    }

    swatchBtns.forEach(function (btn) {
      on(btn, 'click', function () {
        applyAccent(btn.getAttribute('data-accent'), true);
      });
    });

    document.addEventListener('langchange', function () { applyAccent(currentAccent()); });

    /* 인라인 스크립트가 정한 프리셋을 UI에 반영 (저장은 하지 않음) */
    applyAccent(currentAccent());
  });

  /* ── 7. 모바일 메뉴 ────────────────────────────────────────────────── */
  guard('모바일 메뉴', function () {
    var menuBtn = $('menuBtn');
    var nav = $('nav');

    if (!menuBtn || !nav) return;

    function closeNav() {
      nav.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }

    on(menuBtn, 'click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });

    on(nav, 'click', function (e) {
      if (e.target && e.target.tagName === 'A') closeNav();
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  });

  /* ── 8. 복사 (클립보드) ────────────────────────────────────────────── */
  function copyToClipboard(text, message) {
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();

      var copied = false;
      try { copied = document.execCommand('copy'); } catch (err) { copied = false; }

      document.body.removeChild(area);
      showToast(copied ? message : currentDict()['contact.copyFailed']);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { showToast(message); },
        fallback
      );
    } else {
      fallback();
    }
  }

  guard('주소 복사', function () {
    var copyMailBtn = $('copyMailBtn');
    if (!copyMailBtn) return;

    on(copyMailBtn, 'click', function () {
      copyToClipboard(EMAIL, currentDict()['contact.copied']);
    });
  });

  /* ── 9. 문의 폼 ────────────────────────────────────────────────────── */
  guard('문의 폼', function () {
    var form = $('contactForm');
    if (!form) return;

    var MAX_MESSAGE = 2000;
    var nameEl = $('cfName');
    var emailEl = $('cfEmail');
    var msgEl = $('cfMsg');
    var countEl = $('cfCount');
    var preview = $('mailPreview');
    var previewSubject = $('mailPreviewSubject');
    var previewBody = $('mailPreviewBody');
    var intentTabs = $$('.intent-tab');
    var gmailBtn = $('sendGmailBtn');
    var copyBodyBtn = $('copyBodyBtn');
    var activeIntent = 'general';

    if (!nameEl || !emailEl || !msgEl) return;

    msgEl.setAttribute('maxlength', String(MAX_MESSAGE));

    function showError(id, message) {
      var box = $(id);
      if (!box) return;
      box.textContent = message || '';
      box.hidden = !message;
    }

    function validEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function composedMail() {
      var dict = currentDict();
      var name = nameEl.value.trim();
      var email = emailEl.value.trim();
      var subject = dict['contact.subject.' + activeIntent] + (name ? ' — ' + name : '');
      var lines = [];

      if (name) lines.push(dict['form.name'] + ': ' + name);
      if (email) lines.push(dict['form.email'] + ': ' + email);
      if (lines.length) lines.push('');
      lines.push(msgEl.value.trim());

      return { subject: subject, body: lines.join('\n') };
    }

    function validate() {
      var dict = currentDict();
      var ok = true;

      showError('cfNameErr', '');
      showError('cfEmailErr', '');
      showError('cfMsgErr', '');

      if (!nameEl.value.trim()) { showError('cfNameErr', dict['form.needName']); ok = false; }
      if (!validEmail(emailEl.value.trim())) { showError('cfEmailErr', dict['form.needEmail']); ok = false; }
      if (!msgEl.value.trim()) { showError('cfMsgErr', dict['form.needMessage']); ok = false; }

      if (!ok) {
        var firstError = form.querySelector('.field-error:not([hidden])');
        if (firstError) {
          var field = firstError.parentNode &&
            firstError.parentNode.querySelector('input, textarea');
          if (field && field.focus) field.focus();
        }
      }

      return ok;
    }

    function syncPreview() {
      if (!preview) return;

      var mail = composedMail();
      var hasInput = !!(nameEl.value.trim() || msgEl.value.trim());

      preview.hidden = !hasInput;
      if (!hasInput) return;
      if (previewSubject) previewSubject.textContent = mail.subject;
      if (previewBody) previewBody.textContent = mail.body;
    }

    function updateCount() {
      if (countEl) countEl.textContent = msgEl.value.length + ' / ' + MAX_MESSAGE;
    }

    intentTabs.forEach(function (tab) {
      on(tab, 'click', function () {
        activeIntent = tab.getAttribute('data-intent');
        intentTabs.forEach(function (other) {
          var active = other === tab;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        syncPreview();
      });
    });

    [nameEl, emailEl, msgEl].forEach(function (field) {
      on(field, 'input', function () {
        updateCount();
        syncPreview();
      });
    });

    /* 1) 기본 메일 앱 */
    on(form, 'submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      var mail = composedMail();
      window.location.href = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent(mail.subject) +
        '&body=' + encodeURIComponent(mail.body);

      showToast(currentDict()['form.opened']);
    });

    /* 2) Gmail 새 창 (메일 앱이 없는 환경) */
    on(gmailBtn, 'click', function () {
      if (!validate()) return;

      var mail = composedMail();
      window.open(
        'https://mail.google.com/mail/?view=cm&fs=1' +
        '&to=' + encodeURIComponent(EMAIL) +
        '&su=' + encodeURIComponent(mail.subject) +
        '&body=' + encodeURIComponent(mail.body),
        '_blank',
        'noopener'
      );
    });

    /* 3) 본문 복사 (어디에든 붙여넣기) */
    on(copyBodyBtn, 'click', function () {
      if (!validate()) return;

      var mail = composedMail();
      copyToClipboard(mail.subject + '\n\n' + mail.body, currentDict()['form.bodyCopied']);
    });

    updateCount();
  });

  /* ── 10. 스크롤 등장 ───────────────────────────────────────────────── */
  guard('스크롤 등장', function () {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var targets = $$('.card, .service, .timeline > li, .faq, .preview-window');
    if (!targets.length) return;

    document.documentElement.classList.add('reveal-ready');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i % 4) * 70) + 'ms';
      observer.observe(el);
    });
  });

  /* ── 11. 헤더 그림자 · 맨 위로 · 현재 섹션 ─────────────────────────── */
  guard('스크롤 반응', function () {
    var header = $('siteHeader');
    var toTop = $('toTop');
    var nav = $('nav');
    var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
    var sections = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    function syncActiveNav() {
      if (!sections.length) return;

      var pos = (window.scrollY || window.pageYOffset || 0) + 130;
      var current = null;

      sections.forEach(function (section) {
        if (section.offsetTop <= pos) current = section.id;
      });

      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    }

    on(toTop, 'click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;

      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (toTop) toTop.hidden = y < 600;
      syncActiveNav();
    }

    onScroll();
    on(window, 'scroll', onScroll, { passive: true });
  });

  /* ── 12. 푸터 연도 ─────────────────────────────────────────────────── */
  guard('푸터 연도', function () {
    var yearEl = $('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  });
})();
