const normalizedPath = window.location.pathname.replace(/\/index\.html$/, '/');
const lang = document.documentElement.lang?.toLowerCase() || '';
const isChineseHomepage = lang.startsWith('zh') && normalizedPath === '/';
const isEnglishHomepage = lang.startsWith('en') && normalizedPath === '/en/';
const isHomepage = isChineseHomepage || isEnglishHomepage;

if (isHomepage) {
  document.body?.classList.add('homepage-premium');

  if (!document.querySelector('link[data-home-premium]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/css/home-premium.css';
    stylesheet.dataset.homePremium = 'true';
    document.head.appendChild(stylesheet);
  }
}
