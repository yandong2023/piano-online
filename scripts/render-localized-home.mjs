import { pianoHomeCopy } from '../data/piano-home-copy.mjs';
import { NEW_PIANO_LOCALES, pianoSongName, starterSongNames, translatePiano } from '../data/piano-locales.mjs';
import { publicSongs } from '../data/song-library.mjs';
import { HOME_HREFLANG, SITE_ORIGIN } from './locale-alternates.mjs';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const jsonLd = value => `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;

export function renderLocalizedHome(locale, { instrument, nav, version }) {
  if (!NEW_PIANO_LOCALES.includes(locale)) throw new Error(`Unsupported piano locale: ${locale}`);
  const copy = pianoHomeCopy[locale];
  const url = `${SITE_ORIGIN}/${locale}/`;
  const text = en => translatePiano(locale, '', en);
  const featured = Object.keys(starterSongNames).map(id => publicSongs.find(song => song.id === id));
  const graph = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', name: 'Piano Online', url, inLanguage: locale },
      { '@type': 'WebApplication', name: copy.h1, url, inLanguage: locale, description: copy.description,
        applicationCategory: 'MusicApplication', operatingSystem: 'Web browser', isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
      { '@type': 'FAQPage', inLanguage: locale, mainEntity: copy.faq.map(([question, answer]) => ({
        '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer },
      })) },
    ],
  };
  const alternates = HOME_HREFLANG.map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('');
  const quickSongs = featured.map(song => `<button type="button" class="studio-quiet" data-quick-song="${song.id}" disabled>${esc(pianoSongName(song, locale))}</button>`).join('');
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(copy.title)}</title><meta name="description" content="${esc(copy.description)}"><link rel="canonical" href="${url}">${alternates}<link rel="icon" href="/images/favicon.svg"><meta property="og:type" content="website"><meta property="og:title" content="${esc(copy.title)}"><meta property="og:description" content="${esc(copy.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE_ORIGIN}/images/og-image.jpg"><link rel="stylesheet" href="/css/studio.css?v=${version}"><link rel="stylesheet" href="/css/home-faq.css?v=20261022.1"><script type="module" src="/js/studio.js?v=${version}"></script>${jsonLd(graph)}<script async src="https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EYGD99YB4Y');</script><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4423187689700927" crossorigin="anonymous"></script></head>
<body class="studio-page piano-locale-page"><a class="skip-link" href="#practice-start">${esc(copy.skip)}</a>${nav(locale, 'piano', '', true)}<main class="studio-main"><header class="studio-intro"><div><h1>${esc(copy.h1)}</h1><p>${esc(copy.lead)}</p></div><div class="studio-promise">${copy.badges.map(badge => `<span>${esc(badge)}</span>`).join('')}</div></header>
${instrument(locale)}
<section class="studio-discover"><div class="studio-section-heading"><h2>${esc(copy.starterTitle)}</h2></div><p>${esc(copy.starterIntro)}</p><div class="studio-local-songs">${quickSongs}</div></section>
<section class="studio-learn studio-local-guide" aria-labelledby="local-guide-title"><div><h2 id="local-guide-title">${esc(copy.guideTitle)}</h2></div><div class="studio-help">${copy.sections.map(([heading, body]) => `<article><h3>${esc(heading)}</h3><p>${esc(body)}</p></article>`).join('')}</div></section>
<section class="home-faq" aria-labelledby="home-faq-title"><h2 id="home-faq-title">${esc(copy.faqTitle)}</h2>${copy.faq.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('')}</section>
<section class="studio-local-library"><p>${esc(copy.libraryNote)}</p><a href="/en/songs/" hreflang="en">${esc(text('Songs (English)'))} ↗</a><a href="/en/tutorials.html" hreflang="en">${esc(text('Learn (English)'))} ↗</a></section></main><footer class="studio-footer"><span>Piano Online © 2026</span><a href="/${locale}/">${esc(text('Piano'))}</a></footer></body></html>`;
}
