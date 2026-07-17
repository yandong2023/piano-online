import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = [
  {
    path: 'index.html',
    titleStart: '跟着按键提示，弹完你的',
    titleAccent: '第一首歌。',
    guidedLabel: '跟着《生日快乐》弹',
    songsHref: '/songs/'
  },
  {
    path: 'en/index.html',
    titleStart: 'Follow the key prompts and finish your',
    titleAccent: 'first song.',
    guidedLabel: 'Play Happy Birthday with prompts',
    songsHref: '/en/songs/'
  }
];

for (const page of pages) {
  test(`${page.path} renders one stable guided first paint`, async () => {
    const html = await readFile(page.path, 'utf8');

    assert.match(html, /<body class="homepage-premium">/);
    assert.match(html, /href="\/css\/home-premium\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/homepage-detail-fixes\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/song-pages\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/concert-hero\.css\?v=[^"]+"/);
    assert.match(html, /href="\/css\/guided-homepage\.css\?v=[^"]+"/);
    assert.match(html, /src="\/js\/main\.js\?v=20260717\.1"/);
    assert.match(html, /<section class="hero hero-home hero-concert">/);
    assert.ok(html.includes(page.titleStart));
    assert.ok(html.includes(`<span class="hero-accent">${page.titleAccent}</span>`));
    assert.ok(html.includes(page.guidedLabel));
    assert.ok(html.includes('data-guided-song="happy-birthday"'));
    assert.ok(html.includes(`href="${page.songsHref}" data-song-library-link="true"`));
    assert.ok(html.includes('data-guided-ready="true"'));
    assert.ok(html.includes('practice-more-options'));

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
