import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { publicSongs } from '../data/song-library.mjs';
import { generateSongSite } from '../scripts/render-song-pages.mjs';

test('every generated song and library page initializes the existing GA property exactly once', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'piano-song-analytics-'));
  try {
    await generateSongSite(root);
    for (const locale of ['', 'en', 'zh-hant']) {
      for (const slug of ['', ...publicSongs.map(song => song.slug)]) {
        const file = path.join(locale, 'songs', slug, 'index.html');
        const html = await readFile(path.join(root, file), 'utf8');
        const head = html.split('</head>')[0];
        const tags = [...head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
        const loaders = tags.filter(([, attrs]) => attrs.includes('https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y'));
        assert.equal(loaders.length, 1, `${file}: expected one GA loader`);
        assert.match(loaders[0][1], /\basync\b/);
        const context = vm.createContext({});
        context.window = context;
        for (const [, attrs, source] of tags) {
          if (!/\b(?:src|type)=/.test(attrs)) vm.runInContext(source, context);
        }
        const calls = context.window.dataLayer?.map(args => Array.from(args));
        assert.equal(calls?.filter(([command]) => command === 'js').length, 1, `${file}: expected GA startup`);
        const configs = calls.filter(([command]) => command === 'config');
        assert.equal(configs.length, 1, `${file}: avoid duplicate page views`);
        assert.equal(configs[0][1], 'G-EYGD99YB4Y', `${file}: retain the existing property`);
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
