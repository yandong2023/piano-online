import { existsSync } from 'node:fs';
import path from 'node:path';

export const SITE_ORIGIN = 'https://pianoonline.cc';

export const legacyTutorialSlugs = [
  'piano-basics',
  'reading-notes',
  'finger-numbers',
  'rhythm-basics',
  'practice-methods',
  'scales-practice',
  'hand-coordination',
  'music-theory',
  'advanced-music-theory',
  'sight-reading',
  'performance-skills',
  'music-analysis',
  'piano-maintenance'
];

// Traditional pages are not written yet. A slug listed here is included in
// hreflang and the sitemap only after that HTML file exists on disk.
export const reservedZhHantTutorials = {
  'piano-basics': '/zh-hant/articles/tutorials/piano-basics.html'
};

export function hreflangBlock(alternates) {
  return alternates.map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('\n');
}

export function guideAlternates(slug) {
  const zh = `${SITE_ORIGIN}/articles/guides/${slug}/`;
  const en = `${SITE_ORIGIN}/en/articles/guides/${slug}/`;
  return [
    ['zh-CN', zh],
    ['en', en],
    ['x-default', en]
  ];
}

export function tutorialIndexAlternates() {
  const zh = `${SITE_ORIGIN}/tutorials.html`;
  const en = `${SITE_ORIGIN}/en/tutorials.html`;
  return [
    ['zh-CN', zh],
    ['en', en],
    ['x-default', en]
  ];
}

function publicFile(root, pathname) {
  const relative = pathname.replace(/^\//, '');
  return path.join(root, relative.endsWith('/') ? path.join(relative, 'index.html') : relative);
}

export function legacyTutorialLocales(slug, root) {
  const locales = [
    ['zh-CN', `/articles/tutorials/${slug}.html`],
    ['en', `/en/articles/tutorials/${slug}.html`]
  ];
  const reserved = reservedZhHantTutorials[slug];
  if (reserved && existsSync(publicFile(root, reserved))) locales.push(['zh-Hant', reserved]);
  return locales;
}

export function legacyTutorialAlternates(slug, root) {
  const locales = legacyTutorialLocales(slug, root).filter(([, pathname]) => existsSync(publicFile(root, pathname)));
  const en = locales.find(([lang]) => lang === 'en');
  const zh = locales.find(([lang]) => lang === 'zh-CN');
  const xDefault = en || zh || locales[0];
  return [
    ...locales.map(([lang, pathname]) => [lang, `${SITE_ORIGIN}${pathname}`]),
    ['x-default', `${SITE_ORIGIN}${xDefault[1]}`]
  ];
}

export function zhHantTutorialHref(slug, root) {
  const reserved = reservedZhHantTutorials[slug];
  if (reserved && existsSync(publicFile(root, reserved))) return reserved;
  return '/zh-hant/';
}
