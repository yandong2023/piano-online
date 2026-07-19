import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tutorialArticles, tutorialCategories, getTutorialBySlug, getTutorialTitle } from '../data/tutorial-library.mjs';
import { getSongById, getSongTitle } from '../data/song-library.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..');
const ASSET_VERSION = '20260718.1';

const legacyTutorials = {
  'piano-basics': { zh: '钢琴基础知识', en: 'Piano Basics' },
  'finger-numbers': { zh: '手指编号与基本指法', en: 'Finger Numbers and Fingering' },
  'reading-notes': { zh: '五线谱入门', en: 'Reading Piano Notes' },
  'rhythm-basics': { zh: '节奏基础', en: 'Rhythm Basics' },
  'practice-methods': { zh: '科学练习方法', en: 'Effective Practice Methods' },
  'hand-coordination': { zh: '双手协调训练', en: 'Hand Coordination' },
  'scales-practice': { zh: '音阶练习指南', en: 'Scale Practice' },
  'sight-reading': { zh: '视奏训练方法', en: 'Sight-Reading Practice' },
  'music-theory': { zh: '基础乐理知识', en: 'Basic Music Theory' },
  'advanced-music-theory': { zh: '进阶乐理知识', en: 'Advanced Music Theory' },
  'music-analysis': { zh: '经典曲目解析', en: 'Music Analysis' },
  'performance-skills': { zh: '提升演奏表现力', en: 'Performance Skills' }
};

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function text(value, locale) {
  return value?.[locale] || value?.zh || '';
}

function localizedPath(locale, slug) {
  return locale === 'zh'
    ? `/articles/guides/${slug}/`
    : `/en/articles/guides/${slug}/`;
}

function tutorialHref(slug, locale) {
  if (getTutorialBySlug(slug)) return localizedPath(locale, slug);
  const prefix = locale === 'zh' ? '' : '/en';
  return `${prefix}/articles/tutorials/${slug}.html`;
}

function tutorialLabel(slug, locale) {
  const article = getTutorialBySlug(slug);
  if (article) return getTutorialTitle(article, locale);
  return legacyTutorials[slug]?.[locale] || slug;
}

function songHref(song, locale) {
  return locale === 'zh' ? `/songs/${song.slug}/` : `/en/songs/${song.slug}/`;
}

function nav(locale) {
  const zh = locale === 'zh';
  return `<nav class="nav-bar"><div class="nav-container"><a href="${zh ? '/' : '/en/'}" class="nav-logo"><img src="/images/logo.svg" alt="${zh ? '钢琴在线' : 'Piano Online'}" class="logo-img"></a><div class="nav-links"><a href="${zh ? '/' : '/en/'}">${zh ? '首页' : 'Home'}</a><a href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '曲库' : 'Songs'}</a><a href="${zh ? '/tutorials.html' : '/en/tutorials.html'}" class="active">${zh ? '教程' : 'Learn'}</a><a href="${zh ? '/#practice-start' : '/en/#practice-start'}">${zh ? '在线钢琴' : 'Piano'}</a><a href="${zh ? '/en/tutorials.html' : '/tutorials.html'}" hreflang="${zh ? 'en' : 'zh-CN'}">${zh ? 'English' : '中文'}</a></div></div></nav>`;
}

function sharedHead({ locale, title, description, canonical, alternate, type = 'article' }) {
  const zh = locale === 'zh';
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title)} | Piano Online</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${zh ? 'zh-CN' : 'en'}" href="${canonical}">
<link rel="alternate" hreflang="${zh ? 'en' : 'zh-CN'}" href="${alternate}">
<link rel="alternate" hreflang="x-default" href="${zh ? alternate : canonical}">
<link rel="icon" href="/images/favicon.svg">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://pianoonline.cc/images/og-image.jpg">
<meta property="og:site_name" content="Piano Online">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="stylesheet" href="/css/piano.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/secondary-pages.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="/css/tutorial-guide.css?v=${ASSET_VERSION}">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-EYGD99YB4Y"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-EYGD99YB4Y');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4423187689700927" crossorigin="anonymous"></script>`;
}

function renderExample(example, locale) {
  if (!example) return '';
  const count = Math.max(example.keys?.length || 0, example.notes?.length || 0);
  const items = Array.from({ length: count }, (_, index) => `<div class="tutorial-example-item"><kbd>${esc(example.keys?.[index] || '')}</kbd><span>${esc(example.notes?.[index] || '')}</span></div>`).join('');
  return `<div class="tutorial-example"><strong>${esc(text(example.label, locale))}</strong><div class="tutorial-example-grid">${items}</div></div>`;
}

function renderSection(section, locale, index) {
  const paragraphs = (section.paragraphs?.[locale] || section.paragraphs?.zh || [])
    .map((paragraph) => `<p>${esc(paragraph)}</p>`).join('');
  const bullets = (section.bullets?.[locale] || section.bullets?.zh || [])
    .map((item) => `<li>${esc(item)}</li>`).join('');
  const steps = (section.steps?.[locale] || section.steps?.zh || [])
    .map((item, stepIndex) => `<li><span>${stepIndex + 1}</span><p>${esc(item)}</p></li>`).join('');
  const tip = section.tip ? `<aside class="tutorial-tip"><strong>${locale === 'zh' ? '练习提示' : 'Practice tip'}</strong><p>${esc(text(section.tip, locale))}</p></aside>` : '';

  return `<section class="tutorial-section" id="section-${index + 1}"><div class="tutorial-section-number">${String(index + 1).padStart(2, '0')}</div><div><h2>${esc(text(section.heading, locale))}</h2>${paragraphs}${bullets ? `<ul class="tutorial-bullets">${bullets}</ul>` : ''}${steps ? `<ol class="tutorial-steps">${steps}</ol>` : ''}${renderExample(section.example, locale)}${tip}</div></section>`;
}

function renderArticle(article, locale) {
  const zh = locale === 'zh';
  const title = getTutorialTitle(article, locale);
  const description = text(article.description, locale);
  const canonicalPath = localizedPath(locale, article.slug);
  const alternatePath = localizedPath(zh ? 'en' : 'zh', article.slug);
  const canonical = `https://pianoonline.cc${canonicalPath}`;
  const alternate = `https://pianoonline.cc${alternatePath}`;
  const outcomes = (article.outcomes?.[locale] || article.outcomes?.zh || [])
    .map((item) => `<li>${esc(item)}</li>`).join('');
  const sections = article.sections.map((section, index) => renderSection(section, locale, index)).join('');
  const relatedSongs = article.relatedSongs
    .map((id) => getSongById(id))
    .filter(Boolean)
    .map((song) => `<a class="tutorial-related-card" href="${songHref(song, locale)}"><span>${zh ? '互动歌曲' : 'Interactive song'}</span><strong>${esc(getSongTitle(song, locale))}</strong><small>${song.estimatedMinutes} ${zh ? '分钟' : 'min'} · ${song.notes.length} ${zh ? '个音符' : 'notes'}</small></a>`).join('');
  const relatedTutorials = article.relatedTutorials
    .map((slug) => `<a class="tutorial-related-card" href="${tutorialHref(slug, locale)}"><span>${zh ? '继续学习' : 'Continue learning'}</span><strong>${esc(tutorialLabel(slug, locale))}</strong><small>${zh ? '查看教程' : 'Read guide'} →</small></a>`).join('');
  const faqHtml = (article.faq || []).map((item) => `<details class="tutorial-faq"><summary>${esc(text(item.q, locale))}</summary><p>${esc(text(item.a, locale))}</p></details>`).join('');
  const faqSchema = (article.faq || []).map((item) => ({
    '@type': 'Question',
    name: text(item.q, locale),
    acceptedAnswer: { '@type': 'Answer', text: text(item.a, locale) }
  }));

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: zh ? 'zh-CN' : 'en',
    mainEntityOfPage: canonical,
    image: 'https://pianoonline.cc/images/og-image.jpg',
    author: { '@type': 'Organization', name: 'Piano Online', url: 'https://pianoonline.cc' },
    publisher: { '@type': 'Organization', name: 'Piano Online', logo: { '@type': 'ImageObject', url: 'https://pianoonline.cc/images/logo.svg' } }
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: zh ? '首页' : 'Home', item: `https://pianoonline.cc${zh ? '/' : '/en/'}` },
      { '@type': 'ListItem', position: 2, name: zh ? '钢琴教程' : 'Piano Tutorials', item: `https://pianoonline.cc${zh ? '/tutorials.html' : '/en/tutorials.html'}` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical }
    ]
  };

  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head>${sharedHead({ locale, title, description, canonical, alternate })}<meta property="article:published_time" content="${article.publishedAt}"><meta property="article:modified_time" content="${article.updatedAt}"></head><body class="secondary-page tutorial-guide-page">${nav(locale)}<main class="tutorial-guide-main"><div class="container"><div class="tutorial-breadcrumbs"><a href="${zh ? '/' : '/en/'}">${zh ? '首页' : 'Home'}</a><span>›</span><a href="${zh ? '/tutorials.html' : '/en/tutorials.html'}">${zh ? '教程' : 'Learn'}</a><span>›</span><span>${esc(title)}</span></div><header class="tutorial-guide-hero"><div class="tutorial-guide-copy"><div class="secondary-eyebrow">${zh ? 'Piano Online 实用教程' : 'Piano Online practical guide'}</div><h1>${esc(title)}</h1><p>${esc(text(article.intro, locale))}</p><div class="tutorial-meta"><span>${zh ? '阅读' : 'Read'} ${article.minutes} ${zh ? '分钟' : 'min'}</span><span>${zh ? '难度' : 'Level'} ${article.difficulty}</span><span>${article.updatedAt}</span></div><div class="tutorial-hero-actions"><a class="primary-action" href="${zh ? '/#practice-start' : '/en/#practice-start'}">${zh ? '打开在线钢琴' : 'Open the piano'}</a><a class="secondary-action" href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '浏览歌曲库' : 'Browse songs'}</a></div></div><aside class="tutorial-outcomes"><span>${zh ? '学完你会' : 'You will learn'}</span><ul>${outcomes}</ul></aside></header><div class="tutorial-content-layout"><article class="tutorial-content">${sections}${faqHtml ? `<section class="tutorial-faq-section"><div class="secondary-eyebrow">FAQ</div><h2>${zh ? '常见问题' : 'Frequently asked questions'}</h2>${faqHtml}</section>` : ''}</article><aside class="tutorial-sidebar"><div class="tutorial-sidebar-card"><strong>${zh ? '本文目录' : 'On this page'}</strong><ol>${article.sections.map((section, index) => `<li><a href="#section-${index + 1}">${esc(text(section.heading, locale))}</a></li>`).join('')}</ol></div><div class="tutorial-sidebar-card tutorial-practice-cta"><span>${zh ? '边看边练' : 'Learn by doing'}</span><strong>${zh ? '打开钢琴，跟着提示完成一首歌' : 'Open the piano and finish a guided song'}</strong><a href="${zh ? '/#practice-start' : '/en/#practice-start'}">${zh ? '立即开始' : 'Start now'} →</a></div></aside></div><section class="tutorial-related"><div class="secondary-section-heading"><div><div class="secondary-eyebrow">${zh ? '把知识用起来' : 'Put it into practice'}</div><h2>${zh ? '相关歌曲与下一篇教程' : 'Related songs and next guides'}</h2></div></div><div class="tutorial-related-grid">${relatedSongs}${relatedTutorials}</div></section></div></main><footer class="footer"><div class="container"><div class="footer-content"><p>&copy; 2026 Piano Online</p><div class="footer-links"><a href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '曲库' : 'Songs'}</a><a href="${zh ? '/tutorials.html' : '/en/tutorials.html'}">${zh ? '教程' : 'Learn'}</a><a href="${zh ? '/en/' : '/'}">${zh ? 'English' : '中文'}</a></div></div></div></footer><script type="application/ld+json">${JSON.stringify(articleSchema)}</script><script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>${faqSchema.length ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqSchema })}</script>` : ''}</body></html>`;
}

function renderIndex(locale) {
  const zh = locale === 'zh';
  const canonical = `https://pianoonline.cc${zh ? '/tutorials.html' : '/en/tutorials.html'}`;
  const alternate = `https://pianoonline.cc${zh ? '/en/tutorials.html' : '/tutorials.html'}`;
  const title = zh ? '钢琴教程与知识库：零基础、练习方法与经典曲目' : 'Piano Tutorials: Beginner Lessons, Practice Methods and Classic Songs';
  const description = zh ? `收录 ${tutorialArticles.length + Object.keys(legacyTutorials).length} 篇钢琴教程，覆盖电脑键盘弹琴、读谱、节奏、和弦、左手练习与经典曲目。` : `${tutorialArticles.length + Object.keys(legacyTutorials).length} piano tutorials covering computer-keyboard playing, notation, rhythm, chords, left-hand practice and classic pieces.`;
  const categorySections = tutorialCategories.map((category) => {
    const articles = tutorialArticles.filter((article) => article.category === category.id);
    return `<section class="tutorial-index-section" id="${category.id}"><div class="secondary-section-heading"><div><div class="secondary-eyebrow">${esc(text(category.label, locale))}</div><h2>${esc(text(category.label, locale))}</h2></div><p>${esc(text(category.description, locale))}</p></div><div class="tutorial-index-grid">${articles.map((article) => `<a class="tutorial-index-card" href="${localizedPath(locale, article.slug)}"><span>${zh ? `难度 ${article.difficulty}` : `Level ${article.difficulty}`} · ${article.minutes} ${zh ? '分钟' : 'min'}</span><h3>${esc(getTutorialTitle(article, locale))}</h3><p>${esc(text(article.description, locale))}</p><strong>${zh ? '阅读教程' : 'Read guide'} →</strong></a>`).join('')}</div></section>`;
  }).join('');
  const legacyCards = Object.entries(legacyTutorials).map(([slug, labels]) => `<a class="tutorial-index-card tutorial-index-card-legacy" href="${tutorialHref(slug, locale)}"><span>${zh ? '基础知识库' : 'Foundation library'}</span><h3>${esc(labels[locale])}</h3><p>${zh ? '继续阅读原有钢琴基础、乐理和练习内容。' : 'Continue with the existing foundation, theory and practice lesson.'}</p><strong>${zh ? '查看文章' : 'Read article'} →</strong></a>`).join('');
  const itemList = tutorialArticles.map((article, index) => ({ '@type': 'ListItem', position: index + 1, url: `https://pianoonline.cc${localizedPath(locale, article.slug)}`, name: getTutorialTitle(article, locale) }));

  return `<!DOCTYPE html><html lang="${zh ? 'zh-CN' : 'en'}"><head>${sharedHead({ locale, title, description, canonical, alternate, type: 'website' })}</head><body class="secondary-page tutorial-library-page">${nav(locale)}<main class="secondary-shell tutorial-library-main"><div class="container"><header class="secondary-hero tutorial-library-hero"><div class="secondary-eyebrow">${zh ? '工具 + 内容学习中心' : 'Tool + content learning hub'}</div><h1>${zh ? '从第一次按键，到真正弹完经典旋律。' : 'From your first key to a complete classic melody.'}</h1><p class="secondary-lead">${zh ? '先用在线钢琴获得即时反馈，再通过详细教程理解键位、节奏、和弦和作品。每篇内容都连接到可以直接练习的歌曲或工具。' : 'Use the online piano for immediate feedback, then learn keyboard geography, rhythm, chords and repertoire through detailed guides. Every guide links back to something playable.'}</p><div class="secondary-actions"><a class="primary-action" href="${zh ? '/#practice-start' : '/en/#practice-start'}">${zh ? '立即体验提示练习' : 'Try guided practice'}</a><a class="secondary-action" href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '浏览经典曲库' : 'Browse classic songs'}</a></div><div class="tutorial-library-stats"><span><strong>${tutorialArticles.length + Object.keys(legacyTutorials).length}</strong>${zh ? '篇教程' : 'guides'}</span><span><strong>2</strong>${zh ? '种语言' : 'languages'}</span><span><strong>1</strong>${zh ? '个可直接练习的钢琴' : 'playable piano'}</span></div></header><nav class="tutorial-category-nav">${tutorialCategories.map((category) => `<a href="#${category.id}">${esc(text(category.label, locale))}</a>`).join('')}<a href="#foundation">${zh ? '基础知识库' : 'Foundation library'}</a></nav>${categorySections}<section class="tutorial-index-section" id="foundation"><div class="secondary-section-heading"><div><div class="secondary-eyebrow">${zh ? '已有内容升级保留' : 'Existing foundation'}</div><h2>${zh ? '基础知识、乐理与演奏技巧' : 'Foundation, theory and performance'}</h2></div><p>${zh ? '原有教程继续保留，并与新场景页互相链接。' : 'The original tutorials remain available and are connected to the new scenario guides.'}</p></div><div class="tutorial-index-grid">${legacyCards}</div></section></div></main><footer class="footer"><div class="container"><div class="footer-content"><p>&copy; 2026 Piano Online</p><div class="footer-links"><a href="${zh ? '/songs/' : '/en/songs/'}">${zh ? '曲库' : 'Songs'}</a><a href="${zh ? '/#practice-start' : '/en/#practice-start'}">${zh ? '在线钢琴' : 'Piano'}</a><a href="${zh ? '/en/tutorials.html' : '/tutorials.html'}">${zh ? 'English' : '中文'}</a></div></div></div></footer><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: canonical, mainEntity: { '@type': 'ItemList', itemListElement: itemList } })}</script></body></html>`;
}

export async function generateTutorialSite(root = PROJECT_ROOT) {
  for (const locale of ['zh', 'en']) {
    for (const article of tutorialArticles) {
      const directory = path.join(root, locale === 'zh' ? '' : 'en', 'articles', 'guides', article.slug);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, 'index.html'), renderArticle(article, locale), 'utf8');
    }

    const indexPath = path.join(root, locale === 'zh' ? '' : 'en', 'tutorials.html');
    await mkdir(path.dirname(indexPath), { recursive: true });
    await writeFile(indexPath, renderIndex(locale), 'utf8');
  }

  return { articles: tutorialArticles.length, pages: tutorialArticles.length * 2 + 2 };
}

const isDirectRun = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) {
  const result = await generateTutorialSite(PROJECT_ROOT);
  console.log(`Generated ${result.pages} tutorial pages for ${result.articles} new guides.`);
}
