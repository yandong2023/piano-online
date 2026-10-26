# SELFTEST STAF-66 · Legacy 文章首屏 CTA

2026-10-22；PRD v1；基线 origin/main 9bcdcab。范围为提案 1，简体/英文 26 页。

## 执行结果

- `npm test`：97/97 PASS（24 audio + 20 home + 9 secondary + 28 songs + 12 tutorials + 4 score），0 fail。tutorials 原有 10 项保留，增加 2 项；完整日志见附件 npm-test.log。
- `npm run build`：100 public songs, 10 new tutorials, 357 sitemap URLs。
- `python3 verify-dist.py`：连续两次构建 SHA256 清单必须相同；结果见附件 idempotency.txt。包含整个 dist 文件树，非仅抽查 HTML。
- `git diff --check`：无输出。
- 保护名单及 legacy HTML 源码：与 origin/main 差异为空；提交仅含下列实现与证据文档。

## AC 对照

| AC | 结果与证据 |
|---|---|
| AC-1 | PASS，26 行覆盖表见下文，原始 grep -c 每页 1 |
| AC-2 | PASS，全部 26 页在 header.article-header 内且 h1 之后；简英 DOM 见下文 |
| AC-3 | PASS，简 13/13 /#practice-start + 打开在线钢琴；英 13/13 /en/#practice-start + Open the piano；slug 为文件名 |
| AC-4 | PASS，新增单测二次应用与连续构建全文件哈希对比，见 idempotency.txt |
| AC-5 | PASS，26 页移除 CTA/script/单页回退 style 后与构建前基线逐字节一致，title、h1、metadata、正文等均包含在对照范围；26 个 HTML 源码未改 |
| AC-6 | PASS，20 指南 + 2 索引前后逐字节一致，比仅比较链接更严格 |
| AC-7 | PASS（本地请求参数），真实 Google gtag 库发出的 collect 请求事件和 3 参数相符；zh-CN-collect.png / en-collect.png；缺 gtag 导航无错误。请求被本地返回 204，不入生产 GA4。见下面限制 |
| AC-8 | PASS，26 页 × 手机/桌面共 52 组；四截图见附件，按钮首屏可见、无遮挡、无横溢、高度 ≥44px |
| AC-9 | PASS，npm test 97/97，build 通过，sitemap=357；原有语言标签幂等断言保留 |
| AC-10 | PASS，保护文件差异为空（js/piano.js / js/piano-audio.js / js/practice-mode.js / css/studio.css） |
| AC-11 | 未执行：未发布，需上线满 14 天由产品/运营按 PRD 口径观察；不作开发门槛 |

## 实现路径与行号

- scripts/apply-legacy-articles.mjs:106：纯 HTML 注入与独立去重；:130：固定 26 页遍历。
- scripts/render-tutorial-pages.mjs:131：默认不注入，保留源码生成路径；:143：显式开启时调用。
- scripts/build-site.mjs:23：dist 构建开启 includeLegacyCta。
- css/article.css:140：CTA 样式命名区。
- tests/tutorial-library.test.mjs:173：覆盖/幂等/正文保留；:207：空页面/无 header 警告/既有块/不支持语言。
- scripts/ui-article-cta.py：浏览器可复现检查，依赖 Python playwright 和 Chromium。

## 26 页逐页结果

```text
articles/tutorials/advanced-music-theory.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/finger-numbers.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/hand-coordination.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/music-analysis.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/music-theory.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/performance-skills.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/piano-basics.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/piano-maintenance.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/practice-methods.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/reading-notes.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/rhythm-basics.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/scales-practice.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
articles/tutorials/sight-reading.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/advanced-music-theory.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/finger-numbers.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/hand-coordination.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/music-analysis.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/music-theory.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/performance-skills.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/piano-basics.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/piano-maintenance.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/practice-methods.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/reading-notes.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/rhythm-basics.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/scales-practice.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
en/articles/tutorials/sight-reading.html: CTA=1, header/title order=PASS, href/text/slug=PASS, original bytes=UNCHANGED
PASS: 26 legacy pages, zh=13/13 en=13/13; stripped diff empty; 22 guide/index pages byte-identical; sitemap=357
```

## 两页 DOM（省略跟踪脚本，仅为便于阅读；原始完整 DOM 在 browser/report.json）

### zh-CN

```html
<header class="article-header">
                <h1>钢琴基础知识：认识键盘与正确坐姿</h1>
                <div class="article-meta">
                    <span class="publish-date">发布于：2025-03-22</span>
                    <span class="read-time">阅读时间：15分钟</span>
                    <span class="difficulty">难度：入门</span>
                </div>
            <div class="article-cta" data-article-cta=""><a class="article-cta-primary" href="/#practice-start" data-article-cta-link="" data-article-slug="piano-basics">打开在线钢琴</a></div></header>
```

### en

```html
<header class="article-header">
        <h1>Piano Basics: Keyboard Layout and Proper Posture</h1>
        <div class="meta"><span>Published: 2025-03-22</span> · <span>Read time: 12 min</span> · <span>Level: Beginner</span></div>
      <div class="article-cta" data-article-cta=""><a class="article-cta-primary" href="/en/#practice-start" data-article-cta-link="" data-article-slug="piano-basics">Open the piano</a></div></header>
```

## 埋点与导航

```json
[
  {
    "en": "article_cta_click",
    "ep.article_slug": "piano-basics",
    "ep.locale": "zh-CN",
    "ep.position": "hero"
  },
  {
    "en": "article_cta_click",
    "ep.article_slug": "piano-basics",
    "ep.locale": "en",
    "ep.position": "hero"
  }
]
```

浏览器输出：`PASS: 52 layouts, 2 real gtag collect events, 4 fallback navigations; no page errors`。
最低按钮高度：44px。
4 次导航 = 简英两侧各一次 gtag=undefined、一次 JavaScript disabled，均到正确首页 #practice-start。

复现：先 `npm run build`，另起本地静态服务器 `python3 -m http.server 4173 --directory dist`，安装 Python playwright 与 Chromium 后运行 `python scripts/ui-article-cta.py`；可用 PIANO_TEST_URL、ARTICLE_CTA_ARTIFACTS、BROWSER_EXECUTABLE 环境变量指定 URL / 输出 / 已有 Chromium。原始输出及 6 张截图随 evidence 包提供。

## 限制、回滚与交接

GA4 会批量延后发送，浏览器路由拦截在文档卸载时可能观察不到 beacon。请求参数测试临时阻止默认导航，留在文章页等待真实 collect；普通链接/禁 JS/缺 gtag 导航另行验证。生产入库、真实导航时送达率与 14 天点击率未验证，尽力上报的丢失可能低估 CTR，应由质检及运营复核，不把本地参数通过当成线上数据通过。

PRD 一处事实修正：英文 piano-basics 未加载 article.css，故只为该页从 article.css 提取按钮规则插入 style；原文章布局保持。其余 25 页沿用已加载样式。
无权限、后端空数据和多租户不适用；无 header/空 HTML、重复应用与缺 JS/gtag 边界已覆盖。串行静态构建无并发服务写入。

不合并、不部署，等 STAF-68 窗口决策。回滚：获批后通过新分支 `git revert <本单提交 SHA>` 走评审重建部署，或恢复发布前静态部署；无数据库改动。详见 TECH-STAF-66-article-page-piano-cta.md。
