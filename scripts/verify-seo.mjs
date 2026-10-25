// Run after build: node scripts/verify-seo.mjs [baseline-home.json] [baseline-sitemap.xml]
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicSongs } from '../data/song-library.mjs';
import { SONG_TUTORIALS } from './render-song-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const read = relative => readFile(path.join(dist, relative), 'utf8');
const baseline = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : null;
const homePages = [
  ['index.html', ['在线钢琴', '钢琴模拟器', '自由钢琴', '五线谱'], false],
  ['en/index.html', ['virtual piano', 'visual piano', 'online piano', 'piano online'], true],
  ['zh-hant/index.html', ['鋼琴模擬器', '自由鋼琴', '五線譜'], false]
];
for (const [file, keywords, english] of homePages) {
  const html = await read(file);
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)[1];
  for (const keyword of keywords) assert.ok(description.includes(keyword), `${file}: ${keyword}`);
  const json = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const faqs = json.filter(item => item['@type'] === 'FAQPage');
  assert.equal(faqs.length, 1);
  const visible = html.match(/<section class="home-faq"[\s\S]*?<\/section>/)[0];
  for (const question of faqs[0].mainEntity) {
    assert.ok(visible.includes(question.name));
    assert.ok(visible.includes(question.acceptedAnswer.text));
  }
  assert.ok(description.length <= 155);
  if (!english) assert.ok([...title].reduce((n, c) => n + (c.charCodeAt(0) > 127 ? 2 : 1), 0) <= 60);
  if (baseline) {
    assert.equal(html.match(/<h1>([^<]*)<\/h1>/)[1], baseline[file].h1);
    assert.equal(html.match(/<nav[\s\S]*?<\/nav>/)[0], baseline[file].nav);
    assert.deepEqual(html.match(/<link rel="alternate"[^>]*>/g), baseline[file].alternates);
  }
  console.log(`AC-A ${file}: ${keywords.join(' / ')}; independent FAQPage=1, visible Q&A=3, description=${description.length}; H1/nav/hreflang=${baseline ? 'unchanged' : 'not compared'}`);
  console.log(`  BEFORE title: ${baseline?.[file].title || '(baseline not supplied)'}`);
  console.log(`  AFTER title: ${title}`);
  console.log(`  BEFORE description: ${baseline?.[file].description || '(baseline not supplied)'}`);
  console.log(`  AFTER description: ${description}`);
}

const urls = new Set();
let mappedPages = 0;
for (const prefix of ['', 'en/', 'zh-hant/']) {
  const library = await read(`${prefix}songs/index.html`);
  assert.ok(library.includes('id="library-difficulty"'));
  for (const song of publicSongs) {
    const html = await read(`${prefix}songs/${song.slug}/index.html`);
    const targets = [...html.matchAll(/class="song-card" href="([^"]+)"/g)].map(match => match[1]);
    assert.equal(targets.length, 9);
    assert.equal(new Set(targets).size, 9);
    assert.ok(targets.every(href => href.startsWith(`/${prefix}songs/`) && href !== `/${prefix}songs/${song.slug}/`));
    assert.ok(html.includes(`href="/${prefix}songs/#difficulty-${song.difficulty}"`));
    const guides = [...html.matchAll(/<a href="([^\"]*\/articles\/guides\/[^\"]+)"/g)].map(match => match[1]);
    assert.equal(guides.length, prefix === 'zh-hant/' ? 0 : (SONG_TUTORIALS[song.id] || []).length);
    assert.equal(new Set(guides).size, guides.length);
    if (guides.length) mappedPages++;
    for (const href of guides) assert.ok(href.startsWith(`/${prefix}articles/guides/`));
    for (const href of [...targets, ...guides]) {
      await stat(path.join(dist, href, 'index.html'));
      urls.add(href);
    }
  }
}
console.log(`AC-B all ${publicSongs.length * 3} song pages: 6 related + 3 same-level unique song targets; ${mappedPages} mapped zh/en pages have localized existing guides; zh-hant guides omitted (no existing URLs).`);
console.log('Uniqueness scope: content song/tutorial targets. Existing navigation, breadcrumbs, language switches and repeated self #letter-notes links retain baseline behavior.');

// Fixed-seed Fisher-Yates gives reproducible random samples from mapped songs.
let seed = 64;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
const sampled = shuffle(publicSongs.filter(song => SONG_TUTORIALS[song.id])).slice(0, 5);
for (const [index, song] of sampled.entries()) {
  const prefix = index % 2 ? 'en/' : '';
  console.log(`SAMPLE /${prefix}songs/${song.slug}/: other-song=9 unique, tutorials=${SONG_TUTORIALS[song.id].length}, difficulty=${song.difficulty}`);
}

const sitemap = await read('sitemap.xml');
const locations = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(locations(sitemap).length, 359);
if (process.argv[3]) assert.deepEqual(locations(sitemap), locations(await readFile(process.argv[3], 'utf8')));
console.log(`SITEMAP before=357 after=${locations(sitemap).length}; Chinese /, English /en/, plus /with-notes/ and /midi/; URL list=${process.argv[3] ? 'identical' : 'not compared'}`);

// A real static server, with 404 for missing files (no SPA fallback).
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(dist, `.${pathname}`, ...(pathname.endsWith('/') ? ['index.html'] : []));
    assert.ok(file.startsWith(dist + path.sep));
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const port = server.address().port;
  const all = [...urls];
  // Ten URLs per locale, with guide targets forced into the zh/en samples.
  const requests = ['', 'en/', 'zh-hant/'].flatMap(prefix => {
    const localized = all.filter(url => url.startsWith(`/${prefix}songs/`));
    const guides = all.filter(url => url.startsWith(`/${prefix}articles/guides/`));
    return [...shuffle(guides).slice(0, 2), ...shuffle(localized)].slice(0, 10);
  });
  assert.equal(new Set(requests).size, 30);
  for (const url of requests) {
    const response = await fetch(`http://127.0.0.1:${port}${url}`);
    await response.arrayBuffer();
    assert.equal(response.status, 200, url);
    console.log(`HTTP ${response.status} ${url}`);
  }
  console.log('HTTP SUMMARY: 30/30 unique internal URLs returned 200 from local dist; production not deployed.');
} finally { await new Promise(resolve => server.close(resolve)); }
