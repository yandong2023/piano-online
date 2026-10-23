// Run after build: node scripts/verify-home-internal-links.mjs dist <clean-main-dist>
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { publicSongs } from '../data/song-library.mjs';
import { tutorialArticles } from '../data/tutorial-library.mjs';
import { legacyTutorialSlugs } from './locale-alternates.mjs';
import { applyArticleLanguage } from './apply-legacy-articles.mjs';

const [currentRoot, baselineRoot] = process.argv.slice(2);
assert.ok(currentRoot && baselineRoot, 'Provide current dist and clean-main baseline dist');
async function htmlFiles(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await htmlFiles(root, relative));
    else if (relative.endsWith('.html')) result.push(relative);
  }
  return result.sort();
}
const files = await htmlFiles(currentRoot);
assert.deepEqual(files, await htmlFiles(baselineRoot), 'HTML page set must remain unchanged');
const current = new Map(await Promise.all(files.map(async file => [file, await readFile(path.join(currentRoot, file), 'utf8')])));
const baseline = new Map(await Promise.all(files.map(async file => [file, await readFile(path.join(baselineRoot, file), 'utf8')])));
const text = html => html.replace(/<[^>]*>/g, '').trim();
// Templates use quoted hrefs and well-formed, non-nested anchors.
const links = html => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(match => ({
  href: match[1].match(/\bhref=["']([^"']*)["']/i)?.[1], text: text(match[2])
}));
const homeLinks = html => links(html).filter(a => a.href === '/' || a.href?.startsWith('/#'));
const traditionalHomeLinks = html => links(html).filter(a => a.href === '/zh-hant/' || a.href?.startsWith('/zh-hant/#'));
const breadcrumb = (html, kind) => links(html.match(new RegExp(`<div class="${kind}-breadcrumbs">([\\s\\S]*?)<\\/div>`))?.[1] || '')[0];
const schemaHome = html => {
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(match => { const value = JSON.parse(match[1]); return value['@graph'] || [value]; });
  return schemas.find(value => value['@type'] === 'BreadcrumbList')?.itemListElement[0];
};
const cta = html => [...html.matchAll(/<p class="song-home-cta">([\s\S]*?)<\/p>/g)];
const meta = html => [html.match(/<title>[\s\S]*?<\/title>/)?.[0], html.match(/<meta name="description"[^>]*>/)?.[0]];
let failures = 0;
async function check(name, fn) {
  try { console.log(`${name} PASS ${await fn()}`); }
  catch (error) { failures++; console.error(`${name} FAIL ${error.message}`); }
}

await check('AC-10', () => {
  for (const song of publicSongs) {
    const html = current.get(`songs/${song.slug}/index.html`);
    assert.deepEqual(breadcrumb(html, 'song'), { href: '/', text: '在线钢琴' }, song.slug);
    assert.equal(schemaHome(html).name, '在线钢琴', song.slug);
  }
  return '100 zh breadcrumbs + BreadcrumbList agree';
});
await check('AC-11', () => {
  for (const song of publicSongs) {
    const html = current.get(`songs/${song.slug}/index.html`);
    const paragraphs = cta(html);
    assert.equal(paragraphs.length, 1, song.slug);
    assert.equal(text(paragraphs[0][1]), '弹完这一段，可以回到免费的在线钢琴，从这首歌的第一句开始跟提示练。');
    assert.deepEqual(links(paragraphs[0][1]), [{ href: '/#practice-start', text: '免费的在线钢琴' }]);
    assert.ok(paragraphs[0].index < html.indexOf('<section class="song-content-section">'));
    assert.ok(homeLinks(html).length <= 3, song.slug);
  }
  return '100 zh CTAs: exact sentence, position, target; max home links=3';
});
await check('AC-12', () => {
  for (const song of publicSongs) {
    const en = current.get(`en/songs/${song.slug}/index.html`);
    assert.deepEqual(breadcrumb(en, 'song'), { href: '/en/', text: 'Home' });
    assert.ok(!en.includes('在线钢琴'));
    assert.equal(cta(en).length, 0);
    const hant = current.get(`zh-hant/songs/${song.slug}/index.html`);
    assert.deepEqual(breadcrumb(hant, 'song'), { href: '/zh-hant/', text: '在線鋼琴' });
    assert.equal(schemaHome(hant).name, '在線鋼琴');
    assert.equal(schemaHome(hant).item, 'https://pianoonline.cc/zh-hant/');
    assert.equal(cta(hant).length, 1);
    assert.deepEqual(links(cta(hant)[0][1]), [{ href: '/zh-hant/#practice-start', text: '免費的在線鋼琴' }]);
    assert.ok(!hant.includes('href="/#practice-start"'));
  }
  const englishFiles = files.filter(file => file.startsWith('en/'));
  for (const file of englishFiles) assert.equal(current.get(file), baseline.get(file), file);
  assert.equal(current.get('zh-hant/songs/index.html'), baseline.get('zh-hant/songs/index.html'));
  return `100 en + 100 zh-hant songs; all ${englishFiles.length} English HTML and zh-hant library byte-identical`;
});
await check('AC-13', () => {
  const library = current.get('songs/index.html');
  assert.equal(homeLinks(library).filter(a => a.text === '在线钢琴' && a.href === '/').length, 2);
  assert.match(library, /<header class="song-library-hero">[\s\S]*?<a href="\/">在线钢琴<\/a>/);
  assert.match(library, /<footer[\s\S]*?<a href="\/">在线钢琴<\/a>/);
  const index = current.get('tutorials.html');
  assert.equal(homeLinks(index).filter(a => a.text === '在线钢琴' && a.href === '/').length, 1);
  for (const song of ['/#practice-start']) {
    for (const file of ['tutorials.html', ...tutorialArticles.map(a => `articles/guides/${a.slug}/index.html`)]) {
      const original = homeLinks(baseline.get(file)).filter(a => a.href === song);
      assert.deepEqual(homeLinks(current.get(file)).filter(a => a.href === song), original, file);
    }
  }
  for (const article of tutorialArticles) {
    const html = current.get(`articles/guides/${article.slug}/index.html`);
    assert.deepEqual(breadcrumb(html, 'tutorial'), { href: '/', text: '在线钢琴' });
    assert.equal(schemaHome(html).name, '在线钢琴');
  }
  for (const slug of legacyTutorialSlugs) {
    const file = `articles/tutorials/${slug}.html`;
    assert.equal(homeLinks(current.get(file)).filter(a => a.text === '在线钢琴').length, 1, file);
    const opts = { slug, lang: 'zh-CN', root: currentRoot };
    assert.equal(applyArticleLanguage(current.get(file), opts), current.get(file), `idempotent ${file}`);
  }
  return '2 song-index anchors; 1 tutorial-index body anchor; 10 guides + 13 legacy; existing practice CTAs unchanged; legacy conversion idempotent';
});
await check('AC-14', () => {
  const counts = { zh: 0, 'zh-hant': 0, en: 0 };
  const groups = { songs: 0, guides: 0, legacy: 0, indexes: 0 };
  for (const file of files) {
    const locale = file.startsWith('en/') ? 'en' : file.startsWith('zh-hant/') ? 'zh-hant' : 'zh';
    const anchors = locale === 'zh-hant' ? traditionalHomeLinks(current.get(file)) : homeLinks(current.get(file));
    if (!anchors.some(a => /在线钢琴|在線鋼琴/.test(a.text))) continue;
    counts[locale]++;
    if (locale === 'zh') {
      if (/^songs\/.+\/index\.html$/.test(file)) groups.songs++;
      else if (file.startsWith('articles/guides/')) groups.guides++;
      else if (file.startsWith('articles/tutorials/')) groups.legacy++;
      else if (['songs/index.html', 'tutorials.html'].includes(file)) groups.indexes++;
    }
  }
  assert.deepEqual(counts, { zh: 125, 'zh-hant': 100, en: 0 });
  assert.deepEqual(groups, { songs: 100, guides: 10, legacy: 13, indexes: 2 });
  assert.equal(publicSongs.length, 100);
  assert.equal(tutorialArticles.length, 10);
  return `all ${files.length} HTML: ${JSON.stringify(counts)}; zh=${JSON.stringify(groups)}`;
});
await check('AC-15', () => {
  for (const file of files) {
    assert.deepEqual(meta(current.get(file)), meta(baseline.get(file)), file);
    // No added keyword link may target the duplicate piano page.
    const pianoLinks = html => links(html).filter(a => a.href?.endsWith('/piano.html'));
    assert.deepEqual(pianoLinks(current.get(file)), pianoLinks(baseline.get(file)), file);
  }
  assert.equal(current.get('index.html'), baseline.get('index.html'));
  assert.equal(current.get('piano.html'), baseline.get('piano.html'));
  return `all ${files.length} title/description pairs unchanged; home + piano HTML byte-identical; no changed piano.html links`;
});
await check('AC-16', () => {
  const violations = [];
  let maxZh = 0, maxHant = 0;
  for (const file of files) {
    const html = current.get(file);
    const zhCount = homeLinks(html).length;
    const hantCount = traditionalHomeLinks(html).length;
    maxZh = Math.max(maxZh, zhCount);
    maxHant = Math.max(maxHant, hantCount);
    if (zhCount > 3 || hantCount > 3) violations.push(`${file}: zh=${zhCount}, zh-hant=${hantCount}`);
  }
  assert.equal(violations.length, 0, `${violations.length} pages exceed 3; max zh=${maxZh}, max zh-hant=${maxHant}; samples: ${violations.slice(0, 3).join('; ')}`);
  return `all HTML: max zh=${maxZh}, max zh-hant=${maxHant}, violations=0 (all anchors including logos counted)`;
});
console.log(`Result: ${7 - failures}/7 AC groups passed`);
process.exitCode = failures ? 1 : 0;
