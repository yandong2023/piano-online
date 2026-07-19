import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publicSongs } from '../data/song-library.mjs';
import { tutorialArticles } from '../data/tutorial-library.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..');
const BASE_URL = 'https://pianoonline.cc';
const LASTMOD = '2026-07-18';

const legacyTutorialSlugs = [
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

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function bilingualUrl(zhPath, enPath, { priority = '0.8', changefreq = 'monthly', lastmod = LASTMOD } = {}) {
  const zh = `${BASE_URL}${zhPath}`;
  const en = `${BASE_URL}${enPath}`;
  return [
    `<url><loc>${esc(zh)}</loc><xhtml:link rel="alternate" hreflang="zh-CN" href="${esc(zh)}"/><xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${esc(en)}"/><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
    `<url><loc>${esc(en)}</loc><xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/><xhtml:link rel="alternate" hreflang="zh-CN" href="${esc(zh)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${esc(en)}"/><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
  ];
}

function singleUrl(pathname, { priority = '0.6', changefreq = 'monthly', lastmod = LASTMOD } = {}) {
  return `<url><loc>${esc(`${BASE_URL}${pathname}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

function xmlDocument(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map((url) => `  ${url}`).join('\n')}\n</urlset>\n`;
}

export async function generateSitemaps(root = PROJECT_ROOT) {
  const songUrls = [
    ...bilingualUrl('/songs/', '/en/songs/', { priority: '0.9', changefreq: 'weekly' }),
    ...publicSongs.flatMap((song) => bilingualUrl(`/songs/${song.slug}/`, `/en/songs/${song.slug}/`, { priority: song.featured ? '0.85' : '0.75', changefreq: 'monthly' }))
  ];

  const tutorialUrls = [
    ...bilingualUrl('/tutorials.html', '/en/tutorials.html', { priority: '0.9', changefreq: 'weekly' }),
    ...tutorialArticles.flatMap((article) => bilingualUrl(`/articles/guides/${article.slug}/`, `/en/articles/guides/${article.slug}/`, { priority: article.category === 'songs' ? '0.85' : '0.8', changefreq: 'monthly', lastmod: article.updatedAt })),
    ...legacyTutorialSlugs.flatMap((slug) => bilingualUrl(`/articles/tutorials/${slug}.html`, `/en/articles/tutorials/${slug}.html`, { priority: '0.7', changefreq: 'monthly' }))
  ];

  const mainUrls = [
    ...bilingualUrl('/', '/en/', { priority: '1.0', changefreq: 'daily' }),
    singleUrl('/piano.html', { priority: '0.85', changefreq: 'weekly' }),
    singleUrl('/practice.html', { priority: '0.8', changefreq: 'weekly' }),
    ...bilingualUrl('/about.html', '/en/about.html', { priority: '0.5', changefreq: 'monthly' }),
    ...tutorialUrls,
    ...songUrls
  ];

  await writeFile(path.join(root, 'sitemap.xml'), xmlDocument(mainUrls), 'utf8');
  await writeFile(path.join(root, 'sitemap-songs.xml'), xmlDocument(songUrls), 'utf8');

  return { total: mainUrls.length, songs: songUrls.length, tutorials: tutorialUrls.length };
}

const isDirectRun = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) {
  const result = await generateSitemaps(PROJECT_ROOT);
  console.log(`Generated sitemap with ${result.total} URLs (${result.songs} song URLs, ${result.tutorials} tutorial URLs).`);
}
