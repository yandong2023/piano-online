import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { publicSongs, songs } from '../data/song-library.mjs';

const ids = publicSongs.map((song) => song.id);
const slugs = publicSongs.map((song) => song.slug);

test('classic library includes at least 100 public songs', () => {
  assert.ok(publicSongs.length >= 100, `expected at least 100 songs, received ${publicSongs.length}`);
});

test('public song ids and slugs are unique', () => {
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('every public song has usable bilingual metadata and notes', () => {
  for (const song of publicSongs) {
    assert.ok(song.title?.zh);
    assert.ok(song.title?.en);
    assert.ok(song.description?.zh);
    assert.ok(song.description?.en);
    assert.ok(song.notes.length >= 12, `${song.id} has too few notes`);
    assert.ok(song.notes.every((note) => /^[A-G](?:#|b)?-?\d+$/.test(note)), `${song.id} has an invalid note`);
  }
});

test('songs requiring rights review stay out of the public library', () => {
  assert.equal(songs['river-flows'].copyrightRestricted, true);
  assert.ok(!ids.includes('river-flows'));
  assert.equal(songs['butterfly-lovers'].seoEnabled, false);
  assert.ok(!ids.includes('butterfly-lovers'));
});

test('generator creates representative Chinese and English pages', () => {
  for (const slug of ['minuet-in-g', 'turkish-march', 'brahms-lullaby', 'the-entertainer']) {
    assert.ok(existsSync(`songs/${slug}/index.html`), `missing Chinese page for ${slug}`);
    assert.ok(existsSync(`en/songs/${slug}/index.html`), `missing English page for ${slug}`);
  }
});

test('generated library pages expose the expanded catalog and premium theme', async () => {
  const zh = await readFile('songs/index.html', 'utf8');
  const en = await readFile('en/songs/index.html', 'utf8');
  const escapedCount = String(publicSongs.length).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  assert.match(zh, new RegExp(`${escapedCount} 首歌曲`));
  assert.match(zh, /G大调小步舞曲/);
  assert.match(en, new RegExp(`${escapedCount} songs`));
  assert.match(en, /Eine kleine Nachtmusik/);

  for (const html of [zh, en]) {
    assert.match(html, /class="secondary-page song-library-theme premium-song-library"/);
    assert.match(html, /class="song-library-page song-library-main"/);
    assert.match(html, /song-library-fix\.css\?v=20260711\.10/);
    assert.match(html, /class="song-card-composer"/);
  }
});

test('generated song pages include working practice, fullscreen and score controls', async () => {
  const zh = await readFile('songs/blue-danube/index.html', 'utf8');
  const en = await readFile('en/songs/blue-danube/index.html', 'utf8');

  for (const html of [zh, en]) {
    assert.match(html, /id="start-practice"/);
    assert.match(html, /id="stop-practice"/);
    assert.match(html, /id="toggle-fullscreen"/);
    assert.match(html, /data-start-song/);
    assert.match(html, /data-score-viewer/);
    assert.match(html, /data-score-ready="true"/);
    assert.match(html, /score-viewer\.css\?v=20260711\.10/);
    assert.match(html, /song-interactions\.css\?v=20260711\.10/);
    assert.match(html, /song-page\.js\?v=20260711\.10/);
  }
});

test('second-batch songs render as score-ready in both locales', async () => {
  for (const slug of ['two-tigers', 'mary-had-a-little-lamb', 'minuet-in-g', 'we-wish-you-a-merry-christmas']) {
    const zh = await readFile(`songs/${slug}/index.html`, 'utf8');
    const en = await readFile(`en/songs/${slug}/index.html`, 'utf8');
    assert.match(zh, /data-score-ready="true"/, `${slug} Chinese page is not score-ready`);
    assert.match(en, /data-score-ready="true"/, `${slug} English page is not score-ready`);
  }
});

test('songs without score data keep the friendly fallback', async () => {
  const zh = await readFile('songs/turkish-march/index.html', 'utf8');
  const en = await readFile('en/songs/turkish-march/index.html', 'utf8');
  assert.match(zh, /data-score-ready="false"/);
  assert.match(en, /data-score-ready="false"/);
});

test('generator creates Traditional Chinese song pages with reciprocal hreflang', async () => {
  const library = await readFile('zh-hant/songs/index.html', 'utf8');
  const song = await readFile('zh-hant/songs/happy-birthday/index.html', 'utf8');

  assert.match(library, /<html lang="zh-Hant">/);
  assert.match(library, new RegExp(`${publicSongs.length} 首歌曲`));
  assert.match(song, /生日快樂/);
  assert.match(song, /hreflang="zh-Hant"/);
  assert.match(song, /hreflang="zh-CN"/);
  assert.match(song, /href="\/songs\/">簡體/);
});

test('song and library pages in all variants emit one canonical and exactly four hreflang alternates', async () => {
  const cases = [
    ['songs/happy-birthday/index.html', 'songs/happy-birthday/', ['BreadcrumbList', 'MusicComposition']],
    ['en/songs/happy-birthday/index.html', 'en/songs/happy-birthday/', ['BreadcrumbList', 'MusicComposition']],
    ['zh-hant/songs/happy-birthday/index.html', 'zh-hant/songs/happy-birthday/', ['BreadcrumbList', 'MusicComposition']],
    ['songs/index.html', 'songs/', ['CollectionPage', 'ItemList']],
    ['en/songs/index.html', 'en/songs/', ['CollectionPage', 'ItemList']],
    ['zh-hant/songs/index.html', 'zh-hant/songs/', ['CollectionPage', 'ItemList']]
  ];
  for (const [file, relPath, expectedTypes] of cases) {
    const html = await readFile(file, 'utf8');
    const zhPath = relPath.replace(/^(en|zh-hant)\//, '');
    const canonicals = html.match(/<link rel="canonical" href="[^"]+">/g) || [];
    assert.deepEqual(canonicals, [`<link rel="canonical" href="https://pianoonline.cc/${relPath}">`], `${file} canonical`);
    const alternates = html.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g) || [];
    assert.deepEqual(alternates, [
      `<link rel="alternate" hreflang="zh-CN" href="https://pianoonline.cc/${zhPath}">`,
      `<link rel="alternate" hreflang="en" href="https://pianoonline.cc/en/${zhPath}">`,
      `<link rel="alternate" hreflang="zh-Hant" href="https://pianoonline.cc/zh-hant/${zhPath}">`,
      `<link rel="alternate" hreflang="x-default" href="https://pianoonline.cc/en/${zhPath}">`
    ], `${file} alternates`);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.ok(blocks.length >= 1, `${file} missing ld+json`);
    const types = [];
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node['@type']) types.push(node['@type']);
      for (const value of Object.values(node)) {
        if (value && typeof value === 'object') Array.isArray(value) ? value.forEach(walk) : walk(value);
      }
    };
    blocks.forEach(walk);
    for (const type of expectedTypes) assert.ok(types.includes(type), `${file} missing @type ${type}`);
  }
});

test('zh-hant fur-elise title is fully converted to traditional characters', async () => {
  const html = await readFile('zh-hant/songs/fur-elise/index.html', 'utf8');
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  assert.ok(title.includes('致愛麗絲'), title);
  assert.ok(title.includes('彈奏'), title);
  assert.ok(!title.includes('丝'), title);
  assert.ok(!title.includes('弹'), title);
});

test('premium song library stylesheet defines readable dark cards', async () => {
  const css = await readFile('css/song-library-fix.css', 'utf8');
  assert.match(css, /body\.premium-song-library \.song-card/);
  assert.match(css, /display:\s*flex;/);
  assert.match(css, /margin-top:\s*auto;/);
  assert.match(css, /color:\s*#fff;/);
});

test('song interaction stylesheet hides inactive status space and supports fullscreen', async () => {
  const css = await readFile('css/song-interactions.css', 'utf8');
  assert.match(css, /practice-status-panel\.is-active/);
  assert.match(css, /practice-layout\.has-active-status/);
  assert.match(css, /song-practice-shell\.fullscreen/);
});
