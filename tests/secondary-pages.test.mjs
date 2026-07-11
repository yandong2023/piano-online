import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const premiumPages = [
  ['songs/index.html', 'song-library-theme', '/css/song-pages.css?v=20260711.6'],
  ['en/songs/index.html', 'song-library-theme', '/css/song-pages.css?v=20260711.6'],
  ['tutorials.html', 'secondary-page tutorials-page', '/css/secondary-pages.css?v=20260711.6'],
  ['en/tutorials.html', 'secondary-page tutorials-page', '/css/secondary-pages.css?v=20260711.6'],
  ['about.html', 'secondary-page about-page', '/css/secondary-pages.css?v=20260711.6'],
  ['en/about.html', 'secondary-page about-page', '/css/secondary-pages.css?v=20260711.6'],
  ['practice.html', 'secondary-page practice-page', '/css/secondary-pages.css?v=20260711.6']
];

for (const [path, bodyClass, stylesheet] of premiumPages) {
  test(`${path} uses the premium secondary page system`, async () => {
    const html = await readFile(path, 'utf8');
    assert.ok(html.includes(`<body class="${bodyClass}">`));
    assert.ok(html.includes(`href="${stylesheet}"`));
    assert.match(html, /class="nav-bar"/);
  });
}

test('practice page preserves every interactive hook', async () => {
  const html = await readFile('practice.html', 'utf8');
  for (const selector of [
    'start-stop', 'tempo-up', 'tempo-down', 'key-select', 'play-scale',
    'chord-type', 'play-chord', 'difficulty-selector', 'generate-notes',
    'staff-container', 'current-notes'
  ]) {
    assert.ok(html.includes(selector), `missing practice hook: ${selector}`);
  }
});

test('song detail CSS targets generated song bodies', async () => {
  const css = await readFile('css/song-pages.css', 'utf8');
  assert.match(css, /body\[data-song-id\]/);
  assert.match(css, /\.song-hero-panel/);
  assert.match(css, /\.song-practice-shell/);
});
