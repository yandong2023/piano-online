# STAF-76：首页权重内链

版本 v2，2026-10-23。对应 PRD-STAF-73 v1 §4 B1、AC-10～AC-16；范围 A 不在本任务内。基线为 remote main `9bcdcabec6d78d31f767bf94f5c9adf1bf672e0b`，独立 clone，未访问用户工作区。v2 按 Morgan 决策澄清 AC-16 计数口径并更新验证证据；页面实现不变。

## 方案

| 选项 | 行为 | 选择 |
| --- | --- | --- |
| 修改生成模板与旧教程构建转换 | 每次 build 自动生成中文关键词锚文本，保留英文与繁体索引 | 采用，输出可复现 |
| 逐页改 HTML 或全站导航 | 手改生成文件会被覆盖；全站导航扩大范围与密度 | 不采用 |

中文歌曲面包屑及 BreadcrumbList 同步改名，在“继续演奏”之前插入 PRD 原句。曲库和教程索引增加正文内链；guides 的可见及 schema 面包屑同步改名。旧教程在已有 `applyArticleLanguage` 中仅对 `zh-CN` 转换首页锚文本，不修改 13 个 HTML 源文件。

繁体歌曲链接改写在现有 href 改写之后补 `/#practice-start` 规则。现有转换器将“在线”译为“線上”，仅将本次首页锚文本与对应 BreadcrumbList 改成 AC 指定“在線鋼琴”，不修改通用转换器或元数据。繁体曲库索引维持原输出，范围是 100 个繁体歌曲详情。

## 影响面与变更清单

- `scripts/render-song-pages.mjs`：中文歌曲、曲库索引、繁体歌曲转换。
- `scripts/render-tutorial-pages.mjs`：中文 guides 面包屑及 schema、教程索引正文。
- `scripts/apply-legacy-articles.mjs`：13 篇简中旧教程首页锚文本。
- `scripts/verify-home-internal-links.mjs`：构建产物验收与基线比较。
- `tests/song-library.test.mjs:343`：同步本次变更涉及的繁体面包屑断言，并断言 schema 名称一致；不修改 HTML 源文件。
- 本 TECH 文档：证据、风险及交接。

无接口、数据结构、迁移、权限、多租户、异步任务或第三方调用变更。现有静态构建、歌曲推荐、练习入口、语言菜单、sitemap 是上下游；CDN 在后续获批发布后按既有 Vercel 流程更新。本次不发布。

## 验证

先在未改动、干净的上述 main checkout 执行 `node scripts/build-site.mjs`（退出码 0），保存产物到仓库外的 `../staf-76-baseline-dist`。构建输出：`100 public songs, 10 new tutorials and 357 sitemap URLs`。

质检可在自己的 clone 重建基线：

```sh
git worktree add --detach ../staf-76-main-baseline 9bcdcabec6d78d31f767bf94f5c9adf1bf672e0b
(cd ../staf-76-main-baseline && node scripts/build-site.mjs)
node scripts/build-site.mjs
node scripts/verify-home-internal-links.mjs dist ../staf-76-main-baseline/dist
```

实现后运行：

```sh
node scripts/build-site.mjs
node scripts/verify-home-internal-links.mjs dist ../staf-76-baseline-dist
```

统计遍历全部 360 个 HTML，按 `<a>` 实际链接计算，不将 canonical、hreflang 或 JSON-LD 算作内链。AC-16 按页面所属语言统计，排除品牌 logo 和空文本锚，详见下节决策原文。AC-14 的关键词命中逻辑未修改：全站命中恰为 125/100/0；main 基线已有 11 个简中命中页（10 guides + 教程索引），不是新增 125 页。全文输出发生变化的页面是 125 简中 + 100 繁体 = 225 页，英文 0 页。

| AC | 验证方法 | 结果 |
| --- | --- | --- |
| AC-10 | 100 首中文面包屑及 JSON-LD 一致 | PASS，`verify-home-internal-links.mjs:46` |
| AC-11 | 100 首 CTA 原句、位置、目标、密度 | PASS，中文歌曲最大 3 条，`:54` |
| AC-12 | 100 首英文与繁体分支；英文全文基线比较 | PASS，128 个英文 HTML、繁体曲库索引全文不变，`:66` |
| AC-13 | 两索引、10 guides、13 旧教程及原有 CTA | PASS，旧教程重复转换也不变，`:85` |
| AC-14 | 遍历所有 HTML，分组计数；歌曲/教程数 | PASS，125/100/0；歌曲100、教程10，`:111` |
| AC-15 | 所有 HTML 的 title/description 对比干净 main 基线 | PASS，360 对逐字一致；首页及 piano 全文不变，`:132` |
| AC-16 | 按页面语言统计首页文字链接，排除品牌与空文本锚 | PASS，zh/en/zh-hant 最大均为 3，当前与基线超标均为 0，`:143` |

实际命令与输出（构建与验收脚本退出码均为 **0**）：

```text
$ node scripts/build-site.mjs
Built static site in dist with 100 public songs, 10 new tutorials and 357 sitemap URLs.
$ node scripts/verify-home-internal-links.mjs dist ../staf-76-baseline-dist
AC-10 PASS 100 zh breadcrumbs + BreadcrumbList agree
AC-11 PASS 100 zh CTAs: exact sentence, position, target; max home links=3
AC-12 PASS 100 en + 100 zh-hant songs; all 128 English HTML and zh-hant library byte-identical
AC-13 PASS 2 song-index anchors; 1 tutorial-index body anchor; 10 guides + 13 legacy; existing practice CTAs unchanged; legacy conversion idempotent
AC-14 PASS all 360 HTML: {"zh":125,"zh-hant":100,"en":0}; zh={"songs":100,"guides":10,"legacy":13,"indexes":2}
AC-15 PASS all 360 title/description pairs unchanged; home + piano HTML byte-identical; no changed piano.html links
AC-16 current {"zh":{"pages":130,"max":3,"over3":0,"histogram":{"0":2,"1":16,"2":101,"3":11}},"en":{"pages":128,"max":3,"over3":0,"histogram":{"0":2,"1":102,"2":1,"3":23}},"zh-hant":{"pages":102,"max":3,"over3":0,"histogram":{"1":1,"2":1,"3":100}}}
AC-16 baseline {"zh":{"pages":130,"max":3,"over3":0,"histogram":{"0":2,"1":117,"2":1,"3":10}},"en":{"pages":128,"max":3,"over3":0,"histogram":{"0":2,"1":102,"2":1,"3":23}},"zh-hant":{"pages":102,"max":2,"over3":0,"histogram":{"1":1,"2":101}}}
AC-16 PASS 360 HTML by page language; current + baseline violations=0; brand/empty-text anchors excluded
Result: 7/7 AC groups passed
```

对构建产物运行全部既有测试（避免 `npm test` 的 generate:content 将受版本控制的 HTML 源文件改写），退出码 0：

```text
$ (cd dist && node --test tests/*.test.mjs)
# tests 96
# pass 96
# fail 0
```

`git diff --check`、`node --check scripts/verify-home-internal-links.mjs` 均退出 0。没有执行生产发布、浏览器交互测试或 GSC 排名检查；本次只变更静态链接与 schema，静态产物全量验证覆盖目标。

静态文案变更没有新增空数据、权限或并发路径；相关生成器的异常由构建命令非零退出暴露。旧教程转换应可重复运行且英文保持不变；验收脚本覆盖这些边界。

## AC-16 口径与决策来源

来源：STAF-76，Morgan 于 2026-10-23 04:16:12 UTC 的评论 `01a166f9-3bb3-7a23-9f10-b08ef701beb0`（“AC-16 口径我来定，不再挂决策单，回开发做收尾”）。该评论明确指示只调整核对脚本和 TECH、保持页面实现及测试断言、复跑后交质检。以下为口径原文：

> 1. 按语言区分别计数：zh 数 `/` 与 `/#…`；zh-hant 数 `/zh-hant/` 与 `/zh-hant/#…`；en 数 `/en/` 与 `/en/#…`（跨语言切换链接因此天然不计入）。
> 2. 不计入站级品牌 logo：`class` 含 `studio-brand` 的锚，以及锚文本为空（纯图片 logo）的锚。
> 3. 其余**有可见文字的关键词型首页锚文本，每页 ≤3**，全站 360 页无一例外。

原因：原先“全部锚含 logo”的口径在干净 main 基线已不成立。Morgan 独立复核确认 10 篇 zh guides 和 23 个 en 页共 33 页原本已有 4 条（现有文字入口 + logo）。原报告中的 111 页也都只多出品牌 logo；不能为此删掉原有 CTA 或改变 logo 的交互。新口径保留 ≤3 上限，实际统计所有本语言首页的非品牌文字锚，不只筛选包含“在线钢琴”的锚。代码对 class 按空白分词匹配 `studio-brand`，不会误排除 `studio-brand-extra`。

验收脚本同时校验当前产物与 main 基线，并输出直方图；新增边界断言覆盖品牌锚、纯图片锚、空白实体、跨语言锚、同名前缀 class 和 4 个实际文字链接（仍计为 4，触发超标判定）。不新增页面、不改变导航和 CTA。

当前产物分布：

| 语言区 | 页数 | 0 条页 | 1 条页 | 2 条页 | 3 条页 | >3 条页 | 最大值 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| zh | 130 | 2 | 16 | 101 | 11 | 0 | 3 |
| en | 128 | 2 | 102 | 1 | 23 | 0 | 3 |
| zh-hant | 102 | 0 | 1 | 1 | 100 | 0 | 3 |

基线分布：zh 的 0/1/2/3 条页数为 2/117/1/10；en 为 2/102/1/23；zh-hant 为 0/1/101/0。三个语言区均 0 页超过 3。

## 上线与回滚

仅提 PR，禁止本任务合并。质检通过后，由用户决定是否及何时上线。main 合并即触发 Vercel 生产自动部署，无预发环境、无独立开关。获批后合并并记录 merge SHA、部署 URL、线上抽查结果。

未合并时关闭 PR 即可撤销。合并后在独立回滚分支执行 `git revert <merge-or-squash-commit-sha>`，走回滚 PR 和发布决策，再由既有生产构建重新生成所有页面；不手改 dist，不回滚其他提交。无数据变更，完全可逆。

## 发布风险与观察

首页 title **无变化**。`scripts/studio-pages.mjs:77` 的首页分支为“在线钢琴模拟器 · 跟着提示学歌 | Piano Online”；“在线钢琴 · 打开就能弹，跟着提示学歌 | Piano Online”属于 `/piano.html`。AC-15 已比较干净 main 构建：360 页 title/description 无变化，首页和 `/piano.html` 全文无变化。Morgan 在上述决策评论中也独立确认线上与 main 首页 title 一致，并撤回任务书中的标题风险。本次未自行访问线上，线上复核结论来源为 Morgan。

上线决策仅保留一项风险：**合并 main 即触发 Vercel 生产部署，无预发环境**。本任务只更新 PR，不合并，是否及何时发布仍由用户决定。

guides 的 hero/侧栏 CTA、教程索引的 hero/footer CTA、品牌 logo 均保持原样。排名改善不是验收承诺；上线后按 PRD B2 观察 3～4 周 GSC。本次未进行生产发布或排名观察。
