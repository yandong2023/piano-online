import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { NEW_PIANO_LOCALES, pianoUi, translatePiano, pianoLocaleNames } from '../data/piano-locales.mjs';
import { pianoHomeCopy } from '../data/piano-home-copy.mjs';
import { renderStudioPage, renderTraditionalHome, studioLanguageMenu } from '../scripts/studio-pages.mjs';
import { getLocale, pianoText, t } from '../js/i18n.js';

const expectedHomes = ['zh-CN', 'en', 'zh-Hant', 'ru', 'fr', 'es', 'ja', 'it', 'ko', 'x-default'];
const keywords = { ru: 'пианино онлайн', fr: 'piano en ligne', es: 'piano virtual online', ja: 'オンラインピアノ', it: 'pianoforte online', ko: '가상 피아노' };
const esc = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

test('every interactive translation has all six languages', async () => {
  for (const [key, values] of Object.entries(pianoUi)) {
    assert.equal(values.length, 6, key);
    assert.ok(values.every(value => typeof value === 'string' && value.trim()), key);
  }
  const instrument = (await readFile('scripts/studio-pages.mjs', 'utf8')).split('export function studioInstrument')[1].split('const homeFaq')[0];
  const sources = [instrument, ...await Promise.all(['js/studio.js', 'js/studio-recorder.mjs'].map(file => readFile(file, 'utf8')))];
  for (const source of sources) {
    for (const match of source.matchAll(/(?:s|text)\(\s*'(?:[^'\\]|\\.)*'\s*,\s*'((?:[^'\\]|\\.)*)'/g)) {
      assert.ok(pianoUi[match[1]], `Untranslated interactive copy: ${match[1]}`);
    }
  }
});

for (const locale of NEW_PIANO_LOCALES) {
  test(`${locale} is a real, server-rendered piano home with matching SEO and FAQ data`, async () => {
    const copy = pianoHomeCopy[locale];
    const html = renderStudioPage(locale);
    const url = `https://pianoonline.cc/${locale}/`;
    assert.equal(await readFile(`${locale}/index.html`, 'utf8'), html);
    assert.ok(html.includes(`<html lang="${locale}">`));
    assert.ok(html.includes(`<title>${esc(copy.title)}</title>`));
    assert.ok(copy.title.toLowerCase().includes(keywords[locale]), `${locale} primary intent`);
    assert.ok(html.includes(`<meta name="description" content="${esc(copy.description)}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(html.includes(`<h1>${esc(copy.h1)}</h1>`));
    assert.doesNotMatch(html, /undefined|\[object Object\]|type="password"/);
    assert.ok(html.includes('data-record-wav') && html.includes('data-record-download'));
    assert.ok(html.indexOf('data-studio') < html.indexOf('class="home-faq"'));
    assert.ok(html.includes(`>${esc(translatePiano(locale, '', 'Record'))}</button>`));
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const app = data.find(node => node['@type'] === 'WebApplication');
    assert.equal(app.url, url);
    assert.equal(app.inLanguage, locale);
    assert.equal(app.description, copy.description);
    const faq = data.find(node => node['@type'] === 'FAQPage');
    assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), copy.faq);
    for (const [q, a] of copy.faq) assert.ok(html.includes(esc(q)) && html.includes(esc(a)));
    assert.ok(html.includes(esc(copy.libraryNote)));
    assert.ok(html.includes('href="/en/songs/" hreflang="en"'));
    assert.ok(!html.includes(`href="/${locale}/songs/"`), 'do not invent translated song routes');
  });

  test(`${locale} runtime messages and practice results stay in the selected language`, () => {
    const original = globalThis.document;
    try {
      globalThis.document = { documentElement: { lang: locale } };
      assert.equal(getLocale(), locale);
      assert.equal(pianoText('开始录音', 'Record'), translatePiano(locale, '', 'Record'));
      assert.equal(t('practice.correct'), translatePiano(locale, '', 'Correct'));
      assert.equal(t('practice.completedTitle'), translatePiano(locale, '', 'Song completed!'));
      assert.equal(t('practice.practiceAgain'), translatePiano(locale, '', 'Practice again'));
      assert.equal(t('practice.stop'), translatePiano(locale, '', 'Stop Practice'));
    } finally { globalThis.document = original; }
  });
}

test('all nine language homes have reciprocal alternates and working native language menus', async () => {
  const sitemap = await readFile('sitemap.xml', 'utf8');
  const pages = [renderStudioPage('zh'), renderStudioPage('en'), renderTraditionalHome(), ...NEW_PIANO_LOCALES.map(locale => renderStudioPage(locale))];
  for (const html of pages) {
    const tags = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
    assert.deepEqual(tags.map(match => match[1]), expectedHomes);
    assert.equal(tags.find(match => match[1] === 'x-default')[2], 'https://pianoonline.cc/en/');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)[1];
    const sitemapRow = sitemap.split('\n').find(row => row.includes(`<loc>${canonical}</loc>`));
    assert.ok(sitemapRow, canonical);
    for (const [, lang, href] of tags) assert.ok(sitemapRow.includes(`hreflang="${lang}" href="${href}"`));
  }
  for (const locale of NEW_PIANO_LOCALES) {
    const menu = studioLanguageMenu(locale, 'piano', '', true);
    assert.ok(menu.includes(`lang="${locale}" aria-current="true">${pianoLocaleNames[locale]}</span>`));
    assert.equal((menu.match(/class="studio-lang-option"/g) || []).length, 9);
  }
});

test('Spanish home no longer redirects to English on either hosting configuration', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.ok(!config.redirects.some(rule => /^\/es\/?$/.test(rule.source)));
  assert.doesNotMatch(await readFile('netlify.toml', 'utf8'), /from = "\/es\/?"/);
  assert.equal((await readFile('sitemap.xml', 'utf8')).match(/<loc>/g).length, 367);
});
