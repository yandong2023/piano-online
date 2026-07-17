import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const premiumPages = [
  { path: 'songs/index.html', classes: ['song-library-theme'], stylesheet: '/css/song-pages.css' },
  { path: 'en/songs/index.html', classes: ['song-library-theme'], stylesheet: '/css/song-pages.css' },
  { path: 'tutorials.html', classes: ['secondary-page', 'tutorials-page'], stylesheet: '/css/secondary-pages.css' },
  { path: 'en/tutorials.html', classes: ['secondary-page', 'tutorials-page'], stylesheet: '/css/secondary-pages.css' },
  { path: 'about.html', classes: ['secondary-page', 'about-page'], stylesheet: '/css/secondary-pages.css' },
  { path: 'en/about.html', classes: ['secondary-page', 'about-page'], stylesheet: '/css/secondary-pages.css' },
  { path: 'practice.html', classes: ['secondary-page', 'practice-page'], stylesheet: '/css/secondary-pages.css' }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const page of premiumPages) {
  test(`${page.path} uses the premium secondary page system`, async () => {
    const html = await readFile(page.path, 'utf8');
    const bodyClassMatch = html.match(/<body class="([^"]+)"/);

    assert.ok(bodyClassMatch, `${page.path} is missing a body class`);
    const bodyClasses = new Set(bodyClassMatch[1].split(/\s+/));
    for (const className of page.classes) {
      assert.ok(bodyClasses.has(className), `${page.path} is missing .${className}`);
    }

    const stylesheetPattern = new RegExp(`href="${escapeRegExp(page.stylesheet)}\\?v=[^"]+"`);
    assert.match(html, stylesheetPattern);
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
