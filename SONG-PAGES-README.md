# Song pages

`data/song-catalog.mjs` is the canonical source for song metadata and note sequences.

The first public bilingual song pages are:

- Happy Birthday
- Twinkle Twinkle Little Star
- Ode to Joy
- Jingle Bells
- Für Elise

When adding a new public song:

1. Add or update the catalog entry.
2. Set `seoEnabled: true` only after the page copy and rights status are reviewed.
3. Add both `/songs/{slug}/index.html` and `/en/songs/{slug}/index.html`.
4. Add both URLs to `sitemap-songs.xml`.
5. Run `npm test` to verify that all expected bilingual pages exist and the JavaScript modules parse.

Modern copyrighted songs should remain `seoEnabled: false` until publishing rights are reviewed.
