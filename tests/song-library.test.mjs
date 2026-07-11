import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { publicSongs, songs } from '../data/song-library.mjs';

const ids = publicSongs.map((song) => song.id);
const slugs = publicSongs.map((song) => song.slug);

test('classic library includes at least 35 public songs', () => {
  assert.ok(publicSongs.length >= 35, `expected at least 35 songs, received ${publicSongs.length}`);
});

test('public song ids and slugs are unique', () => {
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('every public song has usable bilingual metadata and notes', () => {
  for (const song of publicSongs) {
    assert.ok(song.title?.zh);
    assert.ok(song.title?.en);
    assert.ok(song.description?.zh);
    assert.ok(song.description?.en);
    assert.ok(song.notes.length >= 12, `${song.id} has too few notes`);
    assert.ok(song.notes.every((note) => /^[A-G](?:#|b)?-?\d+$/.test(note)), `${song.id} has an invalid note`);
  }
});

test('copyright-restricted modern songs stay out of the public library', () => {
  assert.equal(songs['river-flows'].copyrightRestricted, true);
  assert.equal(songs['butterfly-lovers'].copyrightRestricted, true);
  assert.ok(!ids.includes('river-flows'));
  assert.ok(!ids.includes('butterfly-lovers'));
});

test('generator creates representative Chinese and English pages', () => {
  for (const slug of ['minuet-in-g', 'turkish-march', 'brahms-lullaby', 'the-entertainer']) {
    assert.ok(existsSync(`songs/${slug}/index.html`), `missing Chinese page for ${slug}`);
    assert.ok(existsSync(`en/songs/${slug}/index.html`), `missing English page for ${slug}`);
  }
});

test('generated library pages expose the expanded catalog', async () => {
  const zh = await readFile('songs/index.html', 'utf8');
  const en = await readFile('en/songs/index.html', 'utf8');
  assert.match(zh, /35 首歌曲/);
  assert.match(zh, /G大调小步舞曲/);
  assert.match(en, /35 songs/);
  assert.match(en, /Eine kleine Nachtmusik/);
});
