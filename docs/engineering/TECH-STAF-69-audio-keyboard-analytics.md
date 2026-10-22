# TECH-STAF-69 · 音频与键盘埋点

版本 v1，2026-10-23。对应 PRD-STAF-69 v1（13a6d72），交付 AC-1～AC-9；AC-10/11 属上线后观测。

## 方案

| 选项 | 做法 | 结论 |
|---|---|---|
| A | 在 pointerdown / keydown 直接发事件 | 否决：resume 失败、24ms 去重和取消的按键会误报，rhythm 直接调用 audio 的路径会漏报 |
| B | 音频成功启动后发事件，Studio 提供触发时上下文 | 采用：复用现有 firstAttackLogged 与 true/false 播放结果，同步上下文快照覆盖等待 resume 时的模式/音区变化 |

统一通道 `js/analytics.js` 每次读取 studio script 的版本，独立 try/catch 保护版本解析与 gtag。首音从已有日志同一数值产生，成功播放回调给 Studio 发送 note_play / free_play_entry。物理输入传 source；未注明来源的直接 audio 调用为 program。play_mode 由 rhythm.isPlaying 和壳内 mode 决定。只在移动端非 force / 非 automatic 的实际音区变化后发 octave_shift。

## 影响面

- 接口：playNote 新增可选第四参数，pressKey 新增可选 source；旧调用兼容。新增 getPlaybackContext / onNoteStarted 可选回调，异常隔离。MIDI 沿用原解析，仅传来源。
- 数据：四个事件遵循 PRD §4.1，无 count / device / PII。无迁移、身份、权限、多租户或持久任务变更。
- 异步：上下文在 resume 前保存；重复、stale、stopAll 取消及播放失败不触发成功回调。
- 缓存：不改 HTML query 版本；asset_version 真实反映现有脚本 v 值，不代表 commit。
- 第三方：仍为现有 gtag，无 SDK / 广告 / GA4 配置变更。

## 变更清单

| 文件 | 内容 |
|---|---|
| js/analytics.js | 公共 track、版本参数和异常隔离 |
| js/piano-audio.js | 首音、冷启动上下文、成功出声回调 |
| js/studio.js | 输入来源、模式/音区快照、note_play 与 free_play_entry |
| js/piano.js | MIDI 来源、真实手动换区事件 |
| tests/studio-events.test.mjs | 静态契约及动态失败/去重/取消验证 |
| tests/mobile-piano-browser.py | --analytics 浏览器验收分支 |
| docs/product/PRD-STAF-69-audio-keyboard-analytics.md | 产品原始定稿，随功能 PR 交付 |

AC-8 接线与 AC-9 白名单冲突：package.json 枚举了测试文件，新增测试不会自动运行。已请求只追加一条测试命令的授权；授权前不修改白名单外文件。

## 测试点与证据

| AC | 方法 |
|---|---|
| 1 | dist 390px 触屏/键盘/换区及 1280px，导出完整 dataLayer |
| 2 | 首音参数、重复 10 键仍一次、时延与独立 start hook 对比 |
| 3 | 原生 touch 拖键、键盘、MIDI、program，按事件序列和 aria-label 比较 |
| 4 | 上下边界、disabled、clamp、自动 teaching、resize、桌面箭头零误报 |
| 5 | 加载/切模式零事件，首次 free 键一次，歌曲页 guided 零事件，guided→free 可恢复 |
| 6 | 每次公共参数，动态删除/改写 query 与缺失 script 返回 unknown |
| 7 | gtag 缺失/抛错下真实音源启动、pressedNotes、高亮与换区；与基线同脚本比较 |
| 8 | 静态事件/必填参数/唯一通道，Node 动态验证版本及异常；npm test 接线待授权 |
| 9 | npm test / build、白名单和 GA 单例、保留首音日志 |

执行结果见 `docs/engineering/SELFTEST-STAF-69-audio-keyboard-analytics.md` 和随任务附上的 `analytics-browser.json`。无权限场景不适用；无参数/空版本、超长时延、并发 resume、异常中断由 Node 测试覆盖。上报时延限制到 0～9999.99ms，同时满足字典范围和 AC-2 的严格小于 10000；原 console 数值保留。

自测结果：现有 `npm test` 95/95；新增独立 Node 测试 6/6；build 100 songs / 10 tutorials / 357 URLs；AC-1～AC-6 浏览器断言通过，AC-4 桌面箭头原本被 CSS 隐藏，使用 HTMLElement.click 验证 scrollBy 分支，未修改可见性。AC-7 真实首音跨基线差 11.6ms / 1.6ms，严格 ≤1ms 条件未通过；功能/几何相同且无 pageerror。两侧均有外网 abort 导致的两条资源 console error。AC-8 独立测试通过，但 npm test 接线因白名单冲突待授权。AC-9 现有回归及文件范围通过。未将以上两条判为通过，也未改变 PRD 的门槛。

待决策：允许 package.json 仅添加新测试命令，或由产品提供既能遵守白名单又能接线的修订；AC-7 由产品/质检明确如何处理基线同样存在的外网拦截错误与宿主 cold resume 波动。在决策前只交付 draft PR，不申请合并。

## 上线与回滚

1. 本阶段只推独立功能分支、创建 PR，交质检，不合并或部署。
2. Morgan/用户确认部署窗口（包括 STAF-66 的 11-06 限制）后，才按既有发布链路合并。
3. 若需回滚，合并提交由发布人执行 `git revert <merge-sha>`，走 PR 发布；不 force push。无数据库与客户端存储变更，代码可逆，已进入 GA 的事件不可撤回。
4. D-1 后台维度/指标注册由 GA4 admin 决策，本单不执行。上线 48h / ≥7 天分别交产品与运营观测 AC-10/11，n<20 仅报绝对数。

## 风险与未知

- 独立运行的真实首音依赖宿主调度，AC-7 跨基线 1ms 容差不一定可复现，必须保留原始读数，不能据此放宽 AC。
- gtag 缺失或抛错时事件静默丢弃；首音与首次进入都不重试，避免后续行为冒充首次。
- free_play_entry 事件字典：v1 为 2026-07-25～2026-10-01 的旧 CTA；v2 从本单实际上线日开始，为 free 模式首次成功物理按键。event_version 仍为公共协议版本 1；旧新口径不可比较，中间断点无数据。
- guided_song_entry / guided_fullscreen_result 标注 deprecated (2026-10-01)，本单不恢复也不删除旧代码。
- 不确定：实际 GA4 后台注册状态、最终上线日期、真实线上分布；本地结果不替代线上验收。
