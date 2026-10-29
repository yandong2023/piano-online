import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { publicSongs } from '../data/song-library.mjs';
import { toTraditionalHtml } from '../data/zh-hant.mjs';
import { HOME_HREFLANG } from './locale-alternates.mjs';

export const STUDIO_VERSION = '20261028.2';
// Keep stable language homes: Chinese at /, English at /en/, Traditional at /zh-hant/.
export const ZH_PIANO_HOME = '/';
export const EN_VIRTUAL_HOME = '/en/';
const esc = (v = '') => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function studioLanguageMenu(current = 'zh', active = 'piano', songSlug = '', home = false) {
  const song = songSlug ? `${songSlug}/` : '';
  const page = home ? ZH_PIANO_HOME : active === 'songs' ? `/songs/${song}` : active === 'learn' ? '/tutorials.html' : '/piano.html';
  const options = [
    ['zh', 'zh-CN', '简体中文', home ? ZH_PIANO_HOME : page],
    ['zh-hant', 'zh-Hant', '繁體中文', active === 'songs' ? `/zh-hant/songs/${song}` : '/zh-hant/'],
    ['en', 'en', 'English', home ? EN_VIRTUAL_HOME : `/en${page}`]
  ];
  const label = { zh: '切换语言', 'zh-hant': '切換語言', en: 'Change language' }[current];
  const currentName = { zh: '简体中文', 'zh-hant': '繁體中文', en: 'English' }[current];
  const short = { zh: '中文', 'zh-hant': '繁體', en: 'EN' }[current];
  const items = options.map(([id, lang, name, href]) => id === current
    ? `<span class="studio-lang-option" lang="${lang}" aria-current="true">${name}</span>`
    : `<a class="studio-lang-option" href="${href}" lang="${lang}" hreflang="${lang}">${name}</a>`).join('');
  return `<details class="studio-lang"><summary aria-label="${label} · ${currentName}" title="${label}"><svg class="studio-lang-globe" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg><span class="studio-lang-current">${short}</span></summary><div class="studio-lang-menu">${items}</div></details>`;
}

export function studioNav(locale = 'zh', active = 'piano', songSlug = '', home = false) {
  const zh = locale === 'zh', base = zh ? '' : '/en';
  const homeHref = zh ? ZH_PIANO_HOME : EN_VIRTUAL_HOME;
  return `<nav class="nav-bar" aria-label="${zh ? '主导航' : 'Main navigation'}"><div class="nav-container"><a class="studio-brand" href="${homeHref}" aria-label="Piano Online"><span class="brand-keys" aria-hidden="true"><i></i><i></i><i></i></span><span>Piano<span class="brand-light">Online</span><small>${zh ? '让音乐发生' : 'MAKE A LITTLE MUSIC'}</small></span></a><div class="nav-links"><a href="${zh ? ZH_PIANO_HOME : `${base}/piano.html`}"${active === 'piano' ? ' class="active" aria-current="page"' : ''}>${zh ? '弹钢琴' : 'Piano'}</a><a href="${base}/songs/"${active === 'songs' ? ' class="active" aria-current="page"' : ''}>${zh ? '找首歌' : 'Songs'}</a><a href="${base}/tutorials.html"${active === 'learn' ? ' class="active" aria-current="page"' : ''}>${zh ? '学一点' : 'Learn'}</a>${studioLanguageMenu(locale, active, songSlug, home)}</div></div><script type="module" src="/js/language-menu.js?v=${STUDIO_VERSION}"></script></nav>`;
}

export function studioInstrument(locale = 'zh', songId = 'happy-birthday', scorePanel = '') {
  const zh = locale === 'zh', s = (a, b) => zh ? a : b;
  const options = publicSongs.map(song => `<option value="${esc(song.id)}"${song.id === songId ? ' selected' : ''}>${esc(song.title[locale])}</option>`).join('');
  return `<section id="practice-start" class="practice-section studio-instrument song-practice-shell" tabindex="-1" aria-label="${s('在线钢琴', 'Interactive piano')}" data-studio>
  <div class="studio-toolbar"><div class="studio-modes" role="group" aria-label="${s('演奏模式', 'Playing mode')}"><button type="button" data-play-mode="free" aria-pressed="true">${s('自由弹奏', 'Free play')}</button><button type="button" data-play-mode="guided" aria-pressed="false">${s('跟着提示弹', 'Learn a song')}</button></div><button type="button" id="toggle-fullscreen" class="studio-quiet" aria-pressed="false"><span aria-hidden="true">⛶</span> <span data-fullscreen-label>${s('专注全屏', 'Full screen')}</span></button></div>
  <div class="studio-song-bar" id="studio-song-bar" hidden><label for="song-select">${s('选择歌曲', 'Choose a song')}</label><select id="song-select">${options}</select><button type="button" id="start-practice" class="studio-primary" disabled>${s('开始跟弹', 'Start learning')}</button><button type="button" id="stop-practice" class="studio-primary" style="display:none">${s('停止练习', 'Stop practice')}</button><a href="${zh ? '/songs/' : '/en/songs/'}">${s('浏览曲库', 'Browse songs')} ↗</a></div>
  ${scorePanel}<div class="studio-surface"><div class="studio-display"><div class="studio-display-copy"><span class="studio-eyebrow">PIANO ONLINE <span class="studio-dot"></span></span><h2 id="studio-message">${s('随手按下一个音符。', 'Make yourself a little music.')}</h2><p id="studio-submessage">${s('点击琴键，或按电脑键盘上的 A、S、D。', 'Click a key, or press A, S, D on your keyboard.')}</p></div><div class="studio-readout"><span id="studio-note">—</span><small id="studio-note-caption">${s('当前音符', 'CURRENT NOTE')}</small></div><div id="key-hint" class="key-hint" style="display:none"><span class="hint-text">${s('下一键', 'NEXT KEY')}</span><span class="hint-key"></span><span class="hint-note"></span></div></div>
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
    ['在线弹琴要下载软件或注册吗？', '不需要。打开网页就能使用在线钢琴模拟器，第一次按下琴键时，浏览器可能需要启用音频。'],
    ['可以直接用电脑键盘弹钢琴吗？', '可以。看钢琴键上显示的电脑按键标签，按对应按键即可。本站 K 对应中央 C（C4），W 对应 G4；鼠标和手机触屏也可以弹。'],
    ['自由钢琴模式和跟着提示弹有什么区别？', '自由钢琴模式适合随意弹奏或练习键位；“跟着提示弹”会逐个高亮下一音符，适合第一次练习熟悉的旋律。'],
    ['钢琴模拟器可以替代真实钢琴吗？', '这里是提供 37 键音域（C3–C6）的浏览器模拟钢琴，适合认识琴键和练习简化旋律。它无法代替真实钢琴的力度、踏板和完整 88 键训练。'],
    ['完全不会钢琴，先学什么歌？', '建议从《小星星》或《生日快乐》开始。选择歌曲后点击“开始跟弹”，跟着亮起的琴键练习；熟悉后再试着不看提示弹出开头几个音。'],
    ['简谱、音名和电脑字母谱有什么区别？', '数字简谱用 1、2、3 等表示音级；C4、D4 等是钢琴音名；电脑按键标签告诉你在本站实际按哪个键。有些按键是分号或数字，并不全是字母。'],
    ['每首歌都有完整五线谱和伴奏吗？', '不是。歌曲以简化练习旋律为主，每首提供音名、电脑按键和数字简谱；只有部分歌曲提供互动五线谱。'],
    ['钢琴没声音怎么办？', '先点击一次琴键，再检查系统媒体音量、静音模式、蓝牙音频输出和页面音量。']
  ],
  en: [
    ['Can I play piano online for free?', 'Yes. You can play this virtual piano in your browser without creating an account or downloading an app.'],
    ['Can I use my computer keyboard to play piano?', 'Yes. Press the computer-key label shown on each piano key. On PianoOnline, K plays middle C (C4), and W plays G4. You can also play with a mouse or touchscreen.'],
    ['How do I learn a song if I cannot read sheet music?', 'Choose Learn a Song, select a melody, and follow the highlighted piano keys. Each song page also shows musical note names and matching computer-key labels.'],
    ['What is the difference between a piano note and a computer key?', 'A piano note such as C4 names the sound. A computer key such as K is what you press on this website. Some mapped keys use numbers or punctuation, so follow the labels.'],
    ['Can I play on my phone?', 'Yes. Tap the on-screen keys and move the visible keyboard range using the on-screen controls. Landscape usually gives you more room.'],
    ['Why is there no sound?', 'Click or tap a piano key to enable browser audio. Then check your device volume, silent mode, Bluetooth output and the piano volume control.'],
    ['Is this a piano simulator or a real 88-key piano?', 'It is a browser-based piano simulator with 37 playable keys (C3–C6). You can practise melodies and note positions, but it is not a physical 88-key piano.'],
    ['Does every song include sheet music?', 'No. Song pages provide note names and computer-key labels. Some also include interactive staff notation. These are simplified practice melodies.']
  ],
  'zh-hant': [
    ['線上彈琴需要下載軟體或註冊嗎？', '不需要。打開網頁就能使用線上鋼琴模擬器，第一次按下琴鍵時，瀏覽器可能需要啟用音訊。'],
    ['可以直接用電腦鍵盤彈鋼琴嗎？', '可以。看琴鍵上顯示的電腦按鍵標籤，按對應按鍵即可。本站 K 對應中央 C（C4），W 對應 G4；滑鼠和手機觸控也能彈。'],
    ['自由鋼琴模式和跟著提示彈有甚麼不同？', '自由鋼琴模式適合自由彈奏與練習鍵位；「跟著提示彈」會逐個高亮下一個音符，適合初學者練習熟悉的旋律。'],
    ['鋼琴模擬器能取代真實鋼琴嗎？', '這是提供 37 鍵音域（C3–C6）的瀏覽器鋼琴模擬器，適合認識琴鍵及練習簡化旋律，不能取代真實鋼琴的力度、踏板和完整 88 鍵訓練。'],
    ['完全不會鋼琴，先練哪首歌？', '建議先練《小星星》或《生日快樂》。選歌並開始跟彈，跟著亮起的琴鍵練習，再試著不看提示彈出開頭幾個音。'],
    ['簡譜、音名和電腦按鍵有甚麼不同？', '數字簡譜以 1、2、3 表示音級；C4、D4 等是鋼琴音名；電腦按鍵標籤告訴你實際要按哪個鍵，可能是字母、數字或分號。'],
    ['每首歌都有完整五線譜和伴奏嗎？', '不是。歌曲以簡化練習旋律為主，每首提供音名、電腦按鍵及數字簡譜，只有部分歌曲提供互動五線譜。'],
    ['鋼琴沒有聲音怎麼辦？', '先點按一個琴鍵，再檢查系統音量、靜音模式、藍牙音訊輸出和頁面音量。']
  ]
};
function faqSection(locale) {
  return `<section class="home-faq" aria-labelledby="home-faq-title"><h2 id="home-faq-title">${{ zh: '在线弹琴常见问题', en: 'Virtual piano questions', 'zh-hant': '線上彈琴常見問題' }[locale]}</h2>${homeFaq[locale].map(([q,a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>`;
}
function virtualPianoSections() {
  return `<section class="vp-sections" aria-label="Virtual piano guide"><article><h2>What is a virtual piano?</h2><p>A virtual piano is an online piano keyboard you can play in your browser. This free visual piano lets you use a mouse, touchscreen or computer keys without downloading software. Prefer Chinese? Open <a href="/" lang="zh-CN" hreflang="zh-CN">在线钢琴</a>.</p></article><article><h2>Virtual piano with notes</h2><p>Musical notes such as C4 name the pitch; computer-key labels tell you what to press here. K plays middle C (C4). Explore the <a href="/with-notes/">virtual piano with notes</a> for labeled keys.</p></article><article><h2>How to play</h2><p>Click a piano key to enable sound. On a computer, press its matching key label. Switch from Free Play to Learn a Song when you want to follow highlighted notes. For MIDI playback, open <a href="/midi/">Piano MIDI online</a>.</p></article></section>`;
}
function studioSteps(locale) {
  const zh = locale === 'zh';
  return `<section class="studio-learn studio-steps" aria-labelledby="studio-steps-title"><div><p class="studio-kicker">${zh ? '从第一个音开始' : 'THREE SIMPLE STEPS'}</p><h2 id="studio-steps-title">${zh ? '在线弹钢琴，三步就够了' : 'How to Play Piano Online in 3 Steps'}</h2><p>${zh ? 'C4、G4 是钢琴音名；K、W 是本站对应的电脑按键。部分音符对应数字或分号键，请以琴键显示的标签为准。' : 'Musical notes name the pitch (for example, C4). Computer-key labels show what to press (for example, K for C4). This online piano keyboard also uses some number and symbol keys.'}</p></div><div class="studio-help"><ol><li><strong>${zh ? '先弹一个音' : '1. Play a note'}</strong><p>${zh ? '点击琴键、用手机触屏，或按琴键上显示的电脑按键。' : 'Click a piano key, tap it on your phone, or press its matching computer key.'}</p></li><li><strong>${zh ? '选一首熟悉的歌' : '2. Choose a song'}</strong><p>${zh ? '切换到“跟着提示弹”，选择《小星星》或《生日快乐》。' : 'Switch to Learn a Song and select a familiar melody.'}</p></li><li><strong>${zh ? '按亮起的琴键练习' : '3. Follow the highlighted key'}</strong><p>${zh ? '从第一个音开始跟着提示练。还可以打开歌曲页查看音名、电脑按键和数字简谱。' : 'Play each highlighted note. Open the song page to read the musical notes and computer-key labels.'}</p></li></ol></div></section>`;
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
  const englishLanding = !zh && home;
  const url = `https://pianoonline.cc${zh ? ZH_PIANO_HOME : EN_VIRTUAL_HOME}`;
  // Alias piano pages canonicalize to the matching language home.
  const title = zh
    ? (home ? '在线钢琴_免费模拟器·免下载免注册·简谱学歌' : '在线钢琴 · 打开就能弹，跟着提示学歌 | Piano Online')
    : (home ? 'Free Online Piano & Piano Simulator — Virtual Piano' : 'Virtual Piano Online: Play Free with Your Computer Keyboard');
  const description = home
    ? s('免费在线钢琴模拟器，用电脑键盘、鼠标或手机触屏就能弹。支持自由钢琴弹奏，也可跟着亮键练习熟悉旋律。100 首歌曲提供音名、电脑按键和数字简谱，部分歌曲有五线谱。', 'Free online piano and piano simulator in your browser. Play with keyboard, mouse or touch. Follow highlighted keys to learn songs — no download, no signup.')
    : s('免费的在线钢琴，支持鼠标、触屏和电脑键盘。37 个琴键、逐键学歌提示、音量与延音控制，无需注册。', 'Play a free online piano with your keyboard, mouse or touchscreen. 37 keys, guided songs, volume, sustain and distraction-free full screen. No signup.');
  const hreflang = home ? HOME_HREFLANG.map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`).join('') : '';
  const jsonLd = home ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: englishLanding ? title : 'Piano Online', url, inLanguage: zh ? 'zh-CN' : 'en' },
      { '@type': 'WebApplication', name: englishLanding ? 'Virtual Piano Online' : 'Piano Online', url, applicationCategory: 'MusicApplication', operatingSystem: 'Web browser', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description }
    ]
  }).replaceAll('<', '\\u003c')}</script>` : '';
  // Honor the site-specific formats and area exclusions saved in AdSense.
  // A data-overlays override would re-enable anchors even when disabled there.
  const homeAds = home ? '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4423187689700927" crossorigin="anonymous"></script>' : '';
  const featured = ['happy-birthday','twinkle','ode-to-joy','jingle-bells','fur-elise','canon'].map(id=>publicSongs.find(x=>x.id===id)).filter(Boolean);
  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}">${hreflang}<link rel="icon" href="/images/favicon.svg"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://pianoonline.cc/images/og-image.jpg"><link rel="stylesheet" href="/css/studio.css?v=${STUDIO_VERSION}"><script type="module" src="/js/studio.js?v=${STUDIO_VERSION}"></script><script async src="https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EYGD99YB4Y');</script><meta name="google-site-verification" content="Fii3zK2l54f0uFP7RPwdn7BEqB4OjC2jc_07JxSs1uI">${homeAds}${jsonLd}${englishLanding ? '<link rel="stylesheet" href="/css/virtual-piano-home.css?v=20261028.2">' : ''}${home ? '<link rel="stylesheet" href="/css/home-faq.css?v=20261022.1">' + faqJsonLd(locale) : ''}</head>
<body class="studio-page${englishLanding ? ' virtual-piano-home' : ''}"><a class="skip-link" href="#practice-start">${s('跳到钢琴', 'Skip to piano')}</a>${studioNav(locale, 'piano', '', home)}<main class="studio-main"><header class="studio-intro"><div><p class="studio-kicker">${s('免费在线钢琴', englishLanding ? 'FREE ONLINE PIANO' : 'A LITTLE TIME. A LITTLE MUSIC.')}</p><h1>${zh ? (home ? '在线钢琴：打开就能弹，跟着亮键学歌曲' : '在线钢琴，打开就能弹。') : (englishLanding ? 'Free Online Piano Simulator — Play Instantly' : 'Play virtual piano online, right now.')}</h1><p>${home ? s('不用下载软件，也不用先学会五线谱。用电脑键盘、鼠标或手机触屏直接弹琴；想学一首歌，就切换到“跟着提示弹”，照着亮起的琴键逐音练习。', 'Play a free virtual piano using your computer keyboard, mouse, or touchscreen. No piano experience needed—choose a song and follow the highlighted keys one note at a time. No downloads or signup. <a href="/with-notes/">Virtual piano with notes</a>.') : s('随心弹一段，或跟着亮起的琴键学会一首歌。', 'Play something of your own, or follow the keys to learn a familiar song.')}</p></div><div class="studio-promise"><span>${s('免费使用', 'Free to play')}</span><span>${s('电脑键盘 / 触屏', 'Keyboard & touch')}</span><span>${s('逐键跟弹', 'Guided songs')}</span></div></header><div class="studio-quick-start" aria-label="${s('快速开始', 'Quick start')}"><span>${s('第一次弹？先试试这两首', 'Try your first song')}</span>${['twinkle','happy-birthday'].map(id => publicSongs.find(song => song.id === id)).filter(Boolean).map(song => `<button type="button" data-quick-song="${esc(song.id)}" disabled><span aria-hidden="true">♪</span> ${esc(song.title[locale])} <span aria-hidden="true">→</span></button>`).join('')}<span class="studio-quick-help">${s('跟着高亮琴键，一次弹一个音', 'Follow the highlighted keys—one note at a time')}</span></div>${studioInstrument(locale)}
${studioSteps(locale)}
<section class="studio-discover"><div class="studio-section-heading"><div><p class="studio-kicker">${s('从熟悉的旋律开始', 'SONGS YOU CAN PLAY')}</p><h2>${s('100 首钢琴曲目，选一首开始跟弹', '100 Piano Songs to Play and Practise')}</h2></div><a href="${base}/songs/">${s(`全部 ${publicSongs.length} 首歌曲`, `All ${publicSongs.length} songs`)} →</a></div><div class="studio-song-grid">${featured.map((song,i)=>`<a class="studio-song-card" href="${base}/songs/${song.slug}/"><span class="studio-song-art" data-art="${i}"><span aria-hidden="true">${['♪','✧','♩','❋','♬','𝄞'][i]}</span><small>0${i+1}</small></span><span class="studio-song-copy"><small>${s(['入门','简单','中等','进阶'][Math.min(3,song.difficulty-1)],['Starter','Easy','Medium','Advanced'][Math.min(3,song.difficulty-1)])} · ${song.estimatedMinutes} ${s('分钟','min')}</small><strong>${esc(song.title[locale])}</strong><span>${song.notes.length} ${s('个音符 · 字母谱 + 在线跟弹', 'notes · Key letters & guided practice')}</span></span><span class="studio-song-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section>
${englishLanding ? virtualPianoSections() : ''}
<section class="studio-learn"><div><p class="studio-kicker">${s('零基础也能开始', 'NEW TO PIANO?')}</p><h2>${s('不会五线谱，也能先弹出一首歌', 'You Can Start Without Reading Sheet Music')}</h2><p>${s('先跟着亮起的琴键认识位置，再对照音名和数字简谱理解旋律。这里的版本以入门练习为主，部分曲目只保留简化主旋律，不等于原曲的完整双手编配。', 'You do not need to read sheet music before playing your first melody. Start with highlighted keys, then compare each note with its name and computer-key label. These are simplified melodies, not full two-hand piano arrangements.')}</p></div><div class="studio-help"><details><summary>${s('电脑上怎么弹？', 'How do I play on a computer?')}</summary><p>${s('点击琴键，或按琴键上的大写字母。A 对应 C3，K 对应中央 C（C4），T 对应 C5。数字和部分字母对应黑键。', 'Click a key, or press its large letter. A plays C3, K plays middle C (C4), and T plays C5. Numbers and some letters play the black keys.')}</p></details><details><summary>${s('手机上琴键太多怎么办？', 'How do I play on a phone?')}</summary><p>${s('用琴键下方的左右箭头移动音区。跟弹时，会自动把下一个琴键移到可见区域。横屏有更大的弹奏空间。', 'Use the arrows below the keys to move the range. Guided mode brings the next key into view automatically. Landscape gives you more playing space.')}</p></details><details><summary>${s('没有声音，怎么检查？', 'Why can’t I hear anything?')}</summary><p>${s('先点击一次琴键以允许浏览器播放音频，再检查设备媒体音量、静音模式、蓝牙输出和页面音量。采样加载失败时会使用合成音。', 'Tap a piano key to allow browser audio. Check media volume, silent mode, Bluetooth output and the volume slider. A synthesized tone is used if samples cannot load.')}</p></details><a href="${base}/articles/guides/computer-keyboard-piano/">${s('查看电脑键盘弹琴教程', 'Read the beginner keyboard guide')} →</a><a href="${base}/articles/guides/piano-keyboard-letters/">${s('认识 C D E F G A B 音名', 'Learn piano keyboard letters and note names')} →</a></div></section>${home ? faqSection(locale) : ''}</main><footer class="studio-footer"><span>Piano Online <span class="brand-light">© 2026</span></span><span>${s('给日常，多一点音乐。', 'Make a little room for music.')}</span><a href="${base}/about.html">${s('关于', 'About')}</a></footer></body></html>`;
}

export function renderTraditionalHome() {
  const url = 'https://pianoonline.cc/zh-hant/';
  const title = '線上鋼琴模擬器 · 跟著提示學歌 | Piano Online';
  const description = '免費線上鋼琴模擬器，用電腦鍵盤、滑鼠或手機觸控自由彈奏，體驗自由鋼琴。跟著亮起的琴鍵練習熟悉旋律，探索 100 首歌曲的音名、電腦按鍵與簡譜；部分歌曲另有五線譜，無需下載或註冊。';
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
    .replace(/<h1>[^<]*<\/h1>/, '<h1>線上鋼琴：打開就能彈，跟著亮鍵學歌曲</h1>');
  const graph = [
    { '@type': 'WebSite', name: 'Piano Online', url, inLanguage: 'zh-Hant' },
    { '@type': 'WebApplication', name: 'Piano Online', url, applicationCategory: 'MusicApplication', operatingSystem: 'Web browser', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description }
  ];
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`);
  html = html.replace(/<section class="home-faq"[\s\S]*?<\/section>/, faqSection('zh-hant'))
    .replace(/<script type="application\/ld\+json">(?=[^<]*"@type":"FAQPage")[\s\S]*?<\/script>/, faqJsonLd('zh-hant'))
    .replace('免費線上鋼琴模擬器，免下載、免註冊，滑鼠、觸屏和電腦鍵盤都能彈。', '免費線上鋼琴模擬器，免下載、免註冊，滑鼠、觸控螢幕和電腦鍵盤都能彈。');
  return html.replace('</head>', `<script type="module" src="/js/zh-hant-runtime.js?v=${STUDIO_VERSION}"></script></head>`);
}

const focusedCopy = {
  notes: {
    path: '/with-notes/',
    title: 'Virtual Piano with Notes – Labeled Keys Online',
    description: 'Play a free virtual piano with note names labeled on the keys. See C4, D4 and other notes, show computer-key labels and practise in your browser.',
    h1: 'Virtual Piano with Notes on Every Key',
    lead: 'See the musical note name on each piano key while you play. Want to use your computer keyboard? Keep the key labels visible to learn which key presses each note on PianoOnline.'
  },
  midi: {
    path: '/midi/',
    title: 'Play MIDI Files Online on a Virtual Piano',
    description: 'Open a .mid or .midi file and hear it play on a virtual piano in your browser. No installation required. Use the on-screen keys to play along.',
    h1: 'Play a MIDI File on a Virtual Piano',
    lead: 'Drop a .mid or .midi file here, or choose one from your computer. The file plays in your browser without being uploaded to our server.'
  }
};

export function renderFocusedLanding(variant) {
  const copy = focusedCopy[variant];
  const url = `https://pianoonline.cc${copy.path}`;
  const midi = variant === 'midi';
  const drop = midi ? `<div id="midi-drop" class="midi-drop"><p class="studio-kicker">DROP A FILE</p><p>Drop a MIDI file here or choose a file</p><input id="midi-file" type="file" accept=".mid,.midi,audio/midi,audio/mid"><button type="button" id="midi-stop" class="studio-quiet">Stop playback</button><p id="midi-status" role="status">No MIDI file is playing yet.</p></div>` : '';
  const extra = midi
    ? '<section class="vp-sections"><article><h2>How to play a MIDI file</h2><p>Choose a MIDI file, wait for it to load, then listen on the virtual piano. You can use your mouse, touchscreen or computer keyboard to play along.</p></article><article><p><a href="/en/">Back to the virtual piano</a> · <a href="/with-notes/">Virtual piano with notes</a></p></article></section>'
    : `<section class="vp-sections" aria-label="Labeled keys"><article><h2>What do the labels mean?</h2><p>C4 is the pitch called middle C. K is the computer key that plays C4 here. The note name and computer-key label are different kinds of information.</p></article><article><h2>Computer key labels</h2><p>Key labels shows which computer key plays each pitch; it may be a letter, number or symbol. Turn it off when you want only the musical note names.</p></article><article><h2>Keep practising</h2><p><a href="/en/#practice-start">Play the labeled piano</a> or <a href="/en/songs/">Explore piano songs</a>. To hear a file, open <a href="/midi/">Piano MIDI online</a>.</p></article></section>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.title}</title><meta name="description" content="${copy.description}"><link rel="canonical" href="${url}"><link rel="icon" href="/images/favicon.svg"><meta property="og:type" content="website"><meta property="og:title" content="${copy.title}"><meta property="og:description" content="${copy.description}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://pianoonline.cc/images/og-image.jpg"><link rel="stylesheet" href="/css/studio.css?v=${STUDIO_VERSION}"><link rel="stylesheet" href="/css/virtual-piano-home.css?v=20261028.2"><script type="module" src="/js/studio.js?v=${STUDIO_VERSION}"></script>${midi ? '<script type="module" src="/js/midi-drop.mjs?v=20261024.1"></script>' : ''}<script async src="https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EYGD99YB4Y');</script><meta name="google-site-verification" content="Fii3zK2l54f0uFP7RPwdn7BEqB4OjC2jc_07JxSs1uI"></head>
<body class="studio-page virtual-piano-home"><a class="skip-link" href="#practice-start">Skip to piano</a>${studioNav('en', 'piano', '', true)}<main class="studio-main"><header class="studio-intro"><div><p class="studio-kicker">PLAY IN THE BROWSER</p><h1>${copy.h1}</h1><p>${copy.lead}</p></div><div class="studio-promise"><span>Free</span><span>No signup</span><span>No download</span></div></header>${drop}${studioInstrument('en')}${extra}</main><footer class="studio-footer"><span>Piano Online <span class="brand-light">© 2026</span></span><a href="/en/">Virtual piano</a></footer></body></html>`;
}

export async function generateStudioPages(root) {
  await mkdir(path.join(root,'en'),{recursive:true});
  await mkdir(path.join(root,'zh-hant'),{recursive:true});
  await mkdir(path.join(root,'with-notes'),{recursive:true});
  await mkdir(path.join(root,'midi'),{recursive:true});
  await writeFile(path.join(root,'index.html'), renderStudioPage('zh', true));
  await writeFile(path.join(root,'en','index.html'), renderStudioPage('en', true));
  await writeFile(path.join(root,'piano.html'), renderStudioPage('zh', false));
  await writeFile(path.join(root,'en','piano.html'), renderStudioPage('en', false));
  await writeFile(path.join(root,'with-notes','index.html'), renderFocusedLanding('notes'));
  await writeFile(path.join(root,'midi','index.html'), renderFocusedLanding('midi'));
  await writeFile(path.join(root,'zh-hant','index.html'), renderTraditionalHome());
  // Apply the shared design to legacy editorial pages without changing their content/hooks.
  for (const name of ['about.html','en/about.html','practice.html']) {
    const file=path.join(root,name); let html=await readFile(file,'utf8');
    if (!html.includes('/css/studio.css')) html=html.replace('</head>',`<link rel="stylesheet" href="/css/studio.css?v=${STUDIO_VERSION}"></head>`);
    html=html.replace(/href="\/css\/studio\.css(?:\?v=[^"]*)?"/g, `href="/css/studio.css?v=${STUDIO_VERSION}"`);
    html=html.replace(/<nav class="nav-bar"[^>]*>[\s\S]*?<\/nav>/,studioNav(name.startsWith('en/')?'en':'zh','learn'));
    await writeFile(file,html);
  }
}
