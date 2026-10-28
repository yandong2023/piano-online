import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
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
    assert.match(html, /class="studio-page(?: virtual-piano-home)?"/);
    assert.match(html, /\/css\/studio\.css/);
    assert.match(html, /\/js\/studio\.js/);
    for (const id of ['song-select','sustain-toggle','labels-toggle','start-practice','stop-practice','start-rhythm-game','toggle-fullscreen','studio-volume','keyboard-viewport']) assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.indexOf('data-studio') < html.indexOf('class="studio-discover"'));
    assert.doesNotMatch(html, /tutorial-overlay|88键|88 keys|src="piano\.js"/);
    assert.match(html, /37/);
    const homeUrl = locale === 'zh' ? 'https://pianoonline.cc/' : 'https://pianoonline.cc/en/';
    assert.ok(html.includes(`<link rel="canonical" href="${homeUrl}">`));
    if (home) {
      assert.deepEqual(html.match(/<link rel="alternate"[^>]*>/g), HOME_ALTERNATES);
    } else {
      assert.ok(!html.includes('<link rel="alternate"'), 'piano pages must not emit hreflang alternates');
      assert.ok(html.includes(`<meta property="og:url" content="${homeUrl}">`));
    }
    assert.equal(html.includes('adsbygoogle.js'), home, 'homepage monetization must not be removed by UX changes');
    assert.ok(!html.includes('zh-hant-runtime'), 'zh/en pages must not load the traditional runtime');
    assert.equal((html.match(/<h1>/g)||[]).length,1);
  });
}
test('zh home adds simulator while piano page keeps its title', () => {
  const html = renderStudioPage('zh', true);
  assert.ok(html.includes('<title>在线钢琴_免费模拟器·免下载免注册·简谱学歌</title>'));
  assert.match(html, /<h1>在线钢琴：打开就能弹，跟着亮键学歌曲<\/h1>/);
  assert.match(html, /<meta name="description" content="免费在线钢琴模拟器/);
  assert.ok(renderStudioPage('zh', false).includes('<title>在线钢琴 · 打开就能弹，跟着提示学歌 | Piano Online</title>'));
  assert.match(renderStudioPage('zh', false), /<h1>在线钢琴，打开就能弹。<\/h1>/);
});

test('V2.1 answers user tasks while preserving priority SEO phrases', () => {
  const zh = renderStudioPage('zh', true);
  const en = renderStudioPage('en', true);
  const traditional = renderTraditionalHome();
  assert.match(zh, /在线弹钢琴，三步就够了/);
  assert.match(en, /How to Play Piano Online in 3 Steps/);
  assert.match(en, /piano simulator/);
  assert.match(traditional, /線上鋼琴：打開就能彈，跟著亮鍵學歌曲/);
  for (const phrase of ['钢琴模拟器', '自由钢琴']) assert.ok(zh.includes(phrase), phrase);
  for (const phrase of ['virtual piano', 'visual piano', 'online piano', 'play piano online']) assert.ok(en.toLowerCase().includes(phrase), phrase);
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
  assert.ok(html.includes('<h1>線上鋼琴：打開就能彈，跟著亮鍵學歌曲</h1>'));
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
  assert.equal(html.match(/href="\/"/g).length, 1);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(ld['@graph'].map((node) => node['@type']), ['WebSite', 'WebApplication']);
  assert.equal(ld['@graph'][0].inLanguage, 'zh-Hant');
  assert.ok(html.includes('/js/zh-hant-runtime.js'));
});

test('homepage hreflang matches sitemap and /zh /es redirect to real locales', async () => {
  const sitemap = await readFile('sitemap.xml', 'utf8');
  for (const loc of ['https://pianoonline.cc/', 'https://pianoonline.cc/en/', 'https://pianoonline.cc/zh-hant/']) {
    const row = sitemap.split('\n').find((line) => line.includes(`<loc>${loc}</loc>`));
    assert.ok(row, loc);
    for (const link of HOME_ALTERNATES) {
      const hreflang = link.match(/hreflang="([^"]+)"/)[1];
      const href = link.match(/href="([^"]+)"/)[1];
      assert.match(row, new RegExp(`hreflang="${hreflang}" href="${href.replaceAll('/', '\\/')}"`));
    }
  }
  assert.doesNotMatch(sitemap, /<loc>https:\/\/pianoonline\.cc\/zh(?:\/|<)/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/pianoonline\.cc\/es(?:\/|<)/);
  assert.doesNotMatch(sitemap, /hreflang="(?:zh|es)"/);

  const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));
  const netlify = await readFile('netlify.toml', 'utf8');
  const aliases = [['/zh', '/'], ['/zh/', '/'], ['/es', '/en/'], ['/es/', '/en/']];
  for (const [source, destination] of aliases) {
    const rule = vercel.redirects.find((item) => item.source === source);
    assert.equal(rule?.destination, destination, source);
    assert.equal(rule.statusCode, 301);
    assert.match(netlify, new RegExp(`from = "${source}"\\n  to = "${destination}"\\n  status = 301`));
  }

  const rules = new Map(vercel.redirects.map((rule) => [rule.source, rule]));
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const rule = rules.get(pathname);
    if (rule) {
      response.writeHead(rule.statusCode, { Location: rule.destination });
      response.end();
      return;
    }
    if (pathname === '/' || pathname === '/en' || pathname === '/en/') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(pathname.startsWith('/en') ? renderStudioPage('en', true) : renderStudioPage('zh', true));
      return;
    }
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('missing');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    for (const [source, destination] of aliases) {
      const response = await fetch(`http://127.0.0.1:${port}${source}`, { redirect: 'manual' });
      assert.equal(response.status, 301, source);
      assert.equal(response.headers.get('location'), destination);
      await response.arrayBuffer();
    }
    for (const source of ['/', '/en', '/en/']) {
      const response = await fetch(`http://127.0.0.1:${port}${source}`, { redirect: 'manual' });
      assert.equal(response.status, 200, source);
      const html = await response.text();
      const title = html.match(/<title>([^<]*)<\/title>/)[1];
      if (source === '/') {
        assert.equal(title, '在线钢琴_免费模拟器·免下载免注册·简谱学歌');
        assert.match(html, /免费在线钢琴模拟器/);
        assert.match(html, /不用下载软件/);
      } else {
        assert.equal(title, 'Virtual Piano Online — Free Visual Piano');
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
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
  ['en', renderStudioPage('en'), ['online piano', 'visual piano']],
  ['zh-Hant', renderTraditionalHome(), ['鋼琴模擬器', '自由鋼琴', '五線譜']]
]) test(`${locale} home has visible localized FAQ matching independent JSON-LD`, () => {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const faqs = scripts.filter(item => item['@type'] === 'FAQPage');
  assert.equal(faqs.length, 1);
  assert.equal(faqs[0].inLanguage, locale === 'zh' ? 'zh-CN' : locale);
  assert.equal(faqs[0].mainEntity.length, 8);
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
  } else {
    assert.match(html, /<title>Virtual Piano Online — Free Visual Piano<\/title>/);
    assert.match(html, /<h1>Play Piano Online with Your Computer Keyboard<\/h1>/);
    for (const phrase of ['visual piano', 'online piano']) assert.ok(description.toLowerCase().includes(phrase), phrase);
    for (const phrase of ['virtual piano', 'play piano online']) assert.ok(html.toLowerCase().includes(phrase), phrase);
  }
});

// Guard the incident: all language homes must retain the real publisher loader exactly once.
test('homepage advertising stays enabled and respects dashboard format settings', async () => {
  const publisher = 'ca-pub-4423187689700927';
  const authorized = await readFile('ads.txt', 'utf8');
  assert.ok(authorized.includes(publisher.replace('ca-', '')));
  for (const html of [renderStudioPage('zh', true), renderStudioPage('en', true), renderTraditionalHome()]) {
    const scripts = html.match(/<script[^>]+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*>/g) || [];
    assert.equal(scripts.length, 1);
    assert.ok(scripts[0].includes(publisher));
    assert.ok(!scripts[0].includes('data-overlays'));
    assert.ok(html.indexOf(scripts[0]) < html.indexOf('</head>'));
  }
});
