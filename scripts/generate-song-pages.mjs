import { generateSongSite } from './render-song-pages.mjs';

const result = await generateSongSite();
console.log(`Generated ${result.pages} song pages from ${result.count} public-domain or traditional songs.`);
