# PRD-STAF-69 · 补齐音频 / 键盘埋点：让首音与移动端交互可观测

- 版本：v1（2026-10-23）
- 作者：产品
- 来源：STAF-63 复盘（`ANALYSIS-20261023-pianoonline-octave-audio.md` §4 提案 1，P1）
- 上游 issue：STAF-69（Morgan 转需求）
- 需求性质判定：**真需求（可复现的证据链，不是"加个按钮"）**。判定见 §1.2。
- 一句话：**本轮不重做 STAF-63，只把它的两个 P0 从"人工脚本可测"变成"用户侧可测"。**

---

## 1. 背景与问题

### 1.1 谁在什么场景遇到什么问题

站点的每次前端体验改动（音色、首音、键宽、音域、教学高亮），决策人都要回答"改了有没有变好"。现在这个问题**答不了**：`pianoonline.cc` 的 GA4 里有 13 个事件，没有一个能反映"按下键到出声多久""用户按了多少次键""有没有用八度切换"。

结果就是 STAF-63 这条链路：PRD → 开发 → 质检 → 上线 → 产品验收，全部跑完，两个 P0 都"通过"了，但**效果评估交不出来**（Atlas 报告结论：`数据不足`，用户侧可用样本 0）。这不是数据没拉全，是**成功指标压根没有发送端**。

绕过方式（现有）只有两条，都不面向用户：
1. 线上 `js/piano-audio.js:144` 只 `console.info('[piano:first-attack]', …)`，`gtag` 在该文件出现 0 次；
2. 质检/开发用 `tests/mobile-piano-browser.py`（Playwright）在自己机器上手工量首音，样本个位数、全部来自同一台宿主。

### 1.2 事实与证据（本人复算，基于 `origin/main` = `9bcdcab`，非引用报告）

| # | 事实 | 证据（可复跑） |
|---|---|---|
| F1 | 线上外壳是 `js/studio.js`，`index.html`、`piano.html`、`songs/*/index.html`、`en/songs/*/index.html` 都以 `<script type="module" src="/js/studio.js?v=20261001.1">` 加载它 | `grep -rl 'studio.js' --include=*.html . \| grep -v dist/` |
| F2 | **`js/main.js` 不被任何 HTML 加载**——`grep -rln 'main.js' --include=*.html` 命中 0。它是旧壳入口，当前是死代码 | 同上，0 命中 |
| F3 | 已停报的 `free_play_entry` / `guided_song_entry` / `guided_fullscreen_result` **唯一的发送点全在 `main.js` 的依赖链里**：`js/main.js:8-9` import `guided-homepage.js`、`guided-entry-bindings.js`；发送点分别是 `js/guided-homepage.js:253`、`js/guided-entry-bindings.js:210`、`:101` / `:107` | `grep -rn 'free_play_entry\|guided_song_entry\|guided_fullscreen_result' js/` |
| F4 | 所以"2026-10-01 起停报"的根因不是"埋点被删"，而是**埋点留在了不再被加载的旧壳里**（同日 `studio.js?v=20261001.1` 换壳） | F1 + F2 + F3 |
| F5 | 现在有 **3 份互不共享的 `track()` 实现**：`js/practice-mode.js:367`（实例方法）、`js/guided-entry-bindings.js:3`（模块函数）、`js/song-page.js:23/85/101`（直接调 `window.gtag`） | `grep -rn "gtag('event'" js/` |
| F6 | 首音时延已算好，但只进 console，且每页面生命周期**只打一次**（`this.firstAttackLogged`，`js/piano-audio.js:142-149`） | 读 `js/piano-audio.js:114-152` |
| F7 | 输入起点时间戳在三个入口各自采集：指针 `js/studio.js:49`、键盘 `js/studio.js:76`、`js/piano.js:148/338`；一路传到 `playNote(note, velocity, inputStartedAt)` | 同上 |
| F8 | **八度切换只存在于移动端**：`js/piano.js:270-276` 里 `mobileViewport.matches` 为真时调 `setRange()`，为假时只做 `scrollBy()`（桌面左右箭头是"滚动键床"，不是换八度）；断点 `(max-width: 640px)`，`js/piano.js:14`；移动端音区 clamp 在 1–5（`js/piano.js:302`），初始 `C3–C5` / 25 键 | 读 `js/piano.js:14, 259-303` |
| F9 | 新壳**默认就是自由弹奏模式**（`js/studio.js:161` `let mode = 'free'`），只有带 `?song=` 或 `body[data-song-id]` 的页面才默认 guided（`js/studio.js:224-226`）；模式切换由 `[data-play-mode]` 按钮驱动（`js/studio.js:191-198`，markup 里 `free` / `guided` 两个值） | 读 `js/studio.js` |
| F10 | 站点**没有隐私政策 / cookie 声明页**：`grep -rli 'privacy\|cookie' --include=*.html --include=*.js --exclude-dir=node_modules --exclude-dir=dist .` 命中 0（裸跑会命中 4 个 `node_modules/` 里的 devDependency，与本结论无关） | 同上，源码侧 0 命中 |
| F11 | 已有两个可直接复用的验证范式：`tests/song-analytics.test.mjs`（用 `vm` 跑内联 GA 片段读 `window.dataLayer` 断言 GA 配置）、`tests/mobile-piano-browser.py`（headless Playwright、真实 Web Audio、原生 touch、**已 abort 所有外网请求**） | 读这两个文件 |

### 1.3 影响量级

- 28 天（2026-09-25~10-22）GA4：3,949 会话 / 3,475 去重用户，其中 mobile 1,144 用户（32.9%）；`pianoonline.cc` 日均约 140 会话。
- **不补埋点的代价是可复现的、已经发生过一次**：STAF-63 一次上线 + 一次质检复核 + 一次产品验收，最终产出"效果不可评估"；且任何下一轮音/键优化都会重复这个成本。
- 补埋点后**仍然**不能立刻下结论：mobile 7 天约 286 用户，7 天最小可识别提升 +6.7pp（Atlas 功率表）。本单只承诺"指标可读"，不承诺"指标变好"。

---

## 2. 目标 / 非目标

### 目标

1. 新增 4 个 GA4 事件（`audio_first_attack` / `note_play` / `octave_shift` / 重定义后的 `free_play_entry`），**全部走同一份 `js/analytics.js`**，不再新增第 4 份 `track()`。
2. 首音时延、按键活跃度、八度切换使用率、自由弹奏真实开始率，四项在 GA4 里**按设备可切分、按版本可分层**。
3. 埋点具备**防退化能力**：未来改壳/改版静默丢事件时，`npm test` 会失败（F2/F3 这类事故不能再无声发生）。
4. 埋点失败**永不影响**弹奏：`gtag` 缺失、被拦截、抛错时，产品行为与现在逐项一致。

### 非目标（本版明确不做）

- **不改首音、键盘、音域的任何产品行为**（预热时机、`duplicateWindowMs`、`minimumAttackSeconds`、键宽、clamp 区间、教学高亮，全部不动）。
- **不重做 STAF-63**，不重新评估它的 AC，不动 PR #24 的逻辑。
- 不动广告脚本、GA4/GSC 配置（含 GA4 后台的自定义维度注册——见 §7 依赖 D-1）、`vercel.json`、`index.html` 的 `?v=` 版本戳（另开任务）。
- **不删除** `js/main.js` 及其依赖的 `guided-*.js` 死代码（删除会牵动 `npm test` 的 `node --check` 列表与既有测试，属独立清理单）。
- 不做 A/B 实验、不做漏斗重算、不改对外引用的历史百分比（只标注不可比，见 §7 待确认 3）。
- 不做上采样/降采样、不做事件量上限、不做会话级聚合上报（理由见 §4.7）。
- 不覆盖 tablet（GA4 device category 口径保留，不新增 tablet 专属逻辑）。

---

## 3. 用户与场景

**主路径（移动端，本单重点）**：搜索进入 `/`（390px）→ 见 25 键、`C3–C5` → 第一下触键出声（`audio_first_attack` + `free_play_entry` + `note_play`）→ 觉得音域窄，点 ▶ 换到 `C4–C6`（`octave_shift`）→ 继续按键（`note_play`）。

**主路径（桌面）**：进入 `/`（1280px）→ 37 键、`C3–C6` → 按键（`audio_first_attack` + `free_play_entry` + `note_play`）；左右箭头是**滚动键床**，不产生 `octave_shift`。

**次要路径（跟弹）**：从歌曲页 `/songs/<slug>/` 进入（默认 guided）→ 点「开始跟弹」→ 按键（`note_play`，`play_mode=guided`）→ **不**产生 `free_play_entry`。

**异常路径**：`gtag` 被广告拦截器拦掉 / 用户关 JS 之外的脚本失败 / `window.gtag` 抛错 → 弹奏、换音区、教学全部照常，控制台无未捕获异常，事件静默丢弃。

---

## 4. 功能描述与边界

### 4.0 统一上报通道（唯一新增的横切代码）

新增 `js/analytics.js`，导出 `track(eventName, params)`：

- 内部 `if (typeof window.gtag !== 'function') return;` 守卫，且整个调用包 `try/catch` 静默（**禁止**因埋点抛错影响弹奏）。
- 自动补两个公共参数：`event_version`（数字常量，本版 `1`）、`asset_version`（从 `document.querySelector('script[src*="/js/studio.js"]')` 的 `?v=` 解析；解析不到为 `'unknown'`）。**`asset_version` 必须在每次上报时读取**，不得在模块加载时缓存（否则无法验证解析失败路径，也无法在版本戳更新后自动生效）。
- 事件名与参数名统一 `snake_case`，事件名 ≤40 字符、只含字母/数字/下划线且以字母开头，参数名 ≤40 字符（GA4 硬约束）。
- **不**上报 `device` 参数：GA4 内置 `device category` 已是唯一事实源，自有 device 参数会造成两套真相。

`js/practice-mode.js`、`js/guided-entry-bindings.js`、`js/song-page.js` 的既有 `track()` **本单不改**（改它们会扩大回归面），但**新增代码一律走 `js/analytics.js`**。

### 4.1 事件字典（本表为唯一事实源）

#### `audio_first_attack` — 首次用户按键到出声的时延（每页面会话 ≤1 次）

| 参数 | 类型 | 取值 | 说明 |
|---|---|---|---|
| `input_to_start_ms` | number | 0–10000，最多 2 位小数 | 从输入时间戳（pointerdown / keydown）到音频启动。**含** `ensureRunning()` / `resume()` 成本——这正是 STAF-63 要优化的东西 |
| `latency_bucket` | string | `<50` / `50-100` / `100-200` / `200-500` / `>=500` | 分桶维度。GA4 不出分位数，靠此维度读累计分布（见 §5.4 偏差 2） |
| `note` | string | `C4`、`F#5` 等音名 | 触发首音的键 |
| `hit` | string | `sample` / `fallback` | 走了采样播放还是振荡器兜底（`js/piano-audio.js:140-141` 的分支结果） |
| `cold_start` | string | `yes` / `no` | 触发前 `AudioContext.state` 是否非 `running`。`yes` = 含冷启动 resume 成本，**这是分层读数的关键** |
| `play_mode` | string | `free` / `guided` / `rhythm` | 触发时所处模式 |
| `event_version` | number | `1` | 公共参数 |
| `asset_version` | string | 如 `20261001.1` / `unknown` | 公共参数 |

- 触发点：`js/piano-audio.js` 首音成功启动的那一处（现有 `console.info` 旁边）。**保留** `console.info`，质检脚本仍依赖它。
- `firstAttackLogged` 的"只一次"语义保留：连按 10 个键仍只有 1 条。

#### `note_play` — 每次成功出声的按键（每按键 1 次）

| 参数 | 类型 | 取值 | 说明 |
|---|---|---|---|
| `source` | string | `touch` / `keyboard` / `midi` / `program` | `touch` = 指针/触屏（含按住拖过多个键，每键各 1 次）；`keyboard` = 电脑键盘；`midi` = MIDI 设备；`program` = 程序自动播放（节奏游戏自动音符） |
| `range` | string | `C3–C5` | 上报时的音区标签，与 `.keys[aria-label]` 一致（注意是 en dash `–`） |
| `octaves` | number | `2` / `3` | 移动视口 2、桌面 3 |
| `play_mode` | string | `free` / `guided` / `rhythm` | |
| `event_version` / `asset_version` | | | 公共参数 |

- 计数口径：**GA4 的事件数就是按键数**，不再额外传 `count`（issue 原建议的"每会话聚合 count"已否，理由见 §5.4 偏差 1）。
- 去重：沿用音频层的 `duplicateWindowMs = 24ms`（同键 24ms 内的重复触发不**出声**，因此也不上报），**不额外新增去重逻辑**。

#### `octave_shift` — 移动端音区切换（每次成功切换 1 次）

| 参数 | 类型 | 取值 | 说明 |
|---|---|---|---|
| `direction` | string | `up` / `down` | `data-octave="1"` → `up`，`-1` → `down` |
| `from_range` | string | `C3–C5` | 切换前音区 |
| `to_range` | string | `C4–C6` | 切换后音区 |
| `octaves` | number | `2` | |
| `event_version` / `asset_version` | | | 公共参数 |

- **只在移动视口（`max-width: 640px`）上报**。桌面左右箭头是 `scrollBy()` 滚动键床，**不是**八度切换，**禁止上报**。
- 按钮被判 `disabled` 时（已到 `C1–C3` / `C5–C7` 边界）不产生事件。

#### `free_play_entry` — 自由弹奏真正开始（每页面会话 ≤1 次，**口径 v2**）

| 参数 | 类型 | 取值 | 说明 |
|---|---|---|---|
| `range` | string | `C3–C5` | 上报时音区 |
| `octaves` | number | `2` / `3` | |
| `keys_visible` | string | `true` / `false` | 音名标签是否可见，取 `#labels-toggle.checked`（`js/studio.js:28`） |
| `play_mode` | string | `free` | 恒为 `free` |
| `event_version` / `asset_version` | | | 公共参数 |

- 触发条件：**该页面会话内第一次在 `free` 模式下成功按下琴键**。页面加载不算（新壳默认就是 free，页面加载上报等于 pageview，没有信息量）；点模式按钮也不算（那只是意图，不是行为）。若用户从 guided 切回 free 后按键，仍算。
- 与 `audio_first_attack` 的关系：首音那一下两条会同时发（同一帧），这是设计而非重复——一条测性能，一条测漏斗起点。

### 4.2 事件口径变更（必须写进事件字典的断点）

`free_play_entry` **旧口径**（2026-07-25~2026-10-01，共 10,072 条）是「点击首页 `[data-free-play]` 入口 CTA」（`js/guided-homepage.js:246-256`）；**新口径 v2** 是「自由弹奏模式下第一次真实按键」。两者语义不同，**新旧数据不可相加、不可做趋势对比**。事件字典须标注：

```
free_play_entry: v1 2026-07-25 → 2026-10-01（点入口 CTA，旧壳）
                 v2 待本单上线日 →（free 模式首次按键，新壳）
                 断点期间（2026-10-02 起）无数据；v1 与 v2 不可比
```

### 4.3 边界与异常

| 情况 | 期望行为 |
|---|---|
| `window.gtag` 不存在（拦截器 / 内联片段未执行） | 静默跳过，弹奏正常，无 console error |
| `gtag` 抛错 | `try/catch` 吞掉，弹奏正常，无未捕获异常 |
| `asset_version` 解析失败 | 上报 `unknown`，**不阻断**事件 |
| 用户按住拖过 5 个键 | `note_play` 5 条（每键 1 条），`source=touch` |
| 同键 24ms 内重复触发 | 不出声也不上报（沿用音频层去重） |
| 桌面点左右箭头 | 只滚动，`octave_shift` 0 条 |
| 已到音区边界再点箭头（按钮 disabled） | 0 条 |
| `?song=` 打开（默认 guided）后一直不切 free | `free_play_entry` 0 条 |
| 节奏游戏自动播放的音符 | `note_play` 上报，`source=program` |
| 视口从 390 拖到 1280（`matchMedia` change） | 不产生 `octave_shift`（`js/piano.js:277-280` 的重置不是用户切换） |
| 无权限 / 登录 / 收费 | 不涉及，全站免登录无权限模型 |

### 4.4 数据口径（写死，供 Atlas 与产品复用）

- 数据源：GA4 property `469040246` / measurementId `G-EYGD99YB4Y` / dataStream `10004076394`；属性时区 **America/Los_Angeles**。
- 设备切分：用 GA4 内置 `device category`，不用自有参数。
- 时间窗：上线后读 48h（存活检查）与 ≥7 天（分布读数）；同窗口不与 2026-10-01 之前的数据混用。
- 最小样本纪律：**n < 20 会话只报绝对值、不算百分比、不下结论**（沿用 Atlas 口径卡）。
- 抽样：GA4 事件级报表在本站量级（日均约 140 会话）无抽样；不做客户端采样（§4.7）。

### 4.5 隐私与合规口径

- 上报参数**不含任何个人数据**：无用户 ID、无 client 拼接、无自由输入文本、无精确坐标、无设备指纹；`note` 是 12 音 × 八度的有限集，不构成用户内容。
- **不需要**为木单新增隐私政策披露：站点现有页面已加载 GA4 并按 pageview 采集，本单只是把同一次页面会话里的交互细化成事件级参数，**不引入新的数据类别、不新增第三方、不改变数据用途**。
- 但必须先说清一个既存缺口：**站点现在没有任何隐私政策 / cookie 声明页**（`privacy` / `cookie` 关键词在源码 HTML/JS 中 0 命中（已排除 `node_modules/`、`dist/`，F10））。这是 AdSense + GA4 的既存合规问题，**不属于本单**，不在本单偷偷补一个页面。
- 不做用户级长期标识：不写 `user_id`，不设置跨站 cookie 参数；GA4 匿名 `client_id` 行为不变。

### 4.6 代码落点建议（约束可观测行为，不约束实现）

| 事件 | 建议落点 | 约束 |
|---|---|---|
| `audio_first_attack` | `js/piano-audio.js` 首音分支（现有 `console.info` 处），或在同处暴露回调由 `js/studio.js` 发送 | 必须仍只发 1 次/页面会话；`console.info` 必须保留 |
| `note_play` | `js/studio.js` 的 `hold()` / `pressKey()`（`js/studio.js:38-42, 98-103`） | 必须能区分 touch / keyboard / midi / program |
| `octave_shift` | `js/piano.js:270-276` 的 `setRange()` 分支内 | 必须与 `scrollBy()` 分支互斥 |
| `free_play_entry` | `js/studio.js`，首次 free 模式 `pressKey` 时（`noteHolders` 首次写入处） | 每页面会话 ≤1 次 |

允许触碰的源码文件（本次范围）：`js/analytics.js`（新增）、`js/studio.js`、`js/piano.js`、`js/piano-audio.js`；外加 `tests/` 与 `docs/`。**未列出的文件不得改动。**

---

### 4.7 事件量与采样口径

- **不做客户端采样**（100% 上报）。量级估算：site 日均约 140 会话；单会话自由弹奏按 30–60 次按键估，`note_play` 约 4,000–8,000 条/日、约 12–25 万条/28 天；其余三个事件 ≤1 条/会话。相对 GA4 单属性上限（单事件名参数 ≤25、事件名 ≤500 个、请求体积限制）**余量充足**，采样只会让 n<20 的保护更早触发，得不偿失。
- **不做会话级聚合上报**：聚合值无法按 `source` / `play_mode` / `range` 交叉切分，也无法校验多报少报（见 §5.4 偏差 1）。GA4 自身按会话聚合事件数即可。
- **不做事件量上限**：设上限会让"持续按键的用户"的按键数被截断，污染"按键次数/会话"这一 AC2 指标。若上线后 48h 观察到 `note_play` 超过 5 万条/日，再单独出决策单讨论降噪（不在本版预设）。
- **不使用 `transport_type: 'beacon'` 手动指定**：GA4 默认在 `pagehide` 用 beacon 发送，手动覆盖会干扰既有 `song_*` 事件的行为一致性。

---

## 5. 验收标准（可被质检直接转用例）

> AC-1～AC-9 在本地 `dist` 上可完整验证，**不依赖 GA4**。AC-10 / AC-11 是上线后观测口径，不作为开发验收门槛。
> 所有本地断言优先读 `window.dataLayer`：内联 GA 片段即使 `gtag.js` 被 abort 也仍会把 `('event', name, params)` push 进 `dataLayer`（`index.html` 内联片段 + `tests/song-analytics.test.mjs` 已验证该范式），因此**判定与网络无关、可重复**。

**AC-1 四个事件在真实会话中齐发，且次数符合定义**
操作：`npm run build`；`http-server dist -p 8763 -c-1`；用 Playwright（可复用 `tests/mobile-piano-browser.py` 的启动与 init_script 方式，**abort 外网**）390×844 打开 `/`，执行：tap `C4` → 按键盘 `A` → 点 `[data-octave="1"]` 一次 → 再 tap `D4`；随后 1280×800 重开 `/`，按一次 `A`。
期望（导出 `window.dataLayer` 的 `['event', name, params]` 条目为证据）：
- mobile 页：`audio_first_attack` = 1、`free_play_entry` = 1、`note_play` = 3（tap C4 / 键盘 A / tap D4）、`octave_shift` = 1；
- desktop 页：`audio_first_attack` = 1、`free_play_entry` = 1、`note_play` = 1、`octave_shift` = **0**；
- 任一数字不符即不通过。附两页 dataLayer 导出 JSON。

**AC-2 `audio_first_attack` 参数正确且"只一次"**
操作：承接 AC-1 的 mobile 页，再连按 10 个不同键。
期望：
1. 该事件仍只有 1 条；
2. `input_to_start_ms` 为 `number`，`0 ≤ x < 10000`，小数位 ≤2；
3. `latency_bucket` ∈ {`<50`,`50-100`,`100-200`,`200-500`,`>=500`} 且与 `input_to_start_ms` 落桶一致；
4. `note` = 首次按下的键（例：`C4`）；
5. `hit` ∈ {`sample`,`fallback`}；`cold_start` ∈ {`yes`,`no`}；`play_mode` = `free`。
附该条事件的完整参数 JSON。

**AC-3 `note_play` 计数与 `source` 对应输入方式**
操作：mobile 页 —— tap `C4`（触屏）、按键盘 `S`（电脑键盘）、用 CDP `Input.dispatchTouchEvent` 在同一次触控里按住拖过 `C4`→`D4`。
期望：三次交互共产生 `note_play` 4 条；`source` 依次 `touch` / `keyboard` / `touch` / `touch`（拖拽每键 1 条）；`range` 与 `document.querySelector('.keys').getAttribute('aria-label')` **逐字符相同**；`octaves` = 2。附 4 条事件 JSON + 页面 `aria-label` 值。

**AC-4 `octave_shift` 仅移动端、仅真实切换**
操作：390×844 打开 `/`（初始 `C3–C5`）：
① 点 `[data-octave="1"]` 1 次 → ② 再点 1 次 → ③ 检查 `▶` 已 `disabled`，用 `page.evaluate` 直接 `document.querySelector('[data-octave="1"]').click()` 再触发 1 次 → ④ `page.evaluate('window.pianoStudio.piano.setRange(9)')`（clamp 回 5，音区不变）→ ⑤ 把视口拉到 1280×800（触发 `matchMedia` change 的 `setRange(3, true)`），再点 `[data-octave="-1"]` 2 次。
期望：
- ①② 共 **2 条**：`direction=up`，`from_range`/`to_range` 依次 `C3–C5→C4–C6`、`C4–C6→C5–C7`，`octaves=2`；
- ③④ 共 **0 条**（disabled 点击、clamp 后音区未变，均不得上报）；
- ⑤ 共 **0 条**（桌面左右箭头是 `scrollBy()` 滚动键床；`matchMedia` 重置是 `force` 路径且音区未变，也不得上报）。
附事件序列 + `aria-label` 前后值 + 按钮 `disabled` 状态。

> 判定要点：实现若把"点击箭头"当上报条件（而不是"`startOctave` 实际变化"），③④⑤ 会多出事件，AC 不通过。合法落点是 `js/piano.js:303` 的 `if (!force && next === this.startOctave) return;` **之后**。

**AC-5 `free_play_entry` 恢复且口径为"free 模式首次按键"**
操作：① 390px 打开 `/`，不按键 → 等 2s；② tap `C4`；③ 点 `[data-play-mode="guided"]` 再点回 `free`，再 tap `E4`；④ 另开 `/songs/twinkle-twinkle-little-star/`（`body[data-song-id="twinkle"]`，默认 guided，`js/studio.js:226`），tap `C4`。
期望：① 0 条；② 1 条（`play_mode=free`，`keys_visible` 与 `#labels-toggle.checked` 一致，`range=C3–C5`）；③ 仍只有 1 条（会话内 ≤1）；④ 0 条（歌曲页默认 guided，未切 free 就按键）。附四段 dataLayer 导出。

**AC-6 版本参数可分层**
操作：读 AC-1 的全部事件参数；并 `grep -n "event_version" js/analytics.js`。
期望：每条新事件都含 `event_version`（number，= `1`）与 `asset_version`（非空 string）；`asset_version` 与 `document.querySelector('script[src*="/js/studio.js"]').src` 的 `?v=` 值一致（当前应为 `20261001.1`）；解析失败路径返回 `unknown`（在测试里把该 script 的 `src` 改成无 query 后断言）。附对照。

**AC-7 埋点失败不影响产品行为**
操作：同 AC-1 脚本，在 `page.goto` **之后、按键之前**用 `page.evaluate` 覆盖（不能在 `add_init_script` 里注入——页面内联片段 `function gtag(){…}` 会把它覆盖掉）：① `window.gtag = undefined`；② `window.gtag = () => { throw new Error('boom'); }`。
期望：两种情况下——按键**有声音**（`window.firstStart` 存在、`audio.pressedNotes` 变化正常）、键高亮正常、`[data-octave]` 切换后 `.keys[aria-label]` 正常变化、`pageerror` 事件数 = 0、`console` 无 error；首音/键宽/音区各项读数与对 `origin/main`（`9bcdcab`）跑同一脚本的读数**逐字段相同**（1px / 1ms 容差内）。附两份对比 JSON。

**AC-8 防退化断言进 `npm test`**
操作：新增 `tests/studio-events.test.mjs`（风格对齐 `tests/song-analytics.test.mjs` 与 `tests/guided-onboarding.test.mjs` 的静态断言）。
期望至少断言：① 四个事件名在源码中各出现 ≥1 次；② 每个发送点所在语句被 `typeof window.gtag` 守卫或经 `js/analytics.js` 的 `track()` 调用（即"直接裸调 `window.gtag`"出现在白名单之外时失败）；③ 每个事件名附近出现其字典必填参数名（`audio_first_attack` → `input_to_start_ms`/`latency_bucket`/`note`/`hit`/`cold_start`；`note_play` → `source`/`range`/`octaves`；`octave_shift` → `direction`/`from_range`/`to_range`；`free_play_entry` → `keys_visible`）；④ `js/analytics.js` 导出 `track` 且含 `try`/`catch`。`npm test` 全绿，**不得放宽或删除既有断言**（尤其 `tests/song-analytics.test.mjs` 的 GA 单例断言）。

**AC-9 无回归与范围纪律**
操作：`npm test`；`git diff --name-only origin/main...HEAD`；`grep -c "googletagmanager" index.html`。
期望：`npm test` 全绿；改动文件 ⊆ {`js/analytics.js`,`js/studio.js`,`js/piano.js`,`js/piano-audio.js`,`tests/studio-events.test.mjs`,`tests/mobile-piano-browser.py`(可选),`docs/**`}；不含 `vercel.json`、`css/**`、广告相关、`js/main.js`、`js/guided-*.js`；`googletagmanager` 在 `index.html` 仍为 1 处；`js/piano-audio.js` 的 `console.info('[piano:first-attack]'` 仍在。附 diff 文件名清单。

**AC-10（上线后 48h 观测，非开发门槛）**
上线满 48h，在 GA4（属性时区 America/Los_Angeles）核对：
1. 事件清单出现 `audio_first_attack` / `note_play` / `octave_shift` / `free_play_entry` 四个事件名，各自事件量 > 0；
2. **埋点存活率** = 「mobile 设备、studio 页（`/`、`/en/`、`/piano.html`、`/songs/*`）且出现过 `audio_first_attack` 的会话」中，同时出现 `note_play` 的会话比例 ≥ 95%（同一属性会话 id 对齐）；
3. 分母会话数 < 20 时只报绝对值，不判 ≥95%。
判定规则写死：存活率 <95% → 判埋点缺陷，退回开发（不算 AC 通过）；≥95% → AC-10 通过。

**AC-11（上线后 ≥7 天观测，非开发门槛）**
1. `latency_bucket` 维度可切分（需 GA4 已注册该 custom dimension，见依赖 D-1），accumulated 分桶能给出近似 P50 / P90；
2. 与 `tests/mobile-piano-browser.py` 同一时段在本机跑 10 次冷启动测得的首音时延**落在同一档桶**（桶档位：`<50` / `50-100` / `100-200` / `200-500` / `>=500`）；
3. `cold_start=yes` 与 `no` 必须分开读，不得合并成一个中位数；
4. n ≥ 20 会话才读；否则只报绝对值。
不满足 §2 或与本 PRD 口径不符时，产品出「不通过 + 差在哪条」，退回开发。

---

### 5.4 与 issue 建议 AC 的偏差（3 处，均已按证据改口径）

| # | issue 建议 | 本 PRD 定稿 | 理由 |
|---|---|---|---|
| 1 | `note_play` 带 `count`（每会话聚合） | **不传 `count`**，每按键 1 条事件，靠 GA4 事件数计次 | 会话聚合的 `count` 无法与 `source`/`range`/`play_mode` 做交叉切分（一次会话里可能既有 touch 又有 keyboard、既有 free 又有 guided），会把维度压平成"会话级标签"，反而丢掉 AC2 需要的活跃度分层；且聚合值无法校验（多报/少报都看不出来）。量级：日均约 140 会话 × 数十次按键 ≈ 数千条/日，无压力 |
| 2 | `audio_first_attack.input_to_start_ms` 能出 **P50/P90 分布** | 改为 `input_to_start_ms`（数值）+ `latency_bucket`（分桶维度），**在 GA4 内用累计分桶读近似 P50/P90**；精确分位数需 BigQuery 导出（不在本单） | GA4 的自定义指标聚合只有平均值 / 最大值 / 总和，**标准报表与探索都不给分位数**。只传数值参数 = 上线后依然读不出 P50/P90，等于重演 STAF-63 的"有数不可用的坑"。分桶是唯一能留在 GA4 内的可读方案 |
| 3 | mobile 会话事件覆盖 **≥95%**（抽样核对） | 改为**埋点存活率 ≥95%**：分母 = 有 `audio_first_attack` 的 mobile 会话，分子 = 其中同时有 `note_play` 的会话 | 原始"会话覆盖率"不可能到 95%：占绝大多数会话根本不按键（28 天 mobile 1,144 用户 / 1,289 会话，`free_play_entry` 存活期口径下只有约 4 成进过自由弹奏，按键会话更少）。用原始会话做分母会把"用户没弹"误判成"埋点坏了"。用存活率才真正测到埋点可靠性 |

---

## 6. 优先级与理由

| 项 | 价值 | 成本 | 不做的代价 | 结论 |
|---|---|---|---|---|
| 本单（补 4 个事件 + 统一通道 + CI 断言） | 高：一次改动让后续**全部**音/键/教学类改动的效果可评估；直接兑现 STAF-63 复盘的两个 P0 | 低：1 个新模块 + 3 个文件的埋点插入 + 1 个测试；无后端、无新 URL、无依赖 | 每轮同类改动都要再花一次"上线 + 质检 + 验收"却换来"不可评估"；已发生过 1 次 | **P1，本批先做** |
| 精确分位数（BigQuery 导出） | 中 | 中：需 BQ 链接、配额、SQL 维护 | 只有近似分桶可用 | **P3，等这批有数据后再定** |
| 清理 `main.js` 死代码 | 低 | 低但牵动测试 | 死代码继续误导后来人（本次复盘就被它误导过） | **P3，独立单** |

拆分建议：**不拆**。四个事件共享同一通道与同一批测试，拆开会让"埋点存活率"验收失去整体性（半套埋点比没有更难判读）。

与其他在途单的关系：STAF-66（文章页 CTA，动 `scripts/apply-legacy-articles.mjs` + `css/article.css` + `tests/tutorial-library.test.mjs`）与本单**文件不重叠**；冲突只在**部署窗口**（见 §7.4）。

---

## 7. 依赖、风险、待确认项

### 7.1 待确认项（已给默认值，不阻塞开发）

1. **`guided_song_entry` / `guided_fullscreen_result` 的处置（建议：正式废弃）**
   证据：两条事件的唯一发送点在 `js/main.js` 的死代码链里（F3），新壳无对应交互；`guided_song_entry` 的功能已被 `song_start`（`js/practice-mode.js:98`，带 `song_id`）覆盖。
   本单默认：**不做代码改动、在事件字典标注 `deprecated (2026-10-01)`**，不恢复。
   若用户要求保留，成本约 3 行（`js/studio.js` 的歌曲选择处），但不建议——会得到与 `song_start` 重复的两个真相。
2. **GA4 侧注册项由谁执行**（依赖 D-1）：本单边界不动 GA4 配置，需要 admin 权限的人注册维度。
3. **历史漏斗数字**：本单上线后 `free_play_entry` 口径变 v2。对外引用的"7.6% 进过自由弹奏"（Atlas §1.2 已证伪为分母错误 + 事件停报）必须撤下，且 v1/v2 之间不可比。是否需要对外发更正，需 Morgan/用户定（不阻塞开发）。
4. **是否受 11-06 部署窗口约束**：STAF-66 的任务书提到"11-06 复盘前不合并会触发生产部署的变更"。本单 issue 未写此约束，但本单合并必然触发部署。开发完成 + PR + 自测后停在 `in_review`，合并时点由 Morgan/用户定。

### 7.2 依赖

| ID | 依赖 | 影响 | 谁负责 |
|---|---|---|---|
| D-1 | GA4 后台注册：custom dimension × 5（`hit`、`source`、`range`、`play_mode`、`latency_bucket`）+ custom metric × 1（`input_to_start_ms`，若要用平均值/最大值） | **不注册**：事件名与事件量仍能在 GA4 事件报表看到（AC-10 的第 1 条可判），但**按参数切分与 AC-11 的分布读取做不到**。不阻塞开发与上线，阻塞上线后读数 | GA4 admin（Atlas 只有只读权限，需用户/Morgan 执行或授权） |
| D-2 | `index.html` 的 `?v=` 版本戳修复（另开任务） | 本单 `asset_version` 会一直是 `20261001.1`，无法按真实构建分层；本单只如实上报，不负责修 | 另单 |
| D-3 | 上线时点决策 | 见 7.1-4 | Morgan / 用户 |

### 7.3 风险

| 风险 | 概率 / 影响 | 说明 | 缓解 |
|---|---|---|---|
| 补了埋点仍评估不了效果 | 中 / 高 | mobile 7 天约 286 用户，7 天最小可识别提升 +6.7pp（Atlas 功率表）。48h 内任何"变好/变差"都是噪声 | AC-10/AC-11 写死最小样本 n≥20 与"只报绝对值"；PRD 明确不承诺提升数值 |
| 分桶掩盖长尾 | 中 / 中 | `>=500` 是无上界桶，若长任务导致 3s+ 的用户被合并，P90 会失真 | 同时保留 `input_to_start_ms` 原始数值（注册 custom metric 后可看最大值）；`200-500`/`>=500` 两档足够判"是否病态" |
| 首音时延双峰 | 高 / 中 | 产品验收期已观测到 0.5–98.2ms 与 115–774ms 两类样本，取决于宿主长任务与是否冷启动 | `cold_start` 强制分层，AC-11 禁止合并读数 |
| 又出现一份 `track()` | 中 / 中 | 现有 3 份实现（F5），本单再手写第 4 份，下次改壳又会漏 | AC-8 静态断言 + 单一 `js/analytics.js` |
| 事件量超预期 | 低 / 低 | 拖拽过键 + 节奏游戏可能放大 `note_play` | 量级估算数千/日，远低于 GA4 上限（单事件名 ≤500 个、参数 ≤25 个）；不加采样，先观察 48h |
| 埋点被拦截器拦掉 | 中 / 低 | 广告拦截器拦 GA 会拉低存活率判定 | 存活率口径限定在"首音已发出"的会话内（同时被拦则两条都缺，不进分母）；AC-7 保证拦截时功能无感 |
| 桌面八度被顺手埋上 | 中 / 中 | 桌面箭头是滚动，容易被误当八度切换 | AC-4 明写 desktop 必须 0 条 |
| 死代码误导后人 | 高 / 中 | 本次复盘的"停报"根因就是死代码（F2/F3），不清理还会再误导一次 | 本单在事件字典记录该根因；清理另开 P3 单 |

### 7.4 交付物（本单给开发的边界）

- PR + `docs/engineering/TECH-STAF-69-<slug>.md`（技术方案 + 自测证据）；
- 事件字典以本 PRD §4.1 为唯一事实源；实现若偏离，须在 TECH 文档写明理由并回写本 PRD 为 v2；
- 走质检（`docs/qa/TEST-STAF-69-<slug>.md`）；
- **不动**广告、GA4/GSC 配置、`vercel.json`；不新建 worktree 以外的用户本地改动。

---

## 附录 A：复现命令

```bash
# 死代码根因（F2/F3）
grep -rln 'main.js' --include=*.html . | grep -v dist/            # → 0 命中
grep -n "guided-homepage\|guided-entry-bindings" js/main.js        # → 8,9 行 import
grep -rn 'free_play_entry' --include=*.js js/                    # → 只有 guided-homepage.js:253

# 线上外壳（F1）
grep -rl 'studio.js' --include=*.html . | grep -v dist/

# 首音只写 console（F6）
grep -n "first-attack\|firstAttackLogged" js/piano-audio.js

# 八度仅移动端（F8）
sed -n '270,276p' js/piano.js

# 无隐私页（F10）
grep -rli 'privacy\|cookie' --include=*.html --include=*.js \
  --exclude-dir=node_modules --exclude-dir=dist .                  # → 0 命中（源码侧）
```

## 附录 B：本地验证脚手架（供开发/质检直接改）

- 复用 `tests/mobile-piano-browser.py` 的启动方式（390×844、`has_touch`、CDP 禁缓存、abort 外网），在 tap 后追加：
  `page.evaluate("window.dataLayer.filter(c => c[0]==='event').map(c => ({name:c[1], params:{...c[2]}}))")` 导出为证据 JSON；
- node 侧新增 `tests/studio-events.test.mjs` 做静态断言（AC-8），并入 `npm test`。
