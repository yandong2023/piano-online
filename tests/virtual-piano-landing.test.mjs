import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderFocusedLanding, renderStudioPage } from '../scripts/studio-pages.mjs';

const landing = renderStudioPage('en', true);

test('English homepage SEO copy stays consistent in source and published HTML', async () => {
  const title = 'Free Online Piano & Piano Simulator — Virtual Piano';
  const description = 'Free online piano and piano simulator in your browser. Play with keyboard, mouse or touch. Follow highlighted keys to learn songs — no download, no signup.';
  for (const html of [landing, await readFile('en/index.html', 'utf8')]) {
    assert.ok(html.includes(`<title>${title}</title>`));
    assert.ok(html.includes(`<meta name="description" content="${description}">`));
    assert.ok(html.includes(`<meta property="og:title" content="${title}">`));
    assert.ok(html.includes(`<meta property="og:description" content="${description}">`));
    assert.ok(html.includes('<h1>Free Online Piano Simulator — Play Instantly</h1>'));
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    assert.equal(graph.find(node => node['@type'] === 'WebSite').name, title);
    assert.equal(graph.find(node => node['@type'] === 'WebApplication').description, description);
  }
});

test('English homepage is the virtual piano landing', () => {
  assert.match(landing, /<html lang="en">/);
  assert.match(landing, /<title>Free Online Piano & Piano Simulator — Virtual Piano<\/title>/);
  assert.match(landing, /<h1>Free Online Piano Simulator — Play Instantly<\/h1>/);
  assert.match(landing, /free virtual piano using your computer keyboard/);
  assert.match(landing, /No downloads or signup/);
  assert.equal((landing.match(/<h1>/g) || []).length, 1);
  const guide = '<h2>What is a virtual piano?</h2>';
  assert.ok(landing.indexOf('id="keyboard-viewport"') < landing.indexOf(guide));
  assert.ok(landing.indexOf('class="studio-discover"') < landing.indexOf(guide));
  assert.ok(landing.indexOf('<h1>') < landing.indexOf('href="/with-notes/"'));
  assert.match(landing, /How to play/);
  assert.match(landing, /href="\/midi\/"/);
  assert.match(landing, /<h2>Virtual piano with notes<\/h2>/);
  assert.match(landing, /href="\/with-notes\/"/);
  assert.match(landing, /href="\/" lang="zh-CN" hreflang="zh-CN">在线钢琴<\/a>/);
  assert.match(landing, /id="labels-toggle" checked/);
  assert.match(landing, /virtual-piano-home\.css/);
  assert.doesNotMatch(landing, /<form|type="password"/);
  const head = landing.slice(0, landing.indexOf('</head>'));
  assert.doesNotMatch(head, /在线钢琴|琴鍵|琴键/);
  for (const phrase of ['virtual piano', 'piano simulator', 'online piano']) {
    assert.ok(`${head} ${landing.match(/<h1>[^<]*<\/h1>/)[0]}`.toLowerCase().includes(phrase), phrase);
  }
  assert.match(landing, /adsbygoogle\.js/);
  assert.doesNotMatch(landing, /<section id="practice-start"[\s\S]*adsbygoogle/);
});

test('note and MIDI landings link back to the homepage', () => {
  const notes = renderFocusedLanding('notes');
  const midi = renderFocusedLanding('midi');
  assert.match(notes, /<title>Virtual Piano with Notes – Labeled Keys Online<\/title>/);
  assert.match(notes, /<h1>Virtual Piano with Notes on Every Key<\/h1>/);
  assert.match(notes, /What do the labels mean\?/);
  assert.match(notes, /<h2>Computer key labels<\/h2>/);
  assert.match(notes, /href="\/en\/"/);
  assert.match(notes, /href="\/midi\/"/);
  assert.match(notes, /id="keyboard-viewport"/);
  assert.match(notes, /id="labels-toggle" checked/);
  assert.match(midi, /<h1>Play a MIDI File on a Virtual Piano<\/h1>/);
  assert.match(midi, /id="midi-drop"/);
  assert.match(midi, /id="midi-file"/);
  assert.match(midi, /href="\/en\/"/);
  assert.match(midi, /href="\/with-notes\/"/);
  assert.match(midi, /id="keyboard-viewport"/);
  assert.match(midi, /midi-drop\.mjs/);
  for (const html of [notes, midi]) {
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.match(html, /<html lang="en">/);
    assert.doesNotMatch(html, /在线钢琴|adsbygoogle/);
    assert.ok(html.indexOf('<h1>') < html.indexOf('id="keyboard-viewport"'));
  }
});

test('published default is Chinese and English has an independent homepage', async () => {
  const html = await readFile('index.html', 'utf8');
  const css = await readFile('css/virtual-piano-home.css', 'utf8');
  const sitemap = await readFile('sitemap.xml', 'utf8');
  assert.equal(html, renderStudioPage('zh', true));
  assert.equal(await readFile('en/index.html', 'utf8'), landing);
  assert.match(html, /<html lang="zh-CN">/);
  assert.doesNotMatch(css, /adsbygoogle|google-auto-placed|aswift_/);
  assert.doesNotMatch(await readFile('css/studio.css', 'utf8'), /adsbygoogle|googlesyndication|google-auto-placed/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/with-notes\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/midi\/<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/pianoonline\.cc\/piano\.html<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/en\/<\/loc>/);
});
