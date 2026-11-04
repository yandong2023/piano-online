import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { publicSongs } from '../data/song-library.mjs';
import { tutorialArticles } from '../data/tutorial-library.mjs';
import { renderStudioPage } from '../scripts/studio-pages.mjs';

const root = process.env.HUB_SITE_ROOT || '.';
const ids = ['happy-birthday', 'twinkle', 'ode-to-joy', 'jingle-bells', 'fur-elise', 'canon', 'silent-night', 'amazing-grace', 'moonlight', 'row-boat'];
const guideSlugs = ['computer-keyboard-piano', 'piano-keyboard-letters', 'beginner-30-day-plan', 'basic-piano-chords'];
const links = html => [...new Set([...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(m => m[1].split(/[?#]/)[0]).filter(Boolean))];
const read = url => readFile(path.join(root, url.endsWith('/') ? `${url}index.html` : url), 'utf8');

function checkHub(html) {
  // Visible navigation/main anchors only: exclude footer, locale roots, and non-intent paths.
  const visible = html.split('<footer')[0];
  const intents = links(visible).filter(h => ['/with-notes/', '/midi/'].includes(h) || /^\/en\/(?:piano\.html|songs(?:\/.*)?|tutorials\.html|about\.html|articles\/(?:guides|tutorials)\/.*)$/.test(h));
  assert.ok(intents.length >= 16 && intents.length <= 20, `EN intent count ${intents.length}, expected 16–20`);
  const cards = [...visible.matchAll(/<a class="studio-song-card" href="([^"]+)"/g)];
  assert.equal(cards.length, 10, 'curated Popular subset, not the entire library');
  for (const id of ids) {
    const song = publicSongs.find(s => s.id === id);
    assert.ok(song, `public song ${id}`);
    assert.ok(cards.some(m => m[1] === `/en/songs/${song.slug}/`), id);
  }
  assert.deepEqual([...visible.matchAll(/<small>(\d+)<\/small>/g)].map(m => m[1]), ids.map((_, i) => String(i + 1).padStart(2, '0')));
  assert.doesNotMatch(visible, /undefined/);
  for (const slug of guideSlugs) assert.ok(links(visible).includes(`/en/articles/guides/${slug}/`), slug);
  for (const url of ['/en/piano.html', '/en/songs/', '/en/tutorials.html', '/en/about.html']) assert.ok(links(html).includes(url), url);
}
test('EN rendered studio home and piano expose a bounded intent hub', () => {
  for (const home of [true, false]) checkHub(renderStudioPage('en', home));
});
test('generated EN homepage exposes the hub before the footer', async () => checkHub(await read('/en/')));

for (const id of ids) test(`hub song ${id} has home, library and two relevant siblings`, async () => {
  const song = publicSongs.find(s => s.id === id);
  const hrefs = links(await read(`/en/songs/${song.slug}/`));
  assert.ok(hrefs.includes('/en/'));
  assert.ok(hrefs.includes('/en/songs/'));
  const siblings = publicSongs.filter(s => s.id !== id && (ids.includes(s.id) || s.difficulty === song.difficulty));
  assert.ok(siblings.filter(s => hrefs.includes(`/en/songs/${s.slug}/`)).length >= 2);
});
for (const article of tutorialArticles) test(`guide ${article.slug} has home and two guide siblings`, async () => {
  const hrefs = links(await read(`/en/articles/guides/${article.slug}/`));
  assert.ok(hrefs.includes('/en/'));
  assert.ok(tutorialArticles.filter(a => a.slug !== article.slug && hrefs.includes(`/en/articles/guides/${a.slug}/`)).length >= 2);
});
for (const slug of ['piano-basics', 'reading-notes', 'rhythm-basics']) test(`legacy tutorial ${slug} has home and Learn or siblings`, async () => {
  const hrefs = links(await read(`/en/articles/tutorials/${slug}.html`));
  assert.ok(hrefs.includes('/en/'));
  assert.ok(hrefs.includes('/en/tutorials.html') || hrefs.filter(h => h.startsWith('/en/articles/tutorials/') && !h.endsWith(`/${slug}.html`)).length >= 2);
});
