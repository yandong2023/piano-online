import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderFocusedLanding, renderStudioPage } from '../scripts/studio-pages.mjs';

const landing = renderStudioPage('en', true);

test('English homepage is the virtual piano landing', () => {
  assert.match(landing, /<html lang="en">/);
  assert.match(landing, /<title>Virtual Piano Online — Play Free in Browser<\/title>/);
  assert.match(landing, /<h1>Virtual Piano<\/h1>/);
  assert.match(landing, /visual piano you can play online/);
  assert.match(landing, /No download and no account/);
  assert.equal((landing.match(/<h1>/g) || []).length, 1);
  const guide = '<h2>What is a virtual piano?</h2>';
  assert.ok(landing.indexOf('id="keyboard-viewport"') < landing.indexOf(guide));
  assert.ok(landing.indexOf(guide) < landing.indexOf('class="studio-discover"'));
  assert.match(landing, /How to play/);
  assert.match(landing, /href="\/midi\/"/);
  assert.match(landing, /href="\/with-notes\/"/);
  assert.match(landing, /id="labels-toggle" checked/);
  assert.match(landing, /virtual-piano-home\.css/);
  assert.doesNotMatch(landing, /<form|type="password"|在线钢琴/);
  assert.match(landing, /adsbygoogle\.js/);
  assert.doesNotMatch(landing, /<section id="practice-start"[\s\S]*adsbygoogle/);
});

test('note and MIDI landings link back to the homepage', () => {
  const notes = renderFocusedLanding('notes');
  const midi = renderFocusedLanding('midi');
  assert.match(notes, /<h1>Virtual piano with notes<\/h1>/);
  assert.match(notes, /href="\/"/);
  assert.match(notes, /href="\/midi\/"/);
  assert.match(notes, /id="keyboard-viewport"/);
  assert.match(notes, /id="labels-toggle" checked/);
  assert.match(midi, /<h1>Piano MIDI online — drop file to play<\/h1>/);
  assert.match(midi, /id="midi-drop"/);
  assert.match(midi, /id="midi-file"/);
  assert.match(midi, /href="\/"/);
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

test('published homepage file is English and ad rules protect the keyboard', async () => {
  const html = await readFile('index.html', 'utf8');
  const css = await readFile('css/virtual-piano-home.css', 'utf8');
  const sitemap = await readFile('sitemap.xml', 'utf8');
  assert.equal(html, landing);
  assert.match(css, /studio-instrument/);
  assert.match(css, /position:\s*static !important/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/with-notes\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/midi\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/pianoonline\.cc\/piano\.html<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/pianoonline\.cc\/en\/<\/loc>/);
});
