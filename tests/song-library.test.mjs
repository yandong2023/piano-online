import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { publicSongs, songs } from '../data/song-library.mjs';
import { KEY_MAP, jianpu, letterNoteLines, noteName } from '../scripts/render-song-pages.mjs';

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

test('songs without score data omit the score stage entirely', async () => {
  const zh = await readFile('songs/turkish-march/index.html', 'utf8');
  const en = await readFile('en/songs/turkish-march/index.html', 'utf8');
  for (const html of [zh, en]) {
    assert.doesNotMatch(html, /data-score-viewer/);
    assert.doesNotMatch(html, /coming soon/i);
    assert.doesNotMatch(html, /正在补充/);
  }
  const birthday = await readFile('songs/happy-birthday/index.html', 'utf8');
  assert.match(birthday, /data-score-ready="true"/);
});

test('letter note lines cover every note and mapped computer key of all public songs', () => {
  for (const song of publicSongs) {
    const { names, keys } = letterNoteLines(song);
    assert.deepEqual(names.flat(), song.notes.map(noteName), `${song.id} names`);
    assert.deepEqual(keys.flat(), song.notes.map((pitch) => KEY_MAP[pitch]), `${song.id} keys`);
  }
});

test('jianpu covers every note with valid degree tokens on all public songs', () => {
  for (const song of publicSongs) {
    const { tokens } = jianpu(song);
    assert.equal(tokens.flat().length, song.notes.length, `${song.id} token count`);
    for (const token of tokens.flat()) assert.match(token, /^(#|b)?[1-7][̣̤̇̈]?$/, `${song.id}: ${token}`);
    assert.deepEqual(tokens.map((line) => line.length), letterNoteLines(song).names.map((line) => line.length), `${song.id} lines`);
  }
});

test('jianpu key labels and openings match reference songs', () => {
  const byId = (id) => publicSongs.find((song) => song.id === id);
  const strip = (token) => token.replace(/[̣̤̇̈]/g, '');
  const birthday = jianpu(byId('happy-birthday'));
  assert.equal(birthday.keyLabel, '1=C');
  assert.deepEqual(birthday.tokens.flat().slice(0, 6), ['5', '5', '6', '5', '1̇', '7']);
  assert.deepEqual(jianpu(byId('twinkle')).tokens.flat().slice(0, 7), ['1', '1', '5', '5', '6', '6', '5']);
  const elise = jianpu(byId('fur-elise'));
  assert.equal(elise.keyLabel, '1=C');
  const eliseStripped = elise.tokens.flat().map(strip);
  assert.ok(eliseStripped.includes('#2') && eliseStripped.includes('#5'));
  assert.equal(eliseStripped[0], '3');
  assert.equal(jianpu(byId('schubert-serenade')).keyLabel, '1=D');
  for (const song of publicSongs.filter((item) => item.keySignature === 'Gb Major')) assert.equal(jianpu(song).keyLabel, '1=♭G');
  for (const song of publicSongs.filter((item) => item.keySignature === 'A Minor')) assert.equal(jianpu(song).keyLabel, '1=C');
});

test('song pages render the complete letter notes, copy buttons and melody facts', async () => {
  const song = publicSongs.find((item) => item.id === 'fur-elise');
  const expectedNames = song.notes.map(noteName).join(' ');
  const expectedKeys = song.notes.map((pitch) => KEY_MAP[pitch]).join(' ');
  for (const [file, path] of [
    ['songs/fur-elise/index.html', '/songs/fur-elise/'],
    ['en/songs/fur-elise/index.html', '/en/songs/fur-elise/'],
    ['zh-hant/songs/fur-elise/index.html', '/zh-hant/songs/fur-elise/']
  ]) {
    const html = await readFile(file, 'utf8');
    assert.ok(html.includes('id="letter-notes"'), file);
    const namesText = html.match(/<pre id="letter-notes-names"[^>]*>([\s\S]*?)<\/pre>/)[1].replace(/\s+/g, ' ').trim();
    const keysText = html.match(/<pre id="letter-notes-keys"[^>]*>([\s\S]*?)<\/pre>/)[1].replace(/\s+/g, ' ').trim();
    assert.equal(namesText, expectedNames, `${file} note names`);
    assert.equal(keysText, expectedKeys, `${file} computer keys`);
    assert.equal((html.match(/data-copy-target=/g) || []).length, file.startsWith('en/') ? 2 : 3, `${file} copy buttons`);
    assert.ok(html.includes('D#') && html.includes('G#'), `${file} black-key facts`);
    assert.ok(html.includes(`href="${path}#letter-notes"`), `${file} letter-notes link`);
  }
});

test('jianpu notation renders on zh and zh-hant song pages but not en', async () => {
  const song = publicSongs.find((item) => item.id === 'fur-elise');
  const expectedCopy = jianpu(song).tokens.map((line) => line.join(' ')).join('\n');
  const copyText = (html) => html.match(/id="letter-notes-jianpu"[^>]*data-copy-text="([\s\S]*?)"/)[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  for (const [file, titleMark] of [['songs/fur-elise/index.html', '简谱'], ['zh-hant/songs/fur-elise/index.html', '簡譜']]) {
    const html = await readFile(file, 'utf8');
    assert.ok(html.includes('id="letter-notes-jianpu"'), `${file} jianpu pre`);
    assert.equal(copyText(html), expectedCopy, `${file} copy text`);
    assert.match(html, new RegExp(`<title>[^<]*${titleMark}`), `${file} title`);
    assert.match(html, /简谱开头是什么|簡譜開頭是什麼/, `${file} jianpu facts`);
  }
  const en = await readFile('en/songs/fur-elise/index.html', 'utf8');
  assert.ok(!en.includes('letter-notes-jianpu') && !en.includes('简谱'), 'en page has no jianpu');
});

test('twinkle explains that the melody uses only white keys', async () => {
  const en = await readFile('en/songs/twinkle-twinkle-little-star/index.html', 'utf8');
  assert.match(en, /only white keys/);
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

test('zh-hant song pages link home to the traditional home and drop the 繁體 nav link', async () => {
  const html = await readFile('zh-hant/songs/happy-birthday/index.html', 'utf8');
  assert.ok(html.includes('<a class="studio-brand" href="/zh-hant/"'));
  assert.ok(html.includes('<a href="/zh-hant/">首頁</a>'));
  assert.ok(!/>繁體</.test(html));
  const blocks = [...html.matchAll(/application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const breadcrumb = blocks.flatMap((b) => b['@graph']).find((node) => node['@type'] === 'BreadcrumbList');
  assert.equal(breadcrumb.itemListElement[0].item, 'https://pianoonline.cc/zh-hant/');
  assert.ok(html.includes('/js/zh-hant-runtime.js'));
});

test('sitemap includes the traditional home page', async () => {
  const xml = await readFile('sitemap.xml', 'utf8');
  assert.ok(xml.includes('<loc>https://pianoonline.cc/zh-hant/</loc>'));
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
