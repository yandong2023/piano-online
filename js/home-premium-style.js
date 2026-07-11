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

if (isHomepage) {
  document.body?.classList.add('homepage-premium');
  appendStylesheet('/css/home-premium.css', 'data-home-premium');
  appendStylesheet('/css/homepage-detail-fixes.css', 'data-home-detail-fixes');
}
