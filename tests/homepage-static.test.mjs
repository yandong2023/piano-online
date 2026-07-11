import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = [
  {
    path: 'index.html',
    titleStart: '把家，变成你的',
    titleAccent: '音乐厅。',
    songsHref: '/songs/'
  },
  {
    path: 'en/index.html',
    titleStart: 'Turn your home into a',
    titleAccent: 'concert hall.',
    songsHref: '/en/songs/'
  }
];

for (const page of pages) {
  test(`${page.path} renders one stable premium first paint`, async () => {
    const html = await readFile(page.path, 'utf8');

    assert.match(html, /<body class="homepage-premium">/);
    assert.match(html, /href="\/css\/home-premium\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/homepage-detail-fixes\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/song-pages\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/concert-hero\.css\?v=[^"]+"/);
    assert.match(html, /src="\/js\/main\.js\?v=[^"]+"/);
    assert.match(html, /<section class="hero hero-home hero-concert">/);
    assert.ok(html.includes(page.titleStart));
    assert.ok(html.includes(`<span class="hero-accent">${page.titleAccent}</span>`));
    assert.ok(html.includes(`href="${page.songsHref}" data-song-library-link="true"`));

    for (const requiredId of ['hero-start-fullscreen', 'song-select', 'sustain-toggle', 'labels-toggle', 'start-practice', 'start-rhythm-game', 'toggle-fullscreen']) {
      assert.ok(html.includes(`id="${requiredId}"`), `${page.path} is missing #${requiredId}`);
    }

    assert.doesNotMatch(html, /home-premium-style\.js/);
    assert.doesNotMatch(html, /en-home-style\.js/);
  });
}

test('legacy homepage modules are inert compatibility shims', async () => {
  const legacyHome = await readFile('js/home-premium-style.js', 'utf8');
  const legacyEnglish = await readFile('js/en-home-style.js', 'utf8');

  assert.doesNotMatch(legacyHome, /textContent|classList\.add|createElement\(['"]link/);
  assert.doesNotMatch(legacyEnglish, /textContent|classList\.add|createElement\(['"]link/);
});
