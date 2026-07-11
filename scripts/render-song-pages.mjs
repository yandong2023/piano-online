import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publicSongs } from '../data/song-library.mjs';
import { hasScoreForSong } from '../data/song-scores.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..');
const ASSET_VERSION = '20260711.10';

const KEY_MAP = {
  C3: 'A', 'C#3': '1', D3: 'S', 'D#3': '2', E3: 'D', F3: 'F', 'F#3': '3',
  G3: 'G', 'G#3': '4', A3: 'H', 'A#3': '5', B3: 'J',
  C4: 'K', 'C#4': '6', D4: 'L', 'D#4': '7', E4: ';', F4: 'Q', 'F#4': '8',
  G4: 'W', 'G#4': '9', A4: 'E', 'A#4': '0', B4: 'R',
  C5: 'T', 'C#5': 'X', D5: 'Y', 'D#5': 'C', E5: 'U', F5: 'I',
  'F#5': 'V', G5: 'O', 'G#5': 'B', A5: 'P', 'A#5': 'N', B5: 'M', C6: ','
};

const categoryOrder = ['beginner', 'kids', 'traditional', 'holiday', 'classical', 'ragtime'];
const categoryLabels = {
  zh: { beginner: '入门歌曲', kids: '童谣与儿歌', traditional: '传统旋律', holiday: '节日歌曲', classical: '古典名曲', ragtime: '拉格泰姆' },
  en: { beginner: 'First songs', kids: 'Nursery & children’s songs', traditional: 'Traditional melodies', holiday: 'Holiday songs', classical: 'Classical essentials', ragtime: 'Ragtime' }
};

function esc(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function localeText(song, locale) {
  return song.title?.[locale] || song.title?.zh || '';
}

function difficultyLabel(level, locale) {
  const labels = locale === 'zh' ? ['入门', '简单', '中等', '进阶'] : ['Starter', 'Easy', 'Medium', 'Advanced'];
  return labels[Math.max(0, Math.min(3, Number(level) - 1))];
}

function songUrl(song, locale) {
  return locale === 'zh' ? `/songs/${song.slug}/` : `/en/songs/${song.slug}/`;
}

function languageUrl(song, locale) {
  return locale === 'zh' ? `/en/songs/${song.slug}/` : `/songs/${song.slug}/`;
}

function nav(locale, active = 'songs') {
  const zh = locale === 'zh';
  const base = zh ? '' : '/en';
  const links = [
    [`${base || ''}/`, zh ? '首页' : 'Home', 'home'],
    [`${base}/songs/`.replace('//', '/'), zh ? '曲库' : 'Songs', 'songs'],
    [`${base}/tutorials.html`.replace('//', '/'), zh ? '学习' : 'Learn', 'learn'],
    [zh ? '/#practice-start' : '/en/#practice-start', zh ? '在线钢琴' : 'Piano', 'piano']
  ];
  const items = links.map(([href, label, key]) => `<a href="${href}"${key === active ? ' class="active"' : ''}>${label}</a>`).join('');
  return `<nav class="nav-bar"><div class="nav-container"><a href="${zh ? '/' : '/en/'}" class="nav-logo"><img src="/images/logo.svg" alt="${zh ? '钢琴在线' : 'Piano Online'}" class="logo-img"></a><div class="nav-links">${items}<a href="${zh ? '/en/songs/' : '/songs/'}">${zh ? 'English' : '中文'}</a></div></div></nav>`;
}

function sharedHead({ locale, title, description, canonical, alternate }) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${locale === 'zh' ? 'zh-CN' : 'en'}" href="${canonical}">
<link rel="alternate" hreflang="${locale === 'zh' ? 'en' : 'zh-CN'}" href="${alternate}">
<link rel="alternate" hreflang="x-default" href="${locale === 'zh' ? alternate : canonical}">
<link rel="icon" href="/images/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="https://pianoonline.cc/images/og-image.jpg">
<link rel="stylesheet" href="/css/piano.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/song-pages.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/secondary-pages.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/song-library-fix.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/song-interactions.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/score-viewer.css?v=${ASSET_VERSION}">`;
}

function card(song, locale) {
  const composer = song.composer ? `<span class="song-card-composer">${esc(song.composer)}</span>` : '';
  return `<a class="song-card" href="${songUrl(song, locale)}" data-category="${esc(song.category)}">
<span class="song-card-level">${difficultyLabel(song.difficulty, locale)}</span>
<h3>${esc(localeText(song, locale))}</h3>
<p>${song.estimatedMinutes} ${locale === 'zh' ? '分钟' : 'min'} · ${song.notes.length} ${locale === 'zh' ? '个音符' : 'notes'}</p>
${composer}
<span class="song-card-action">${locale === 'zh' ? '开始学习' : 'Start learning'} →</span>
</a>`;
}

function renderLibrary(locale) {
  const zh = locale === 'zh';
  const groups = categoryOrder
    .map((category) => ({ category, songs: publicSongs.filter((song) => song.category === category) }))
    .filter((group) => group.songs.length);
  const total = publicSongs.length;
  const title = zh ? `在线钢琴经典曲库｜${total} 首入门、童谣与古典名曲` : `${total} Classic Piano Songs to Play Online`;
  const description = zh ? `浏览 ${total} 首可在线练习的经典钢琴曲，包括童谣、传统旋律、节日歌曲和公版古典名曲。` : `Explore ${total} playable piano classics, including beginner songs, traditional melodies, holiday music and public-domain classical themes.`;
  const canonical = zh ? 'https://pianoonline.cc/songs/' : 'https://pianoonline.cc/en/songs/';
  const alternate = zh ? 'https://pianoonline.cc/en/songs/' : 'https://pianoonline.cc/songs/';

  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head>${sharedHead({ locale, title, description, canonical, alternate })}</head>
<body class="secondary-page song-library-theme premium-song-library">${nav(locale)}
<main class="song-library-page song-library-main">
<header class="song-library-hero"><div class="song-library-hero-inner"><div class="section-kicker">${zh ? '经典曲库' : 'Classic song library'}</div><h1>${zh ? '从熟悉的旋律，走进钢琴。' : 'Start with a melody you already know.'}</h1><p>${zh ? `已收录 ${total} 首可直接练习的经典曲目。按难度和类型挑一首，查看电脑按键并立即开始。` : `${total} playable classics, organized by style and difficulty. Choose a song, see the keyboard letters and begin.`}</p><div class="library-stats"><span>${total} ${zh ? '首歌曲' : 'songs'}</span><span>${zh ? '中英文页面' : 'Bilingual pages'}</span><span>${zh ? '无需注册' : 'No signup'}</span></div></div></header>
<div class="container song-library-groups">${groups.map((group) => `<section class="song-category-section" id="${group.category}"><div class="song-category-heading"><div><div class="section-kicker">${esc(group.category)}</div><h2>${categoryLabels[locale][group.category]}</h2></div><span>${group.songs.length} ${zh ? '首' : 'songs'}</span></div><div class="song-card-grid">${group.songs.map((song) => card(song, locale)).join('')}</div></section>`).join('')}</div>
</main><footer class="footer"><div class="container"><div class="footer-content"><p>&copy; 2026 Piano Online</p><div class="footer-links"><a href="${zh ? '/' : '/en/'}">${zh ? '首页' : 'Home'}</a><a href="${zh ? '/tutorials.html' : '/en/tutorials.html'}">${zh ? '学习' : 'Learn'}</a></div></div></div></footer></body></html>`;
}

function relatedSongs(song) {
  const same = publicSongs.filter((item) => item.id !== song.id && item.category === song.category);
  const rest = publicSongs.filter((item) => item.id !== song.id && item.category !== song.category);
  return [...same, ...rest].slice(0, 3);
}

function keyboardPreview(notes) {
  return notes.slice(0, 20).map((note) => `<span class="note-chip" title="${esc(note)}">${esc(KEY_MAP[note] || note)}</span>`).join('');
}

function options(locale, selectedId) {
  return publicSongs.map((song) => `<option value="${esc(song.id)}"${song.id === selectedId ? ' selected' : ''}>${esc(localeText(song, locale))}</option>`).join('');
}

function renderSong(song, locale) {
  const zh = locale === 'zh';
  const title = localeText(song, locale);
  const pageTitle = zh ? `${title}钢琴谱与在线弹奏｜按键提示教程` : `${title} Piano Notes & Online Practice`;
  const description = song.description?.[locale] || '';
  const canonical = `https://pianoonline.cc${songUrl(song, locale)}`;
  const alternate = `https://pianoonline.cc${languageUrl(song, locale)}`;
  const rel = relatedSongs(song);
  const startLabel = zh ? '开始提示练习' : 'Start guided practice';
  const fullscreenLabel = zh ? '全屏演奏' : 'Play full screen';
  const scoreReady = hasScoreForSong(song.id);

  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head><base href="/">${sharedHead({ locale, title: pageTitle, description, canonical, alternate })}<script type="module" src="/js/main.js?v=${ASSET_VERSION}"></script><script type="module" src="/js/song-page.js?v=${ASSET_VERSION}"></script></head>
<body class="secondary-page song-detail-page" data-song-id="${esc(song.id)}">${nav(locale)}
<main class="song-page-main"><div class="container">
<div class="song-breadcrumbs"><a href="${zh ? '/' : '/en/'}">${zh ? '首页' : 'Home'}</a><span>›</span><a href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '曲库' : 'Songs'}</a><span>›</span><span>${esc(title)}</span></div>
<section class="song-hero-panel"><div class="song-hero-copy"><div class="song-eyebrow">${zh ? '互动钢琴歌曲' : 'Interactive piano song'}</div><h1>${zh ? `在线学习弹奏《${esc(title)}》` : `Learn ${esc(title)} online`}</h1><p class="song-lead">${esc(description)}</p>${song.composer ? `<p class="song-composer">${zh ? '作曲/来源' : 'Composer / source'} · ${esc(song.composer)}</p>` : ''}<div class="song-meta-grid"><div class="song-meta-item"><strong>${difficultyLabel(song.difficulty, locale)}</strong><span>${zh ? '难度' : 'Difficulty'}</span></div><div class="song-meta-item"><strong>${song.estimatedMinutes} ${zh ? '分钟' : 'min'}</strong><span>${zh ? '预计时间' : 'Estimated time'}</span></div><div class="song-meta-item"><strong>${song.notes.length}</strong><span>${zh ? '音符数量' : 'Notes'}</span></div><div class="song-meta-item"><strong>${esc(song.keySignature)}</strong><span>${zh ? '调性' : 'Key'}</span></div></div><div class="song-primary-actions"><button type="button" class="btn primary" data-start-song>${startLabel}</button><a class="btn secondary" href="#keyboard-notes">${zh ? '查看按键' : 'View keys'}</a></div></div><aside class="song-note-preview" id="keyboard-notes"><div class="section-kicker">${zh ? '前 20 个按键' : 'First 20 keys'}</div><h2>${zh ? '电脑键盘预览' : 'Computer-key preview'}</h2><div class="note-chip-list">${keyboardPreview(song.notes)}</div><p>${zh ? '琴键上的字母与电脑键盘对应。进入练习后，系统会逐个提示。' : 'These letters match your computer keyboard. Guided practice reveals them one at a time.'}</p></aside></section>
<section class="score-stage" data-score-viewer data-locale="${locale}" data-score-ready="${scoreReady ? 'true' : 'false'}"><div class="score-stage-header"><div><div class="section-kicker">${zh ? '互动乐谱' : 'Interactive sheet music'}</div><h2>${zh ? '看着乐谱，也能直接开始弹。' : 'Read the score while you play.'}</h2><p data-score-caption>${scoreReady ? (zh ? '双视图会同时保留乐谱与键位提示，适合从提示练习逐步过渡到看谱弹奏。' : 'Dual view keeps the score and key prompts together so you can transition into reading notation.') : (zh ? '这首曲目的五线谱正在补充中，当前仍可直接使用下方提示练习。' : 'Sheet music for this song is still being prepared, but guided practice below is ready right now.')}</p></div><div class="score-stage-options"><label class="score-follow"><input type="checkbox" data-score-follow checked>${zh ? '自动跟随当前音符' : 'Follow current note'}</label><span>${scoreReady ? (zh ? '已支持乐谱同步' : 'Score sync available') : (zh ? '更多乐谱陆续上线' : 'More scores coming soon')}</span></div></div><div class="score-stage-toolbar"><div class="score-mode-group"><button type="button" class="score-mode-button" data-score-mode="guided">${zh ? '提示模式' : 'Guided'}</button><button type="button" class="score-mode-button is-active" data-score-mode="dual">${zh ? '双视图' : 'Dual view'}</button><button type="button" class="score-mode-button" data-score-mode="score">${zh ? '只看乐谱' : 'Score only'}</button></div><div class="section-kicker">${zh ? '乐谱在上，键盘在下，练习更像真正上课。' : 'Score above, keyboard below, closer to real practice.'}</div></div><div class="score-canvas-frame"><div class="score-canvas" data-score-canvas><div class="score-viewer-empty"><strong>${zh ? '正在准备互动乐谱…' : 'Preparing interactive sheet music…'}</strong><p>${zh ? '如果当前歌曲尚未支持五线谱，我们会在这里提示你继续使用下方练习区。' : 'If this song does not support notation yet, you will see a friendly fallback here.'}</p></div></div></div></section>
<section id="practice-start" class="practice-section song-practice-shell" tabindex="-1"><div class="song-practice-toolbar"><div><div class="section-kicker">${zh ? '演奏舞台' : 'Performance stage'}</div><h2>${zh ? '在线提示练习' : 'Guided online practice'}</h2><p>${zh ? '弹对以后自动进入下一个音符。' : 'Play the correct key to advance to the next note.'}</p></div><select id="song-select" class="song-select">${options(locale, song.id)}</select></div><div class="piano-container"><div class="keys"></div></div><div class="practice-layout"><div class="practice-controls-panel"><div class="practice-controls"><div class="control-row"><div class="sustain-control"><label class="switch"><input type="checkbox" id="sustain-toggle"><span class="slider round"></span></label><span>${zh ? '延音' : 'Sustain'}</span></div><div class="sustain-control"><label class="switch"><input type="checkbox" id="labels-toggle" checked><span class="slider round"></span></label><span>${zh ? '按键提示' : 'Key labels'}</span></div><div id="midi-status" class="midi-status offline"><span class="status-dot"></span><span class="status-text">${zh ? 'MIDI 未连接' : 'MIDI not connected'}</span></div></div><div class="practice-buttons"><button id="start-practice" class="btn primary">${zh ? '跟着提示弹' : 'Guided practice'}</button><button id="stop-practice" class="btn danger" style="display:none">${zh ? '停止练习' : 'Stop practice'}</button><button id="toggle-fullscreen" class="btn secondary">⛶ ${fullscreenLabel}</button></div></div></div><div class="practice-status-panel"><div id="key-hint" class="key-hint" style="display:none"><div class="hint-text">${zh ? '下一个键' : 'Next key'}</div><div class="hint-key"></div><div class="hint-note"></div></div><div id="practice-stats" class="stats-panel" style="display:none"><span id="correct-notes">${zh ? '正确' : 'Correct'}: 0</span><span id="wrong-notes">${zh ? '错误' : 'Wrong'}: 0</span><span id="progress">${zh ? '进度' : 'Progress'}: 0%</span></div></div></div></section>
<section class="song-content-section"><div class="song-category-heading"><div><div class="section-kicker">${zh ? '继续演奏' : 'Keep playing'}</div><h2>${zh ? '下一首经典旋律' : 'Your next classic melody'}</h2></div></div><div class="song-card-grid">${rel.map((item) => card(item, locale)).join('')}</div></section>
</div></main><footer class="footer"><div class="container"><div class="footer-content"><p>&copy; 2026 Piano Online</p><div class="footer-links"><a href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '返回曲库' : 'Back to songs'}</a><a href="${languageUrl(song, locale)}">${zh ? 'English' : '中文'}</a></div></div></div></footer></body></html>`;
}

function renderSitemap() {
  const urls = publicSongs.flatMap((song) => [
    `  <url><loc>https://pianoonline.cc/songs/${song.slug}/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    `  <url><loc>https://pianoonline.cc/en/songs/${song.slug}/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://pianoonline.cc/songs/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n  <url><loc>https://pianoonline.cc/en/songs/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n${urls.join('\n')}\n</urlset>`;
}

export async function generateSongSite(rootDir = PROJECT_ROOT) {
  const zhLibraryDir = path.join(rootDir, 'songs');
  const enLibraryDir = path.join(rootDir, 'en', 'songs');
  await mkdir(zhLibraryDir, { recursive: true });
  await mkdir(enLibraryDir, { recursive: true });
  await writeFile(path.join(zhLibraryDir, 'index.html'), renderLibrary('zh'), 'utf8');
  await writeFile(path.join(enLibraryDir, 'index.html'), renderLibrary('en'), 'utf8');

  for (const song of publicSongs) {
    const zhDir = path.join(zhLibraryDir, song.slug);
    const enDir = path.join(enLibraryDir, song.slug);
    await mkdir(zhDir, { recursive: true });
    await mkdir(enDir, { recursive: true });
    await writeFile(path.join(zhDir, 'index.html'), renderSong(song, 'zh'), 'utf8');
    await writeFile(path.join(enDir, 'index.html'), renderSong(song, 'en'), 'utf8');
  }

  await writeFile(path.join(rootDir, 'sitemap-songs.xml'), renderSitemap(), 'utf8');
  return { count: publicSongs.length, pages: publicSongs.length * 2 + 2 };
}

const directRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (directRun) {
  const result = await generateSongSite(PROJECT_ROOT);
  console.log(`Generated ${result.pages} song pages from ${result.count} public-domain or traditional songs.`);
}
