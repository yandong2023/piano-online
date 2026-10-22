import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderStudioPage, renderTraditionalHome, studioInstrument } from '../scripts/studio-pages.mjs';
import { toTraditionalText } from '../data/zh-hant.mjs';

const HOME_ALTERNATES = [
  '<link rel="alternate" hreflang="zh-CN" href="https://pianoonline.cc/">',
  '<link rel="alternate" hreflang="en" href="https://pianoonline.cc/en/">',
  '<link rel="alternate" hreflang="zh-Hant" href="https://pianoonline.cc/zh-hant/">',
  '<link rel="alternate" hreflang="x-default" href="https://pianoonline.cc/en/">'
];

for (const locale of ['zh','en']) for (const home of [true,false]) {
  test(`${locale} ${home ? 'home' : 'piano'} has a playable first paint and accurate content`, () => {
    const html=renderStudioPage(locale,home);
    assert.match(html, /class="studio-page"/);
    assert.match(html, /\/css\/studio\.css/);
    assert.match(html, /\/js\/studio\.js/);
    for (const id of ['song-select','sustain-toggle','labels-toggle','start-practice','stop-practice','start-rhythm-game','toggle-fullscreen','studio-volume','keyboard-viewport']) assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.indexOf('data-studio') < html.indexOf('class="studio-discover"'));
    assert.doesNotMatch(html, /tutorial-overlay|88键|88 keys|src="piano\.js"/);
    assert.match(html, /37/);
    const homeUrl = `https://pianoonline.cc${locale === 'zh' ? '' : '/en'}/`;
    assert.ok(html.includes(`<link rel="canonical" href="${homeUrl}">`));
    if (home) {
      assert.deepEqual(html.match(/<link rel="alternate"[^>]*>/g), HOME_ALTERNATES);
    } else {
      assert.ok(!html.includes('<link rel="alternate"'), 'piano pages must not emit hreflang alternates');
      assert.ok(html.includes(`<meta property="og:url" content="${homeUrl}">`));
    }
    assert.equal(html.includes('adsbygoogle.js'), home);
    assert.ok(!html.includes('zh-hant-runtime'), 'zh/en pages must not load the traditional runtime');
    assert.equal((html.match(/<h1>/g)||[]).length,1);
  });
}
test('zh home adds simulator while piano page keeps its title', () => {
  const html = renderStudioPage('zh', true);
  assert.ok(html.includes('<title>在线钢琴模拟器 · 跟着提示学歌 | Piano Online</title>'));
  assert.ok(renderStudioPage('zh', false).includes('<title>在线钢琴 · 打开就能弹，跟着提示学歌 | Piano Online</title>'));
});

test('zh home language menu links all locales and marks 简体中文 current', () => {
  const html = renderStudioPage('zh', true);
  assert.ok(!html.includes('studio-language'));
  assert.ok(html.includes('<details class="studio-lang">'));
  assert.ok(html.includes('<span class="studio-lang-option" lang="zh-CN" aria-current="true">简体中文</span>'));
  assert.ok(html.includes('<a class="studio-lang-option" href="/zh-hant/" lang="zh-Hant"'));
  assert.ok(html.includes('<a class="studio-lang-option" href="/en/" lang="en"'));
});

test('en piano page language menu links back to zh piano and zh-hant home', () => {
  const html = renderStudioPage('en', false);
  assert.ok(!html.includes('studio-language'));
  assert.ok(html.includes('<a class="studio-lang-option" href="/piano.html" lang="zh-CN"'));
  assert.ok(html.includes('<a class="studio-lang-option" href="/zh-hant/" lang="zh-Hant"'));
  assert.ok(html.includes('<span class="studio-lang-option" lang="en" aria-current="true">English</span>'));
});

test('zh-hant home renders traditional content with correct head and nav', () => {
  const html = renderTraditionalHome();
  assert.match(html, /<html lang="zh-Hant">/);
  assert.ok(html.includes('<title>線上鋼琴模擬器 · 跟著提示學歌 | Piano Online</title>'));
  assert.ok(html.includes('<link rel="canonical" href="https://pianoonline.cc/zh-hant/">'));
  assert.deepEqual(html.match(/<link rel="alternate"[^>]*>/g), HOME_ALTERNATES);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.ok(html.includes('<h1>線上鋼琴，打開就能彈。</h1>'));
  assert.ok(html.includes('adsbygoogle.js'));
  for (const id of ['song-select','sustain-toggle','labels-toggle','start-practice','stop-practice','start-rhythm-game','toggle-fullscreen','studio-volume','keyboard-viewport']) assert.ok(html.includes(`id="${id}"`));
  const texts = [/<title>([^<]*)<\/title>/, /<h1>([^<]*)<\/h1>/, /<meta name="description" content="([^"]*)">/]
    .map((pattern) => html.match(pattern)[1]);
  for (const text of texts) assert.ok(!/钢|琴键|弹/.test(text), text);
  assert.ok(html.includes('<details class="studio-lang">'));
  assert.ok(html.includes('<a class="studio-lang-option" href="/" lang="zh-CN"'));
  assert.ok(html.includes('<a class="studio-lang-option" href="/en/" lang="en"'));
  assert.ok(html.includes('<span class="studio-lang-option" lang="zh-Hant" aria-current="true">繁體中文</span>'));
  assert.match(html, /class="studio-song-card" href="\/zh-hant\/songs\//);
  assert.ok(!html.includes('href="/songs/'));
  assert.ok(!html.includes('href="/piano.html"'));
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(ld['@graph'].map((node) => node['@type']), ['WebSite', 'WebApplication']);
  assert.equal(ld['@graph'][0].inLanguage, 'zh-Hant');
  assert.ok(html.includes('/js/zh-hant-runtime.js'));
});

test('toTraditionalText converts runtime strings including 分钟 and 复制', () => {
  assert.equal(toTraditionalText('随手按下一个音符。点击琴键 3 分钟 已复制'), '隨手按下一個音符。點擊琴鍵 3 分鐘 已複製');
});

test('instrument controls use labels, button types and live status',()=>{
  const html=studioInstrument('zh');
  assert.match(html,/for="song-select"/); assert.match(html,/for="studio-volume"/);
  assert.match(html,/aria-pressed="true"/); assert.match(html,/role="status"/);
  assert.match(html,/data-play-mode="guided"/); assert.match(html,/id="studio-song-bar" hidden/);
});
test('input and focus safety are implemented without replacing the audio engine',async()=>{
  const source=await readFile('js/studio.js','utf8');
  for(const term of ['pointercancel','lostpointercapture','visibilitychange','isFormControl','noteHolders','studio-focus-fallback','aria-pressed','releaseAll']) assert.ok(source.includes(term));
  assert.match(source,/extends Piano/);
});
test('legacy homepage modules remain inert compatibility shims',async()=>{
  for(const file of ['js/home-premium-style.js','js/en-home-style.js'])assert.doesNotMatch(await readFile(file,'utf8'),/textContent|classList\.add|createElement\(['"]link/);
});

for (const [locale, html, keywords] of [
  ['zh', renderStudioPage('zh'), ['钢琴模拟器', '自由钢琴', '五线谱']],
  ['en', renderStudioPage('en'), ['piano simulator']],
  ['zh-Hant', renderTraditionalHome(), ['鋼琴模擬器', '自由鋼琴', '五線譜']]
]) test(`${locale} home has visible localized FAQ matching independent JSON-LD`, () => {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const faqs = scripts.filter(item => item['@type'] === 'FAQPage');
  assert.equal(faqs.length, 1);
  assert.equal(faqs[0].inLanguage, locale === 'zh' ? 'zh-CN' : locale);
  assert.equal(faqs[0].mainEntity.length, 3);
  const section = html.match(/<section class="home-faq"[\s\S]*?<\/section>/)[0];
  for (const { name, acceptedAnswer } of faqs[0].mainEntity) {
    assert.ok(section.includes(name));
    assert.ok(section.includes(acceptedAnswer.text));
  }
  const description = html.match(/<meta name="description" content="([^"]*)/)[1];
  assert.ok(description.length <= 155);
  for (const keyword of keywords) assert.ok(description.includes(keyword), keyword);
  if (locale !== 'en') {
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert.ok([...title].reduce((n, char) => n + (char.charCodeAt(0) > 127 ? 2 : 1), 0) <= 60);
  } else assert.match(html, /<title>Virtual Piano Online: Play Free with Your Computer Keyboard<\/title>/);
});
