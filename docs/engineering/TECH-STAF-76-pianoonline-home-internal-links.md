# STAF-76：首页权重内链

版本 v1，2026-10-23。对应 PRD-STAF-73 v1 §4 B1、AC-10～AC-16；范围 A 不在本任务内。基线为 remote main `9bcdcabec6d78d31f767bf94f5c9adf1bf672e0b`，独立 clone，未访问用户工作区。

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

统计遍历全部 360 个 HTML，按 `<a>` 实际链接计算，不将 canonical、hreflang 或 JSON-LD 算作内链；繁体以 `/zh-hant/` 和 `/zh-hant/#…` 为目标，简中以 `/` 和 `/#…` 为目标，语言菜单和 logo 计入对应目标密度。不同语言目标分别检查，不将它们相加。AC-14 全站命中恰为 125/100/0；main 基线已有 11 个简中命中页（10 guides + 教程索引），不是新增 125 页。全文输出发生变化的页面是 125 简中 + 100 繁体 = 225 页，英文 0 页。

| AC | 验证方法 | 结果 |
| --- | --- | --- |
| AC-10 | 100 首中文面包屑及 JSON-LD 一致 | PASS，`verify-home-internal-links.mjs:46` |
| AC-11 | 100 首 CTA 原句、位置、目标、密度 | PASS，中文歌曲最大 3 条，`:54` |
| AC-12 | 100 首英文与繁体分支；英文全文基线比较 | PASS，128 个英文 HTML、繁体曲库索引全文不变，`:66` |
| AC-13 | 两索引、10 guides、13 旧教程及原有 CTA | PASS，旧教程重复转换也不变，`:85` |
| AC-14 | 遍历所有 HTML，分组计数；歌曲/教程数 | PASS，125/100/0；歌曲100、教程10，`:111` |
| AC-15 | 所有 HTML 的 title/description 对比干净 main 基线 | PASS，360 对逐字一致；首页及 piano 全文不变，`:132` |
| AC-16 | 全站简中及繁体首页链接密度最大值 | **FAIL**，111 页最大 4 条；需决策，`:143` |

实际命令与输出（验收脚本退出码 **1**，保留失败，不放宽计数口径）：

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
AC-16 FAIL 111 pages exceed 3; max zh=4, max zh-hant=4
Result: 6/7 AC groups passed
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

## 上线与回滚

仅提 PR，禁止本任务合并。质检通过后，由用户决定是否及何时上线。main 合并即触发 Vercel 生产自动部署，无预发环境、无独立开关。获批后合并并记录 merge SHA、部署 URL、线上抽查结果。

未合并时关闭 PR 即可撤销。合并后在独立回滚分支执行 `git revert <merge-or-squash-commit-sha>`，走回滚 PR 和发布决策，再由既有生产构建重新生成所有页面；不手改 dist，不回滚其他提交。无数据变更，完全可逆。

## 风险与未知

- 原任务报告线上 title 与 remote main 不一致、合并可能顺带改变首页 title。实际 `9bcdcab` 的 `scripts/studio-pages.mjs:77` 已按 `home` 分支区分：首页是“在线钢琴模拟器 · 跟着提示学歌 | Piano Online”；“在线钢琴 · 打开就能弹，跟着提示学歌 | Piano Online”属于 `/piano.html`。所以该 SHA 的干净构建并不支持“必然改变首页 title”的结论。AC-15 仍严格使用干净 main 构建基线；当前线上与待发布版本是否存在其他差异不确定，发布决策前须核对线上和合并后的实际产物。
- guides 已有 hero 与侧栏两个练习 CTA，教程索引已有 hero 和 footer 两个首页链接。总密度按全部链接核算，保留原 CTA。
- PRD 密度计算遗漏 logo 和其他现有入口：10 篇 guides 基线已为 4 条（logo + 面包屑 + hero CTA + 侧栏 CTA）；教程索引从 3 变 4（logo + 新正文 + hero CTA + footer CTA）；100 个繁体歌曲页从 3 变 4（logo + 原导航“彈鋼琴”被改写至繁体首页 + 面包屑 + 新正文）。不能排除 logo 来伪报通过。
- 排名改善不作承诺；上线后观察 3～4 周的 GSC，同 PRD B2 口径。本次未做线上验证。

## [需决策] 保留现有 CTA 与 ≤3 密度冲突

方案 A（建议）：允许仅对上述 111 页将 logo 渲染成非链接品牌标识，保留现有导航与全部练习 CTA，满足 ≤3。代价是这些页面 logo 不再导航，需要批准此范围调整，再实施及复验。

方案 B：保留 logo 与 CTA 当前行为，接受 111 页为 4 条。需要明确批准修改 AC-16，不得把当前报告标为全通过。

未决时：PR 保持 draft、不合并；issue blocked 交 Morgan 转用户决策。用户未授权前，两种方案均不实施；暂不进入质检验收。
