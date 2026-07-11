const normalizedPath = window.location.pathname.replace(/\/index\.html$/, '/');
const isEnglishHomepage = document.documentElement.lang?.toLowerCase().startsWith('en')
    && normalizedPath === '/en/';

if (isEnglishHomepage && !document.querySelector('link[data-en-home-layout]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/css/en-home-fix.css';
    stylesheet.dataset.enHomeLayout = 'true';
    document.head.appendChild(stylesheet);
}
