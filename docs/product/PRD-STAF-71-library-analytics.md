# STAF-71 曲库页埋点：筛选 / 搜索 / 歌曲点击 / 相关教程点击

- **版本**：v1（2026-11-06）
- **产品**：产品（agent `1f95fde3`）
- **需求来源**：STAF-71（Morgan，2026-10-22）／上游证据 `docs/growth/ANALYSIS-20261023-staf-65-library-counts.md`（PR #29）
- **代码基线**：`yandong2023/piano-online` main @ `87541d8`
- **优先级**：P3

---

## 1. 背景与问题

**谁**：运营分析（Atlas）与后续所有要评估曲库页改动的产品/开发决策者。

**什么场景**：曲库页 `/songs/`、`/en/songs/`、`/zh-hant/songs/` 是站上唯一的歌曲入口目录（100 首歌、6 个分类、4 档难度、1 个搜索框、1 个清除筛选按钮、`#difficulty-N` 深链），但这一页**一条自定义事件都没有**。

**证据（Atlas 2026-10-22 实测，GA4 property `469040246`）**：

| 事实 | 数值 |
|---|---|
| 曲库首页 28 天事件 | 只有 `page_view` 44 / `user_engagement` 35 / `scroll` 18 / `session_start` 6 / `first_visit` 5 |
| 全站 14 天事件清单 | 无任何筛选、搜索、分类按钮、相关教程点击事件 |
| `#difficulty` 深链在 `pageLocation` 出现次数 | 0 |
| 曲库首页 28 天 | 38 用户 / 49 次浏览（占全站 1.06%）；moonlight 三语页 6 用户 / 6 次浏览 |

**现在怎么绕过去**：绕不过去。STAF-65 修了「分类计数随筛选更新」，但上线后 Atlas 只能给「不可度量」的结论——不是这次的数据缺失，是**底座**缺失。

**不做会怎样**：曲库页之后任何改动（筛选交互、默认排序、深链、分类重排）都无法判断效果，只能靠主观。

**谁付成本**：开发约 1 人日以内（改 2 个 JS + 1 个生成器 + 2 个测试文件），长期维护成本=事件表要跟着交互一起改（写在 §7 风险）。

---

## 2. 目标 / 非目标

### 目标
1. 曲库页的四类用户动作（难度筛选、分类筛选、搜索、清除筛选）与两类跳转（歌曲卡片点击、相关教程点击）在 GA4 里可被计数、可被下钻到具体值。
2. 上线后**一次取数**就能回答「有多少次筛选（按类型拆开）、筛完点了哪首歌」——不只是证明事件存在。
3. 三条语种页面（zh-CN / en / zh-Hant）的数据同构可合并统计，且能按语言拆开。

### 非目标（这一版明确不做）
- 不做服务端/自建埋点，不引入新第三方 SDK，不接 GA4 转化、受众、再营销。
- 不改曲库页任何可见 UI、文案、排序、计数逻辑、深链行为。
- 不埋歌页内部的其它交互（亮键、录音、五线谱、复制简谱）——已有 `song_page_view` / `song_page_start` / `letter_notes_copy`。
- 不新增或修改任何 URL，`sitemap.xml` / `sitemap-songs.xml` 条目集合保持完全不变。
- 不改 `js/piano.js`、`js/piano-audio.js`、`js/practice-mode.js`、`css/studio.css`、`vercel.json`（硬约束，见 AC-5）。
- 不做 A/B、不做埋点采样、不做数据看板（看板是 Atlas 后续工作）。

---

## 3. 用户与场景

| # | 主/次 | 场景 | 涉及事件 |
|---|---|---|---|
| S1 | 主 | 从首页/搜索落地 `/songs/`，用难度或分类缩小范围，挑一首点进去 | `library_filter_apply`(difficulty/category) → `library_song_click` |
| S2 | 主 | 记得歌名/作曲家，直接搜索框输入 | `library_filter_apply`(search) → `library_song_click` |
| S3 | 次 | 筛完没找到，点「清除筛选」重来 | `library_filter_apply`(reset) |
| S4 | 次 | 从歌页「浏览全部 X 级曲目」跳到 `/songs/#difficulty-2`（深链带筛选进站） | `library_filter_apply`(deep_link) |
| S5 | 主 | 在歌页看完简谱，点「相关教程」继续学 | `related_tutorial_click` |

---

## 4. 功能描述与边界

### 4.1 事件契约（冻结；开发按此实现，字段不做「自由发挥」）

所有事件统一用页面上已存在的 gtag（`G-EYGD99YB4Y`，`window.gtag`），**必须** `typeof window.gtag === 'function'` 守卫；无 gtag（被拦截/未加载/测试环境）时静默跳过，不得抛错。

#### E1 `library_filter_apply`

| 参数 | 类型 | 取值与口径 |
|---|---|---|
| `filter_type` | string | `difficulty` / `category` / `search` / `reset` / `deep_link` |
| `filter_value` | string | difficulty→`1`~`4`；category→`beginner`/`kids`/`traditional`/`holiday`/`classical`/`ragtime`/`all`（点「全部」按钮记 `all`）；search→用户输入 trim + 折叠连续空格，截断 60 字符，空串记 `(empty)`；reset→`all`；deep_link→`1`~`4` |
| `result_count` | number | 本次筛选后**可见歌曲卡片数**（即页面上 `#library-count` 显示的那个数）。0 也要发 |
| `language` | string | 运行时取 `document.documentElement.lang`，取值 `zh-CN` / `en` / `zh-Hant` |

触发时机（**一次用户动作 = 一条事件**，不得重复发）：
- `difficulty`：`#library-difficulty` 的 `change` 事件，在既有 `update()` 之后发。
- `category`：`[data-library-filter]` 按钮 `click` 之后发（点「全部」也发，`filter_value=all`）。
- `search`：输入停止 **800ms** 后发；归一化后与「上次已发送的关键词」相同则不重复发（避免输入 `fur` 再删成 `fu` 又发一条相同值）。清空输入时发一条 `filter_value=(empty)`。
- `reset`：`#library-reset` 的 `click` 之后发，`filter_value=all`，`result_count` 取重置后的总数（100）。
- `deep_link`：页面加载时 hash 命中 `#difficulty-1..4` 发一条；`hashchange` 到另一个合法层号也发一条。非法 hash（如 `#difficulty-99`、`#kids`）**不发**（现状会把下拉框归到 all，不算筛选动作）。

#### E2 `library_song_click`

| 参数 | 类型 | 取值与口径 |
|---|---|---|
| `song_id` | string | 卡片的 `song.id`（`data/song-library.mjs` 里的 id，如 `twinkle`、`fur-elise`），**不是** slug。与歌页 `<body data-song-id>`、既有 `song_page_view` 的 `song_id` 同源，可直接 join |
| `position` | number | 1 起，点击时在「当前可见卡片」列表里的序号（DOM 顺序，跳过隐藏卡片） |
| `filter_state` | string | `cat=<category>;diff=<level>;q=<term>`，三键固定顺序、始终齐全；默认 `cat=all;diff=all;q=`；q 口径同 E1 的 search 值（含 `(empty)` 用法：q 为空时留空，即 `q=`） |
| `language` | string | 同 E1 |

触发：卡片 `click`（左键、正常跳转）。**不得 `preventDefault`、不得延迟跳转超过 300ms、不得改变跳转目标**。

#### E3 `related_tutorial_click`

| 参数 | 类型 | 取值与口径 |
|---|---|---|
| `source_song_id` | string | `document.body.dataset.songId`（歌页已有，如 `twinkle`） |
| `target_slug` | string | 点击链接 href 中 `/articles/guides/<slug>/` 的 `<slug>`，去掉可能的 `/en` 前缀 |
| `language` | string | 同 E1 |

触发：点击 `[data-related-tutorials]` 区块内的任意 `<a>`。zh-Hant 歌页没有该区块（生成器既定行为），不新增。

### 4.2 载荷样例（GA4 DebugView 里应该长这样）

```
library_filter_apply  { filter_type: difficulty, filter_value: 2,   result_count: 33,  language: zh-CN }
library_filter_apply  { filter_type: category,   filter_value: kids, result_count: 8,  language: en }
library_filter_apply  { filter_type: search,     filter_value: fur,  result_count: 1,  language: zh-CN }
library_filter_apply  { filter_type: reset,      filter_value: all,  result_count: 100, language: zh-CN }
library_filter_apply  { filter_type: deep_link,  filter_value: 2,   result_count: 33,  language: zh-Hant }
library_song_click    { song_id: two-tigers, position: 2, filter_state: "cat=kids;diff=all;q=", language: zh-CN }
related_tutorial_click{ source_song_id: twinkle, target_slug: xiaoxingxing-piano-numbered-notation, language: zh-CN }
```

> 上面的 `result_count` / `position` 是按当前数据算出来的**可核对期望值**：100 首歌，难度 1/2/3/4 = 10/33/50/7；分类 beginner 1、kids 8、traditional 21、holiday 15、classical 52、ragtime 3；`kids` 全部是难度 1，所以「难度=2 且 分类=kids」= 0（空态用例）。搜索 `fur` 只命中 `fur-elise` 一首。`kids` 组 DOM 顺序第 2 张是 `two-tigers`。

### 4.3 数据口径（先定死，实现完再补就晚了）

- **一次筛选 = 一条 `library_filter_apply`**。连续拖难度下拉会发多条——这就是「次数」的定义，不做会话级去重。
- **筛选次数**按 `filter_type` 分桶统计；`deep_link` 单独一桶，代表「不带任何点击、进来就已经有筛选」的流量，**不计入**主动筛选次数（报表要能拆开）。
- **「筛完点了哪首歌」**：以 `library_song_click` 的 `song_id` 为维度、`filter_state` 为交叉维度计数；`filter_state` 里 `cat=all;diff=all;q=` 表示「没筛就直接点」。
- 不做漏斗（没有曝光事件），不做转化率；要做点击率需要另开「卡片曝光」需求——本版明确不做。
- 语言维度一律取页面 `<html lang>`，不取浏览器语言、不取 URL 前缀（zh-Hant 页面是从 zh 字符串替换生成的，构建期写死语言会在繁体页上错）。

### 4.4 异常 / 边界

| 场景 | 期望行为 |
|---|---|
| gtag 被广告拦截器拦掉 / 未加载 | `typeof window.gtag !== 'function'`，静默跳过，功能完全不受影响 |
| 筛选结果为 0（如 难度=2 + 分类=kids） | 照发 `result_count=0`，页面空态行为不变 |
| 搜索词 200 字符、含 emoji、全角空格 | 截断 60 字符后再发；匹配逻辑不变 |
| 搜索词形似邮箱/手机号 | 上报前替换为 `(redacted)`（见 §7 隐私） |
| 用户在搜索框连续输入 12 个字符 | 只在停止输入 800ms 后发 1 条，`filter_value` 是完整词 |
| 深链 `#difficulty-2` 进站后用户又手动选难度 | 首次 `deep_link` 1 条 + `change` 1 条，都能区分 |
| 中键/Command+点击卡片（新标签） | 仍发 `library_song_click`（click 事件照常触发），不做特殊处理 |
| 点击卡片后事件丢失（页面已跳转） | 见 §7 R1：必须用 beacon 或 `event_callback`，AC-1 要求连点 5 次收 5 条 |
| 测试环境（`tests/song-library.test.mjs` 的 VM） | VM 里没有 `window.gtag`、`setTimeout`、`window.location.href`、`document.addEventListener`；新代码必须全部守卫，不得抛 ReferenceError |

---

## 5. 验收标准

> 与原 issue 的对应：AC-1↔原 AC1，AC-2↔原 AC2，AC-3↔原 AC3（基线数字已按当前代码更正，见 §7 D1），AC-4↔原 AC4，AC-5 为本次补充的硬约束检查。

### AC-1 生产上七种动作各收到一条事件，字段齐全
**操作**：在 `pianoonline.cc` 生产页，逐步执行（**每一步前刷新页面**，保证单变量）：

| 步 | 输入 / 操作 | 期望结果 |
|---|---|---|
| a | 打开 `/songs/`，难度下拉选「简单」 | 1 条 `library_filter_apply{filter_type:difficulty, filter_value:2, result_count:33, language:zh-CN}` |
| b | 打开 `/songs/`，点分类「童谣与儿歌」 | 1 条 `{filter_type:category, filter_value:kids, result_count:8, language:zh-CN}`；再点第 2 张卡片 → 1 条 `library_song_click{song_id:two-tigers, position:2, filter_state:"cat=kids;diff=all;q=", language:zh-CN}` |
| c | 打开 `/en/songs/`，搜索框输入 `fur` 后停手 | 800ms 后 1 条 `{filter_type:search, filter_value:fur, result_count:1, language:en}`；输入过程中不得出现中间态事件 |
| d | 打开 `/songs/`，难度=简单 + 分类=童谣（结果为 0） | 1 条 `{filter_type:category, filter_value:kids, result_count:0}`，空态照常显示 |
| e | 在 b 之后点「清除筛选」 | 1 条 `{filter_type:reset, filter_value:all, result_count:100, language:zh-CN}` |
| f | 打开 `/zh-hant/songs/#difficulty-2` | 1 条 `{filter_type:deep_link, filter_value:2, result_count:33, language:zh-Hant}` |
| g | 打开 `/songs/twinkle-twinkle-little-star/`，点「相关教程」第一条 | 1 条 `related_tutorial_click{source_song_id:twinkle, target_slug:xiaoxingxing-piano-numbered-notation, language:zh-CN}` |

**证据**：GA4 DebugView（或 Realtime 事件卡片展开后的参数表）截图，逐步对应；每步**只能多 1 条**该事件（多一条即视为重复上报，不通过）。另需在 b 的卡片上连点 5 次（可返回再点）证明收到 5 条 `library_song_click`。

### AC-2 零可见副作用
**操作**：`npm run test:songs`；再按 STAF-65 用例手工回归（难度 4 档 × 分类 6 个 × 搜索「Minuet」/空 × 清除筛选）。
**期望**：
- `npm run test:songs` 全绿，且其中 `difficulty, category, search and reset keep category counts and totals in sync` 通过——该用例在无 `gtag` 的 VM 里跑 `js/library-browser.js`，等于顺带证明「没有 gtag 时不抛错、计数不变」。
- 每个组合下 `#library-count` 文本、分组标题计数、空态显隐、`aria-pressed`、URL hash 与改动前逐项一致（附前后对照截图，中/英/繁各一组）。
- `git diff` 中不含任何 `.css` 文件、不含可见文案改动。

### AC-3 构建与 SEO 不变
**操作**：`npm test`；`npm run build`；连续两次 build 后 `diff -r dist dist2`；对比 `sitemap.xml` / `sitemap-songs.xml` 的 URL 集合。
**期望**：
- `npm test` 全绿（含 `tests/song-analytics.test.mjs`：每个曲库/歌页仍**恰好 1 个** GA loader + 1 次 `config`，属性仍为 `G-EYGD99YB4Y`）。
- `npm run build` 通过，输出 `100 public songs`、`369 sitemap URLs`。
- 两次构建产物逐文件一致（无时间戳/顺序抖动）。
- `sitemap.xml` **369 条**、`sitemap-songs.xml` **303 条**，URL 集合与改动前完全相同（附 `comm -3` 或等价对比输出，应为空）。
- 无新增页面目录（不新增 `index.html` 路径）。

### AC-4 一次取数就能回答业务问题
**前提**：§6 的 9 个事件级自定义维度已在 GA4 Admin 注册（未注册时事件可见但维度不可用）。
**操作**：上线满 48h 后，在 GA4 property `469040246` 用 Explorations 出两张表并截图：
- R1：维度 `filter_type` + 指标 `Event count` → 「有多少次筛选，各类型多少」
- R2：维度 `song_id` × `filter_state`，指标 `Event count`，降序 → 「筛完点了哪首歌」
**期望**：两张表能直接写成结论句，形如「近 7 天筛选 41 次（难度 22 / 搜索 11 / 分类 6 / 清除 2）；筛选后点击 Top3：twinkle 9 次、happy-birthday 5 次、fur-elise 3 次」。**只贴事件存在不算通过。**

### AC-5 硬约束零改动
**操作**：`git diff --name-only origin/main...HEAD`。
**期望**：输出中**不出现** `js/piano.js`、`js/piano-audio.js`、`js/practice-mode.js`、`css/studio.css`、`vercel.json`；不出现新增 URL 路径。

---

## 6. 实施锚点（已核对 @ `87541d8`，供开发省时间）

| 位置 | 现状 | 本需求要做什么 |
|---|---|---|
| `js/library-browser.js:15-42` | 唯一的筛选/搜索/重置逻辑，`update()` 里已有 `count`（可见数）和 `cards` 数组 | 在既有监听器里追加事件上报；`position` 用 `cards.filter(c=>!c.hidden).indexOf(card)+1` |
| `scripts/render-song-pages.mjs:97` `card()` | 生成 `<a class="song-card" data-category data-difficulty data-search href=/songs/<slug>/>`，**没有 song id** | 加可选参数只给曲库页卡片输出 `data-song-id="${song.id}"`。`card()` 同时被歌页「同难度/相关曲目」复用，加开关可避免 100+ 歌页 HTML 无谓变动 |
| `scripts/render-song-pages.mjs:107` `renderLibrary()` | 曲库页模板 | 调用 `card(song, locale, true)` |
| `scripts/render-song-pages.mjs:153` `relatedTutorials()` | `<section data-related-tutorials>` 内 `<a href="/articles/guides/<slug>/">`；zh-Hant 直接 `return ''` | HTML 无需改动；`source_song_id` 从 `body[data-song-id]` 取，`target_slug` 从 href 解析 |
| `js/song-page.js:5,105` | 已有 `const songId = document.body.dataset.songId` 与 `window.gtag` 用法 | 在此文件加 `[data-related-tutorials]` 的点击委托 |
| `scripts/render-song-pages.mjs:12,75-82` | `library-browser.js` 用 `?v=${STUDIO_VERSION}`（`20261030.1`），`song-page.js` 用 `?v=${ASSET_VERSION}`（`20260711.10`） | 改了 JS 必须让 `?v=` 变化，否则老访客拿缓存旧脚本（`vercel.json` 未给 `library-browser.js` 配 no-cache，且本次不许改 vercel.json）。bump `STUDIO_VERSION` 会重生成全站 HTML，建议给 `library-browser.js` 单独一个 `LIBRARY_VERSION` 常量 |
| `tests/song-library.test.mjs:80-125` | VM 里跑 `library-browser.js`，只提供 `document` / `window`（**无 gtag、无 setTimeout、无 location.href**） | 新代码必须 `typeof` 守卫；搜索防抖要用 `typeof setTimeout === 'function'` 兜底（无 setTimeout 时立即发或跳过，且不得影响计数断言） |
| `tests/song-analytics.test.mjs` | 断言每个曲库/歌页恰好 1 个 GA loader + 1 次 config | 不用改，但**必须继续通过**（新增事件不影响它，新增 script 标签会影响） |

---

## 7. 依赖、风险、待确认项

### 依赖
- **D1 GA4 后台配置（不在代码里）**：9 个事件级自定义维度必须注册才能在报表里当维度用，否则只有 DebugView 能看。清单：`filter_type`、`filter_value`、`result_count`、`filter_state`、`song_id`、`position`、`source_song_id`、`target_slug`、`language`。GA4 免费版每属性上限 50 个事件级自定义维度，本次占 9 个，安全。
- **D2 生产部署**：合并到 main 即由 Vercel `npm run build` 重新生成并部署，无需改 `vercel.json`。
- **D3 数据源**：`data/song-library.mjs` 的 `song.id` / `slug` 是本次 join 的关键，未来若重命名 id，历史数据会断层（见 R5）。

### 风险与对策
| # | 风险 | 对策（写进本需求，不留给「以后再说」） |
|---|---|---|
| R1 | 卡片点击后立即跳转，事件可能发不出去 | 用 `transport_type:'beacon'`，或 `event_callback` + `event_timeout ≤300ms`（不得阻塞跳转更久）。AC-1 用「连点 5 次收 5 条」验证，不是只看 1 条 |
| R2 | 现有 VM 回归用例没有 gtag/setTimeout，新代码一抛错 AC-2 直接挂 | 全部 `typeof` 守卫；无 setTimeout 时退化为同步上报 |
| R3 | zh-Hant 页面由 zh HTML 字符串替换生成（`renderTraditional()`），构建期写死语言会错标 | `language` 一律运行时读 `document.documentElement.lang` |
| R4 | 缓存：`library-browser.js` 只有 `?v=` 做版本，无 no-cache 头 | 改 JS 必须同步改版本参数（建议独立 `LIBRARY_VERSION`），并在 AC 里用生产页面 HTML 的 `?v=` 值确认 |
| R5 | `song_id` 命名不统一（库 id 如 `twinkle` vs slug `twinkle-twinkle-little-star`） | 统一用 `song.id`，与歌页 `body[data-song-id]`、既有 `song_page_view` 同源；`filter_state`/`target_slug` 用 slug 的地方明确写清 |
| R6 | 搜索词是用户输入，可能含个人信息 | 截断 60 字符；匹配到邮箱/手机号形态替换为 `(redacted)`；分析时只按词聚合，不追个人 |
| R7 | 埋点与交互脱钩：以后改筛选逻辑忘更新事件 | 事件契约与 VM 用例放在同一个测试文件里（`tests/song-library.test.mjs`），改逻辑时用例会拦住 |

### 待确认（不阻塞开发，PR 评审时定）
- **Q1（需 Morgan 转用户/Atlas）**：D1 的 9 个自定义维度由谁在 GA4 Admin 注册？建议 Atlas（有属性权限）。不注册则 AC-4 无法通过，AC-1 不受影响。
- **Q2（需 Morgan 定）**：AC-1 在生产页操作会写入真实 GA4 数据（每天约 1~2 个会话量级）。建议上线后 1 小时内各语种做 1 次，数据量可忽略；若要求零污染，则改为 Preview 验证 + 上线后只做 1 次抽查。
- **Q3（已由产品决定，记录在此）**：原 issue 写「`sitemap.xml` 保持 357 条」——该数字是 2026-10-22 的基线。当前 main `87541d8` 实跑 `node scripts/render-sitemaps.mjs` 输出 **369 条**（303 歌曲 + 50 教程 + 16 其它），差异来自之后新增的 tr/vi 语种页。本 PRD 以 **369** 为基线，**要求「URL 集合不变」而非「数字等于 357」**。已实测：基线重新生成 sitemap 与原文件无差异。
- **Q4（已由产品决定）**：`language` 若因 GA4 保留名冲突无法注册为自定义维度，改名为 `content_language`，语义不变，并同步本文件 v2 与技术文档。

---

## 8. 优先级与理由

**P3（沿用 issue 定级）**
- 价值：曲库页 28 天仅 49 次浏览、38 用户（占全站 1.06%），当前数据量下埋点的直接收益小；但它是**后续所有曲库改动的度量底座**，不做则永远只能用「不可度量」结案（STAF-65 已经吃过一次）。
- 成本：估 ≤1 人日（2 个 JS + 1 个生成器 + 测试），无新增依赖、无 URL 变更、无迁移。
- 不做的代价：曲库页迭代全部失去判断依据；下次再有人问「筛选有人用吗」仍然只能猜。
- 升级为 P2 的触发条件（不自行改级）：曲库页周活连续 2 周 > 100，或 STAF-64 内链生效后 `/songs/` GSC 周曝光 > 200。触发时由 Morgan 重排。
