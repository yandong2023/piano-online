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
  // Update only Chinese legacy home anchors; English source/output stays intact.
  let next = html;
  if (lang === 'zh-CN') {
    next = next.replaceAll('<a href="/">首页</a>', '<a href="/piano.html">在线钢琴</a>');
    next = next.replaceAll('<a href="/">在线钢琴</a>', '<a href="/piano.html">在线钢琴</a>');
    next = next.replaceAll('<a href="/" class="nav-logo">', '<a href="/piano.html" class="nav-logo">');
  }
  next = stripAlternateLinks(next);
  next = setHtmlLang(next, lang);
  next = setCanonical(next, canonical);
  next = insertHreflang(next, hreflangBlock(legacyTutorialAlternates(slug, root)));
  next = ensureLanguageSwitcher(next, slug, lang, root);
  next = ensureSwitcherScript(next);
  return next;
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
