# PRD-STAF-66-A · 文章/教程页首屏统一「打开在线钢琴」CTA

- 版本：v1（2026-10-22）
- 作者：产品
- 来源提案：Atlas《ANALYSIS-20261022-staf64-seo-simulator.md》§6 提案 1（P2，数据最硬）
- 上游 issue：STAF-66（Morgan 转需求收敛）
- 需求性质判定：**真需求（改动小、缺口确定），但收益为假设，不作承诺**。判定依据见 §1.2 与 §1.3 的反证据。

---

## 1. 背景与问题

### 1.1 谁在什么场景遇到什么问题

用 Bing / Google 搜「钢琴基础知识」「五线谱入门」「手指编号」等中文学习词的用户，落在站点的文章页（`/articles/tutorials/*.html`）。这些页面读完开头就想马上试弹，但正文区域**没有任何通往钢琴本体的入口**；唯一的「练习」在顶部导航，且简体指向 `/practice.html`（另一个练习页），不是钢琴本体。用户要自己猜「回首页才有钢琴」，多数人直接走掉。

### 1.2 事实（本人实测，非引用分析报告）

复核对象 = 仓库 `origin/main`（`9bcdcab`，2026-10-22 15:36 UTC 部署）与生产 `https://pianoonline.cc`。

| 事实 | 证据 |
|---|---|
| 13 篇简体 legacy 文章页正文区指向钢琴的链接数 = **0**（`/piano.html` 与 `#practice-start` 均为 0） | 逐页 `git show origin/main:articles/tutorials/<slug>.html \| grep -oE 'href="[^"]*(piano\.html\|practice-start)[^"]*"'`，13/13 无输出 |
| 13 篇英文 legacy 文章页同样 **0** 个正文 CTA（此前的 2 个匹配全部来自导航 `Practice` 与页脚 `Practice`，均指向 `/en/#practice-start`） | 同上，逐页 grep 后按行号回查，命中行分别为导航（第 33 行）与页脚（第 84 行） |
| 对照：**20 篇生成指南页**（`/articles/guides/*`、`/en/articles/guides/*`）已有首屏 CTA「打开在线钢琴 / Open the piano」→ `/#practice-start`、`/en/#practice-start` | `scripts/render-tutorial-pages.mjs` 的 `renderArticle()` 内 `tutorial-hero-actions` 与侧栏 `tutorial-practice-cta` |
| 对照：教程索引 `/tutorials.html`、`/en/tutorials.html` 也已有主 CTA | 同上 `renderIndex()` |
| 简体文章页顶栏「练习」→ `/practice.html`；英文顶栏「Practice」→ `/en/#practice-start`。**同站两种语言两个目的地**，本身即口径不一致 | `articles/tutorials/piano-basics.html:56`；`en/articles/tutorials/piano-basics.html:33` |

结论：**漏点不是「所有文章页」，而是 26 篇 legacy 文章页**（13 简 + 13 英）。生成指南页不需要本单改动。

### 1.3 反证据（必须一并记录，防止把 CTA 当万能药）

- Atlas 数据里 `piano-basics` 28 sessions / 互动率 0% / 1 秒跳出。但英文页正文也没有 CTA，且**已有 CTA 的生成指南页 `computer-keyboard-piano` 同样是 7.7% 互动率 / 1 秒**。→ 「缺 CTA」不能单独解释 1 秒跳出。
- 加载速度对照（同一台机器、各 3 次采样）：首页 TTFB 1.26–3.93s，简体文章页 1.86–2.94s，英文文章页 1.82–3.86s，生成指南页 3.00–3.30s。**站点级偏慢，不是文章页独有**；且首页同样慢却互动率 60.7%，因此慢加载不能用来解释文章页独有的低互动。仅作观察项，不在本单范围。

因此本单的产品承诺只有一句：**给 26 篇 legacy 文章页补上一个统一、位置固定、可埋点统计的首屏主 CTA**。互动率是否上升是待验证假设，不是验收条件。

### 1.4 影响量级（引用 Atlas，非本人取数）

GA4 28d（2026-09-25~10-22）：6 个主要文章类落地页合计约 220 sessions，加权互动率约 13%；对照首页 2,885 sessions / 互动率 60.7% / 150s。**这是上限，不是预期收益。**

---

## 2. 目标 / 非目标

### 目标

1. 26 篇 legacy 文章页（13 简 + 13 英）首屏各出现 **1 个**「打开在线钢琴」主 CTA，位置、文案、类名、跳转目标在简英两侧完全一致，并与已有 20 篇生成指南页的 CTA 口径一致。
2. CTA 点击可被 GA4 独立统计（事件 + 参数），不依赖路径探索的模糊推断。
3. 统一注入走构建产物后处理，**不逐页手改 HTML**。

### 非目标（本版明确不做）

- 不改生成指南页、教程索引页已有的 CTA（它们已是统一口径的基准）。
- 不改 `/#practice-start` 落点页（首页内嵌钢琴）、不改 `/piano.html`、不改 `/practice.html`。
- 不新增 URL、不改 `sitemap.xml`（保持 357 条）、不改路由。
- 不做 zh-Hant 文章页：站点**不存在** `/zh-hant/articles/*`（`git ls-tree | grep -c zh-hant/articles` = 0），且已知约束禁止新增 URL。**因此「三种语言一致」在本单落地为简/英两种语言**，此为与提案原文的显式偏差（见 §7 待确认项 1）。
- 不改受保护文件：`js/piano.js`、`js/piano-audio.js`、`js/practice-mode.js`、`css/studio.css`。
- 不做 A/B 实验框架、不做 CTA 文案多版本测试、不做跳出率归因建模。
- 不承诺互动率 / 跳出率 / 排名的具体提升数值。

---

## 3. 用户与场景

**主路径（简体）**：搜索进入 `/articles/tutorials/piano-basics.html` → 读标题与开头 → 首屏看到「打开在线钢琴」→ 点击 → 落到 `/#practice-start`，首页钢琴已滚动到练习区 → 直接按键。

**主路径（英文）**：同上，落到 `/en/#practice-start`。

**次要路径**：用户不点 CTA，继续读正文（CTA 不得挤压正文、不得遮挡内容、不得变成弹窗）。

**异常路径**：JS 关闭 / gtag 被广告拦截器拦掉 → CTA 仍是普通 `<a>`，跳转照常，页面无 JS 报错。

---

## 4. 功能描述与边界

### 4.1 注入位置（唯一落点）

`scripts/apply-legacy-articles.mjs`（构建期对 legacy 文章页做后处理，由 `scripts/render-tutorial-pages.mjs` 的 `generateTutorialSite()` 调用，写入 `dist/`）。**不要逐页改 `articles/tutorials/*.html`。**

注入规则：在页面**第一个** `<header class="article-header"> … </header>` 块内、`</header>` 之前插入 CTA 块。

必须对两种 legacy 模板同时成立（实测两套结构不同）：

| 语言 | 模板结构 |
|---|---|
| 简 | `<article class="tutorial-article"><div class="container"><header class="article-header"><h1>…</h1><div class="article-meta">…</div></header><div class="article-content">` |
| 英 | `<main class="container"><article class="article"><header class="article-header"><h1>…</h1><div class="meta">…</div></header><section>…` |

→ 锚点只能用 `header.article-header`，**不得依赖父级 class**（两套不同）。

### 4.2 产物标记（供质检逐页核对）

```html
<div class="article-cta" data-article-cta>
  <a class="article-cta-primary" href="/#practice-start" data-article-cta-link
     data-article-slug="piano-basics">打开在线钢琴</a>
</div>
<script id="article-cta-tracking">/* 见 4.5 */</script>
```

- `data-article-slug` = 文件名（不含 `.html`），构建期由注入器写入，**不得靠运行时从 URL 猜**。
- 英文页：`href="/en/#practice-start"`，文本 `Open the piano`，`locale` 取 `en`。
- 简体页：`href="/#practice-start"`，文本 `打开在线钢琴`，`locale` 取 `zh-CN`。
- 文案与链接目标**与已有 20 篇生成指南页一致**（`renderArticle()` 的 `primary-action`），不新造文案、不加副标题。

### 4.3 幂等

注入器必须先判断：该页已存在 `data-article-cta` 则跳过；`<script id="article-cta-tracking">` 同理。重复构建不得产生第二个 CTA。

### 4.4 样式

新增 `.article-cta` / `.article-cta-primary`，样式写入 **`css/article.css`**（legacy 页已加载该文件）。

- **不得**依赖 `css/secondary-pages.css`、`css/studio.css`、`css/song-pages.css` 里的 `.primary-action`——legacy 页不加载这些文件，且引入会与旧文章样式冲突。
- 视觉：主按钮实心、触控高度 ≥ 44px、四周留白不小于 16px；与页面既有字体/配色体系一致，不引入新字体。
- 390px 宽下不横向溢出、按钮文字不换行截断。

### 4.5 埋点

- 事件名 `article_cta_click`（命名风格与现有 `song_page_start`、`letter_notes_copy` 一致）。
- 参数：`article_slug`（4.2 的 data 属性）、`locale`（`zh-CN` / `en`）、`position: 'hero'`。
- 实现：内联 `<script id="article-cta-tracking">`，对 `[data-article-cta-link]` 绑 click；调用前守卫 `typeof window.gtag === 'function'`（与 `js/song-page.js:23` 现有写法一致），**不得**因 gtag 不存在抛错。
- 页面已加载 GA4 `G-EYGD99YB4Y`（两套 legacy 模板 head 中均有），无需新增 GA/GTM。

### 4.6 边界与异常

| 情况 | 期望行为 |
|---|---|
| 页面无 `header.article-header` | 不注入；构建日志打一条 warning，**构建不失败** |
| 页面已有人工 CTA（含 `data-article-cta`） | 跳过，不重复注入 |
| 用户关 JS | CTA 可见可点，正常跳转，不出现空容器 |
| gtag 未加载 | 跳转正常，控制台无 error |
| 频道/权限 | 无涉及；无开关、无灰度参数 |

### 4.7 数据口径（观测用，写死）

- 事件源：GA4 property `469040246`（pianoonline.cc），事件 `article_cta_click`。
- 对照口径：GA4 会话时间窗按 14 天滚动（属性时区 America/Los_Angeles）；样本 <30 只报绝对值、不算百分比（沿用 Atlas 口径卡纪律）。
- 覆盖页面清单以 `scripts/locale-alternates.mjs` 的 `legacyTutorialSlugs`（13 个）+ 两个 locale 为准，本单固定 26 页。

---

## 5. 验收标准（可被质检直接转用例）

> 全部在本地 `dist/` 与本地静态服务器上可验证；AC-10 是上线后产品侧观测口径，不作为开发验收门槛。

**AC-1 覆盖 26 页且各恰好 1 个**
操作：`npm run build`，然后
`grep -c 'data-article-cta' dist/<path>`，遍历 13 个 slug × {`articles/tutorials`, `en/articles/tutorials`}。
期望：26 个文件**每个计数 = 1**；任一文件为 0 或 ≥2 判不通过。附完整 26 行输出。

**AC-2 位置正确（首屏、标题之后）**
操作：对 26 页各取 `header.article-header` 块内容。
期望：CTA 块位于该 header 内、`<h1>` 之后、`</header>` 之前；`document.querySelector('.article-header .article-cta')` 在浏览器中非空（抽查简/英各 1 页）。附 2 页 DOM 片段。

**AC-3 链接与文案精确匹配**
操作：逐页 grep `data-article-cta-link` 所在行。
期望：简 13 页 `href="/#practice-start"` 且文本「打开在线钢琴」；英 13 页 `href="/en/#practice-start"` 且文本 `Open the piano`。**不允许**出现 `/piano.html`、`/practice.html` 作为 CTA 目标。附计数表（zh 13/13、en 13/13）。

**AC-4 幂等**
操作：连续两次 `npm run build`；第二次构建后 `diff -r dist1 dist2`（或 `git status`+文件哈希）。
期望：两次产物逐字节一致，任一页 CTA 计数仍为 1。附 diff 输出（应为空）。

**AC-5 原有内容零改动**
操作：`git diff` 检查源码；并对比改动前后 `dist` 同一页面的 h1、`<title>`、meta description、canonical、hreflang、正文首段。
期望：除新增 CTA 块与 `<script id="article-cta-tracking">` 外无差异。附 diff 摘要（排除新增块后为空）。

**AC-6 既有页面不回归**
操作：构建前后分别 grep `dist/articles/guides/*/index.html`、`dist/en/articles/guides/*/index.html`、`dist/tutorials.html`、`dist/en/tutorials.html` 的 `#practice-start` 链接与 `primary-action` 文本。
期望：前后的 href 与文本完全一致（20 篇指南 + 2 个索引页）。附前后对照。

**AC-7 埋点可用**
操作：本地 `http-server dist`，打开任一 legacy 页，DevTools Network 过滤 `collect`（或 GA4 DebugView），点击 CTA。
期望：请求中出现 `en=article_cta_click`，且带 `article_slug`、`locale`、`position`；临时把 `window.gtag` 置 `undefined` 后点击，控制台**无** error 且跳转正常。附请求参数截图。

**AC-8 响应式与首屏可见**
操作：390×844 与 1280×800 两个视口，简/英各 1 页截图（共 4 张）。
期望：不滚动即看到 CTA；CTA 不被导航栏/浮层遮挡；390px 下无横向滚动条，按钮高度 ≥44px。

**AC-9 构建与既有测试**
操作：`npm test`、`npm run build`、`grep -c '<loc>' dist/sitemap.xml`。
期望：`npm test` 全绿。注意 `tests/tutorial-library.test.mjs` 里已有两条直接相关用例：`:141`「legacy tutorial pages share canonical, lang and reciprocal hreflang」与 `:165`「legacy language tags stay stable when applied again」（后者就是「重复应用不漂移」的既有范式）。本单需在同文件**新增一条同风格用例**覆盖 CTA 注入的幂等性，**不得**为此放宽或删除已有断言；构建通过；sitemap = **357**。

**AC-10 受保护文件未纳入改动**
操作：`git diff --name-only origin/main...HEAD`。
期望：不含 `js/piano.js`、`js/piano-audio.js`、`js/practice-mode.js`、`css/studio.css`。

**AC-11（上线后观测，非开发验收门槛）**
上线满 14 天后：报表给出 26 页 `article_cta_click` 事件量与 CTA 点击率（点击 / legacy 文章页 sessions），以及与上线前 14 天「文章落地会话后续出现 `/` pageview」的比率对比；n<30 的页面只报绝对值。
**判定规则（写死，防事后解释）**：14 天 CTA 点击率 <2% → 判为「CTA 位置/文案无效」，转下一轮改版；2%–8% 维持；页面互动率无变化但点击率 ≥2% → 记「CTA 有效但页面内容不匹配」，另开诊断单查 1 秒跳出成因。**本单不以「互动率必须上升」作为通过条件。**

---

## 6. 优先级与理由（含两条提案的先后）

| 项 | 价值 | 成本 | 不做的代价 | 结论 |
|---|---|---|---|---|
| 提案 1（本单） | 中：补齐 26 页确定缺口，站内链接口径统一，加可测埋点 | 低：1 个构建脚本注入 + 1 个 CSS 文件 + 埋点，估 0.5–1 人日，无新 URL、无后端 | 文章页继续零出口，搜索来的学习意图继续流失（约 220 sessions/28d 的池子） | **P2，先做** |
| 提案 2（Bing「钢琴」落地页） | 量级大但意图已核对为「工具型」，与首页同质 | 高：新页面 + 内容 + 内链 + 6 周观察；且与首页争夺同一意图 | 维持 1.33% CTR 的现状，但这不是本季度能靠建页解决的问题 | **先决策，不排开发**（见 `INTENT-STAF-66-bing-piano-serp.md`） |

先后顺序：**提案 1 先做**（可开发、可测、无外部依赖）；提案 2 等 `[需决策]` 答复 + 11-06 复盘数据，不占用本批开发资源。

拆分建议：**不拆**。26 页注入是一个原子改动，拆开只会让「统一口径」验收变复杂。

与 STAF-65（P3 补修，开发手上）的关系：无内容冲突（文件不重叠：本单动 `scripts/apply-legacy-articles.mjs` + `css/article.css` + 测试；STAF-65 动 `js/library-browser.js` + `scripts/render-song-pages.mjs`）。**冲突在部署窗口**——见 §7.2。

---

## 7. 依赖、风险、待确认项

### 7.1 待确认项（产品已给默认值，不阻塞开发）

1. **语言范围**：提案原文要求「三种语言一致」。站点无 `/zh-hant/articles/*` 且禁止新增 URL，本单落地为简/英双语。若必须覆盖繁体，需先决策「是否为繁体新增文章页」（超出本单，且与既有「不新增 URL」约束冲突）。
2. **CTA 落点**：本单选 `/#practice-start`（首页内嵌钢琴，高互动主场，且与 20 篇生成指南页一致）。提案验证指标原文写「文章页 → `/piano.html` 跳转率」——本单改用事件口径 + `/` pageview 口径，原因：锚点跳转不产生独立 pageview，用 `/piano.html` 会把「回首页」与「点 CTA」混为一谈。若用户坚持落 `/piano.html`，是一行 href 改动，但英文侧 `/en/piano.html` 为构建生成页、不在 sitemap，需同时确认。
3. **是否补英文降级文案**：本单不新增副文案，两侧都用已有按钮文案。

### 7.2 依赖与硬约束：部署窗口（重要，已实测发现变化）

- STAF-66 任务书要求「11-06 复盘前不合并任何会触发生产部署的变更（含 docs-only PR）」，前提是「生产仍停在 `b38cb10`、PR #24 未部署」。
- **实测：该前提在 2026-10-22 15:36–15:38 UTC 已失效。** 生产 `js/library-browser.js` 已是 PR #26 版本（`last-modified: Thu, 22 Oct 2026 15:36:33 GMT`），生产 `css/piano.css`、`js/piano.js` 的 md5 与 `origin/main` **逐字节相同**，且 `js/piano.js` 已含 PR #24 的 `keyboard-range`。即生产现在 = `origin/main`（`9bcdcab`）。
  详细证据见 `NOTE-STAF-66-attribution-window.md`。
- 因此本单的合并时点**不由产品决定**：需 Morgan/用户确认「STAF-64 的 14 天归因窗口是否重置」。本单只要求：**开发完成 + PR + 自测证据**，合并与部署等决策；若决策为「11-06 后再合」，本单就停在 `in_review` 等窗口。

### 7.3 风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 收益不确定（高） | 已有 CTA 的生成指南页仍出现 1 秒跳出（`computer-keyboard-piano` 7.7%/1s） | AC-11 写死判定规则，不承诺互动率；点击率不达标就转改版而不是加更多 CTA |
| 旧页面样式冲突（中） | legacy 页加载 `piano.css`/`tutorials.css`/`article.css`，`.primary-action` 不在其中 | 只写 `.article-cta*` 到 `article.css`，禁止引入 `secondary-pages.css` |
| 测试断言过时（中） | `tests/secondary-pages.test.mjs`、`tests/tutorial-library.test.mjs` 对页面结构有断言 | AC-9 要求更新断言而不是放宽 |
| 埋点被拦截（低） | 广告拦截器可能拦 GA | CTA 功能不依赖埋点，埋点缺失不影响跳转 |
| 繁体缺口（低） | 繁体用户无文章页可承接 | 已在非目标中写死，后续单独决策 |
