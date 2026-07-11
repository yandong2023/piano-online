import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSongSite } from './render-song-pages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const excluded = new Set(['.git', 'node_modules', 'dist']);

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

for (const entry of await readdir(ROOT, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  await cp(path.join(ROOT, entry.name), path.join(DIST, entry.name), { recursive: true });
}

const result = await generateSongSite(DIST);
console.log(`Built static site in dist with ${result.count} public songs and ${result.pages} song pages.`);
