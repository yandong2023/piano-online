import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  SITE_ORIGIN,
  hreflangBlock,
  legacyTutorialAlternates,
  legacyTutorialLocales,
  legacyTutorialSlugs,
  zhHantTutorialHref
} from './locale-alternates.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..');

const CHECK = '<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
const SWITCHER_SCRIPT = '<script id="article-lang-switcher">document.addEventListener(\'DOMContentLoaded\',()=>{const sw=document.querySelector(\'.lang-switcher\');const btn=sw&&sw.querySelector(\'.lang-switcher-btn\');if(!sw||!btn)return;btn.addEventListener(\'click\',(e)=>{e.stopPropagation();const open=!sw.classList.contains(\'open\');sw.classList.toggle(\'open\',open);btn.setAttribute(\'aria-expanded\',open?\'true\':\'false\');});document.addEventListener(\'click\',()=>{sw.classList.remove(\'open\');btn.setAttribute(\'aria-expanded\',\'false\');});});</script>';

function stripAlternateLinks(html) {
  return html.replace(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["'][^"']+["'])[^>]*>[ \t]*(?:\r?\n)?/gi, '');
}

function setHtmlLang(html, lang) {
  return html.replace(/<html\b([^>]*)>/i, (match, attrs) => {
    if (/\slang=/.test(attrs)) return `<html${attrs.replace(/\slang=["'][^"']*["']/, ` lang="${lang}"`)}>`;
    return `<html lang="${lang}"${attrs}>`;
  });
}

function setCanonical(html, href) {
  const tag = `<link rel="canonical" href="${href}">`;
  if (/<link\b[^>]*\brel=["']canonical["']/i.test(html)) {
    return html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function insertHreflang(html, markup) {
  if (/<link\b[^>]*\brel=["']canonical["']/i.test(html)) {
    return html.replace(/(<link\b[^>]*\brel=["']canonical["'][^>]*>)/i, `$1\n${markup}`);
  }
  return html.replace(/<\/head>/i, `${markup}\n</head>`);
}

function languageOption({ href, lang, label, current }) {
  const currentAttr = current ? ' class="active" aria-current="true"' : '';
  const mark = current ? CHECK : '';
  return `<a href="${href}"${currentAttr} lang="${lang}" hreflang="${lang}">${label}${mark}</a>`;
}

function switcherMarkup(slug, lang, root) {
  const labels = { 'zh-CN': '简体中文', 'zh-Hant': '繁體中文', en: 'English' };
  const button = { 'zh-CN': '中文', 'zh-Hant': '繁體', en: 'English' }[lang];
  const buttonLang = { 'zh-CN': '切换语言', 'zh-Hant': '切換語言', en: 'Change language' }[lang];
  const hrefs = {
    'zh-CN': `/articles/tutorials/${slug}.html`,
    'zh-Hant': zhHantTutorialHref(slug, root),
    en: `/en/articles/tutorials/${slug}.html`
  };
  const options = ['zh-CN', 'zh-Hant', 'en'].map((code) => languageOption({
    href: hrefs[code],
    lang: code,
    label: labels[code],
    current: code === lang
  })).join('');
  return `<div class="lang-switcher"><button type="button" class="lang-switcher-btn" aria-expanded="false" aria-haspopup="true" aria-label="${buttonLang}"><span>${button}</span></button><div class="lang-dropdown">${options}</div></div>`;
}

function upsertTraditionalLink(dropdown, href) {
  const link = languageOption({ href, lang: 'zh-Hant', label: '繁體中文', current: false });
  if (/hreflang=["']zh-Hant["']/.test(dropdown)) {
    return dropdown.replace(/<a\b[^>]*hreflang=["']zh-Hant["'][^>]*>[\s\S]*?<\/a>/, link);
  }
  if (dropdown.includes('</a>')) return dropdown.replace('</a>', `</a>${link}`);
  return `${link}${dropdown}`;
}

function ensureLanguageSwitcher(html, slug, lang, root) {
  const traditionalHref = zhHantTutorialHref(slug, root);
  if (/<div class="lang-dropdown">/.test(html)) {
    return html.replace(/<div class="lang-dropdown">([\s\S]*?)<\/div>/, (match, inner) => `<div class="lang-dropdown">${upsertTraditionalLink(inner, traditionalHref)}</div>`);
  }
  if (html.includes('class="studio-lang"')) return html;
  const switcher = switcherMarkup(slug, lang, root);
  return html.replace(/<div class="nav-links">([\s\S]*?)<\/div>/, (match, inner) => `<div class="nav-links">${inner}\n${switcher}\n</div>`);
}

function ensureSwitcherScript(html) {
  if (!html.includes('class="lang-switcher"')) return html;
  if (html.includes('id="article-lang-switcher"') || html.includes("querySelector('.lang-switcher')") || html.includes('querySelector(".lang-switcher")')) return html;
  return html.replace(/<\/body>/i, `${SWITCHER_SCRIPT}</body>`);
}

export function applyArticleLanguage(html, { slug, lang, root }) {
  const pathname = legacyTutorialLocales(slug, root).find(([code]) => code === lang)?.[1];
  const canonical = `${SITE_ORIGIN}${pathname}`;
  let next = stripAlternateLinks(html);
  next = setHtmlLang(next, lang);
  next = setCanonical(next, canonical);
  next = insertHreflang(next, hreflangBlock(legacyTutorialAlternates(slug, root)));
  next = ensureLanguageSwitcher(next, slug, lang, root);
  next = ensureSwitcherScript(next);
  return next;
}

export function applyArticleCta(html, { slug, lang, styles = '', warn = console.warn }) {
  if (!['zh-CN', 'en'].includes(lang)) return html;
  const header = /(<header\b[^>]*\bclass=["'][^"']*\barticle-header\b[^"']*["'][^>]*>)([\s\S]*?)(<\/header>)/i;
  if (!header.test(html)) {
    warn(`Legacy article CTA: missing header.article-header (${lang}/${slug}).`);
    return html;
  }
  const hasCta = /\sdata-article-cta(?:\s|[=>])/.test(html);
  const hasTracking = /\bid=["']article-cta-tracking["']/.test(html);
  if (hasCta && hasTracking) return html;
  const zh = lang === 'zh-CN';
  // Slugs come from the fixed catalog, never from the visitor's URL.
  const safeSlug = slug.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const cta = hasCta ? '' : `<div class="article-cta" data-article-cta><a class="article-cta-primary" href="${zh ? '/' : '/en/'}#practice-start" data-article-cta-link data-article-slug="${safeSlug}">${zh ? '打开在线钢琴' : 'Open the piano'}</a></div>`;
  const tracking = hasTracking ? '' : `<script id="article-cta-tracking">document.querySelectorAll('[data-article-cta-link]').forEach(function(link){link.addEventListener('click',function(){if(typeof window.gtag==='function'){window.gtag('event','article_cta_click',{article_slug:link.dataset.articleSlug,locale:'${lang}',position:'hero'});}});});</script>`;
  let next = html.replace(header, (match, start, body, end) => `${start}${body}${cta}${tracking}${end}`);
  // One legacy English page lacks article.css; use only its CTA rules so the
  // existing article header and body retain their original appearance.
  if (styles && !/<link\b[^>]*href=["'][^"']*\/css\/article\.css(?:\?[^"']*)?["']/i.test(next) && !next.includes('id="article-cta-styles"')) {
    next = next.replace(/<\/head>/i, `<style id="article-cta-styles">${styles}</style></head>`);
  }
  return next;
}

export async function applyLegacyTutorialCtas(root = PROJECT_ROOT) {
  const css = await readFile(path.join(root, 'css/article.css'), 'utf8');
  const styles = css.match(/\/\* ARTICLE_CTA_START \*\/([\s\S]*?)\/\* ARTICLE_CTA_END \*\//)?.[1];
  if (!styles) throw new Error('Missing article CTA rules in css/article.css');
  let pages = 0;
  for (const slug of legacyTutorialSlugs) {
    for (const [lang, prefix] of [['zh-CN', ''], ['en', 'en/']]) {
      const file = path.join(root, `${prefix}articles/tutorials/${slug}.html`);
      const html = await readFile(file, 'utf8');
      const next = applyArticleCta(html, { slug, lang, styles });
      if (next !== html) await writeFile(file, next, 'utf8');
      pages += 1;
    }
  }
  return { pages };
}

export async function applyLegacyTutorialLocales(root = PROJECT_ROOT) {
  let pages = 0;
  for (const slug of legacyTutorialSlugs) {
    for (const [lang, pathname] of legacyTutorialLocales(slug, root)) {
      const file = path.join(root, pathname.replace(/^\//, ''));
      let html;
      try {
        html = await readFile(file, 'utf8');
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      const next = applyArticleLanguage(html, { slug, lang, root });
      if (next !== html) await writeFile(file, next, 'utf8');
      pages += 1;
    }
  }
  return { pages };
}

const isDirectRun = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) {
  const result = await applyLegacyTutorialLocales(PROJECT_ROOT);
  console.log(`Updated language tags on ${result.pages} legacy tutorial pages.`);
}
