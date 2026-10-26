import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { tutorialArticles, tutorialCategories } from '../data/tutorial-library.mjs';
import { publicSongs, songs } from '../data/song-library.mjs';
import { applyArticleCta, applyLegacyTutorialCtas, applyLegacyTutorialLocales } from '../scripts/apply-legacy-articles.mjs';
import { legacyTutorialAlternates, legacyTutorialSlugs, reservedZhHantTutorials } from '../scripts/locale-alternates.mjs';

const newClassicIds = [
  'bach-prelude-c-major',
  'chopin-prelude-e-minor',
  'mozart-k545',
  'william-tell-overture',
  'offenbach-can-can',
  'bizet-habanera',
  'sugar-plum-fairy',
  'schubert-serenade'
];

test('tutorial catalog contains ten detailed bilingual guides', () => {
  assert.ok(tutorialArticles.length >= 10);
  assert.ok(tutorialCategories.length >= 4);

  for (const article of tutorialArticles) {
    assert.ok(article.slug);
    assert.ok(article.title?.zh);
    assert.ok(article.title?.en);
    assert.ok(article.description?.zh);
    assert.ok(article.description?.en);
    assert.ok(article.intro?.zh);
    assert.ok(article.intro?.en);
    assert.ok(article.sections.length >= 4, `${article.slug} needs at least four sections`);
    assert.ok(article.relatedSongs.length >= 3, `${article.slug} needs playable song links`);
    assert.ok(article.relatedTutorials.length >= 3, `${article.slug} needs internal tutorial links`);
  }
});

test('tutorial generator creates Chinese and English indexable pages', async () => {
  for (const article of tutorialArticles) {
    const zhPath = `articles/guides/${article.slug}/index.html`;
    const enPath = `en/articles/guides/${article.slug}/index.html`;
    assert.ok(existsSync(zhPath), `missing ${zhPath}`);
    assert.ok(existsSync(enPath), `missing ${enPath}`);

    for (const [file, locale] of [[zhPath, 'zh'], [enPath, 'en']]) {
      const html = await readFile(file, 'utf8');
      assert.match(html, /class="secondary-page tutorial-guide-page"/);
      assert.match(html, /rel="canonical"/);
      assert.match(html, locale === 'zh' ? /<html lang="zh-CN">/ : /<html lang="en">/);
      assert.match(html, /hreflang="zh-CN"/);
      assert.match(html, /hreflang="en"/);
      assert.match(html, /hreflang="x-default"/);
      assert.doesNotMatch(html, /<link\b[^>]*hreflang="zh-Hant"/);
      assert.match(html, /"@type":"Article"/);
      assert.match(html, /class="tutorial-section"/);
      assert.match(html, /class="tutorial-related-grid"/);
      assert.match(html, /Open the piano|打开在线钢琴/);
      assert.ok(html.includes(article.title[locale]));
    }
  }
});

test('tutorial indexes expose every new guide and the playable-tool path', async () => {
  const zh = await readFile('tutorials.html', 'utf8');
  const en = await readFile('en/tutorials.html', 'utf8');

  for (const article of tutorialArticles) {
    assert.ok(zh.includes(`/articles/guides/${article.slug}/`));
    assert.ok(en.includes(`/en/articles/guides/${article.slug}/`));
  }

  for (const html of [zh, en]) {
    assert.match(html, /tutorial-library-stats/);
    assert.match(html, /tutorial-category-nav/);
    assert.match(html, /#practice-start/);
    assert.match(html, /"@type":"CollectionPage"/);
  }
});

test('eight new public-domain classical themes are playable and indexable', () => {
  for (const id of newClassicIds) {
    const song = songs[id];
    assert.ok(song, `missing ${id}`);
    assert.equal(song.category, 'classical');
    assert.equal(song.seoEnabled, true);
    assert.ok(song.composer);
    assert.ok(song.notes.length >= 20);
    assert.ok(publicSongs.some((item) => item.id === id));
    assert.ok(song.notes.every((note) => /^[A-G](?:#|b)?-?\d+$/.test(note)), `${id} contains an invalid note`);
  }
});

test('generated song pages and sitemaps include the expansion', async () => {
  for (const id of newClassicIds) {
    const song = songs[id];
    assert.ok(existsSync(`songs/${song.slug}/index.html`));
    assert.ok(existsSync(`en/songs/${song.slug}/index.html`));
  }

  const sitemap = await readFile('sitemap.xml', 'utf8');
  const songSitemap = await readFile('sitemap-songs.xml', 'utf8');
  assert.match(sitemap, /articles\/guides\/computer-keyboard-piano\//);
  assert.match(sitemap, /en\/articles\/guides\/classic-piano-pieces-for-beginners\//);
  assert.match(sitemap, /songs\/bach-prelude-in-c-major\//);
  assert.match(songSitemap, /songs\/offenbach-can-can\//);
  assert.match(songSitemap, /xhtml:link/);
});

test('english piano keyboard letters page uses the chart title and description only in metadata', async () => {
  const html = await readFile('en/articles/guides/piano-keyboard-letters/index.html', 'utf8');
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  const description = html.match(/<meta name="description" content="([^"]*)">/)[1];
  assert.equal(title, 'Piano Keyboard Letters Chart: Notes C to B on Every Key | Piano Online');
  assert.equal(description, 'A labeled piano keyboard chart showing notes C to B on every white key, how black-key groups repeat, and which computer key plays each note on Piano Online.');
  assert.ok(description.length >= 140 && description.length <= 165, `description length ${description.length}`);
  assert.doesNotMatch(description, /print/i);
  assert.match(html, /<h1>Piano Keyboard Letters Explained: C D E F G A B and Computer Keys<\/h1>/);
  assert.match(html, /<img src="\/images\/piano-keyboard-letters\.svg" alt="Piano keyboard letters chart showing notes C to B on white keys and sharps\/flats on black keys" width="768" height="350" loading="lazy">/);
});

test('tutorial index pages keep reciprocal hreflang without a traditional alternate', async () => {
  for (const [file, lang, canonical] of [
    ['tutorials.html', 'zh-CN', 'https://pianoonline.cc/tutorials.html'],
    ['en/tutorials.html', 'en', 'https://pianoonline.cc/en/tutorials.html']
  ]) {
    const html = await readFile(file, 'utf8');
    assert.match(html, new RegExp(`<html lang="${lang}">`));
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
    const links = html.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g);
    assert.deepEqual(links, [
      '<link rel="alternate" hreflang="zh-CN" href="https://pianoonline.cc/tutorials.html">',
      '<link rel="alternate" hreflang="en" href="https://pianoonline.cc/en/tutorials.html">',
      '<link rel="alternate" hreflang="x-default" href="https://pianoonline.cc/en/tutorials.html">'
    ]);
  }
});

test('legacy tutorial pages share canonical, lang and reciprocal hreflang', async () => {
  for (const slug of legacyTutorialSlugs) {
    const zhPath = `articles/tutorials/${slug}.html`;
    const enPath = `en/articles/tutorials/${slug}.html`;
    const zh = await readFile(zhPath, 'utf8');
    const en = await readFile(enPath, 'utf8');
    assert.match(zh, /<html[^>]*\slang="zh-CN"/);
    assert.match(en, /<html[^>]*\slang="en"/);
    for (const [html, canonical] of [
      [zh, `https://pianoonline.cc/articles/tutorials/${slug}.html`],
      [en, `https://pianoonline.cc/en/articles/tutorials/${slug}.html`]
    ]) {
      assert.match(html, new RegExp(`<link rel="canonical" href="${canonical}">`));
      assert.deepEqual(html.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g), [
        `<link rel="alternate" hreflang="zh-CN" href="https://pianoonline.cc/articles/tutorials/${slug}.html">`,
        `<link rel="alternate" hreflang="en" href="https://pianoonline.cc/en/articles/tutorials/${slug}.html">`,
        `<link rel="alternate" hreflang="x-default" href="https://pianoonline.cc/en/articles/tutorials/${slug}.html">`
      ]);
      assert.doesNotMatch(html, /<link\b[^>]*hreflang="zh-Hant"/);
      assert.match(html, /<a href="\/zh-hant\/" lang="zh-Hant" hreflang="zh-Hant">繁體中文<\/a>/);
    }
  }
});

test('legacy language tags stay stable when applied again', async () => {
  const beforeZh = await readFile('articles/tutorials/piano-basics.html', 'utf8');
  const beforeEn = await readFile('en/articles/tutorials/piano-basics.html', 'utf8');
  await applyLegacyTutorialLocales(process.cwd());
  assert.equal(await readFile('articles/tutorials/piano-basics.html', 'utf8'), beforeZh);
  assert.equal(await readFile('en/articles/tutorials/piano-basics.html', 'utf8'), beforeEn);
});

test('legacy CTA covers both templates and all 26 pages without drifting when applied again', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'piano-cta-'));
  try {
    await mkdir(path.join(root, 'css'), { recursive: true });
    await writeFile(path.join(root, 'css/article.css'), await readFile('css/article.css', 'utf8'));
    for (const prefix of ['', 'en/']) {
      await mkdir(path.join(root, prefix, 'articles/tutorials'), { recursive: true });
      for (const slug of legacyTutorialSlugs) {
        const file = `${prefix}articles/tutorials/${slug}.html`;
        await writeFile(path.join(root, file), await readFile(file, 'utf8'));
      }
    }
    assert.equal((await applyLegacyTutorialCtas(root)).pages, 26);
    const first = new Map();
    for (const prefix of ['', 'en/']) {
      for (const slug of legacyTutorialSlugs) {
        const file = `${prefix}articles/tutorials/${slug}.html`;
        const html = await readFile(path.join(root, file), 'utf8');
        first.set(file, html);
        assert.equal((html.match(/\sdata-article-cta(?=[\s>])/g) || []).length, 1, file);
        assert.equal((html.match(/id="article-cta-tracking"/g) || []).length, 1, file);
        assert.match(html, new RegExp(`href="/${prefix}#practice-start" data-article-cta-link data-article-slug="${slug}">${prefix ? 'Open the piano' : '打开在线钢琴'}</a>`));
        assert.match(html, /<header class="article-header">[\s\S]*?<h1>[\s\S]*?class="article-cta"[\s\S]*?<\/header>/);
        const stripped = html.replace(/<div class="article-cta" data-article-cta>[\s\S]*?<\/script>/, '').replace(/<style id="article-cta-styles">[\s\S]*?<\/style>/, '');
        assert.equal(stripped, await readFile(file, 'utf8'), `${file} original content preserved`);
      }
    }
    await applyLegacyTutorialCtas(root);
    for (const [file, html] of first) assert.equal(await readFile(path.join(root, file), 'utf8'), html);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('legacy CTA handles missing headers and independently deduplicates markup and tracking', () => {
  const options = { slug: 'piano-basics', lang: 'en', styles: '.article-cta{margin:16px}' };
  const warnings = [];
  for (const html of ['', '<html><head></head><body>No header</body></html>']) {
    assert.equal(applyArticleCta(html, { ...options, warn: (message) => warnings.push(message) }), html);
  }
  assert.equal(warnings.length, 2);
  const original = '<html><head></head><body><header class="article-header"><h1>Title</h1></header><p>Original paragraph</p></body></html>';
  assert.equal(applyArticleCta(original, { ...options, lang: 'zh-Hant' }), original);
  const complete = applyArticleCta(original, options);
  for (const partial of [
    complete.replace(/<script id="article-cta-tracking">[\s\S]*?<\/script>/, ''),
    complete.replace(/<div class="article-cta" data-article-cta>[\s\S]*?<\/div>/, '')
  ]) {
    const repaired = applyArticleCta(partial, options);
    assert.equal((repaired.match(/\sdata-article-cta(?=[\s>])/g) || []).length, 1);
    assert.equal((repaired.match(/id="article-cta-tracking"/g) || []).length, 1);
    assert.equal(applyArticleCta(repaired, options), repaired);
  }
  assert.match(complete, /typeof window.gtag==='function'/);
});

test('piano-basics reserves a traditional route and emits hreflang only after the file exists', async () => {
  assert.equal(reservedZhHantTutorials['piano-basics'], '/zh-hant/articles/tutorials/piano-basics.html');
  const root = await mkdtemp(path.join(os.tmpdir(), 'piano-hreflang-'));
  await mkdir(path.join(root, 'articles/tutorials'), { recursive: true });
  await mkdir(path.join(root, 'en/articles/tutorials'), { recursive: true });
  await writeFile(path.join(root, 'articles/tutorials/piano-basics.html'), '<!DOCTYPE html><html lang="zh"><head><link rel="canonical" href="https://example.invalid/old"></head><body><nav class="nav-bar"><div class="nav-container"><div class="nav-links"><a href="/">首页</a></div></div></nav></body></html>');
  await writeFile(path.join(root, 'en/articles/tutorials/piano-basics.html'), '<!DOCTYPE html><html lang="en"><head><link rel="canonical" href="https://example.invalid/old"><link rel="alternate" hreflang="en" href="https://example.invalid/old"></head><body><div class="lang-dropdown"><a href="/articles/tutorials/piano-basics.html" hreflang="zh-CN">中文</a><a href="/en/articles/tutorials/piano-basics.html" class="active" hreflang="en">English</a></div></body></html>');
  const before = legacyTutorialAlternates('piano-basics', root).map(([lang]) => lang);
  assert.deepEqual(before, ['zh-CN', 'en', 'x-default']);
  await applyLegacyTutorialLocales(root);
  const zh = await readFile(path.join(root, 'articles/tutorials/piano-basics.html'), 'utf8');
  assert.match(zh, /lang="zh-CN"/);
  assert.doesNotMatch(zh, /<link\b[^>]*hreflang="zh-Hant"/);
  const reserved = reservedZhHantTutorials['piano-basics'];
  await mkdir(path.dirname(path.join(root, reserved.slice(1))), { recursive: true });
  await writeFile(path.join(root, reserved.slice(1)), '<!DOCTYPE html><html lang="zh"><head></head><body><div class="nav-links"><a href="/zh-hant/">首頁</a></div></body></html>');
  const after = legacyTutorialAlternates('piano-basics', root).map(([lang]) => lang);
  assert.deepEqual(after, ['zh-CN', 'en', 'zh-Hant', 'x-default']);
  await applyLegacyTutorialLocales(root);
  const updated = await readFile(path.join(root, 'articles/tutorials/piano-basics.html'), 'utf8');
  assert.match(updated, /hreflang="zh-Hant" href="https:\/\/pianoonline\.cc\/zh-hant\/articles\/tutorials\/piano-basics\.html"/);
  assert.match(updated, /<a href="\/zh-hant\/articles\/tutorials\/piano-basics\.html" lang="zh-Hant" hreflang="zh-Hant">繁體中文<\/a>/);
  const traditional = await readFile(path.join(root, reserved.slice(1)), 'utf8');
  assert.match(traditional, /<html lang="zh-Hant">/);
  assert.match(traditional, /<link rel="canonical" href="https:\/\/pianoonline\.cc\/zh-hant\/articles\/tutorials\/piano-basics\.html">/);
  await rm(root, { recursive: true, force: true });
});
