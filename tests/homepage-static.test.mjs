import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = [
  {
    path: 'index.html',
    title: '想弹的时候，音乐就在手边。',
    songsHref: '/songs/'
  },
  {
    path: 'en/index.html',
    title: 'Play the music you love, right from home.',
    songsHref: '/en/songs/'
  }
];

for (const page of pages) {
  test(`${page.path} renders one stable, cache-busted first paint`, async () => {
    const html = await readFile(page.path, 'utf8');

    assert.match(html, /<body class="homepage-premium">/);
    assert.match(html, /href="\/css\/home-premium\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/homepage-detail-fixes\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/song-pages\.css\?v=[^"]+"/);
    assert.match(html, /src="\/js\/main\.js\?v=[^"]+"/);
    assert.ok(html.includes(`<h1>${page.title}</h1>`));
    assert.ok(html.includes(`href="${page.songsHref}" data-song-library-link="true"`));
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
