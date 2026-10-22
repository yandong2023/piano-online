import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { publicSongs } from '../data/song-library.mjs';
import { toTraditionalHtml } from '../data/zh-hant.mjs';

export const STUDIO_VERSION = '20261001.1';
const esc = (v = '') => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function studioLanguageMenu(current = 'zh', active = 'piano', songSlug = '', home = false) {
  const song = songSlug ? `${songSlug}/` : '';
  const page = home ? '/' : active === 'songs' ? `/songs/${song}` : active === 'learn' ? '/tutorials.html' : '/piano.html';
  const options = [
    ['zh', 'zh-CN', '简体中文', page],
    ['zh-hant', 'zh-Hant', '繁體中文', active === 'songs' ? `/zh-hant/songs/${song}` : '/zh-hant/'],
    ['en', 'en', 'English', `/en${page}`]
  ];
  const label = { zh: '切换语言', 'zh-hant': '切換語言', en: 'Change language' }[current];
  const short = { zh: '中文', 'zh-hant': '繁體', en: 'EN' }[current];
  const items = options.map(([id, lang, name, href]) => id === current
    ? `<span class="studio-lang-option" lang="${lang}" aria-current="true">${name}</span>`
    : `<a class="studio-lang-option" href="${href}" lang="${lang}" hreflang="${lang}">${name}</a>`).join('');
  return `<details class="studio-lang"><summary aria-label="${label}"><span class="studio-lang-globe" aria-hidden="true"></span>${short}</summary><div class="studio-lang-menu">${items}</div></details>`;
}

export function studioNav(locale = 'zh', active = 'piano', songSlug = '', home = false) {
  const zh = locale === 'zh', base = zh ? '' : '/en';
  return `<nav class="nav-bar" aria-label="${zh ? '主导航' : 'Main navigation'}"><div class="nav-container"><a class="studio-brand" href="${base}/" aria-label="Piano Online"><span class="brand-keys" aria-hidden="true"><i></i><i></i><i></i></span><span>Piano<span class="brand-light">Online</span><small>${zh ? '让音乐发生' : 'MAKE A LITTLE MUSIC'}</small></span></a><div class="nav-links"><a href="${base}/piano.html"${active === 'piano' ? ' class="active" aria-current="page"' : ''}>${zh ? '弹钢琴' : 'Piano'}</a><a href="${base}/songs/"${active === 'songs' ? ' class="active" aria-current="page"' : ''}>${zh ? '找首歌' : 'Songs'}</a><a href="${base}/tutorials.html"${active === 'learn' ? ' class="active" aria-current="page"' : ''}>${zh ? '学一点' : 'Learn'}</a>${studioLanguageMenu(locale, active, songSlug, home)}</div></div></nav>`;
}

export function studioInstrument(locale = 'zh', songId = 'happy-birthday') {
  const zh = locale === 'zh', s = (a, b) => zh ? a : b;
  const options = publicSongs.map(song => `<option value="${esc(song.id)}"${song.id === songId ? ' selected' : ''}>${esc(song.title[locale])}</option>`).join('');
  return `<section id="practice-start" class="practice-section studio-instrument song-practice-shell" tabindex="-1" aria-label="${s('在线钢琴', 'Interactive piano')}" data-studio>
  <div class="studio-toolbar"><div class="studio-modes" role="group" aria-label="${s('演奏模式', 'Playing mode')}"><button type="button" data-play-mode="free" aria-pressed="true">${s('自由弹奏', 'Free play')}</button><button type="button" data-play-mode="guided" aria-pressed="false">${s('跟着提示弹', 'Learn a song')}</button></div><button type="button" id="toggle-fullscreen" class="studio-quiet" aria-pressed="false"><span aria-hidden="true">⛶</span> <span data-fullscreen-label>${s('专注全屏', 'Full screen')}</span></button></div>
  <div class="studio-song-bar" id="studio-song-bar" hidden><label for="song-select">${s('选择歌曲', 'Choose a song')}</label><select id="song-select">${options}</select><button type="button" id="start-practice" class="studio-primary" disabled>${s('开始跟弹', 'Start learning')}</button><button type="button" id="stop-practice" class="studio-primary" style="display:none">${s('停止练习', 'Stop practice')}</button><a href="${zh ? '/songs/' : '/en/songs/'}">${s('浏览曲库', 'Browse songs')} ↗</a></div>
  <div class="studio-surface"><div class="studio-display"><div class="studio-display-copy"><span class="studio-eyebrow">PIANO ONLINE <span class="studio-dot"></span></span><h2 id="studio-message">${s('随手按下一个音符。', 'Make yourself a little music.')}</h2><p id="studio-submessage">${s('点击琴键，或按电脑键盘上的 A、S、D。', 'Click a key, or press A, S, D on your keyboard.')}</p></div><div class="studio-readout"><span id="studio-note">—</span><small id="studio-note-caption">${s('当前音符', 'CURRENT NOTE')}</small></div><div id="key-hint" class="key-hint" style="display:none"><span class="hint-text">${s('下一键', 'NEXT KEY')}</span><span class="hint-key"></span><span class="hint-note"></span></div></div>
  <div id="studio-upcoming" class="studio-upcoming" aria-label="${s('接下来的音符', 'Upcoming notes')}" hidden></div>
  <div id="practice-stats" class="studio-progress" style="display:none"><span id="correct-notes"></span><span id="wrong-notes"></span><span id="progress"></span><progress id="studio-progressbar" max="100" value="0" aria-label="${s('练习进度', 'Practice progress')}"></progress></div>
  <div id="note-drop-zone" class="note-drop-zone" style="display:none"><div id="falling-notes" class="falling-notes"></div></div>
  <div class="studio-keyboard-viewport" id="keyboard-viewport"><div class="piano-container"><div class="keys" role="group" aria-label="${s('37 个琴键，C3 到 C6', '37 piano keys, C3 to C6')}"></div></div></div>
  <div class="studio-range"><button type="button" data-octave="-1" aria-label="${s('向低音区移动', 'Move to lower notes')}">← <span>${s('低音', 'Lower')}</span></button><span>${s('37 键 · C3—C6', '37 keys · C3—C6')}<span class="mobile-only"> · ${s('用两侧箭头切换音区', 'Use arrows to change range')}</span></span><button type="button" data-octave="1" aria-label="${s('向高音区移动', 'Move to higher notes')}"><span>${s('高音', 'Higher')}</span> →</button></div></div>
  <div class="studio-bottom"><div class="studio-settings"><label class="studio-volume" for="studio-volume"><span aria-hidden="true">◖))</span><span class="sr-only">${s('音量', 'Volume')}</span><input id="studio-volume" type="range" min="0" max="100" value="62"><output for="studio-volume" id="studio-volume-value">62%</output></label><label class="studio-toggle"><input type="checkbox" id="sustain-toggle">${s('延音', 'Sustain')}</label><label class="studio-toggle"><input type="checkbox" id="labels-toggle" checked>${s('字母提示', 'Key labels')}</label></div><span id="studio-audio-status" role="status">${s('按下琴键开启声音', 'Press a key to enable sound')}</span></div>
  <details class="studio-more"><summary>${s('更多工具与快捷键', 'More tools & keyboard help')}</summary><div class="studio-more-content"><p>${s('字母是电脑按键，小字是实际音名。按住空格键可临时延音；松开即恢复。手机上用两侧箭头切换音区。', 'Large letters are computer keys; small labels are musical notes. Hold Space for sustain. On mobile, use the arrows to change the visible range.')}</p><button type="button" id="studio-midi" class="studio-quiet">${s('连接 MIDI 键盘', 'Connect a MIDI keyboard')}</button><span id="studio-midi-status" role="status"></span><div class="studio-rhythm-tools"><button type="button" id="start-rhythm-game" class="studio-quiet">${s('节奏模式', 'Rhythm mode')}</button><button type="button" id="stop-rhythm-game" class="studio-quiet" style="display:none">${s('结束节奏模式', 'Stop rhythm mode')}</button><div id="game-instructions" style="display:none">${s('音符到达底部时，按对应的电脑按键。', 'Press the matching computer key when a note reaches the bottom.')}</div><div id="game-stats" style="display:none"><span id="game-score">0</span> · <span id="game-combo">0</span> · <span id="game-lives">3</span></div></div><a href="${zh ? '/practice.html' : '/en/tutorials.html'}">${s('音阶、和弦与节拍练习', 'Scales, chords & rhythm practice')} ↗</a></div></details>
  <p class="studio-error" id="studio-error" role="alert" hidden></p><noscript><p>${s('请开启 JavaScript 来弹奏。歌曲的按键谱仍可在曲库中阅读。', 'Enable JavaScript to play. You can still read the keyboard letters in the song library.')}</p></noscript></section>`;
}

const homeFaq = {
  zh: [
    ['模拟钢琴需要下载吗？', '不需要。打开网页即可用鼠标、触屏或电脑键盘弹奏，首次按下琴键后浏览器会开启声音。'],
    ['自由钢琴模式怎么使用？', '选择“自由弹奏”即可随心弹奏，无需注册。也可以切换到“跟着提示弹”，从熟悉的歌曲开始练习。'],
    ['不会五线谱，可以跟着简谱学吗？', '可以。歌曲页提供数字简谱、音名与电脑按键字母谱；部分歌曲还支持五线谱视图。简化旋律适合入门，不能替代完整钢琴编曲。']
  ],
  en: [
    ['Do I need to download this piano simulator?', 'No. Open the page and play with a mouse, touchscreen or computer keyboard. Press a key once to enable browser audio.'],
    ['How do I use free play?', 'Select Free play to explore your own melodies without signing up. Switch to Learn a song for one-key prompts.'],
    ['Can I learn without reading sheet music?', 'Yes. Song pages include note names and computer-key letters; selected songs also have staff notation. These simplified melodies help you get started.']
  ],
  'zh-hant': [
    ['使用模擬鋼琴需要下載程式嗎？', '不需要。開啟網頁後，就能用滑鼠、觸控螢幕或電腦鍵盤彈奏。首次按下琴鍵後，瀏覽器便會開啟聲音。'],
    ['自由鋼琴模式怎麼使用？', '選擇「自由彈奏」即可隨心彈奏，無需註冊。也可以切換到「跟著提示彈」，從熟悉的歌曲開始練習。'],
    ['不會五線譜，可以看簡譜學琴嗎？', '可以。歌曲頁提供數字簡譜、音名與電腦按鍵字母譜；部分歌曲另有五線譜視圖。這些簡化旋律適合入門，不能取代完整的鋼琴編曲。']
  ]
};
function faqSection(locale) {
  return `<section class="home-faq" aria-labelledby="home-faq-title"><h2 id="home-faq-title">${{ zh: '在线弹琴常见问题', en: 'Online piano questions', 'zh-hant': '線上彈琴常見問題' }[locale]}</h2>${homeFaq[locale].map(([q,a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`;
}
function faqJsonLd(locale) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    inLanguage: { zh: 'zh-CN', en: 'en', 'zh-hant': 'zh-Hant' }[locale],
    mainEntity: homeFaq[locale].map(([q,a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  }).replaceAll('<', '\\u003c')}</script>`;
}

export function renderStudioPage(locale = 'zh', home = true) {
  const zh = locale === 'zh', s = (a,b) => zh ? a : b, base = zh ? '' : '/en';
  const url = `https://pianoonline.cc${base}/`;
  const title = s(home ? '在线钢琴模拟器 · 跟着提示学歌 | Piano Online' : '在线钢琴 · 打开就能弹，跟着提示学歌 | Piano Online', 'Virtual Piano Online: Play Free with Your Computer Keyboard');
  const description = home
    ? s('免费在线钢琴模拟器，无需下载或注册。用鼠标、触屏或电脑键盘自由弹奏，体验自由钢琴的乐趣；跟着简谱与按键提示学歌，部分歌曲支持五线谱。', 'Free online piano simulator for keyboard, mouse or touch. Play freely, follow song prompts and read letter notes or sheet music. No download or signup.')
    : s('免费的在线钢琴，支持鼠标、触屏和电脑键盘。37 个琴键、逐键学歌提示、音量与延音控制，无需注册。', 'Play a free online piano with your keyboard, mouse or touchscreen. 37 keys, guided songs, volume, sustain and distraction-free full screen. No signup.');
  const hreflang = home ? '<link rel="alternate" hreflang="zh-CN" href="https://pianoonline.cc/"><link rel="alternate" hreflang="en" href="https://pianoonline.cc/en/"><link rel="alternate" hreflang="zh-Hant" href="https://pianoonline.cc/zh-hant/"><link rel="alternate" hreflang="x-default" href="https://pianoonline.cc/en/">' : '';
  const jsonLd = home ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: 'Piano Online', url, inLanguage: zh ? 'zh-CN' : 'en' },
      { '@type': 'WebApplication', name: 'Piano Online', url, applicationCategory: 'MusicApplication', operatingSystem: 'Web browser', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description }
    ]
  }).replaceAll('<', '\\u003c')}</script>` : '';
  const featured = ['happy-birthday','twinkle','ode-to-joy','jingle-bells','fur-elise','canon'].map(id=>publicSongs.find(x=>x.id===id)).filter(Boolean);
  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}">${hreflang}<link rel="icon" href="/images/favicon.svg"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://pianoonline.cc/images/og-image.jpg"><link rel="stylesheet" href="/css/studio.css?v=${STUDIO_VERSION}"><script type="module" src="/js/studio.js?v=${STUDIO_VERSION}"></script><script async src="https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EYGD99YB4Y');</script><meta name="google-site-verification" content="Fii3zK2l54f0uFP7RPwdn7BEqB4OjC2jc_07JxSs1uI">${home ? '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4423187689700927" crossorigin="anonymous"></script>' : ''}${jsonLd}${home ? '<link rel="stylesheet" href="/css/home-faq.css?v=20261022.1">' + faqJsonLd(locale) : ''}</head>
<body class="studio-page"><a class="skip-link" href="#practice-start">${s('跳到钢琴', 'Skip to piano')}</a>${studioNav(locale, 'piano', '', home)}<main class="studio-main"><header class="studio-intro"><div><p class="studio-kicker">${s('一点空闲，一段旋律', 'A LITTLE TIME. A LITTLE MUSIC.')}</p><h1>${s('在线钢琴，打开就能弹。', 'Play virtual piano online, right now.')}</h1><p>${home ? s('免费在线钢琴模拟器，无需下载，鼠标、触屏和电脑键盘都能弹。', 'Play something of your own, or follow the keys to learn a familiar song.') : s('随心弹一段，或跟着亮起的琴键学会一首歌。', 'Play something of your own, or follow the keys to learn a familiar song.')}</p></div><div class="studio-promise"><span>${s('免费', 'Free')}</span><span>${s('无需注册', 'No signup')}</span><span>${s('手机也能弹', 'Touch friendly')}</span></div></header>${studioInstrument(locale)}
<section class="studio-discover"><div class="studio-section-heading"><div><p class="studio-kicker">${s('从熟悉的旋律开始', 'FIND YOUR FIRST MELODY')}</p><h2>${s('今天，想弹哪一首？', 'What would you like to play?')}</h2></div><a href="${base}/songs/">${s(`全部 ${publicSongs.length} 首歌曲`, `All ${publicSongs.length} songs`)} →</a></div><div class="studio-song-grid">${featured.map((song,i)=>`<a class="studio-song-card" href="${base}/songs/${song.slug}/"><span class="studio-song-art" data-art="${i}"><span aria-hidden="true">${['♪','✧','♩','❋','♬','𝄞'][i]}</span><small>0${i+1}</small></span><span class="studio-song-copy"><small>${s(['入门','简单','中等','进阶'][Math.min(3,song.difficulty-1)],['Starter','Easy','Medium','Advanced'][Math.min(3,song.difficulty-1)])} · ${song.estimatedMinutes} ${s('分钟','min')}</small><strong>${esc(song.title[locale])}</strong><span>${song.notes.length} ${s('个音符 · 字母谱 + 在线跟弹', 'notes · Key letters & guided practice')}</span></span><span class="studio-song-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section>
<section class="studio-learn"><div><p class="studio-kicker">${s('不用先会，先玩起来', 'NO EXPERIENCE NEEDED')}</p><h2>${s('第一次弹？这就够了。', 'New to piano? Start right here.')}</h2><p>${s('这里的简化旋律适合入门与休闲体验，不等同于完整钢琴编曲，也不能替代真实钢琴的力度与踏板训练。', 'These simplified melodies are for getting started, not full piano arrangements. A virtual keyboard does not replace weighted keys or pedal technique.')}</p></div><div class="studio-help"><details><summary>${s('电脑上怎么弹？', 'How do I play on a computer?')}</summary><p>${s('点击琴键，或按琴键上的大写字母。A 对应 C3，K 对应中央 C（C4），T 对应 C5。数字和部分字母对应黑键。', 'Click a key, or press its large letter. A plays C3, K plays middle C (C4), and T plays C5. Numbers and some letters play the black keys.')}</p></details><details><summary>${s('手机上琴键太多怎么办？', 'How do I play on a phone?')}</summary><p>${s('用琴键下方的左右箭头移动音区。跟弹时，会自动把下一个琴键移到可见区域。横屏有更大的弹奏空间。', 'Use the arrows below the keys to move the range. Guided mode brings the next key into view automatically. Landscape gives you more playing space.')}</p></details><details><summary>${s('没有声音，怎么检查？', 'Why can’t I hear anything?')}</summary><p>${s('先点击一次琴键以允许浏览器播放音频，再检查设备媒体音量、静音模式、蓝牙输出和页面音量。采样加载失败时会使用合成音。', 'Tap a piano key to allow browser audio. Check media volume, silent mode, Bluetooth output and the volume slider. A synthesized tone is used if samples cannot load.')}</p></details><a href="${base}/tutorials.html">${s('去看看入门教程', 'Explore beginner lessons')} →</a></div></section>${home ? faqSection(locale) : ''}</main><footer class="studio-footer"><span>Piano Online <span class="brand-light">© 2026</span></span><span>${s('给日常，多一点音乐。', 'Make a little room for music.')}</span><a href="${base}/about.html">${s('关于', 'About')}</a></footer></body></html>`;
}

export function renderTraditionalHome() {
  const url = 'https://pianoonline.cc/zh-hant/';
  const title = '線上鋼琴模擬器 · 跟著提示學歌 | Piano Online';
  const description = '免費線上鋼琴模擬器，無需下載或註冊。用滑鼠、觸控螢幕或電腦鍵盤自由彈奏，享受自由鋼琴的樂趣；跟著簡譜與按鍵提示學歌，部分歌曲另有五線譜。';
  let html = toTraditionalHtml(renderStudioPage('zh', true))
    .replace('<html lang="zh-CN">', '<html lang="zh-Hant">')
    .replaceAll('href="/songs/', 'href="/zh-hant/songs/')
    .replace(/(<a\b[^>]*?)href="\/"/g, '$1href="/zh-hant/"')
    .replaceAll('href="/piano.html"', 'href="/zh-hant/"')
    .replace(/<details class="studio-lang">[\s\S]*?<\/details>/, studioLanguageMenu('zh-hant', 'piano', '', true))
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<h1>[^<]*<\/h1>/, '<h1>線上鋼琴，打開就能彈。</h1>');
  const graph = [
    { '@type': 'WebSite', name: 'Piano Online', url, inLanguage: 'zh-Hant' },
    { '@type': 'WebApplication', name: 'Piano Online', url, applicationCategory: 'MusicApplication', operatingSystem: 'Web browser', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description }
  ];
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`);
  html = html.replace(/<section class="home-faq"[\s\S]*?<\/section>/, faqSection('zh-hant'))
    .replace(/<script type="application\/ld\+json">(?=[^<]*"@type":"FAQPage")[\s\S]*?<\/script>/, faqJsonLd('zh-hant'))
    .replace('免費線上鋼琴模擬器，無需下載，滑鼠、觸屏和電腦鍵盤都能彈。', '免費線上鋼琴模擬器，無需下載，滑鼠、觸控螢幕和電腦鍵盤都能彈。');
  return html.replace('</head>', `<script type="module" src="/js/zh-hant-runtime.js?v=${STUDIO_VERSION}"></script></head>`);
}

export async function generateStudioPages(root) {
  await mkdir(path.join(root,'en'),{recursive:true});
  await mkdir(path.join(root,'zh-hant'),{recursive:true});
  for (const locale of ['zh','en']) for (const home of [true,false]) {
    const file = path.join(root, locale==='zh'?'':'en', home?'index.html':'piano.html');
    await writeFile(file,renderStudioPage(locale,home));
  }
  await writeFile(path.join(root,'zh-hant','index.html'), renderTraditionalHome());
  // Apply the shared design to legacy editorial pages without changing their content/hooks.
  for (const name of ['about.html','en/about.html','practice.html']) {
    const file=path.join(root,name); let html=await readFile(file,'utf8');
    if (!html.includes('/css/studio.css')) html=html.replace('</head>',`<link rel="stylesheet" href="/css/studio.css?v=${STUDIO_VERSION}"></head>`);
    html=html.replace(/<nav class="nav-bar"[^>]*>[\s\S]*?<\/nav>/,studioNav(name.startsWith('en/')?'en':'zh','learn'));
    await writeFile(file,html);
  }
}
