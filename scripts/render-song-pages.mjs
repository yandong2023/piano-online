import { studioNav, studioInstrument, STUDIO_VERSION } from './studio-pages.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { publicSongs } from '../data/song-library.mjs';
import { getScoreBySongId, hasScoreForSong } from '../data/song-scores.mjs';
import { toTraditionalHtml } from '../data/zh-hant.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..');
const ASSET_VERSION = '20260711.10';
export const KEY_MAP = {
  C3: 'A', 'C#3': '1', D3: 'S', 'D#3': '2', E3: 'D', F3: 'F', 'F#3': '3',
  G3: 'G', 'G#3': '4', A3: 'H', 'A#3': '5', B3: 'J',
  C4: 'K', 'C#4': '6', D4: 'L', 'D#4': '7', E4: ';', F4: 'Q', 'F#4': '8',
  G4: 'W', 'G#4': '9', A4: 'E', 'A#4': 'Z', B4: 'R',
  C5: 'T', 'C#5': 'X', D5: 'Y', 'D#5': 'C', E5: 'U', F5: 'I',
  'F#5': 'V', G5: 'O', 'G#5': 'B', A5: 'P', 'A#5': 'N', B5: 'M', C6: ','
};
const categoryOrder = ['beginner', 'kids', 'traditional', 'holiday', 'classical', 'ragtime'];
const categoryLabels = {
  zh: { beginner: '入门歌曲', kids: '童谣与儿歌', traditional: '传统旋律', holiday: '节日歌曲', classical: '古典名曲', ragtime: '拉格泰姆' },
  en: { beginner: 'First songs', kids: 'Nursery & children’s songs', traditional: 'Traditional melodies', holiday: 'Holiday songs', classical: 'Classical essentials', ragtime: 'Ragtime' }
};

function renderTraditional(html) {
  let output = toTraditionalHtml(html)
    .replace('<html lang="zh-CN">', '<html lang="zh-Hant">')
    .replaceAll('https://pianoonline.cc/songs/', 'https://pianoonline.cc/zh-hant/songs/')
    .replaceAll('href="/songs/', 'href="/zh-hant/songs/');
  output = output.replace(
    /(<link rel="alternate" hreflang="zh-CN" href=")https:\/\/pianoonline\.cc\/zh-hant\/songs\//,
    '$1https://pianoonline.cc/songs/'
  );
  return output.replace('</div></div></nav>', '<a href="/songs/">簡體</a></div></div></nav>');
}
function esc(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function localeText(song, locale) { return song.title?.[locale] || song.title?.zh || ''; }
function difficultyLabel(level, locale) {
  const labels = locale === 'zh' ? ['入门', '简单', '中等', '进阶'] : ['Starter', 'Easy', 'Medium', 'Advanced'];
  return labels[Math.max(0, Math.min(3, Number(level) - 1))];
}
function songUrl(song, locale) { return locale === 'zh' ? `/songs/${song.slug}/` : `/en/songs/${song.slug}/`; }
function languageUrl(song, locale) { return locale === 'zh' ? `/en/songs/${song.slug}/` : `/songs/${song.slug}/`; }
function nav(locale, active = 'songs') { return studioNav(locale, active); }

function sharedHead({ locale, title, description, canonical, alternates = [], jsonLd = '' }) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
${alternates.map(([hreflang, href]) => `<link rel="alternate" hreflang="${hreflang}" href="${href}">`).join('\n')}
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
<link rel="stylesheet" href="/css/score-viewer.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/studio.css?v=${STUDIO_VERSION}">
<script type="module" src="/js/library-browser.js?v=${STUDIO_VERSION}"></script>${jsonLd}`;
}
function songAlternates(zhPath) {
  const enPath = `/en${zhPath}`;
  const zhHantPath = `/zh-hant${zhPath}`;
  return [
    ['zh-CN', `https://pianoonline.cc${zhPath}`],
    ['en', `https://pianoonline.cc${enPath}`],
    ['zh-Hant', `https://pianoonline.cc${zhHantPath}`],
    ['x-default', `https://pianoonline.cc${enPath}`]
  ];
}
function jsonLdScript(graph) {
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`;
}
function card(song, locale) {
  const composer = song.composer ? `<span class="song-card-composer">${esc(song.composer)}</span>` : '';
  return `<a class="song-card" href="${songUrl(song, locale)}" data-category="${esc(song.category)}" data-search="${esc(song.title.zh + ' ' + song.title.en)}">
<span class="song-card-level">${difficultyLabel(song.difficulty, locale)}</span>
<h3>${esc(localeText(song, locale))}</h3>
<p>${song.estimatedMinutes} ${locale === 'zh' ? '分钟' : 'min'} · ${song.notes.length} ${locale === 'zh' ? '个音符' : 'notes'}</p>
${composer}
<span class="song-card-action">${locale === 'zh' ? '开始学习' : 'Start learning'} →</span>
</a>`;
}
function renderLibrary(locale) {
  const zh = locale === 'zh';
  const groups = categoryOrder.map((category) => ({ category, songs: publicSongs.filter((song) => song.category === category) })).filter((group) => group.songs.length);
  const total = publicSongs.length;
  const title = zh ? `在线钢琴经典曲库｜${total} 首入门、童谣与古典名曲` : `${total} Classic Piano Songs to Play Online`;
  const description = zh ? `浏览 ${total} 首可在线练习的经典钢琴曲，包括童谣、传统旋律、节日歌曲和公版古典名曲。` : `Explore ${total} playable piano classics, including beginner songs, traditional melodies, holiday music and public-domain classical themes.`;
  const canonical = zh ? 'https://pianoonline.cc/songs/' : 'https://pianoonline.cc/en/songs/';
  const jsonLd = jsonLdScript([
    { '@type': 'CollectionPage', name: title, url: canonical, mainEntity: {
      '@type': 'ItemList',
      itemListElement: publicSongs.map((song, index) => ({
        '@type': 'ListItem', position: index + 1, url: `https://pianoonline.cc${songUrl(song, locale)}`, name: localeText(song, locale)
      }))
    } }
  ]);
  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head>${sharedHead({ locale, title, description, canonical, alternates: songAlternates('/songs/'), jsonLd })}</head>
<body class="secondary-page song-library-theme premium-song-library">${nav(locale)}
<main class="song-library-page song-library-main">
<header class="song-library-hero"><div class="song-library-hero-inner"><div class="section-kicker">${zh ? '经典曲库' : 'Classic song library'}</div><h1>${zh ? '从熟悉的旋律，走进钢琴。' : 'Start with a melody you already know.'}</h1><p>${zh ? `已收录 ${total} 首可直接练习的经典曲目。按难度和类型挑一首，查看电脑按键并立即开始。` : `${total} playable classics, organized by style and difficulty. Choose a song, see the keyboard letters and begin.`}</p><div class="library-stats"><span>${total} ${zh ? '首歌曲' : 'songs'}</span><span>${zh ? '中英文页面' : 'Bilingual pages'}</span><span>${zh ? '无需注册' : 'No signup'}</span></div></div></header>
<section class="library-browser" aria-label="${zh ? '筛选曲库' : 'Filter songs'}"><div class="library-search-row"><label for="library-search"><span class="sr-only">${zh ? '搜索歌名或作曲家' : 'Search songs or composers'}</span><input id="library-search" type="search" placeholder="${zh ? '搜索歌名、英文名或作曲家…' : 'Search a song or composer…'}" autocomplete="off"></label><span id="library-count" class="library-count" role="status">${total} ${zh ? '首歌曲' : 'songs'}</span></div><div class="library-filters" role="group" aria-label="${zh ? '歌曲分类' : 'Song categories'}"><button type="button" data-library-filter="all" aria-pressed="true">${zh ? '全部' : 'All songs'}</button>${groups.map(group=>`<button type="button" data-library-filter="${group.category}" aria-pressed="false">${categoryLabels[locale][group.category]}</button>`).join('')}</div><div class="library-empty" id="library-empty" hidden><p>${zh ? '没有找到匹配的歌曲，换个关键词试试。' : 'No songs found. Try a different search.'}</p><button class="studio-quiet" type="button" id="library-reset">${zh ? '清除筛选' : 'Clear filters'}</button></div></section>
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
export function noteName(pitch) {
  return String(pitch).replace(/\d+$/, '');
}
export function letterNoteLines(song) {
  for (const pitch of song.notes) {
    if (!/^[A-G]#?\d$/.test(pitch)) throw new Error(`Invalid pitch "${pitch}" in song ${song.id}`);
    if (!KEY_MAP[pitch]) throw new Error(`No computer key mapped for pitch "${pitch}" in song ${song.id}`);
  }
  const score = getScoreBySongId(song.id);
  const lines = score
    ? Array.from({ length: Math.ceil(score.measures.length / 2) }, (_, index) => score.measures.slice(index * 2, index * 2 + 2).flatMap((measure) => measure.map((event) => event.pitch)))
    : Array.from({ length: Math.ceil(song.notes.length / 8) }, (_, index) => song.notes.slice(index * 8, index * 8 + 8));
  return {
    names: lines.map((line) => line.map(noteName)),
    keys: lines.map((line) => line.map((pitch) => KEY_MAP[pitch]))
  };
}
const PITCH_ORDER = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
export function songFacts(song) {
  const byPitch = (a, b) => {
    const [, na, oa] = a.match(/^([A-G]#?)(\d)$/);
    const [, nb, ob] = b.match(/^([A-G]#?)(\d)$/);
    return Number(oa) * 12 + PITCH_ORDER[na] - (Number(ob) * 12 + PITCH_ORDER[nb]);
  };
  const sorted = [...song.notes].sort(byPitch);
  return {
    firstNotes: song.notes.slice(0, 8).map(noteName),
    blackKeys: [...new Set(song.notes.filter((pitch) => pitch.includes('#')).map(noteName))],
    lowest: sorted[0],
    highest: sorted[sorted.length - 1],
    noteCount: song.notes.length,
    tempo: song.tempo,
    keySignature: song.keySignature
  };
}
function letterNotesSection(song, locale, title) {
  const zh = locale === 'zh';
  const { names, keys } = letterNoteLines(song);
  const block = (id, heading, format, lines) => `<div class="letter-notes-block"><div class="letter-notes-head"><h3>${heading}</h3><button type="button" class="studio-quiet" data-copy-target="${id}" data-copy-format="${format}">${zh ? '复制' : 'Copy'}</button></div><pre id="${id}" class="letter-notes-text">${esc(lines.map((line) => line.join(' ')).join('\n'))}</pre></div>`;
  return `<section class="song-letter-notes" id="letter-notes" aria-labelledby="letter-notes-title">
<div class="section-kicker">${zh ? '完整字母谱' : 'Full letter notes'}</div>
<h2 id="letter-notes-title">${zh ? `《${esc(title)}》钢琴字母谱` : `${esc(title)} piano letter notes`}</h2>
<p>${zh ? '每个字母代表一个音，从左往右弹。带 # 的是该字母右边紧挨着的黑键。下方还给出了本页钢琴对应的电脑按键。' : 'Each letter is one note, read left to right. A # means the black key just to the right of that letter. Below the note names you’ll find the matching computer keys for the piano on this page.'}</p>
${block('letter-notes-names', zh ? '音名谱' : 'Note names', 'names', names)}
${block('letter-notes-keys', zh ? '本页钢琴的电脑按键' : 'Computer keys on this piano', 'keys', keys)}
</section>`;
}
function songFactsSection(song, locale, title) {
  const zh = locale === 'zh';
  const facts = songFacts(song);
  const markMiddleC = (value) => value === 'C4' ? `${value}${zh ? '（中央 C）' : ' (middle C)'}` : value;
  const items = [
    [zh ? `《${title}》开头是哪几个音？` : `What are the first notes of ${title}?`,
      zh ? `开头是 ${facts.firstNotes.join(' ')}。` : `It starts with ${facts.firstNotes.join(' ')}.`],
    [zh ? `《${title}》要弹黑键吗？` : `Does ${title} use black keys?`,
      facts.blackKeys.length
        ? (zh ? `要，会用到 ${facts.blackKeys.join('、')}。# 表示该字母右边的黑键。` : `Yes: ${facts.blackKeys.join(', ')}. Each # is the black key just to the right of that letter.`)
        : (zh ? '不用。这个简化版旋律只用白键，很适合入门。' : 'No. This simplified melody uses only white keys, which makes it a comfortable first song.')],
    [zh ? '音域有多宽？' : 'What range does it cover?',
      zh ? `从 ${markMiddleC(facts.lowest)} 到 ${markMiddleC(facts.highest)}，上方 37 键钢琴（C3–C6）都能弹到。` : `From ${markMiddleC(facts.lowest)} to ${markMiddleC(facts.highest)}. Everything fits on the 37-key piano above (C3–C6).`],
    [zh ? '学会要多久？' : 'How long does it take to learn?',
      zh ? `这个版本共 ${facts.noteCount} 个音，速度约 ${facts.tempo} BPM，跟着提示练大约 ${song.estimatedMinutes} 分钟就能弹完整。` : `This version has ${facts.noteCount} notes at about ${facts.tempo} BPM. Most beginners can play it through in about ${song.estimatedMinutes} minutes of guided practice.`]
  ];
  return `<section class="song-facts" aria-labelledby="song-facts-title">
<h2 id="song-facts-title">${zh ? `关于《${esc(title)}》这段旋律` : `About the ${esc(title)} melody`}</h2>
${items.map(([question, answer]) => `<h3>${esc(question)}</h3><p>${esc(answer)}</p>`).join('\n')}
</section>`;
}
function renderSong(song, locale) {
  const zh = locale === 'zh';
  const title = localeText(song, locale);
  const pageTitle = zh ? `${title}钢琴谱与在线弹奏｜按键提示教程` : (song.difficulty <= 2 ? `${title} Piano Letter Notes (Easy) – Play Online` : `${title} Piano Letter Notes – Play Online`);
  const description = song.description?.[locale] || '';
  const canonical = `https://pianoonline.cc${songUrl(song, locale)}`;
  const graph = [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: zh ? '首页' : 'Home', item: `https://pianoonline.cc${zh ? '/' : '/en/'}` },
      { '@type': 'ListItem', position: 2, name: zh ? '曲库' : 'Songs', item: `https://pianoonline.cc${zh ? '/songs/' : '/en/songs/'}` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical }
    ] },
    { '@type': 'MusicComposition', name: title, url: canonical, musicalKey: song.keySignature,
      ...(song.composer && !song.composer.startsWith('Traditional') ? { composer: { '@type': 'Person', name: song.composer } } : {}) }
  ];
  const rel = relatedSongs(song);
  const startLabel = zh ? '开始提示练习' : 'Start guided practice';
  const scoreReady = hasScoreForSong(song.id);
  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head><base href="/">${sharedHead({ locale, title: pageTitle, description, canonical, alternates: songAlternates(`/songs/${song.slug}/`), jsonLd: jsonLdScript(graph) })}<script type="module" src="/js/studio.js?v=${STUDIO_VERSION}"></script><script type="module" src="/js/song-page.js?v=${ASSET_VERSION}"></script></head>
<body class="secondary-page song-detail-page" data-song-id="${esc(song.id)}">${nav(locale)}
<main class="song-page-main"><div class="container">
<div class="song-breadcrumbs"><a href="${zh ? '/' : '/en/'}">${zh ? '首页' : 'Home'}</a><span>›</span><a href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '曲库' : 'Songs'}</a><span>›</span><span>${esc(title)}</span></div>
<section class="song-hero-panel"><div class="song-hero-copy"><div class="song-eyebrow">${zh ? '互动钢琴歌曲' : 'Interactive piano song'}</div><h1>${zh ? `在线学习弹奏《${esc(title)}》` : `Learn ${esc(title)} online`}</h1><p class="song-lead">${esc(description)}</p>${song.composer ? `<p class="song-composer">${zh ? '作曲/来源' : 'Composer / source'} · ${esc(song.composer)}</p>` : ''}<div class="song-meta-grid"><div class="song-meta-item"><strong>${difficultyLabel(song.difficulty, locale)}</strong><span>${zh ? '难度' : 'Difficulty'}</span></div><div class="song-meta-item"><strong>${song.estimatedMinutes} ${zh ? '分钟' : 'min'}</strong><span>${zh ? '预计时间' : 'Estimated time'}</span></div><div class="song-meta-item"><strong>${song.notes.length}</strong><span>${zh ? '音符数量' : 'Notes'}</span></div><div class="song-meta-item"><strong>${esc(song.keySignature)}</strong><span>${zh ? '调性' : 'Key'}</span></div></div><div class="song-primary-actions"><button type="button" class="btn primary" data-start-song>${startLabel}</button><a class="btn secondary" href="${songUrl(song, locale)}#letter-notes">${zh ? '查看完整字母谱' : 'See all letter notes'}</a></div></div><aside class="song-note-preview" id="keyboard-notes"><div class="section-kicker">${zh ? `前 20 个音（共 ${song.notes.length} 个）` : `First 20 of ${song.notes.length} notes`}</div><h2>${zh ? '电脑键盘预览' : 'Computer-key preview'}</h2><div class="note-chip-list">${keyboardPreview(song.notes)}</div><a class="song-notes-more" href="${songUrl(song, locale)}#letter-notes">${zh ? `查看全部 ${song.notes.length} 个音 ↓` : `See all ${song.notes.length} notes ↓`}</a><p>${zh ? '琴键上的字母与电脑键盘对应。进入练习后，系统会逐个提示。' : 'These letters match your computer keyboard. Guided practice reveals them one at a time.'}</p></aside></section>
${studioInstrument(locale, song.id)}
${letterNotesSection(song, locale, title)}
${songFactsSection(song, locale, title)}
${scoreReady ? `<section class="score-stage" data-score-viewer data-locale="${locale}" data-score-ready="${scoreReady ? 'true' : 'false'}"><div class="score-stage-header"><div><div class="section-kicker">${zh ? '互动乐谱' : 'Interactive sheet music'}</div><h2>${zh ? '看着乐谱，也能直接开始弹。' : 'Read the score while you play.'}</h2><p data-score-caption>${scoreReady ? (zh ? '双视图会同时保留乐谱与键位提示，适合从提示练习逐步过渡到看谱弹奏。' : 'Dual view keeps the score and key prompts together so you can transition into reading notation.') : (zh ? '这首曲目的五线谱正在补充中，当前仍可直接使用上方提示练习。' : 'Sheet music for this song is still being prepared, but guided practice above is ready right now.')}</p></div><div class="score-stage-options"><label class="score-follow"><input type="checkbox" data-score-follow checked>${zh ? '自动跟随当前音符' : 'Follow current note'}</label><span>${scoreReady ? (zh ? '已支持乐谱同步' : 'Score sync available') : (zh ? '更多乐谱陆续上线' : 'More scores coming soon')}</span></div></div><div class="score-stage-toolbar"><div class="score-mode-group"><button type="button" class="score-mode-button" data-score-mode="guided">${zh ? '提示模式' : 'Guided'}</button><button type="button" class="score-mode-button is-active" data-score-mode="dual">${zh ? '双视图' : 'Dual view'}</button><button type="button" class="score-mode-button" data-score-mode="score">${zh ? '只看乐谱' : 'Score only'}</button></div><div class="section-kicker">${zh ? '先用提示熟悉旋律，再对照乐谱。' : 'Learn the melody first, then explore its notation.'}</div></div><div class="score-canvas-frame"><div class="score-canvas" data-score-canvas><div class="score-viewer-empty"><strong>${zh ? '正在准备互动乐谱…' : 'Preparing interactive sheet music…'}</strong><p>${zh ? '如果当前歌曲尚未支持五线谱，我们会在这里提示你继续使用上方练习区。' : 'If this song does not support notation yet, you will see a friendly fallback here.'}</p></div></div></div></section>` : ''}
<section class="song-content-section"><div class="song-category-heading"><div><div class="section-kicker">${zh ? '继续演奏' : 'Keep playing'}</div><h2>${zh ? '下一首经典旋律' : 'Your next classic melody'}</h2></div></div><div class="song-card-grid">${rel.map((item) => card(item, locale)).join('')}</div></section>
</div></main><footer class="footer"><div class="container"><div class="footer-content"><p>&copy; 2026 Piano Online</p><div class="footer-links"><a href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '返回曲库' : 'Back to songs'}</a><a href="${languageUrl(song, locale)}">${zh ? 'English' : '中文'}</a></div></div></div></footer></body></html>`;
}
function renderSitemap() {
  const urls = publicSongs.flatMap((song) => [
    `  <url><loc>https://pianoonline.cc/songs/${song.slug}/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    `  <url><loc>https://pianoonline.cc/en/songs/${song.slug}/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    `  <url><loc>https://pianoonline.cc/zh-hant/songs/${song.slug}/</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://pianoonline.cc/songs/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n  <url><loc>https://pianoonline.cc/en/songs/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n  <url><loc>https://pianoonline.cc/zh-hant/songs/</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n${urls.join('\n')}\n</urlset>`;
}
export async function generateSongSite(rootDir = PROJECT_ROOT) {
  const zhLibraryDir = path.join(rootDir, 'songs');
  const enLibraryDir = path.join(rootDir, 'en', 'songs');
  const zhHantLibraryDir = path.join(rootDir, 'zh-hant', 'songs');
  await mkdir(zhLibraryDir, { recursive: true });
  await mkdir(enLibraryDir, { recursive: true });
  await mkdir(zhHantLibraryDir, { recursive: true });
  const zhLibraryHtml = renderLibrary('zh');
  await writeFile(path.join(zhLibraryDir, 'index.html'), zhLibraryHtml, 'utf8');
  await writeFile(path.join(enLibraryDir, 'index.html'), renderLibrary('en'), 'utf8');
  await writeFile(path.join(zhHantLibraryDir, 'index.html'), renderTraditional(zhLibraryHtml), 'utf8');
  for (const song of publicSongs) {
    const zhDir = path.join(zhLibraryDir, song.slug);
    const enDir = path.join(enLibraryDir, song.slug);
    const zhHantDir = path.join(zhHantLibraryDir, song.slug);
    await mkdir(zhDir, { recursive: true });
    await mkdir(enDir, { recursive: true });
    await mkdir(zhHantDir, { recursive: true });
    const zhSongHtml = renderSong(song, 'zh');
    await writeFile(path.join(zhDir, 'index.html'), zhSongHtml, 'utf8');
    await writeFile(path.join(enDir, 'index.html'), renderSong(song, 'en'), 'utf8');
    await writeFile(path.join(zhHantDir, 'index.html'), renderTraditional(zhSongHtml), 'utf8');
  }
  await writeFile(path.join(rootDir, 'sitemap-songs.xml'), renderSitemap(), 'utf8');
  return { count: publicSongs.length, pages: publicSongs.length * 3 + 3 };
}
const directRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (directRun) {
  const result = await generateSongSite(PROJECT_ROOT);
  console.log(`Generated ${result.pages} song pages from ${result.count} public-domain or traditional songs.`);
}
