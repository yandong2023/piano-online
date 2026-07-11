const normalizedPath = window.location.pathname.replace(/\/index\.html$/, '/');
const lang = document.documentElement.lang?.toLowerCase() || '';
const isChineseHomepage = lang.startsWith('zh') && normalizedPath === '/';
const isEnglishHomepage = lang.startsWith('en') && normalizedPath === '/en/';
const isHomepage = isChineseHomepage || isEnglishHomepage;

function appendStylesheet(href, dataAttribute) {
  if (document.querySelector(`link[${dataAttribute}]`)) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = href;
  stylesheet.setAttribute(dataAttribute, 'true');
  document.head.appendChild(stylesheet);
}

function applyHomepageHeroCopy() {
  const eyebrow = document.querySelector('.hero-eyebrow');
  const title = document.querySelector('.hero-home h1');
  const subtitle = document.querySelector('.hero-subtitle');
  const secondaryButton = document.querySelector('.hero-cta .secondary.hero-btn');

  if (!eyebrow || !title || !subtitle) return;

  if (isEnglishHomepage) {
    eyebrow.textContent = 'Free Virtual Piano';
    title.textContent = 'Turn your keyboard into a piano.';
    subtitle.textContent = 'Open your browser and start playing in seconds. Learn simple songs, follow next-key prompts, and enjoy a focused piano space right at home.';
    if (secondaryButton) secondaryButton.textContent = 'See how it works';
  }

  if (isChineseHomepage) {
    eyebrow.textContent = '你的线上钢琴';
    title.textContent = '把电脑键盘，变成你的钢琴';
    subtitle.textContent = '打开网页就能开始弹奏。跟着提示练歌、体验节奏模式，或进入全屏，在家也能沉浸地弹出第一段旋律。';
    if (secondaryButton) secondaryButton.textContent = '看看怎么开始';
  }
}

if (isHomepage) {
  document.body?.classList.add('homepage-premium');
  appendStylesheet('/css/home-premium.css', 'data-home-premium');
  appendStylesheet('/css/homepage-detail-fixes.css', 'data-home-detail-fixes');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyHomepageHeroCopy, { once: true });
  } else {
    applyHomepageHeroCopy();
  }
}
