// Generated pages in this repository are sourced from data/song-catalog.mjs.
// Run `npm run generate:songs` after updating the catalog.
import { songList } from '../data/song-catalog.mjs';
import { existsSync } from 'node:fs';

const publicSongs = songList.filter((song) => song.seoEnabled);
const expected = publicSongs.flatMap((song) => [
  `songs/${song.slug}/index.html`,
  `en/songs/${song.slug}/index.html`
]);

const missing = expected.filter((path) => !existsSync(path));
if (missing.length) {
  console.error('Missing generated song pages:\n' + missing.join('\n'));
  process.exit(1);
}
console.log(`Validated ${expected.length} generated song pages from ${publicSongs.length} catalog entries.`);
