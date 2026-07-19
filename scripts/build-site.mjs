import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSongSite } from './render-song-pages.mjs';
import { generateTutorialSite } from './render-tutorial-pages.mjs';
import { generateSitemaps } from './render-sitemaps.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const excluded = new Set(['.git', 'node_modules', 'dist']);

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const entry of await readdir(ROOT, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  await cp(path.join(ROOT, entry.name), path.join(DIST, entry.name), { recursive: true });
}

const songs = await generateSongSite(DIST);
const tutorials = await generateTutorialSite(DIST);
const sitemaps = await generateSitemaps(DIST);

console.log(`Built static site in dist with ${songs.count} public songs, ${tutorials.articles} new tutorials and ${sitemaps.total} sitemap URLs.`);
