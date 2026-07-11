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
  test(`${page.path} renders the final hero without runtime styling`, async () => {
    const html = await readFile(page.path, 'utf8');

    assert.match(html, /<body class="homepage-premium">/);
    assert.match(html, /<link rel="stylesheet" href="\/css\/home-premium\.css">/);
    assert.match(html, /<link rel="stylesheet" href="\/css\/homepage-detail-fixes\.css">/);
    assert.ok(html.includes(`<h1>${page.title}</h1>`));
    assert.ok(html.includes(`href="${page.songsHref}" data-song-library-link="true"`));
    assert.doesNotMatch(html, /home-premium-style\.js/);
  });
}
