# NOTE-STAF-66 · 归因窗口事实核查：生产已于 2026-10-22 15:36 UTC 部署到 main

- 版本：v1（2026-10-22）
- 作者：产品
- 性质：**事实核查 + 风险上报，不是决策**。合并/部署时点属用户与 Morgan 的决策范围。
- 触发原因：STAF-66 任务书写明「11-06 复盘前请勿合并任何会触发生产部署的变更，否则本期 SEO 归因作废」，其前提是「生产仍停在 `b38cb10`、PR #24（`a7704dc`）未部署」。写 PRD 时按惯例复核前提，发现前提已不成立。

---

## 1. 结论（一句话）

**生产已经不是「只有 STAF-64（PR #25）在生效」的状态了。** 2026-10-22 15:36–15:38 UTC，main 被部署到生产，生产现在 = `origin/main`（`9bcdcab`，含 PR #24 + #25 + #26）。因此 STAF-64 的 14 天归因窗口在 **2026-10-22 15:36 UTC 起已被混合变更污染**，`11-06 复盘` 若沿用原基线（「本期只有 SEO 改动生效」）会得出错误结论。

---

## 2. 证据（逐条可复现）

采样时间：2026-10-22 15:40–15:46 UTC，本机直连 `https://pianoonline.cc`。

### 2.1 生产 `js/library-browser.js` 已含 PR #26 代码

```
$ curl -s https://pianoonline.cc/js/library-browser.js | grep -c 'song-category-heading > span'
1
$ curl -sI https://pianoonline.cc/js/library-browser.js | grep -i last-modified
last-modified: Thu, 22 Oct 2026 15:36:33 GMT
```
`group.querySelector('.song-category-heading > span').textContent=…` 是 PR #26（STAF-65，commit `9bcdcab`）新增的行，`b38cb10` 里不存在。

### 2.2 生产 `css/piano.css`、`js/piano.js` 与 `origin/main` 逐字节相同（= PR #24 已上线）

```
$ curl -s https://pianoonline.cc/css/piano.css | md5
c193c1ed44510192f7c60550eefdd769
$ git show origin/main:css/piano.css | md5
c193c1ed44510192f7c60550eefdd769

$ curl -s https://pianoonline.cc/js/piano.js | md5
3fd7c0e8a8bde28ae727e6d2bf47995c
$ git show origin/main:js/piano.js | md5
3fd7c0e8a8bde28ae727e6d2bf47995c

$ git show b38cb10:js/piano.js | grep -c 'keyboard-range\|keyboardRange'
0
```
即：生产 `js/piano.js` **含有** `keyboard-range`，而 `b38cb10` 版本**不含**——`keyboard-range` 正是 PR #24 引入的（位于 `js/piano.js`、`tests/keyboard-input.test.mjs`，**不在** `piano.html` / `js/main.js`）。

### 2.3 PR #26 的页面侧内容也已上线

```
$ curl -s https://pianoonline.cc/en/songs/moonlight-sonata/ | grep -o 'classic-piano-pieces-for-beginners|fur-elise-piano-guide' | sort | uniq -c
   1 classic-piano-pieces-for-beginners
```
`SONG_TUTORIALS.moonlight` 的改正是 PR #26 的内容（`scripts/render-song-pages.mjs`）。

### 2.4 时间线

| 时刻（UTC，2026-10-22） | 事件 |
|---|---|
| 15:16 | PR #25（STAF-64，`b38cb10`）合并并部署（Atlas 报告记录的部署时点） |
| 15:33:44 | STAF-66（本 issue）创建，其中写入「生产未部署、勿合并」的约束 |
| 15:35 | Atlas 出报告，核验「PR #24 未部署」——**当时成立** |
| 15:35:54 | PR #26（STAF-65）合并进 main（`gh pr view 26`：mergedAt 15:35:54Z，merge commit `9bcdcab`） |
| 15:36:33 | 生产 `js/library-browser.js` 更新（上述 last-modified） |
| 15:38:05 | 生产 `css/piano.css` 更新 |

---

## 3. 影响

1. **STAF-64 的 14 天判定规则（Atlas 报告 §5）失去单一变量前提**：现在生产同时包含 #24（移动端八度/音频预加载 + `css/studio.css`/`piano.css`）、#25（SEO 首页+内链）、#26（曲库计数 + moonlight 内链）。11-06 若点击率/互动率变化，无法区分来源。
2. **回滚硬线含义变化**：报告 §5 第 3 行的触发条件是 `git revert b38cb10`。在 `9bcdcab` 之上 revert 单条已合并提交，会与 #24/#26 的改动并存，需要开发确认无冲突；且回滚本身又是一次生产部署。
3. **对 STAF-66 的影响**：提案 1（文章页 CTA）的合并时点必须由 Morgan/用户重新给窗口；「11-06 前不合并」这条约束的事实基础已经不存在，但它原本要保护的目标（干净归因）**仍未达成**，只是污染源从「未来的合并」变成了「已经发生的部署」。
4. **对 11-06 复盘的建议（产品建议，非结论）**：把复盘窗口改为 **2026-10-22 15:36 UTC 起算的 14 天**，并在报告中把 #24/#26 列为「同窗口并发变更」，同时把站点级指标（GSC 曝光斜率、Bing 首页周点击）与"词级"指标分开判读；原报告 §5 第 1、2 行（Bing 词级）受影响较小，第 6 行（GA4 首页互动率）受影响最大（#24 直接改了移动端钢琴交互）。

---

## 4. 需要谁做什么（不自行处理）

- **Morgan / 用户**：确认 11-04~11-06 复盘的窗口与基线是否按 §3.4 重置；确认 STAF-65（PR #26）是否有意越过冻结（该 issue 的 AC-7 确实要求「合并 + 生产部署后复验」，两条约束相互冲突，需要有人裁决哪条优先）。
- **开发**：若被要求回滚或补部署，先确认 `revert` 在 `9bcdcab` 上的可应用性。
- **Atlas**：复盘时按新窗口取数，并显式标注并发变更。
- **产品（我）**：不自行改写 STAF-64 的验收结论，也不追认「已上线」；本单只把事实交出来。
