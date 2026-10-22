# TECH STAF-66 · Legacy 文章首屏 CTA

版本 v1，2026-10-22；对应产品 PRD-STAF-66-article-page-piano-cta.md v1。
开发覆盖 AC-1～AC-10；AC-11 为发布满 14 天后产品/运营观测，不声称已验证。

## 方案

选择：在 apply-legacy-articles.mjs 中独立后处理 13 slug × 简/英的 HTML，在第一个 header.article-header 结束前插入普通链接及守卫埋点。generateTutorialSite 默认不注入，build-site 显式开启，避免 npm test / generate:content 将改动写入 26 个源码页面。

备选：逐页维护 CTA 或在浏览器运行时插入。前者违反统一模板约束，后者使禁 JS 时无 CTA 且可能闪动，因此不用。

代码核实后的 PRD 差异：英文 piano-basics 未加载 article.css，其余 25 页已加载。该页从 css/article.css 的命名标记区提取按钮规则，插入独立 style；不加载整份旧文章样式，以免原有标题/正文布局改变。没有新增 CSS 源文件或新视觉体系。

## 影响面

静态 HTML 新增链接、一个内联脚本及上述单页样式回退。GA4 沿用已有配置，事件 article_cta_click，参数 article_slug / locale / position=hero；不采集用户标识。无接口、数据结构、迁移、权限、多租户、异步任务和第三方依赖变更。静态资源随既有部署缓存策略发布，无生产操作。

浏览器埋点测试加载真实 gtag 库，对 collect 本地返回 204，避免污染生产数据。GA4 会批量延后发送，参数检查时临时阻止默认导航，留在文章页等待真实请求；导航行为由无 gtag 和禁 JS 两组独立检查覆盖。生产入库与导航时发送成功率未验证，事件属于尽力上报。

## 变更清单

- scripts/apply-legacy-articles.mjs：CTA 注入函数及 26 页文件遍历；缺 header 警告；已有块/脚本独立去重。
- scripts/render-tutorial-pages.mjs：增加构建选项调用后处理，默认保持源码生成行为。
- scripts/build-site.mjs：仅 dist 构建开启 CTA。
- css/article.css：命名区域中的 CTA 样式，最小高度 44px、16px 留白、焦点反馈。
- tests/tutorial-library.test.mjs：临时目录验证 26 页、幂等、无 header、不支持语言、既有 CTA/脚本、正文保留及 gtag 缺失边界。
- scripts/ui-article-cta.py：可复现浏览器检查、四张视口截图、真实 gtag collect 请求参数、禁 JS / 无 gtag 导航。

## 测试点

| AC | 验证 |
|---|---|
| 1/2/3 | dist 26 行覆盖表，header 内位置、精确 href / 文案 / slug；浏览器简英 DOM |
| 4 | 单测二次应用；连续构建全部文件 SHA256 清单对比 |
| 5 | 26 页去除新增块/回退样式与构建前基线逐字节相等；源码 HTML 零差异 |
| 6 | 20 指南 + 2 索引与基线逐字节相等 |
| 7 | 浏览器加载真实 Google gtag 库，collect 请求拦截后本地返回 204，核对事件及参数；无 gtag 不报错且导航成功。不将请求参数验证等同生产入库 |
| 8 | 390×844 / 1280×800 简英截图；按钮首屏、无遮挡、44px 高、无横溢；抽查其余 24 页布局 |
| 9 | npm test；npm run build；sitemap 357 |
| 10 | 与 origin/main 的改动文件对照保护名单 |
| 11 | 未发布；由产品在窗口决策后按 PRD 14 天指标观察 |

边界：没有文章 header 时原样返回并警告；空 HTML；已有 CTA / 既有跟踪脚本独立幂等；禁 JS 仍普通链接；无 gtag 跳转照常。构建串行执行，无共享写入服务；无权限、并发用户、数据迁移不适用。上下游：生成器源码调用、dist 构建、语言标签函数、指南和索引、sitemap 均验证。

## 上线与回滚

本轮只提 PR 供质检，不合并、不部署；时点由 STAF-68 窗口决策决定。获批后合并对应提交，使用既有静态部署链，验证 26 页与 GA4 请求。生产 GA4 入库及 14 天效果尚不可验证。

代码回滚：在获批的后续分支执行 git revert <本单提交 SHA>，走评审后重建部署；或部署平台恢复到发布前版本。构建开关 includeLegacyCta=false 可停用注入；没有数据库改动，事件历史无需删除。不得在 main 直接回滚或借 docs-only 合并触发部署。

## 风险与未知

CTA 收益不确定；广告拦截可能使事件缺失但不影响链接；本地测试不证明生产 GA4 入库；低样本按 PRD 只报绝对值。繁体文章不存在，本单不新增 URL。部署窗口保持未决，不把既有生产变化当授权。

## 自测证据

执行完成后记录于同目录 SELFTEST-STAF-66-article-page-piano-cta.md，并随交接附件提供完整输出和截图。
