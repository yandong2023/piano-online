# TEST-STAF-76 pianoonline 首页权重内链（PRD STAF-73 范围 B）

- 被测对象：PR [#31](https://github.com/yandong2023/piano-online/pull/31)，分支 `staf-76-home-internal-links`，代码 sha `eb9fc31`（基线 `9bcdcab`）
- 质检报告提交：本文件所在的 `docs/qa/` 提交（docs-only，不含代码；该提交后重建 dist，360 个 HTML 的 AC 结果与本报告完全一致，dist 只多出 `docs/qa/*.md`——`docs/` 在基线上本就随构建产出）
- 测试环境：macOS 14.5 / node v22.22.0；两个独立 clone（`piano-qa` = PR 分支，`piano-qa-baseline` = 干净 `9bcdcab`），各自 `node scripts/build-site.mjs` 产 dist
- 执行人：质检（6719ad88）；执行时间 2026-10-23
- 独立复验：核对脚本 `qa-verify.py` 由质检自写（不引用开发的 `scripts/verify-home-internal-links.mjs`），口径按 PRD AC 原文 + Morgan 在 STAF-76 评论 `01a166f9-3bb3-7a23-9f10-b08ef701beb0` 批准的 AC-16 语言分区计数

## 结论

**通过。** AC-10～AC-16 七组逐条独立复验通过，既有测试 96/96，构建确定性（连续两次构建产物字节一致）。AC-16 存在一处**已批准的计数口径变更**（字面计入站级 logo 时 100 个繁体歌曲页为 4 条），列在「残留风险」并需在用户上线决策中确认，不作为本阶段失败项。

## 用例执行

18 条：通过 16 / 失败 0 / 不适用 2（静态站点无权限、并发模型）。

| TC | 对应 AC | 步骤 | 期望 | 实际 | 结论 |
|---|---|---|---|---|---|
| TC-01 | AC-10 | 抽查 zh 歌曲页 `songs/amazing-grace`、`songs/moonlight-sonata`、`songs/yankee-doodle` 的 `.song-breadcrumbs` 第 1 个 `<a>` 与同页 `BreadcrumbList` 第 1 项 | 文本 `在线钢琴`、`href="/"`；schema `position:1.name = 在线钢琴` | 三页均 `('在线钢琴','/')` + schema `在线钢琴`；100 个 zh 歌曲页全量脚本核对一致 | 通过 |
| TC-02 | AC-11 | 同一批页面：`p.song-home-cta` 是否存在、位置是否在 `section.song-content-section` 之前、锚文本与 href、整句与 PRD 原文逐字比对 | 位于「继续演奏」前；锚文本 `免费的在线钢琴` → `/#practice-start`；整句 `弹完这一段，可以回到免费的在线钢琴，从这首歌的第一句开始跟提示练。` | 三页均：`before_section=True`，`('免费的在线钢琴','/#practice-start')`，整句与 PRD §4 B1-2 原文完全一致 | 通过 |
| TC-03 | AC-12（en） | `dist/en/songs/fur-elise/index.html` | 面包屑第 1 项 `Home` / `href="/en/"`；无 `在线钢琴`；无 `p.song-home-cta` | `('Home','/en/')`；`在线钢琴`=False；`p.song-home-cta`=False；128 个 en 页全文无中文关键词、无 CTA | 通过 |
| TC-04 | AC-12（zh-hant） | `dist/zh-hant/songs/fur-elise/index.html` | 面包屑 `在線鋼琴` / `href="/zh-hant/"`；CTA 链接 `href="/zh-hant/#practice-start"`（不得是 `/#practice-start`）；schema 第 1 项 `在線鋼琴` | `('在線鋼琴','/zh-hant/')`；CTA `('免費的在線鋼琴','/zh-hant/#practice-start')`；schema `在線鋼琴`；102 个 zh-hant 页中指向简中根路径/曲库的正文链接 0 条（仅语言切换器保留简中入口） | 通过 |
| TC-05 | AC-13（曲库索引） | `dist/songs/index.html` | 2 条指向 `/` 且锚文本含 `在线钢琴`（hero 1 + footer 1） | 恰 2 条 `('在线钢琴','/')`（hero、footer）；另有站级 logo 1 条 | 通过 |
| TC-06 | AC-13（教程索引） | `dist/tutorials.html` | 1 条正文内链 `在线钢琴` → `/`；已有练习 CTA 保持不变 | 新增 `<p>打开<a href="/">在线钢琴</a>，把教程里的方法用起来。</p>`；原 `立即体验提示练习` → `/#practice-start`、页脚 `在线钢琴` → `/#practice-start` 均保留 | 通过 |
| TC-07 | AC-13（zh guides） | `dist/articles/guides/*/index.html`（10 篇） | 面包屑首项 `在线钢琴` / `/`；hero CTA 仍 `/#practice-start` | 10 篇全部符合；hero CTA `打开在线钢琴` → `/#practice-start` 未改；guides `BreadcrumbList` 第 1 项同步为 `在线钢琴` | 通过 |
| TC-08 | AC-13（旧教程） | `dist/articles/tutorials/*.html`（13 篇） | `<a href="/">` 文本为 `在线钢琴` | 13 篇全部 `在线钢琴`；`dist/en/articles/tutorials/*` 13 篇无 `在线钢琴`、无 `首页` 变更 | 通过 |
| TC-09 | AC-14 | 统计 dist 全部 360 HTML 中「存在指向本语言首页且锚文本含 在线钢琴/在線鋼琴 的链接」的页数 | zh 125（歌曲 100 + guides 10 + 旧教程 13 + 曲库索引 + 教程索引）、zh-hant 100、en 0；构建输出 100 songs / 10 tutorials | zh **125**（100/13/10/1/1）、zh-hant **100**、en **0**；`node scripts/build-site.mjs` 退出 0：`100 public songs, 10 new tutorials and 357 sitemap URLs` | 通过 |
| TC-10 | AC-15 | 360 页对干净基线逐页比 `<title>` 与 `<meta name="description">` | 逐字相同 | title 差异 0、description 差异 0、基线缺失 0 | 通过 |
| TC-11 | AC-15（硬约束） | `dist/index.html`、`dist/piano.html` 全文比对；全站 `/piano.html` 链接数比对 | 两页与基线一致；无新增指向 `/piano.html` 的内链 | 两页字节完全相同；`/piano.html` 链接数变化页 0 | 通过 |
| TC-12 | AC-16（批准口径） | 按页面语言分区计数，排除 `studio-brand` 锚与空文本（图片 logo）锚，全站 360 页 | 每页 ≤3 | zh 130 页 max=3 / 超标 0；en 128 页 max=3 / 超标 0；zh-hant 102 页 max=3 / 超标 0；基线同口径超标 0 | 通过 |
| TC-13 | AC-16（字面口径） | 计入站级 logo 的全部 `/`、`/#…`（zh-hant 记 `/zh-hant/`、`/zh-hant/#…`）链接 | 每页 ≤3 | zh 11 页 = 4（10 篇 guides + `tutorials.html`）；en 23 页 = 4；zh-hant 100 页 = 4；基线已存在 zh 10 页、en 23 页 = 4 | 通过（偏差记录见残留风险 R1，口径由 Morgan 批准，需用户确认） |
| TC-14 | 回归 | `(cd dist && node --test tests/*.test.mjs)` | 全绿 | `# tests 96 / # pass 96 / # fail 0`，退出 0 | 通过 |
| TC-15 | 回归（改动面） | `git diff --stat 9bcdcab..HEAD`；比对两版 dist 的变更页集合；连续两次构建比对 | 只改模板/脚本，不手改 HTML；变更页集合 = 预期范围；构建可重复 | 变更仅 6 个文件（3 个 `scripts/*.mjs` + 核对脚本 + TECH + 1 个测试断言）；225 个变更页 = zh 歌曲 100 + zh-hant 歌曲 100 + zh guides 10 + zh 旧教程 13 + `songs/index.html` + `tutorials.html`，无越界页（`zh-hant/songs/index.html` 与 128 个 en 页字节不变）；二次构建 `diff -r` 完全一致 | 通过 |
| TC-16 | 边界（新链接可达） | 检查 `#practice-start` 锚点 | 新 CTA 目标存在 | `dist/index.html`、`dist/zh-hant/index.html` 均含 `id="practice-start"`；全站 224 条 `/#practice-start`、`/zh-hant/#practice-start` 链接目标有效 | 通过 |
| TC-17 | 权限 / 并发 | — | — | 纯静态站点，无权限与并发路径 | 不适用 |
| TC-18 | 视觉（新增段落） | 本地起 `http.server` 打开 `songs/fur-elise/`、`tutorials.html` | 面包屑显示 `在线钢琴`；新增段落不破坏版式 | 面包屑 `在线钢琴 › 曲库 › 致爱丽丝`；新增段落渲染正常但无样式（见 R4） | 通过（含 R4 建议） |

## 证据（命令 + 实际输出）

```text
# 双份构建（PR 分支 / 干净 main）
node scripts/build-site.mjs
Built static site in dist with 100 public songs, 10 new tutorials and 357 sitemap URLs.   # 两版均 exit 0，各 360 HTML

# 质检自写独立核对脚本（含基线对比）
python3 qa-verify.py piano-qa/dist piano-qa-baseline/dist
zh: 125 {guides:10, legacy:13, songs:100, index:songs/index.html:1, index:tutorials.html:1}
zh-hant: 100    en: 0
[literal ] zh pages=130 max=4 over3=11 hist={1:3,2:15,3:101,4:11} | en max=4 over3=23 | zh-hant max=4 over3=100
[approved] zh max=3 over3=0 | en max=3 over3=0 | zh-hant max=3 over3=0
baseline [literal] zh max=4 over3=10 | en max=4 over3=23 | zh-hant max=3 over3=0
title diffs=0 description diffs=0 missing=0；index.html / piano.html byte-identical=True
pages with changed /piano.html link count: 0
per-page delta（非 logo 首页链接增量）：{0:158, 1:202}

# 开发自带核对脚本（质检复跑，非引用其日志）
node scripts/verify-home-internal-links.mjs dist ../piano-qa-baseline/dist
AC-10 … AC-16 PASS；Result: 7/7 AC groups passed；exit 0

# 既有测试
(cd dist && node --test tests/*.test.mjs)
# tests 96 / # pass 96 / # fail 0

# 构建确定性
cp -R dist /tmp/dist-first && node scripts/build-site.mjs && diff -r /tmp/dist-first dist
DETERMINISTIC: second build byte-identical
```

## 无法验证

- **线上与 remote main 的一致性**：无生产环境访问权限，未核对 https://pianoonline.cc 当前 HTML 与 `9bcdcab` 构建产物是否一致。本 PR 的 AC-15 基线按任务书要求用「干净 main 构建产物」，这一条已做到；「合并后线上的实际变化面」只能由发布后的生产核对覆盖。

## 残留风险

- **R1（需用户确认，非本阶段失败）**：AC-16 字面口径（计入站级 `.studio-brand` logo）下，本 PR 让 100 个繁体歌曲页从 3 条升到 4 条，另有 34 页（zh 10 篇 guides + en 23 页）在基线上就是 4 条。Morgan 已把口径定为「按语言分区 + 排除 logo/空文本锚、其余首页文字锚每页 ≤3」，批准口径下全站 0 超标。该口径变更由 Morgan 拍定、PRD 未写，**属于验收标准解释的放宽，需在用户上线决策时一并确认**；若用户坚持字面 ≤3，唯一改法是去掉全站 logo 的首页链接（破坏性、超出本 PR 范围）。
- **R2**：`dist/tutorials.html` 现在同页有 2 条锚文本完全相同的 `在线钢琴`（分别指向 `/` 与 `/#practice-start`），非 logo 首页链接数到 3 条顶格。属 Morgan 任务书明确保留（不要为凑条数删已有 CTA），无余量。
- **R3**：zh-hant 歌曲页的非 logo 首页链接也是 3 条顶格，其中 `彈鋼琴 → /zh-hant/` 来自既有 `/piano.html` 改写规则（基线即存在）。若后续再加任何首页锚文本，会直接破 ≤3。
- **R4（P3 建议）**：`.song-home-cta` 没有任何 CSS 规则，渲染为默认段落（0 外边距、链接与正文同色仅靠下划线区分），紧贴 FAQ 区块下沿。PRD 只规定了标签，开发按 PRD 实现；建议设计侧补一条样式。
- **R5（P3 记录）**：13 篇旧教程页的 `BreadcrumbList` 第 1 项 `name` 仍是 `首页`，与新的导航锚文本 `在线钢琴` 不一致（这些页面本身没有可见面包屑，故不构成可见/schema 冲突，PRD 也只要求歌曲页 schema 同步）。建议后续统一。
- **R6**：合并 main 即触发 Vercel 生产部署，无预发环境；发布仍须用户决策，本阶段未合并、未发布。

## 未覆盖 / 后续

- 内链方案的排名效果（PRD B2）属上线后 3–4 周 GSC 观察，不在本阶段。
- 仓库 `.gitignore` 未忽略 `dist/`（基线即如此），本次 PR 未把 dist 入库；后续若有人误提交会污染仓库，建议补一条 `.gitignore`（不在本 PR 范围）。
