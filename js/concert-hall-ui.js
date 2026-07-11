const UI_STYLES = [
  '/css/design-tokens.css',
  '/css/components-modern.css',
  '/css/home-modern.css',
  '/css/home-modern-layout.css',
  '/css/concert-hall.css'
];

function getLocale() {
  return document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'zh';
}

function ensureStyles() {
  UI_STYLES.forEach((href) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function rebuildNavigation(locale) {
  const nav = document.querySelector('.nav-bar');
  const links = nav?.querySelector('.nav-links');
  if (!nav || !links || links.dataset.concertReady === 'true') return;

  nav.classList.add('concert-nav');
  links.dataset.concertReady = 'true';

  const languageSwitcher = links.querySelector('.lang-switcher');
  const homeHref = locale === 'en' ? '/en/' : '/';
  const songsHref = locale === 'en' ? '/en/songs/' : '/songs/';
  const learnHref = locale === 'en' ? '/en/tutorials.html' : '/tutorials.html';

  links.querySelectorAll(':scope > a').forEach((anchor) => anchor.remove());

  const items = locale === 'en'
    ? [
        ['Home', homeHref],
        ['Piano', `${homeHref}#practice-start`],
        ['Songs', songsHref],
        ['Learn', learnHref]
      ]
    : [
        ['首页', homeHref],
        ['在线钢琴', `${homeHref}#practice-start`],
        ['歌曲库', songsHref],
        ['学习', learnHref]
      ];

  items.forEach(([label, href], index) => {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = label;
    if (index === 0 && document.querySelector('.hero-home')) anchor.classList.add('active');
    links.insertBefore(anchor, languageSwitcher || null);
  });

  if (!languageSwitcher) {
    const languageLink = document.createElement('a');
    languageLink.className = 'concert-language-link';
    languageLink.href = locale === 'en' ? '/' : '/en/';
    languageLink.textContent = locale === 'en' ? '中文' : 'English';
    links.appendChild(languageLink);
  }
}

function enhanceHero(locale) {
  const hero = document.querySelector('.hero-home');
  if (!hero || hero.dataset.concertReady === 'true') return;
  hero.dataset.concertReady = 'true';
  hero.classList.add('concert-hero');

  const eyebrow = hero.querySelector('.hero-eyebrow');
  const title = hero.querySelector('h1');
  const subtitle = hero.querySelector('.hero-subtitle');
  const proofItems = hero.querySelectorAll('.hero-proof-list span');
  const primary = hero.querySelector('#hero-start-fullscreen');
  const secondary = hero.querySelector('.hero-cta a');

  if (locale === 'en') {
    setText(eyebrow, 'PIANO ONLINE · YOUR HOME CONCERT HALL');
    if (title) title.innerHTML = 'Turn your home into a <span>concert hall</span>';
    setText(subtitle, 'Play the melodies you love, anytime, right from your keyboard. No piano room, no download, no waiting for inspiration.');
    ['Play instantly', 'No signup', 'Guided songs'].forEach((text, index) => setText(proofItems[index], text));
    setText(primary, 'Start Playing');
    setText(secondary, 'Choose a Song');
    if (secondary) secondary.href = '/en/songs/';
  } else {
    setText(eyebrow, 'PIANO ONLINE · 家里的音乐殿堂');
    if (title) title.innerHTML = '把家，变成你的<span>音乐殿堂</span>';
    setText(subtitle, '在电脑前，随时弹出你想弹的旋律。无需钢琴房，无需下载，灵感到来时马上开始。');
    ['打开即弹', '无需注册', '跟着歌曲学'].forEach((text, index) => setText(proofItems[index], text));
    setText(primary, '立即开始弹奏');
    setText(secondary, '挑一首歌开始');
    if (secondary) secondary.href = '/songs/';
  }

  primary?.classList.add('concert-primary-action');
  secondary?.classList.add('concert-secondary-action');

  const visual = hero.querySelector('.hero-home-visual');
  const label = visual?.querySelector('.hero-screen-label');
  const highlight = visual?.querySelector('.hero-screen-highlight');
  if (visual) visual.classList.add('concert-stage-visual');
  setText(label, locale === 'en' ? 'YOUR FIRST NOTES' : '你的第一段旋律');
  setText(highlight, locale === 'en' ? 'Press A and let the room fill with music' : '按下 A，让音乐在房间里响起');

  if (visual && !visual.querySelector('.concert-light-rings')) {
    const rings = document.createElement('div');
    rings.className = 'concert-light-rings';
    rings.setAttribute('aria-hidden', 'true');
    visual.prepend(rings);
  }
}

function enhanceQuickStart(locale) {
  const section = document.getElementById('quick-start');
  if (!section || section.dataset.concertReady === 'true') return;
  section.dataset.concertReady = 'true';
  section.classList.add('concert-experience-band');

  const cards = section.querySelectorAll('.quick-start-card');
  const copy = locale === 'en'
    ? [
        ['01', 'Play whenever inspiration arrives', 'Open the page and your piano is ready. No setup, download, or expensive room required.'],
        ['02', 'Learn a melody, one note at a time', 'Choose a song and follow elegant key prompts until the whole phrase becomes yours.'],
        ['03', 'Feel the stage from home', 'Enter full screen, focus on the keys, and turn an ordinary evening into a private performance.']
      ]
    : [
        ['01', '灵感来了，马上开始', '打开网页，钢琴已经准备好。无需安装、无需设备，也不需要专门的琴房。'],
        ['02', '一键一音，弹出完整旋律', '选择一首喜欢的歌，跟着优雅提示练习，直到整段旋律真正属于你。'],
        ['03', '在家，也有舞台感', '进入沉浸全屏，专注琴键，让普通的夜晚变成一场属于自己的演奏。']
      ];

  cards.forEach((card, index) => {
    const [step, heading, description] = copy[index] || copy[0];
    setText(card.querySelector('.quick-step'), step);
    setText(card.querySelector('h3'), heading);
    setText(card.querySelector('p'), description);
    card.classList.add('concert-experience-card');
  });
}

function enhanceSongLibrary(locale) {
  const section = document.querySelector('.song-library-section');
  if (!section || section.dataset.concertReady === 'true') return;
  section.dataset.concertReady = 'true';
  section.classList.add('concert-song-library');

  const heading = section.querySelector('.song-library-heading h2');
  const paragraph = section.querySelector('.song-library-heading p');
  const kicker = section.querySelector('.section-kicker');
  setText(kicker, locale === 'en' ? 'THE PROGRAM' : '今晚的节目单');
  setText(heading, locale === 'en' ? 'Choose the melody you want to bring home' : '挑一首，今晚就想弹的旋律');
  setText(paragraph, locale === 'en'
    ? 'Every song opens into an interactive piano lesson with keyboard letters, guided practice, and a clear finish.'
    : '每首歌都有独立互动页面、电脑按键提示和完整练习流程，打开就能开始。');

  section.querySelectorAll('.song-card').forEach((card, index) => {
    card.classList.add('concert-song-card');
    card.style.setProperty('--song-card-index', String(index));
  });
}

function enhancePracticeStage(locale) {
  const section = document.querySelector('.practice-section');
  if (!section || section.dataset.concertReady === 'true') return;
  section.dataset.concertReady = 'true';
  section.classList.add('concert-piano-stage');

  const intro = section.querySelector('.section-intro');
  if (intro) {
    setText(intro.querySelector('.section-kicker'), locale === 'en' ? 'YOUR PRIVATE STAGE' : '你的私人舞台');
    setText(intro.querySelector('h2'), locale === 'en' ? 'Your piano is ready whenever you are' : '你准备好的那一刻，钢琴也已经准备好');
    setText(intro.querySelector('p'), locale === 'en'
      ? 'Free play, learn a song, or enter a rhythm challenge. Everything begins with one key.'
      : '自由弹奏、跟着歌曲学，或者进入节奏挑战。一切，都从按下第一个键开始。');
  }

  const pianoContainer = section.querySelector('.piano-container');
  pianoContainer?.classList.add('concert-piano-shell');

  if (pianoContainer && !pianoContainer.querySelector('.concert-stage-header')) {
    const header = document.createElement('div');
    header.className = 'concert-stage-header';
    header.innerHTML = `
      <div>
        <span class="concert-stage-kicker">${locale === 'en' ? 'LIVE IN YOUR BROWSER' : '此刻，舞台已经亮起'}</span>
        <strong>${locale === 'en' ? 'Grand Piano Experience' : '沉浸式钢琴体验'}</strong>
      </div>
      <span class="concert-live-indicator"><i></i>${locale === 'en' ? 'Ready' : '可以演奏'}</span>`;
    pianoContainer.prepend(header);
  }

  const controls = section.querySelector('.practice-controls-panel');
  controls?.classList.add('concert-control-deck');
  section.querySelector('.control-row')?.classList.add('concert-utility-row');
  section.querySelector('.song-select-container')?.classList.add('concert-song-select');
  section.querySelector('.practice-buttons')?.classList.add('concert-action-row');
  section.querySelector('.practice-status-panel')?.classList.add('concert-status-deck');

  const startPractice = section.querySelector('#start-practice');
  const startGame = section.querySelector('#start-rhythm-game');
  const fullscreen = section.querySelector('#toggle-fullscreen');
  setText(startPractice, locale === 'en' ? 'Learn This Song' : '跟着学这首歌');
  setText(startGame, locale === 'en' ? 'Rhythm Challenge' : '节奏挑战');
  setText(fullscreen, locale === 'en' ? 'Full Screen' : '沉浸全屏');
}

function enhanceSongPage(locale) {
  const main = document.querySelector('.song-page-main');
  if (!main || main.dataset.concertReady === 'true') return;
  main.dataset.concertReady = 'true';
  document.body.classList.add('concert-song-page');

  document.querySelector('.song-hero-panel')?.classList.add('concert-song-hero');
  document.querySelector('.song-note-preview')?.classList.add('concert-note-score');
  document.querySelector('.song-practice-shell')?.classList.add('concert-song-practice');
  document.querySelectorAll('.song-card').forEach((card) => card.classList.add('concert-song-card'));

  const eyebrow = document.querySelector('.song-eyebrow');
  if (eyebrow) setText(eyebrow, locale === 'en' ? 'YOUR NEXT PERFORMANCE' : '你的下一场演奏');
}

function addFinalInvitation(locale) {
  if (!document.querySelector('.hero-home') || document.querySelector('.concert-final-invitation')) return;
  const footer = document.querySelector('footer');
  if (!footer) return;

  const section = document.createElement('section');
  section.className = 'concert-final-invitation';
  section.innerHTML = locale === 'en'
    ? `<div class="container"><span>YOUR MUSIC IS WAITING</span><h2>When you want to play, music should be right there.</h2><p>Turn an ordinary room into your own concert hall.</p><div><a class="modern-btn modern-btn-primary" href="#practice-start">Start Playing</a><a class="modern-btn" href="/en/songs/">Browse Songs</a></div></div>`
    : `<div class="container"><span>音乐，正在等你</span><h2>当你想弹的时候，音乐不该离你太远。</h2><p>现在开始，把普通的房间变成属于你的音乐殿堂。</p><div><a class="modern-btn modern-btn-primary" href="#practice-start">立即弹奏</a><a class="modern-btn" href="/songs/">浏览歌曲库</a></div></div>`;
  footer.insertAdjacentElement('beforebegin', section);
}

export function initializeConcertHallUI() {
  if (document.documentElement.dataset.concertReady === 'true') return;
  document.documentElement.dataset.concertReady = 'true';

  const locale = getLocale();
  ensureStyles();
  document.body.classList.add('concert-hall-theme');
  document.body.dataset.locale = locale;

  rebuildNavigation(locale);
  enhanceHero(locale);
  enhanceQuickStart(locale);
  enhanceSongLibrary(locale);
  enhancePracticeStage(locale);
  enhanceSongPage(locale);
  addFinalInvitation(locale);
}
