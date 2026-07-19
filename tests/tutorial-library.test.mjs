import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { tutorialArticles, tutorialCategories } from '../data/tutorial-library.mjs';
import { publicSongs, songs } from '../data/song-library.mjs';

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
      assert.match(html, /hreflang="zh-CN"/);
      assert.match(html, /hreflang="en"/);
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
